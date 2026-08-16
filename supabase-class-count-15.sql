-- 학급 수 상한 확장 (10 → 15)
-- Supabase SQL Editor에서 Run 한 뒤, 관리자 페이지에서 학급 저장을 다시 시도하세요.
-- UI(MAX_CLASS_COUNT=15)와 DB 체크 제약을 맞춥니다.

do $$
begin
  begin
    alter table public.classes drop constraint if exists classes_class_no_check;
  exception when others then null;
  end;
  begin
    alter table public.classes
      add constraint classes_class_no_check
      check (class_no is null or class_no between 1 and 15);
  exception when others then null;
  end;
end $$;

notify pgrst, 'reload schema';
