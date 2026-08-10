-- 교사 본인 데이터 전체 삭제 (학급·차시·명단·제출)
-- SQL Editor에서 Run 한 뒤, 앱 상단 [초기화] 사용
-- cascade: classes 삭제 → lessons / students / submissions 함께 삭제

create or replace function public.wipe_my_teacher_data()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  v_classes int := 0;
  v_subs int := 0;
begin
  if uid is null then
    raise exception '로그인이 필요합니다.';
  end if;

  select count(*)::int into v_subs
  from public.submissions s
  join public.lessons l on l.id = s.lesson_id
  join public.classes c on c.id = l.class_id
  where c.teacher_id = uid;

  delete from public.classes
  where teacher_id = uid;

  get diagnostics v_classes = row_count;

  return jsonb_build_object(
    'ok', true,
    'deleted_classes', v_classes,
    'deleted_submissions_approx', v_subs
  );
end;
$$;

grant execute on function public.wipe_my_teacher_data() to authenticated;

-- 클라이언트에서 학급 직접 삭제할 때도 허용
drop policy if exists "classes_delete_own" on public.classes;
create policy "classes_delete_own" on public.classes
  for delete to authenticated
  using (teacher_id = auth.uid());

grant delete on public.classes to authenticated;

drop policy if exists "lessons_delete_teacher" on public.lessons;
create policy "lessons_delete_teacher" on public.lessons
  for delete to authenticated
  using (
    exists (
      select 1 from public.classes c
      where c.id = lessons.class_id and c.teacher_id = auth.uid()
    )
  );

grant delete on public.lessons to authenticated;

notify pgrst, 'reload schema';
