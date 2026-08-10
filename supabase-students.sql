-- 학급별 학생 명단 (기본 30명, 추가/삭제)
-- + 학년별 제거 후 학급 단위만 사용
-- SQL Editor에서 Run

alter table public.classes add column if not exists mode text;
alter table public.classes add column if not exists grade int;
alter table public.classes add column if not exists class_no int;
alter table public.classes add column if not exists is_active boolean not null default true;

-- 예전 학년별(또는 class_no 없는) 행 → 학급 모드로 정규화 후 비활성
update public.classes
set
  is_active = false,
  mode = 'class',
  grade = coalesce(grade, 1),
  class_no = coalesce(nullif(class_no, 0), grade, 1)
where coalesce(mode, '') <> 'class'
   or class_no is null
   or class_no < 1;

update public.classes
set
  mode = 'class',
  grade = coalesce(grade, 1),
  class_no = coalesce(class_no, 1)
where mode is null or grade is null or class_no is null;

-- 같은 교사·학년·반 중복 시 하나만 활성
with ranked as (
  select
    id,
    row_number() over (
      partition by teacher_id, grade, class_no
      order by is_active desc, created_at asc nulls last
    ) as rn
  from public.classes
)
update public.classes c
set is_active = false
from ranked r
where c.id = r.id and r.rn > 1;

do $$
begin
  begin
    alter table public.classes drop constraint if exists classes_mode_check;
  exception when others then null;
  end;
  begin
    alter table public.classes
      add constraint classes_mode_check check (mode = 'class');
  exception when others then null;
  end;
  begin
    alter table public.classes drop constraint if exists classes_grade_check;
  exception when others then null;
  end;
  begin
    alter table public.classes
      add constraint classes_grade_check check (grade between 1 and 3);
  exception when others then null;
  end;
  begin
    alter table public.classes drop constraint if exists classes_class_no_check;
  exception when others then null;
  end;
  begin
    alter table public.classes
      add constraint classes_class_no_check check (class_no between 1 and 10);
  exception when others then null;
  end;
end $$;

-- 활성 학급만 유니크 (비활성 예전 데이터와 충돌 방지)
drop index if exists public.classes_teacher_unit_uidx;
create unique index if not exists classes_teacher_unit_active_uidx
  on public.classes (teacher_id, grade, class_no)
  where is_active = true;

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes (id) on delete cascade,
  student_no text not null,
  student_name text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (class_id, student_no)
);

create index if not exists students_class_id_idx on public.students (class_id);
create index if not exists students_sort_idx on public.students (class_id, sort_order);

alter table public.students enable row level security;

drop policy if exists "students_select_teacher" on public.students;
create policy "students_select_teacher" on public.students
  for select to authenticated
  using (
    exists (
      select 1 from public.classes c
      where c.id = students.class_id and c.teacher_id = auth.uid()
    )
  );

drop policy if exists "students_insert_teacher" on public.students;
create policy "students_insert_teacher" on public.students
  for insert to authenticated
  with check (
    exists (
      select 1 from public.classes c
      where c.id = students.class_id and c.teacher_id = auth.uid()
    )
  );

drop policy if exists "students_update_teacher" on public.students;
create policy "students_update_teacher" on public.students
  for update to authenticated
  using (
    exists (
      select 1 from public.classes c
      where c.id = students.class_id and c.teacher_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.classes c
      where c.id = students.class_id and c.teacher_id = auth.uid()
    )
  );

drop policy if exists "students_delete_teacher" on public.students;
create policy "students_delete_teacher" on public.students
  for delete to authenticated
  using (
    exists (
      select 1 from public.classes c
      where c.id = students.class_id and c.teacher_id = auth.uid()
    )
  );

drop policy if exists "classes_update_own" on public.classes;
create policy "classes_update_own" on public.classes
  for update to authenticated
  using (teacher_id = auth.uid())
  with check (teacher_id = auth.uid());

grant select, insert, update, delete on public.students to authenticated;
grant update on public.classes to authenticated;

-- 학급 생성 시 기본 30명 시드
create or replace function public.seed_default_students(p_class_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  i int;
begin
  if exists (select 1 from public.students s where s.class_id = p_class_id) then
    return;
  end if;
  for i in 1..30 loop
    insert into public.students (class_id, student_no, student_name, sort_order)
    values (
      p_class_id,
      lpad(i::text, 2, '0'),
      '',
      i
    )
    on conflict (class_id, student_no) do nothing;
  end loop;
end;
$$;

grant execute on function public.seed_default_students(uuid) to authenticated;

notify pgrst, 'reload schema';
