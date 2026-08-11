-- 특성화고: 같은 학년·같은 반 번호 + 서로 다른 학과명 허용
-- 예) 1반·미용 / 1반·조리
-- Supabase SQL Editor에서 이 파일을 그대로 실행하세요.

alter table public.classes
  add column if not exists department_name text default '';

update public.classes
set department_name = coalesce(department_name, '')
where department_name is null;

-- 예전 인덱스(학과 미포함)가 남아 있으면 같은 반+다른 학과가 막힘
drop index if exists public.classes_teacher_unit_uidx;
drop index if exists public.classes_teacher_unit_active_uidx;

-- 혹시 남아 있는 (teacher, grade, class_no) 유니크도 제거
do $$
declare
  r record;
begin
  for r in
    select i.relname as index_name
    from pg_class t
    join pg_index x on x.indrelid = t.oid
    join pg_class i on i.oid = x.indexrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'classes'
      and x.indisunique
      and not x.indisprimary
      and pg_get_indexdef(i.oid) ilike '%class_no%'
      and pg_get_indexdef(i.oid) not ilike '%department_name%'
  loop
    execute format('drop index if exists public.%I', r.index_name);
  end loop;
end $$;

-- 활성 학급: (교사, 학년, 반, 학과명) 조합이 유니크
-- → 학과가 다르면 같은 반 허용 (1반·미용 / 1반·조리)
create unique index public.classes_teacher_unit_active_uidx
  on public.classes (
    teacher_id,
    grade,
    class_no,
    (lower(btrim(coalesce(department_name, ''))))
  )
  where is_active = true;

notify pgrst, 'reload schema';
