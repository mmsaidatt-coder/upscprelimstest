-- =============================================================
-- UPSCPRELIMSTEST — Initial Supabase Schema
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- =============================================================

-- 0. Extensions
create extension if not exists "pgcrypto";

-- 1. Enum types
create type subject_enum as enum (
  'Polity', 'History', 'Economy', 'Geography',
  'Environment', 'Science', 'Current Affairs', 'CSAT'
);

create type difficulty_enum as enum ('Easy', 'Moderate', 'Hard');
create type option_id_enum as enum ('A', 'B', 'C', 'D');
create type question_source_enum as enum ('pyq', 'flt', 'subject', 'custom');
create type attempt_grading_enum as enum ('graded', 'partial', 'ungraded');
create type readiness_band_enum as enum (
  'Foundation Build', 'On Track', 'Cutoff Ready', 'Interview Zone'
);

-- 2. Profiles
create table profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', new.email)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- 3. Questions (unified for PYQ, FLT, subject, custom)
create table questions (
  id                uuid primary key default gen_random_uuid(),
  source            question_source_enum not null default 'custom',
  subject           subject_enum not null,
  difficulty        difficulty_enum not null,
  prompt            text not null,
  context_lines     text[] default '{}',
  options           jsonb not null,
  correct_option_id option_id_enum,
  explanation       text,
  takeaway          text,
  marks             numeric(5,2) not null default 2,
  negative_marks    numeric(5,2) not null default 0.67,
  year              smallint,
  source_label      text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index idx_questions_source       on questions (source);
create index idx_questions_subject      on questions (subject);
create index idx_questions_year         on questions (year) where year is not null;
create index idx_questions_year_subject on questions (year, subject) where year is not null;

alter table questions add constraint chk_options_format
  check (jsonb_typeof(options) = 'array' and jsonb_array_length(options) = 4);

-- 4. Topics
create table topics (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  name_lower text not null generated always as (lower(name)) stored,
  created_at timestamptz not null default now(),
  constraint uq_topics_name_lower unique (name_lower)
);

create table question_topics (
  question_id uuid not null references questions(id) on delete cascade,
  topic_id    uuid not null references topics(id) on delete cascade,
  primary key (question_id, topic_id)
);

create index idx_question_topics_topic on question_topics (topic_id);

-- 5. Test templates (for predefined FLTs only)
create table test_templates (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique,
  title            text not null,
  tagline          text not null default '',
  description      text not null default '',
  duration_minutes int not null,
  difficulty_label text not null default '',
  question_count   int not null default 0,
  is_published     boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table test_template_questions (
  template_id uuid not null references test_templates(id) on delete cascade,
  question_id uuid not null references questions(id) on delete cascade,
  ordinal     int not null,
  primary key (template_id, question_id),
  constraint uq_template_ordinal unique (template_id, ordinal)
);

-- 6. Attempts
create table attempts (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references profiles(id) on delete cascade,
  test_template_id      uuid references test_templates(id) on delete set null,
  test_slug             text not null,
  test_title            text not null,
  started_at            timestamptz not null,
  completed_at          timestamptz not null,
  duration_seconds      int not null,
  grading               attempt_grading_enum not null,
  score                 numeric(7,2),
  total_marks           numeric(7,2) not null,
  graded_question_count int not null default 0,
  graded_total_marks    numeric(7,2) not null default 0,
  attempted_count       int not null,
  correct_count         int,
  incorrect_count       int,
  unattempted_count     int not null,
  accuracy_percent      numeric(5,1),
  percentile_estimate   int,
  readiness_band        readiness_band_enum,
  created_at            timestamptz not null default now()
);

create index idx_attempts_user      on attempts (user_id);
create index idx_attempts_user_date on attempts (user_id, completed_at desc);

-- 7. Attempt answers
create table attempt_answers (
  id                    uuid primary key default gen_random_uuid(),
  attempt_id            uuid not null references attempts(id) on delete cascade,
  question_id           uuid not null references questions(id) on delete restrict,
  ordinal               int not null,
  selected_option_id    option_id_enum,
  is_correct            boolean,
  time_spent_seconds    int not null default 0,
  marked_for_review     boolean not null default false,
  eliminated_option_ids option_id_enum[] default '{}',
  constraint uq_attempt_question unique (attempt_id, question_id),
  constraint uq_attempt_ordinal  unique (attempt_id, ordinal)
);

create index idx_attempt_answers_attempt on attempt_answers (attempt_id);

-- 8. Notebook entries
create table notebook_entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  question_id uuid not null references questions(id) on delete cascade,
  attempt_id  uuid references attempts(id) on delete set null,
  test_slug   text not null,
  subject     subject_enum not null,
  title       text not null,
  body        text not null default '',
  saved_at    timestamptz not null default now(),
  constraint uq_notebook_user_question unique (user_id, question_id)
);

create index idx_notebook_user      on notebook_entries (user_id);
create index idx_notebook_user_date on notebook_entries (user_id, saved_at desc);

-- =============================================================
-- 9. Row Level Security
-- =============================================================

-- Profiles
alter table profiles enable row level security;
create policy "Users can view own profile"   on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- Questions: read-only for authenticated users
alter table questions enable row level security;
create policy "Authenticated can read questions" on questions for select to authenticated using (true);

-- Topics: read-only
alter table topics enable row level security;
create policy "Authenticated can read topics" on topics for select to authenticated using (true);
alter table question_topics enable row level security;
create policy "Authenticated can read question_topics" on question_topics for select to authenticated using (true);

-- Test templates: read published only
alter table test_templates enable row level security;
create policy "Authenticated can read published templates" on test_templates for select to authenticated using (is_published = true);
alter table test_template_questions enable row level security;
create policy "Authenticated can read template questions" on test_template_questions for select to authenticated
  using (exists (select 1 from test_templates where id = template_id and is_published = true));

-- Attempts: user-scoped
alter table attempts enable row level security;
create policy "Users can view own attempts"  on attempts for select using (auth.uid() = user_id);
create policy "Users can insert own attempts" on attempts for insert with check (auth.uid() = user_id);

-- Attempt answers: scoped via parent attempt
alter table attempt_answers enable row level security;
create policy "Users can view own attempt answers" on attempt_answers for select
  using (exists (select 1 from attempts where id = attempt_id and user_id = auth.uid()));
create policy "Users can insert own attempt answers" on attempt_answers for insert
  with check (exists (select 1 from attempts where id = attempt_id and user_id = auth.uid()));

-- Notebook: user-scoped CRUD
alter table notebook_entries enable row level security;
create policy "Users can view own notebook"   on notebook_entries for select using (auth.uid() = user_id);
create policy "Users can insert own notebook"  on notebook_entries for insert with check (auth.uid() = user_id);
create policy "Users can update own notebook"  on notebook_entries for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own notebook"  on notebook_entries for delete using (auth.uid() = user_id);

-- =============================================================
-- 10. Helper functions
-- =============================================================

-- Subject metrics for an attempt (computed, not stored)
create or replace function get_attempt_subject_metrics(p_attempt_id uuid)
returns table (
  subject          subject_enum,
  correct          int,
  incorrect        int,
  unattempted      int,
  score            numeric,
  total            int,
  accuracy_percent numeric,
  avg_time_seconds int
)
language sql stable
as $$
  select
    q.subject,
    count(*) filter (where aa.is_correct = true)::int,
    count(*) filter (where aa.is_correct = false)::int,
    count(*) filter (where aa.selected_option_id is null)::int,
    coalesce(sum(case
      when aa.is_correct = true then q.marks
      when aa.is_correct = false then -q.negative_marks
      else 0
    end), 0),
    count(*)::int,
    case
      when count(*) filter (where aa.selected_option_id is not null and aa.is_correct is not null) = 0 then 0
      else round(
        count(*) filter (where aa.is_correct = true)::numeric * 100.0
        / nullif(count(*) filter (where aa.selected_option_id is not null and aa.is_correct is not null), 0), 1
      )
    end,
    coalesce(round(avg(aa.time_spent_seconds))::int, 0)
  from attempt_answers aa
  join questions q on q.id = aa.question_id
  where aa.attempt_id = p_attempt_id
  group by q.subject
  order by array_position(
    array['Polity','History','Economy','Geography','Environment','Science','Current Affairs','CSAT']::subject_enum[],
    q.subject
  );
$$;

-- Save attempt + answers in one RPC call
create or replace function save_attempt(p_attempt jsonb, p_answers jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_attempt_id uuid;
  v_user_id    uuid := auth.uid();
  v_answer     jsonb;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  v_attempt_id := coalesce((p_attempt ->> 'id')::uuid, gen_random_uuid());

  insert into public.attempts (
    id, user_id, test_template_id, test_slug, test_title,
    started_at, completed_at, duration_seconds,
    grading, score, total_marks,
    graded_question_count, graded_total_marks,
    attempted_count, correct_count, incorrect_count, unattempted_count,
    accuracy_percent, percentile_estimate, readiness_band
  ) values (
    v_attempt_id, v_user_id,
    (p_attempt ->> 'test_template_id')::uuid,
    p_attempt ->> 'test_slug',
    p_attempt ->> 'test_title',
    (p_attempt ->> 'started_at')::timestamptz,
    (p_attempt ->> 'completed_at')::timestamptz,
    (p_attempt ->> 'duration_seconds')::int,
    (p_attempt ->> 'grading')::public.attempt_grading_enum,
    (p_attempt ->> 'score')::numeric,
    (p_attempt ->> 'total_marks')::numeric,
    (p_attempt ->> 'graded_question_count')::int,
    (p_attempt ->> 'graded_total_marks')::numeric,
    (p_attempt ->> 'attempted_count')::int,
    (p_attempt ->> 'correct_count')::int,
    (p_attempt ->> 'incorrect_count')::int,
    (p_attempt ->> 'unattempted_count')::int,
    (p_attempt ->> 'accuracy_percent')::numeric,
    (p_attempt ->> 'percentile_estimate')::int,
    (p_attempt ->> 'readiness_band')::public.readiness_band_enum
  );

  for v_answer in select * from jsonb_array_elements(p_answers)
  loop
    insert into public.attempt_answers (
      attempt_id, question_id, ordinal,
      selected_option_id, is_correct,
      time_spent_seconds, marked_for_review, eliminated_option_ids
    ) values (
      v_attempt_id,
      (v_answer ->> 'question_id')::uuid,
      (v_answer ->> 'ordinal')::int,
      (v_answer ->> 'selected_option_id')::public.option_id_enum,
      (v_answer ->> 'is_correct')::boolean,
      (v_answer ->> 'time_spent_seconds')::int,
      coalesce((v_answer ->> 'marked_for_review')::boolean, false),
      coalesce(
        (select array_agg(val::public.option_id_enum)
         from jsonb_array_elements_text(v_answer -> 'eliminated_option_ids') as val),
        '{}'::public.option_id_enum[]
      )
    );
  end loop;

  return v_attempt_id;
end;
$$;
