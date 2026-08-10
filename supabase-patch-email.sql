-- 이메일 컬럼 + 아이디→이메일 조회 (기존 DB에 추가 실행)

alter table public.profiles add column if not exists email text;

create unique index if not exists profiles_email_unique_idx
  on public.profiles (lower(email))
  where email is not null and email <> '';

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
  v_login_id := lower(nullif(trim(coalesce(new.raw_user_meta_data->>'login_id', '')), ''));
  if v_login_id is null then
    v_login_id := lower(split_part(coalesce(new.email, ''), '@', 1));
  end if;
  if v_login_id is null or v_login_id = '' then
    v_login_id := 'user_' || substr(replace(new.id::text, '-', ''), 1, 12);
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
        email = excluded.email,
        school_name = excluded.school_name,
        display_name = excluded.display_name;

  insert into public.classes (teacher_id, title, class_code)
  values (new.id, 'AI와 함께 하는 고교학점제 진로설계', public.generate_class_code())
  returning id into new_class_id;

  for i in 1..30 loop
    insert into public.lessons (class_id, session_no, token)
    values (new_class_id, i, public.generate_lesson_token());
  end loop;

  return new;
end;
$$;

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
