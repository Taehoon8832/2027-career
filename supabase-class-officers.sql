-- 학급 반장·부반장 지정 (1·2학기)
-- SQL Editor에서 Run

alter table public.classes
  add column if not exists president_student_id uuid references public.students (id) on delete set null;

alter table public.classes
  add column if not exists vice_president_student_id uuid references public.students (id) on delete set null;

-- 2학기 반장·부반장 (1학기는 위 컬럼 사용)
alter table public.classes
  add column if not exists president_student_id_s2 uuid references public.students (id) on delete set null;

alter table public.classes
  add column if not exists vice_president_student_id_s2 uuid references public.students (id) on delete set null;

create index if not exists classes_president_student_id_idx
  on public.classes (president_student_id)
  where president_student_id is not null;

create index if not exists classes_vice_president_student_id_idx
  on public.classes (vice_president_student_id)
  where vice_president_student_id is not null;

create index if not exists classes_president_student_id_s2_idx
  on public.classes (president_student_id_s2)
  where president_student_id_s2 is not null;

create index if not exists classes_vice_president_student_id_s2_idx
  on public.classes (vice_president_student_id_s2)
  where vice_president_student_id_s2 is not null;

notify pgrst, 'reload schema';
