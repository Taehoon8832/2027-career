-- ★ 이것만 먼저 실행하세요 (가입 막던 트리거 제거)
-- SQL Editor → + New → 붙여넣기 → Run

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

-- 프로필/수업은 앱에서 생성하므로 RLS 정책만 보강
alter table public.profiles add column if not exists login_id text;
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists school_name text default '';
alter table public.profiles add column if not exists display_name text default '';
alter table public.profiles add column if not exists role text default 'teacher';

alter table public.classes add column if not exists class_code text;

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
