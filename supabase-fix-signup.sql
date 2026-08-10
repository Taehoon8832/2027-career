-- 회원가입 "Database error saving new user" 수정용
-- SQL Editor에 붙여넣고 Run 하세요.

create extension if not exists "pgcrypto";

alter table public.profiles add column if not exists login_id text;
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists school_name text not null default '';
alter table public.profiles add column if not exists display_name text;
alter table public.profiles alter column display_name set default '';

update public.profiles
set login_id = 'user_' || substr(replace(id::text, '-', ''), 1, 12)
where login_id is null or login_id = '';

do $$
begin
  begin
    alter table public.profiles alter column login_id set not null;
  exception when others then null;
  end;
  begin
    alter table public.profiles add constraint profiles_login_id_key unique (login_id);
  exception when duplicate_object then null;
  when others then null;
  end;
end $$;

alter table public.classes add column if not exists class_code text;

update public.classes
set class_code = lower(substr(encode(gen_random_bytes(5), 'hex'), 1, 8))
where class_code is null or class_code = '';

do $$
begin
  begin
    alter table public.classes alter column class_code set not null;
  exception when others then null;
  end;
  begin
    alter table public.classes add constraint classes_class_code_key unique (class_code);
  exception when duplicate_object then null;
  when others then null;
  end;
end $$;

create or replace function public.generate_class_code()
returns text
language plpgsql
as $$
declare
  code text;
  tries int := 0;
begin
  loop
    code := lower(substr(encode(gen_random_bytes(5), 'hex'), 1, 8));
    exit when not exists (select 1 from public.classes where class_code = code);
    tries := tries + 1;
    if tries > 30 then
      code := lower(substr(encode(gen_random_bytes(8), 'hex'), 1, 12));
      exit;
    end if;
  end loop;
  return code;
end;
$$;

create or replace function public.generate_lesson_token()
returns text
language plpgsql
as $$
declare
  tok text;
  tries int := 0;
begin
  loop
    tok := encode(gen_random_bytes(16), 'hex');
    exit when not exists (select 1 from public.lessons where token = tok);
    tries := tries + 1;
    if tries > 30 then
      tok := encode(gen_random_bytes(24), 'hex');
      exit;
    end if;
  end loop;
  return tok;
end;
$$;

-- 가입 트리거: 실패 원인을 메시지로 남기고, 수업이 없을 때만 생성
create or replace function public.handle_new_teacher()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_class_id uuid;
  i int;
  v_login_id text;
  v_school text;
  v_name text;
  v_email text;
begin
  begin
    v_login_id := lower(nullif(trim(coalesce(new.raw_user_meta_data->>'login_id', '')), ''));
    if v_login_id is null or v_login_id = '' then
      v_login_id := lower(split_part(coalesce(new.email, ''), '@', 1));
    end if;
    if v_login_id is null or v_login_id = '' then
      v_login_id := 'user_' || substr(replace(new.id::text, '-', ''), 1, 12);
    end if;

    -- login_id 중복이면 고유 접미사 부여 (트리거 실패 방지)
    if exists (
      select 1 from public.profiles p
      where p.login_id = v_login_id and p.id <> new.id
    ) then
      v_login_id := v_login_id || '_' || substr(replace(new.id::text, '-', ''), 1, 6);
    end if;

    v_school := coalesce(nullif(trim(new.raw_user_meta_data->>'school_name'), ''), '');
    v_name := coalesce(
      nullif(trim(new.raw_user_meta_data->>'display_name'), ''),
      v_login_id
    );
    v_email := lower(coalesce(
      nullif(trim(new.raw_user_meta_data->>'email'), ''),
      nullif(trim(new.email), '')
    ));

    insert into public.profiles (id, login_id, email, school_name, display_name, role)
    values (new.id, v_login_id, v_email, v_school, v_name, 'teacher')
    on conflict (id) do update
      set login_id = excluded.login_id,
          email = coalesce(excluded.email, public.profiles.email),
          school_name = excluded.school_name,
          display_name = excluded.display_name;

    select c.id into new_class_id
    from public.classes c
    where c.teacher_id = new.id
    limit 1;

    if new_class_id is null then
      insert into public.classes (teacher_id, title, class_code)
      values (new.id, 'AI와 함께 하는 고교학점제 진로설계', public.generate_class_code())
      returning id into new_class_id;

      for i in 1..30 loop
        insert into public.lessons (class_id, session_no, token)
        values (new_class_id, i, public.generate_lesson_token())
        on conflict (class_id, session_no) do nothing;
      end loop;
    end if;

  exception
    when others then
      raise exception 'handle_new_teacher failed: %', sqlerrm;
  end;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_teacher();

create or replace function public.get_auth_email_by_login_id(p_login_id text)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(nullif(trim(p.email), ''), u.email)
  from public.profiles p
  left join auth.users u on u.id = p.id
  where lower(p.login_id) = lower(trim(p_login_id))
  limit 1;
$$;

grant execute on function public.get_auth_email_by_login_id(text) to anon, authenticated;
grant execute on function public.generate_class_code() to postgres, anon, authenticated, service_role;
grant execute on function public.generate_lesson_token() to postgres, anon, authenticated, service_role;
grant execute on function public.handle_new_teacher() to postgres, service_role;

-- 이메일 유니크 인덱스 (빈 값 제외)
drop index if exists profiles_email_unique_idx;
create unique index profiles_email_unique_idx
  on public.profiles (lower(email))
  where email is not null and email <> '';
