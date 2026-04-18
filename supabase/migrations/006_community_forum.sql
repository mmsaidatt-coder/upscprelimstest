-- =============================================================
-- UPSCPRELIMSTEST — Community Forum Schema
-- =============================================================

-- 1. Add anonymous_name to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS anonymous_name TEXT UNIQUE;

-- 2. Communities Table (Subreddits equivalents)
CREATE TABLE public.communities (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         TEXT UNIQUE NOT NULL,
  name         TEXT NOT NULL,
  description  TEXT NOT NULL DEFAULT '',
  created_by   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure slugs are lowercase and basic chars
ALTER TABLE public.communities ADD CONSTRAINT chk_community_slug_format CHECK (slug ~ '^[a-z0-9-]+$');

-- 3. Posts Table
CREATE TABLE public.community_posts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title        TEXT NOT NULL,
  content      TEXT NOT NULL DEFAULT '',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Post Votes
CREATE TABLE public.community_post_votes (
  post_id     UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  vote_type   SMALLINT NOT NULL CHECK (vote_type IN (-1, 1)),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

-- 5. Comments Table
CREATE TABLE public.community_comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  parent_id   UUID REFERENCES public.community_comments(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Comment Votes
CREATE TABLE public.community_comment_votes (
  comment_id  UUID NOT NULL REFERENCES public.community_comments(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  vote_type   SMALLINT NOT NULL CHECK (vote_type IN (-1, 1)),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (comment_id, user_id)
);

-- =============================================================
-- Row Level Security (RLS)
-- =============================================================

-- Communities
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view communities" ON public.communities FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create communities" ON public.communities FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Creators can update communities" ON public.communities FOR UPDATE TO authenticated USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);

-- Posts
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view posts" ON public.community_posts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert posts" ON public.community_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authors can update posts" ON public.community_posts FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authors can delete posts" ON public.community_posts FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Post Votes
ALTER TABLE public.community_post_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view post votes" ON public.community_post_votes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can vote on posts" ON public.community_post_votes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their post votes" ON public.community_post_votes FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their post votes" ON public.community_post_votes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Comments
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view comments" ON public.community_comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert comments" ON public.community_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authors can update comments" ON public.community_comments FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authors can delete comments" ON public.community_comments FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Comment Votes
ALTER TABLE public.community_comment_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view comment votes" ON public.community_comment_votes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can vote on comments" ON public.community_comment_votes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their comment votes" ON public.community_comment_votes FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their comment votes" ON public.community_comment_votes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_community_posts_community_id ON public.community_posts (community_id);
CREATE INDEX idx_community_comments_post_id ON public.community_comments (post_id);
CREATE INDEX idx_community_comments_parent_id ON public.community_comments (parent_id);
