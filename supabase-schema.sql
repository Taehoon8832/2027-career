-- 고교학점제 진로설계: 교사(아이디) · 수업코드 · 30차시 QR · 학생 제출
-- Supabase SQL Editor에서 전체 실행하세요.
-- Authentication → Providers → Email → Confirm email: OFF 권장

create extension if not exists "pgcrypto";

-- Profiles (1:1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  login_id text not null unique,
  email text,
  school_name text not null default '',
  display_name text not null default '',
  role text not null default 'teacher' check (role in ('teacher')),
  created_at timestamptz not null default now()
);

-- 기존 테이블이 있을 때 컬럼 보강
alter table public.profiles add column if not exists login_id text;
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists school_name text not null default '';
alter table public.profiles add column if not exists display_name text;
alter table public.profiles alter column display_name set default '';

create unique index if not exists profiles_email_unique_idx
  on public.profiles (lower(email))
  where email is not null and email <> '';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_login_id_key'
  ) then
    -- null login_id가 있으면 임시값으로 채운 뒤 unique 적용
    update public.profiles
    set login_id = 'user_' || substr(replace(id::text, '-', ''), 1, 12)
    where login_id is null or login_id = '';
    alter table public.profiles alter column login_id set not null;
    alter table public.profiles add constraint profiles_login_id_key unique (login_id);
  end if;
end $$;

-- Classes
create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  title text not null default 'AI와 함께 하는 고교학점제 진로설계',
  class_code text not null unique,
  created_at timestamptz not null default now()
);

alter table public.classes add column if not exists class_code text;

do $$
begin
  update public.classes
  set class_code = upper(substr(encode(gen_random_bytes(5), 'hex'), 1, 8))
  where class_code is null or class_code = '';

  if not exists (
    select 1 from pg_constraint where conname = 'classes_class_code_key'
  ) then
    alter table public.classes alter column class_code set not null;
    alter table public.classes add constraint classes_class_code_key unique (class_code);
  end if;
end $$;

create index if not exists classes_teacher_id_idx on public.classes (teacher_id);
create index if not exists classes_class_code_idx on public.classes (class_code);

-- Lessons (1–30 per class, unique QR token — hex only, never login_id)
create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes (id) on delete cascade,
  session_no int not null check (session_no between 1 and 30),
  token text not null unique,
  created_at timestamptz not null default now(),
  unique (class_id, session_no)
);

create index if not exists lessons_class_id_idx on public.lessons (class_id);
create index if not exists lessons_token_idx on public.lessons (token);

-- Student submissions
create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  student_no text not null,
  student_name text not null,
  content text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists submissions_lesson_id_idx on public.submissions (lesson_id);
create index if not exists submissions_created_at_idx on public.submissions (created_at desc);

-- Helpers
create or replace function public.generate_class_code()
returns text
language plpgsql
as $$
declare
  code text;
  tries int := 0;
begin
  loop
    -- 8자리 대문자 hex (수업코드). 로그인 아이디와 네임스페이스가 다름
    code := upper(substr(encode(gen_random_bytes(5), 'hex'), 1, 8));
    exit when not exists (select 1 from public.classes where class_code = code);
    tries := tries + 1;
    exit when tries > 20;
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
    -- 32자 hex 난수 QR 토큰 (회원 login_id와 절대 동일 형식/용도로 쓰지 않음)
    tok := encode(gen_random_bytes(16), 'hex');
    exit when not exists (select 1 from public.lessons where token = tok);
    tries := tries + 1;
    exit when tries > 20;
  end loop;
  return tok;
end;
$$;

-- Auto profile + class + 30 lessons on signup
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_teacher();

-- RLS
alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.lessons enable row level security;
alter table public.submissions enable row level security;

-- Profiles
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Classes
drop policy if exists "classes_select_own" on public.classes;
create policy "classes_select_own" on public.classes
  for select to authenticated
  using (teacher_id = auth.uid());

drop policy if exists "classes_insert_own" on public.classes;
create policy "classes_insert_own" on public.classes
  for insert to authenticated
  with check (teacher_id = auth.uid());

-- Lessons: teacher reads/inserts own
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

-- Public lesson lookup by token (does not expose other tokens)
create or replace function public.get_lesson_by_token(p_token text)
returns table (
  id uuid,
  class_id uuid,
  session_no int
)
language sql
security definer
set search_path = public
stable
as $$
  select l.id, l.class_id, l.session_no
  from public.lessons l
  where l.token = p_token
  limit 1;
$$;

grant execute on function public.get_lesson_by_token(text) to anon, authenticated;

-- 아이디로 로그인할 때 Auth 이메일 조회 (anon 허용)
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

-- Submissions: teacher reads own class; anyone can insert (student QR)
drop policy if exists "submissions_select_teacher" on public.submissions;
create policy "submissions_select_teacher" on public.submissions
  for select to authenticated
  using (
    exists (
      select 1
      from public.lessons l
      join public.classes c on c.id = l.class_id
      where l.id = submissions.lesson_id and c.teacher_id = auth.uid()
    )
  );

drop policy if exists "submissions_insert_public" on public.submissions;
create policy "submissions_insert_public" on public.submissions
  for insert to anon, authenticated
  with check (
    exists (select 1 from public.lessons l where l.id = lesson_id)
  );

-- Realtime
do $$
begin
  alter publication supabase_realtime add table public.submissions;
exception
  when duplicate_object then null;
end $$;
