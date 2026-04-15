-- ============================================================
-- Custom Exam Sampling RPC
-- Keeps large-bank random sampling inside Postgres so app servers
-- do not page through all question metadata on every generated test.
-- ============================================================

drop function if exists public.get_custom_exam_question_ids(text, integer, public.subject_enum);

create or replace function public.get_custom_exam_question_ids(
  p_mode text,
  p_size integer,
  p_subject public.subject_enum default null
)
returns table (id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_size integer := greatest(1, least(coalesce(p_size, 50), 200));
  v_mode text := coalesce(nullif(p_mode, ''), 'mixed');
  v_selected uuid[] := '{}'::uuid[];
begin
  if v_mode = 'single_subject' and p_subject is not null then
    return query
      select q.id
      from public.questions q
      where q.source in ('pyq', 'custom', 'flt')
        and q.subject = p_subject
      order by random()
      limit v_size;
    return;
  end if;

  if v_mode = 'upsc_flt' then
    with blueprint(subject, weight) as (
      values
        ('History'::public.subject_enum, 0.18::numeric),
        ('Geography'::public.subject_enum, 0.15::numeric),
        ('Polity'::public.subject_enum, 0.15::numeric),
        ('Economy'::public.subject_enum, 0.15::numeric),
        ('Environment'::public.subject_enum, 0.15::numeric),
        ('Science'::public.subject_enum, 0.07::numeric),
        ('Current Affairs'::public.subject_enum, 0.15::numeric)
    ),
    base_allocation as (
      select
        subject,
        floor(v_size * weight)::integer as base_count,
        (v_size * weight) - floor(v_size * weight) as remainder
      from blueprint
    ),
    allocation as (
      select
        subject,
        base_count
          + case
              when row_number() over (order by remainder desc, subject::text)
                <= v_size - sum(base_count) over ()
              then 1
              else 0
            end as limit_count
      from base_allocation
    ),
    ranked as (
      select
        q.id,
        a.limit_count,
        row_number() over (partition by q.subject order by random()) as subject_rank
      from public.questions q
      join allocation a on a.subject = q.subject
      where q.source in ('pyq', 'custom', 'flt')
    )
    select coalesce(array_agg(r.id), '{}'::uuid[])
      into v_selected
    from ranked r
    where r.subject_rank <= r.limit_count;

    return query
      with selected_ids as (
        select unnest(v_selected) as id
      ),
      padding as (
        select q.id
        from public.questions q
        where q.source in ('pyq', 'custom', 'flt')
          and q.id <> all(v_selected)
        order by random()
        limit greatest(0, v_size - cardinality(v_selected))
      ),
      combined as (
        select selected_ids.id from selected_ids
        union all
        select padding.id from padding
      )
      select combined.id
      from combined
      order by random()
      limit v_size;
    return;
  end if;

  return query
    select q.id
    from public.questions q
    where q.source in ('pyq', 'custom', 'flt')
    order by random()
    limit v_size;
end;
$$;

revoke all on function public.get_custom_exam_question_ids(text, integer, public.subject_enum)
  from public;
grant execute on function public.get_custom_exam_question_ids(text, integer, public.subject_enum)
  to service_role;
