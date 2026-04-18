"use client";

import { use, useState, useEffect } from "react";
import { createPost } from "@/app/app/forum/actions";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SubmitPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [communityId, setCommunityId] = useState<string | null>(null);
  const [fetching, setFetching] = useState(true);

  const resolvedParams = use(params);
  const slug = resolvedParams.slug;
  const supabase = createClient();

  useEffect(() => {
    async function getComm() {
      const { data, error } = await supabase.from("communities").select("id").eq("slug", slug).single();
      if (!error && data) {
         setCommunityId(data.id);
      } else {
         setError("Community not found.");
      }
      setFetching(false);
    }
    getComm();
  }, [slug, supabase]);

  async function handleSubmit(formData: FormData) {
    if (!communityId) return;
    setLoading(true);
    setError(null);
    try {
      await createPost(communityId, slug, formData);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
      setLoading(false);
    }
  }

  if (fetching) {
     return <div className="text-center py-12 text-muted">Loading...</div>;
  }

  if (!communityId && !fetching) {
     return <div className="text-center py-12 text-danger">Community not found.</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 fade-up">
      <div>
        <h2 className="text-2xl font-bold mb-2">Create a Post</h2>
        <p className="text-muted text-sm border-b border-border pb-4">
          Posting in <span className="font-bold text-foreground">c/{slug}</span>
        </p>
      </div>

      <div className="card-elevated p-6 sm:p-8">
        <form action={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-danger/10 text-danger px-4 py-3 rounded-xl text-sm border border-danger/20 font-medium">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="title" className="label text-base flex items-center gap-2">
              Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              required
              maxLength={300}
              placeholder="An interesting title"
              className="w-full bg-white px-4 py-3 rounded-xl border border-border focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all font-medium"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="content" className="label text-base flex items-center gap-2">
              Content
            </label>
            <textarea
              id="content"
              name="content"
              required
              rows={8}
              placeholder="What are your thoughts?"
              className="w-full bg-white px-4 py-3 rounded-xl border border-border focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all resize-y"
            />
          </div>

          <div className="pt-4 flex items-center gap-4 justify-end">
            <Link href={`/app/forum/c/${slug}`} className="px-6 py-3 text-sm font-bold bg-transparent text-muted hover:text-foreground transition-colors">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex justify-center items-center gap-2 bg-accent text-white px-8 py-3 rounded-xl font-bold hover:bg-accent/90 transition-colors shadow-sm disabled:opacity-50"
            >
              {loading ? "Posting..." : "Post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
