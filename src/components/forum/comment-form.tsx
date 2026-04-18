"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { addComment } from "@/app/app/forum/actions";
import { useRouter } from "next/navigation";

export function CommentForm({ postId, slug }: { postId: string; slug: string }) {
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await addComment(postId, content.trim());
      setContent("");
      router.refresh(); // re-fetch server components to show new comment
    } catch (err: any) {
      if (err.message?.includes("logged in")) {
        setError("You must be logged in to comment. Please sign in.");
      } else {
        setError(err.message || "Failed to post comment.");
      }
    }
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="mb-8 bg-black/5 rounded-2xl p-4 border border-border">
      {error && (
        <div className="mb-3 px-4 py-3 bg-danger/10 text-danger text-sm rounded-xl border border-danger/20 font-medium">
          {error}
        </div>
      )}
      <textarea
        name="content"
        required
        rows={3}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What are your thoughts?"
        className="w-full bg-white px-4 py-3 rounded-xl border border-border focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all resize-y mb-3"
      />
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting || !content.trim()}
          className="flex items-center gap-2 bg-accent text-white px-6 py-2.5 rounded-xl font-bold hover:bg-accent/90 transition-colors shadow-sm disabled:opacity-50"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {submitting ? "Posting..." : "Comment"}
        </button>
      </div>
    </form>
  );
}
