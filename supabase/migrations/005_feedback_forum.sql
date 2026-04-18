-- Create Feedback Forum Tables

-- 1. Feedback Table
CREATE TABLE public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('mistake', 'feature')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'planned', 'done', 'rejected')),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Feedback Votes Table
CREATE TABLE public.feedback_votes (
  feedback_id UUID NOT NULL REFERENCES public.feedback(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (feedback_id, user_id)
);

-- Enable RLS
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_votes ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies for Feedback
CREATE POLICY "Anyone can view feedback"
  ON public.feedback FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert feedback"
  ON public.feedback FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feedback"
  ON public.feedback FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. RLS Policies for Feedback Votes
CREATE POLICY "Anyone can view feedback votes"
  ON public.feedback_votes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can vote"
  ON public.feedback_votes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their vote"
  ON public.feedback_votes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create a view for easy access to feedback with vote counts
CREATE OR REPLACE VIEW public.feedback_with_votes AS
SELECT 
  f.id,
  f.title,
  f.description,
  f.type,
  f.status,
  f.user_id,
  f.created_at,
  COUNT(v.user_id) AS upvotes
FROM 
  public.feedback f
LEFT JOIN 
  public.feedback_votes v ON f.id = v.feedback_id
GROUP BY 
  f.id, f.title, f.description, f.type, f.status, f.user_id, f.created_at;
