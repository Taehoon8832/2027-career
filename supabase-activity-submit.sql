-- 학생 활동 HTML → 수업코드 + 차시번호로 제출
-- SQL Editor에서 Run

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
grant execute on function public.get_lesson_by_class_code(text, integer) to anon, authenticated;

-- API 스키마 캐시 새로고침
notify pgrst, 'reload schema';
