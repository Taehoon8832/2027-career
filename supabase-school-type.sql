-- 고교 유형(일반고/특성화고) + 학급별 학과명
-- Supabase SQL Editor에서 Run

alter table public.profiles
  add column if not exists school_type text default 'general';

update public.profiles
set school_type = 'general'
where school_type is null or btrim(school_type) = '';

do $$
begin
  begin
    alter table public.profiles drop constraint if exists profiles_school_type_check;
  exception when others then null;
  end;
  begin
    alter table public.profiles
      add constraint profiles_school_type_check
      check (school_type in ('general', 'vocational'));
  exception when others then null;
  end;
end $$;

alter table public.classes
  add column if not exists department_name text default '';

update public.classes
set department_name = coalesce(department_name, '')
where department_name is null;

-- 같은 반 번호 + 다른 학과명 허용 (1반·조리과 / 1반·미용과)
drop index if exists public.classes_teacher_unit_active_uidx;
create unique index if not exists classes_teacher_unit_active_uidx
  on public.classes (
    teacher_id,
    grade,
    class_no,
    (lower(btrim(coalesce(department_name, ''))))
  )
  where is_active = true;

-- 학번 유형: type1(10101) / type2(1101)
alter table public.profiles
  add column if not exists student_no_format text default 'type1';

update public.profiles
set student_no_format = 'type1'
where student_no_format is null or btrim(student_no_format) = '';

do $$
begin
  begin
    alter table public.profiles drop constraint if exists profiles_student_no_format_check;
  exception when others then null;
  end;
  begin
    alter table public.profiles
      add constraint profiles_student_no_format_check
      check (student_no_format in ('type1', 'type2'));
  exception when others then null;
  end;
end $$;

notify pgrst, 'reload schema';
