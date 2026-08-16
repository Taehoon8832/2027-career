-- 수업 타이머 (교사 설정 → QR로 접속한 전원에게 동기화)
-- Supabase SQL Editor에서 전체 Run

alter table public.lessons
  add column if not exists timer_status text not null default 'idle',
  add column if not exists timer_duration_sec int,
  add column if not exists timer_remain_sec int,
  add column if not exists timer_ends_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'lessons_timer_status_check'
  ) then
    alter table public.lessons
      add constraint lessons_timer_status_check
      check (timer_status in ('idle', 'running', 'paused', 'done'));
  end if;
end $$;

-- 해당 차시 타이머를 제어할 수 있는 교사인지
create or replace function public.can_control_lesson_timer(
  p_submit_code text,
  p_session_no int
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.lessons l
    join public.classes c on c.id = l.class_id
    where upper(l.submit_code) = upper(trim(p_submit_code))
      and l.session_no = p_session_no
      and c.teacher_id = auth.uid()
  );
$$;

grant execute on function public.can_control_lesson_timer(text, int) to anon, authenticated;

-- 제출코드로 타이머 상태 조회 (QR 접속자 공통)
drop function if exists public.get_lesson_timer(text, int);
drop function if exists public.get_lesson_timer(text, integer);

create or replace function public.get_lesson_timer(
  p_submit_code text,
  p_session_no int
)
returns table (
  status text,
  duration_sec int,
  remain_sec int,
  ends_at timestamptz,
  server_now timestamptz
)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  r public.lessons%rowtype;
  v_remain int;
begin
  select * into r
  from public.lessons l
  where upper(l.submit_code) = upper(trim(p_submit_code))
    and l.session_no = p_session_no
  limit 1;

  if not found then
    return;
  end if;

  if r.timer_status = 'running' and r.timer_ends_at is not null then
    v_remain := greatest(0, floor(extract(epoch from (r.timer_ends_at - now())))::int);
    if v_remain <= 0 then
      status := 'done';
      duration_sec := r.timer_duration_sec;
      remain_sec := 0;
      ends_at := r.timer_ends_at;
      server_now := now();
      return next;
      return;
    end if;
    status := 'running';
    duration_sec := r.timer_duration_sec;
    remain_sec := v_remain;
    ends_at := r.timer_ends_at;
    server_now := now();
    return next;
    return;
  end if;

  status := coalesce(nullif(r.timer_status, ''), 'idle');
  duration_sec := r.timer_duration_sec;
  remain_sec := coalesce(r.timer_remain_sec, r.timer_duration_sec, 0);
  ends_at := r.timer_ends_at;
  server_now := now();
  return next;
end;
$$;

grant execute on function public.get_lesson_timer(text, int) to anon, authenticated;

-- 교사만 타이머 설정
drop function if exists public.set_lesson_timer(text, int, text, int, int);
drop function if exists public.set_lesson_timer(text, integer, text, integer, integer);

create or replace function public.set_lesson_timer(
  p_submit_code text,
  p_session_no int,
  p_status text,
  p_duration_sec int default null,
  p_remain_sec int default null
)
returns table (
  status text,
  duration_sec int,
  remain_sec int,
  ends_at timestamptz,
  server_now timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.lessons%rowtype;
  v_status text;
  v_duration int;
  v_remain int;
  v_ends timestamptz;
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다.';
  end if;

  v_status := lower(trim(coalesce(p_status, 'idle')));
  if v_status not in ('idle', 'running', 'paused', 'done') then
    raise exception '잘못된 타이머 상태입니다.';
  end if;

  select l.* into r
  from public.lessons l
  join public.classes c on c.id = l.class_id
  where upper(l.submit_code) = upper(trim(p_submit_code))
    and l.session_no = p_session_no
    and c.teacher_id = auth.uid()
  limit 1;

  if not found then
    raise exception '이 차시 타이머를 제어할 권한이 없습니다.';
  end if;

  v_duration := nullif(p_duration_sec, 0);
  if v_duration is not null then
    v_duration := greatest(60, least(300 * 60, v_duration));
  else
    v_duration := coalesce(r.timer_duration_sec, 50 * 60);
  end if;

  v_remain := coalesce(p_remain_sec, v_duration);
  v_remain := greatest(0, least(300 * 60, v_remain));
  v_ends := null;

  if v_status = 'running' then
    if v_remain <= 0 then
      v_status := 'done';
      v_remain := 0;
    else
      v_ends := now() + make_interval(secs => v_remain);
    end if;
  elsif v_status = 'idle' then
    v_remain := v_duration;
  elsif v_status = 'done' then
    v_remain := 0;
  end if;

  update public.lessons
  set
    timer_status = v_status,
    timer_duration_sec = v_duration,
    timer_remain_sec = v_remain,
    timer_ends_at = v_ends
  where id = r.id;

  return query
  select * from public.get_lesson_timer(p_submit_code, p_session_no);
end;
$$;

grant execute on function public.set_lesson_timer(text, int, text, int, int) to authenticated;
