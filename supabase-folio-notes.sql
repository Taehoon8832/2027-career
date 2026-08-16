-- 학생 폴리오: 교사 관찰 평가 · 학생 활동 메모 (웹 임시 저장)
-- Supabase SQL Editor에서 Run
-- → 다른 PC에서도 같은 교사 계정으로 로그인하면 동일하게 표시됩니다.

alter table public.students
  add column if not exists teacher_observation text not null default '';

alter table public.students
  add column if not exists student_activity_text text not null default '';

notify pgrst, 'reload schema';
