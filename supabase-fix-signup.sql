-- 회원가입 오류 수정 (프로필만 트리거, 수업/QR은 앱에서 생성)
-- SQL Editor → + New → 전체 붙여넣기 → Run

create extension if not exists "pgcrypto";

-- auth.users 에 걸린 커스텀 트리거 전부 제거 후 안전한 트리거만 다시 설치
do $$
declare
  r record;
begin
  for r in
    select t.tgname
    from pg_trigger t
    where t.tgrelid = 'auth.users'::regclass
      and not t.tgisinternal
  loop
    execute format('drop trigger if exists %I on auth.users', r.tgname);
  end loop;
end $$;

-- profiles 컬럼 보장
alter table public.profiles add column if not exists login_id text;
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists school_name text;
alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists role text;
alter table public.profiles alter column school_name set default '';
alter table public.profiles alter column display_name set default '';
alter table public.profiles alter column role set default 'teacher';

update public.profiles
set
  login_id = coalesce(nullif(login_id, ''), 'user_' || substr(replace(id::text, '-', ''), 1, 12)),
  school_name = coalesce(school_name, ''),
  display_name = coalesce(display_name, ''),
  role = coalesce(nullif(role, ''), 'teacher');

do $$
begin
  begin
    alter table public.profiles alter column login_id set not null;
  exception when others then null;
  end;
  begin
    alter table public.profiles add constraint profiles_login_id_key unique (login_id);
  exception when others then null;
  end;
end $$;

drop index if exists profiles_email_unique_idx;
create unique index profiles_email_unique_idx
  on public.profiles (lower(email))
  where email is not null and email <> '';

-- classes.class_code 보장
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
  exception when others then null;
  end;
end $$;

-- lessons 유니크 보장 (없으면 ON CONFLICT / 중복 방지 실패)
do $$
begin
  begin
    alter table public.lessons
      add constraint lessons_class_id_session_no_key unique (class_id, session_no);
  exception when others then null;
  end;
  begin
    alter table public.lessons
      add constraint lessons_token_key unique (token);
  exception when others then null;
  end;
end $$;

create or replace function public.generate_class_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  code text;
begin
  loop
    code := lower(substr(encode(gen_random_bytes(5), 'hex'), 1, 8));
    exit when not exists (select 1 from public.classes where class_code = code);
  end loop;
  return code;
end;
$$;

create or replace function public.generate_lesson_token()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  tok text;
begin
  loop
    tok := encode(gen_random_bytes(16), 'hex');
    exit when not exists (select 1 from public.lessons where token = tok);
  end loop;
  return tok;
end;
$$;

-- ★ 핵심: 가입 시 프로필만 저장 (여기서 수업/레슨 만들지 않음 → 가입 실패 방지)
create or replace function public.handle_new_teacher()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_login_id text;
  v_school text;
  v_name text;
  v_email text;
begin
  v_login_id := lower(nullif(trim(coalesce(new.raw_user_meta_data->>'login_id', '')), ''));
  if v_login_id is null or v_login_id = '' then
    v_login_id := lower(split_part(coalesce(new.email, ''), '@', 1));
  end if;
  if v_login_id is null or v_login_id = '' then
    v_login_id := 't' || substr(replace(new.id::text, '-', ''), 1, 12);
  end if;

  if exists (select 1 from public.profiles p where p.login_id = v_login_id and p.id <> new.id) then
    v_login_id := v_login_id || '_' || substr(replace(new.id::text, '-', ''), 1, 6);
  end if;

  v_school := coalesce(nullif(trim(new.raw_user_meta_data->>'school_name'), ''), '');
  v_name := coalesce(nullif(trim(new.raw_user_meta_data->>'display_name'), ''), v_login_id);
  v_email := lower(coalesce(
    nullif(trim(new.raw_user_meta_data->>'email'), ''),
    nullif(trim(new.email), '')
  ));

  -- 이메일 유니크 충돌 시 null로 저장 (auth.users.email은 그대로)
  if v_email is not null and exists (
    select 1 from public.profiles p where lower(p.email) = v_email and p.id <> new.id
  ) then
    v_email := null;
  end if;

  insert into public.profiles (id, login_id, email, school_name, display_name, role)
  values (new.id, v_login_id, v_email, v_school, v_name, 'teacher')
  on conflict (id) do update
    set login_id = excluded.login_id,
        email = coalesce(excluded.email, public.profiles.email),
        school_name = excluded.school_name,
        display_name = excluded.display_name;

  return new;
exception
  when others then
    -- 프로필 저장 실패해도 가입 자체는 막지 않음 (앱에서 재시도)
    raise warning 'handle_new_teacher: %', sqlerrm;
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_teacher();

-- 앱에서 프로필 보강/수업 생성 가능하도록 RLS
alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.lessons enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated using (id = auth.uid());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "classes_select_own" on public.classes;
create policy "classes_select_own" on public.classes
  for select to authenticated using (teacher_id = auth.uid());

drop policy if exists "classes_insert_own" on public.classes;
create policy "classes_insert_own" on public.classes
  for insert to authenticated with check (teacher_id = auth.uid());

drop policy if exists "lessons_select_teacher" on public.lessons;
create policy "lessons_select_teacher" on public.lessons
  for select to authenticated
  using (
    exists (
      select 1 from public.classes c
      where c.id = lessons.class_id and c.teacher_id = auth.uid()
    )
  );

drop policy if exists "lessons_insert_teacher" on public.lessons;
create policy "lessons_insert_teacher" on public.lessons
  for insert to authenticated
  with check (
    exists (
      select 1 from public.classes c
      where c.id = lessons.class_id and c.teacher_id = auth.uid()
    )
  );

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
grant usage on schema public to anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert on public.classes to authenticated;
grant select, insert on public.lessons to authenticated;
