-- 고교학점제 진로설계: 교사·30차시 QR·학생 제출
-- Supabase SQL Editor에서 실행하세요.

-- Extensions
create extension if not exists "pgcrypto";

-- Profiles (1:1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  role text not null default 'teacher' check (role in ('teacher')),
  created_at timestamptz not null default now()
);

-- Classes
create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  title text not null default 'AI와 함께 하는 고교학점제 진로설계',
  created_at timestamptz not null default now()
);

create index if not exists classes_teacher_id_idx on public.classes (teacher_id);

-- Lessons (1–30 per class, QR token)
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
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    'teacher'
  );

  insert into public.classes (teacher_id, title)
  values (new.id, 'AI와 함께 하는 고교학점제 진로설계')
  returning id into new_class_id;

  for i in 1..30 loop
    insert into public.lessons (class_id, session_no, token)
    values (
      new_class_id,
      i,
      encode(gen_random_bytes(16), 'hex')
    );
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

-- Realtime (이미 추가된 경우 무시)
do $$
begin
  alter publication supabase_realtime add table public.submissions;
exception
  when duplicate_object then null;
end $$;
