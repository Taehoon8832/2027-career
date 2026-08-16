-- 교사: 본인 학급 제출의 학번·이름·lesson_id 수정 (제출 이동)
-- Supabase SQL Editor에서 Run 한 뒤, 제출 현황에서 다시 "이동"을 시도하세요.
-- ※ 기존에는 SELECT/INSERT/DELETE만 있고 UPDATE 정책이 없어 이동이 조용히 무시되었습니다.

drop policy if exists "submissions_update_teacher" on public.submissions;
create policy "submissions_update_teacher" on public.submissions
  for update to authenticated
  using (
    exists (
      select 1
      from public.lessons l
      join public.classes c on c.id = l.class_id
      where l.id = submissions.lesson_id and c.teacher_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.lessons l
      join public.classes c on c.id = l.class_id
      where l.id = submissions.lesson_id and c.teacher_id = auth.uid()
    )
  );

grant update on public.submissions to authenticated;

notify pgrst, 'reload schema';
