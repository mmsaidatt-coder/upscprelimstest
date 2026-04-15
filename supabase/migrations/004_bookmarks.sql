-- =============================================================
-- 004 — Bookmarks table for cross-device bookmark sync
-- =============================================================

create table bookmarks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references questions(id) on delete cascade,
  subject     subject_enum not null,
  prompt      text not null,
  year        smallint,
  saved_at    timestamptz not null default now(),

  constraint uq_bookmarks_user_question unique (user_id, question_id)
);

create index idx_bookmarks_user on bookmarks (user_id, saved_at desc);

-- RLS: users can only access their own bookmarks
alter table bookmarks enable row level security;

create policy "Users can view own bookmarks"
  on bookmarks for select
  using (auth.uid() = user_id);

create policy "Users can insert own bookmarks"
  on bookmarks for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own bookmarks"
  on bookmarks for delete
  using (auth.uid() = user_id);
