-- 특성화고: 같은 학년·같은 반 번호 + 서로 다른 학과명 허용
-- 예) 1반·조리과 / 1반·미용과

alter table public.classes
  add column if not exists department_name text default '';

update public.classes
set department_name = coalesce(department_name, '')
where department_name is null;

-- 예전 인덱스(학과 미포함)가 남아 있으면 같은 반+다른 학과가 막힘
drop index if exists public.classes_teacher_unit_uidx;
drop index if exists public.classes_teacher_unit_active_uidx;

-- 활성 학급: (교사, 학년, 반, 학과명) 조합이 유니크
-- → 학과가 다르면 같은 반·같은 학번 체계 허용 (1반·미용 / 1반·기계)
create unique index if not exists classes_teacher_unit_active_uidx
  on public.classes (
    teacher_id,
    grade,
    class_no,
    (lower(btrim(coalesce(department_name, ''))))
  )
  where is_active = true;

notify pgrst, 'reload schema';
