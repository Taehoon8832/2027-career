-- 코드번호만으로 차시 활동지 조회 (랜딩·학생 입장용)
-- Supabase SQL Editor에서 Run 한 뒤 사용하세요.

drop function if exists public.get_lesson_by_submit_code_only(text);

create or replace function public.get_lesson_by_submit_code_only(
  p_submit_code text
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
  limit 1;
$$;

grant execute on function public.get_lesson_by_submit_code_only(text) to anon, authenticated;

notify pgrst, 'reload schema';
