-- 차시별 제출코드 + 학생 제출 RPC
-- SQL Editor에서 전체 Run (제출 오류 해결)

-- 1) 차시마다 고유 제출코드
alter table public.lessons add column if not exists submit_code text;

update public.lessons
set submit_code = upper(substr(coalesce(token, encode(gen_random_bytes(8), 'hex')), 1, 8))
where submit_code is null or btrim(submit_code) = '';

-- 충돌 시 재생성
do $$
declare
  r record;
  code text;
  tries int;
begin
  for r in
    select id
    from public.lessons
    where submit_code in (
      select submit_code from public.lessons group by submit_code having count(*) > 1
    )
  loop
    tries := 0;
    loop
      code := upper(substr(encode(gen_random_bytes(5), 'hex'), 1, 8));
      exit when not exists (select 1 from public.lessons where submit_code = code);
      tries := tries + 1;
      exit when tries > 30;
    end loop;
    update public.lessons set submit_code = code where id = r.id;
  end loop;
end $$;

alter table public.lessons alter column submit_code set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'lessons_submit_code_key'
  ) then
    alter table public.lessons add constraint lessons_submit_code_key unique (submit_code);
  end if;
end $$;

create index if not exists lessons_submit_code_idx on public.lessons (submit_code);

-- 2) 제출코드로 차시 조회 (차시번호 일치 검증)
drop function if exists public.get_lesson_by_submit_code(text, int);
drop function if exists public.get_lesson_by_submit_code(text, integer);

create or replace function public.get_lesson_by_submit_code(
  p_submit_code text,
  p_session_no int
)
returns table (
  id uuid,
  class_id uuid,
  session_no int,
  submit_code text
)
language sql
security definer
set search_path = public
stable
as $$
  select l.id, l.class_id, l.session_no, l.submit_code
  from public.lessons l
  where upper(l.submit_code) = upper(trim(p_submit_code))
    and l.session_no = p_session_no
  limit 1;
$$;

grant execute on function public.get_lesson_by_submit_code(text, int) to anon, authenticated;

-- 3) 수업코드 + 차시 (호환 유지)
drop function if exists public.get_lesson_by_class_code(text, int);
drop function if exists public.get_lesson_by_class_code(text, integer);

create or replace function public.get_lesson_by_class_code(
  p_class_code text,
  p_session_no int
)
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
  from public.classes c
  join public.lessons l on l.class_id = c.id
  where lower(c.class_code) = lower(trim(p_class_code))
    and l.session_no = p_session_no
  limit 1;
$$;

grant execute on function public.get_lesson_by_class_code(text, int) to anon, authenticated;

-- 4) 한 번에 제출 (anon RLS 이슈 방지)
drop function if exists public.submit_activity_by_code(text, int, text, text, text);
drop function if exists public.submit_activity_by_code(text, integer, text, text, text);

create or replace function public.submit_activity_by_code(
  p_submit_code text,
  p_session_no int,
  p_student_no text,
  p_student_name text,
  p_content text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lesson_id uuid;
  v_id uuid;
begin
  if trim(coalesce(p_submit_code, '')) = '' then
    raise exception '제출 코드를 입력해 주세요.';
  end if;
  if trim(coalesce(p_student_no, '')) = '' then
    raise exception '학번을 입력해 주세요.';
  end if;
  if trim(coalesce(p_student_name, '')) = '' then
    raise exception '이름을 입력해 주세요.';
  end if;
  if trim(coalesce(p_content, '')) = '' then
    raise exception '제출할 내용이 없습니다.';
  end if;

  select l.id into v_lesson_id
  from public.lessons l
  where upper(l.submit_code) = upper(trim(p_submit_code))
    and l.session_no = p_session_no
  limit 1;

  if v_lesson_id is null then
    raise exception '제출 코드가 올바르지 않거나 이 차시와 맞지 않습니다.';
  end if;

  insert into public.submissions (lesson_id, student_no, student_name, content)
  values (v_lesson_id, trim(p_student_no), trim(p_student_name), p_content)
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.submit_activity_by_code(text, int, text, text, text) to anon, authenticated;

-- 5) 공개 제출 정책 보장
drop policy if exists "submissions_insert_public" on public.submissions;
create policy "submissions_insert_public" on public.submissions
  for insert to anon, authenticated
  with check (
    exists (select 1 from public.lessons l where l.id = lesson_id)
  );

grant insert on public.submissions to anon, authenticated;

-- 교사: 본인 학급 제출 삭제
drop policy if exists "submissions_delete_teacher" on public.submissions;
create policy "submissions_delete_teacher" on public.submissions
  for delete to authenticated
  using (
    exists (
      select 1
      from public.lessons l
      join public.classes c on c.id = l.class_id
      where l.id = submissions.lesson_id and c.teacher_id = auth.uid()
    )
  );

grant delete on public.submissions to authenticated;

-- 교사가 제출코드 보정/갱신 가능
drop policy if exists "lessons_update_teacher" on public.lessons;
create policy "lessons_update_teacher" on public.lessons
  for update to authenticated
  using (
    exists (
      select 1 from public.classes c
      where c.id = lessons.class_id and c.teacher_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.classes c
      where c.id = lessons.class_id and c.teacher_id = auth.uid()
    )
  );

grant update on public.lessons to authenticated;

-- 제출코드로 학급 메타(학과명) 조회 — 활동지 표시용 (anon 가능)
drop function if exists public.get_lesson_class_meta(text, int);
drop function if exists public.get_lesson_class_meta(text, integer);

create or replace function public.get_lesson_class_meta(
  p_submit_code text,
  p_session_no int
)
returns table (
  department_name text,
  grade int,
  class_no int
)
language sql
security definer
set search_path = public
stable
as $$
  select
    nullif(btrim(coalesce(c.department_name, '')), '') as department_name,
    c.grade,
    c.class_no
  from public.lessons l
  join public.classes c on c.id = l.class_id
  where upper(l.submit_code) = upper(trim(p_submit_code))
    and l.session_no = p_session_no
  limit 1;
$$;

grant execute on function public.get_lesson_class_meta(text, int) to anon, authenticated;

notify pgrst, 'reload schema';
