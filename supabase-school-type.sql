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
