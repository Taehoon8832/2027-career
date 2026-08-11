-- 학년별 / 학급별 수업을 각각 별도 classes 행으로 저장
-- SQL Editor에서 Run

alter table public.classes add column if not exists mode text;
alter table public.classes add column if not exists grade int;
alter table public.classes add column if not exists class_no int;
alter table public.classes add column if not exists is_active boolean not null default true;

update public.classes
set
  mode = coalesce(mode, 'grade'),
  grade = coalesce(grade, 1),
  is_active = coalesce(is_active, true)
where mode is null or grade is null;

do $$
begin
  begin
    alter table public.classes
      add constraint classes_mode_check check (mode in ('grade', 'class'));
  exception when others then null;
  end;
  begin
    alter table public.classes
      add constraint classes_grade_check check (grade between 1 and 3);
  exception when others then null;
  end;
  begin
    alter table public.classes
      add constraint classes_class_no_check check (class_no is null or class_no between 1 and 10);
  exception when others then null;
  end;
end $$;

-- 예전 유니크(학과 미포함) — 특성화고 같은 반·다른 학과와 충돌하므로 제거
drop index if exists public.classes_teacher_unit_uidx;
-- 활성 학급만: 학년+반+학과명 조합 유니크 (학과가 다르면 같은 반 허용)
drop index if exists public.classes_teacher_unit_active_uidx;
create unique index if not exists classes_teacher_unit_active_uidx
  on public.classes (
    teacher_id,
    grade,
    class_no,
    (lower(btrim(coalesce(department_name, ''))))
  )
  where is_active = true;

create index if not exists classes_teacher_active_idx
  on public.classes (teacher_id, is_active);

-- 수업코드 조회 RPC (기존 유지 + 캐시 갱신)
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

-- 교사가 본인 수업 단위를 수정/비활성화할 수 있게
drop policy if exists "classes_update_own" on public.classes;
create policy "classes_update_own" on public.classes
  for update to authenticated
  using (teacher_id = auth.uid())
  with check (teacher_id = auth.uid());

grant update on public.classes to authenticated;

notify pgrst, 'reload schema';
