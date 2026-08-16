-- 로그인한 교사 계정 데이터 용량(바이트) 조회
-- 관리자 상단바 DB 사용량 안내용

create or replace function public.get_my_teacher_data_bytes()
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  with my_classes as (
    select id from public.classes where teacher_id = auth.uid()
  ),
  my_lessons as (
    select l.id
    from public.lessons l
    join my_classes c on c.id = l.class_id
  )
  select
    coalesce((
      select sum(pg_column_size(c.*))::bigint
      from public.classes c
      where c.teacher_id = auth.uid()
    ), 0)
    + coalesce((
      select sum(pg_column_size(l.*))::bigint
      from public.lessons l
      join my_classes c on c.id = l.class_id
    ), 0)
    + coalesce((
      select sum(pg_column_size(s.*))::bigint
      from public.students s
      join my_classes c on c.id = s.class_id
    ), 0)
    + coalesce((
      select sum(pg_column_size(sub.*))::bigint
      from public.submissions sub
      join my_lessons l on l.id = sub.lesson_id
    ), 0)
    + coalesce((
      select pg_column_size(p.*)::bigint
      from public.profiles p
      where p.id = auth.uid()
    ), 0);
$$;

revoke all on function public.get_my_teacher_data_bytes() from public;
grant execute on function public.get_my_teacher_data_bytes() to authenticated;
