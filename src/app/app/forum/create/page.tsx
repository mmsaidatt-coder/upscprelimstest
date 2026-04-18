"use client";

import { useActionState } from "react";
import { createCommunity } from "../actions";
import { Users, Info, HelpCircle } from "lucide-react";
import Link from "next/link";

// Using useActionState requires a wrapper if passing state, but simple forms can just use basic submit
// To keep it simple without creating complex action wrappers, we'll use a basic state.

import { useState } from "react";

export default function CreateCommunityPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    try {
      await createCommunity(formData);
      // If successful, redirect happens in server action
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 fade-up">
      <div>
        <h2 className="text-2xl font-bold mb-2">Create a Community</h2>
        <p className="text-muted">
          A community is a dedicated space for specific discussions, subjects, or preparation strategies.
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
            <label htmlFor="name" className="label text-base flex items-center gap-2">
              Community Name
            </label>
            <p className="text-xs text-muted mb-2">The display name of your community.</p>
            <input
              type="text"
              id="name"
              name="name"
              required
              placeholder="e.g., General GS Discussions"
              className="w-full bg-white px-4 py-3 rounded-xl border border-border focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="slug" className="label text-base flex items-center gap-2">
              Slug (URL)
            </label>
            <p className="text-xs text-muted mb-2">This will be the URL for your community: /app/forum/c/<span className="font-bold">slug</span>. Lowercase letters, numbers, and hyphens only.</p>
            <div className="flex items-center gap-3">
              <span className="text-muted font-medium bg-black/5 px-3 py-3 rounded-xl border border-border/50">c/</span>
              <input
                type="text"
                id="slug"
                name="slug"
                required
                pattern="^[a-z0-9-]+$"
                placeholder="gs-general"
                className="flex-1 bg-white px-4 py-3 rounded-xl border border-border focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="label text-base flex items-center gap-2">
              Description
            </label>
            <p className="text-xs text-muted mb-2">What is this community about?</p>
            <textarea
              id="description"
              name="description"
              required
              rows={4}
              placeholder="A place to discuss General Studies paper."
              className="w-full bg-white px-4 py-3 rounded-xl border border-border focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all resize-none"
            />
          </div>

          <div className="pt-4 flex items-center gap-4">
            <Link href="/app/forum" className="px-6 py-3 text-sm font-bold bg-transparent text-muted hover:text-foreground transition-colors">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex justify-center items-center gap-2 bg-accent text-white px-6 py-3 rounded-xl font-bold hover:bg-accent/90 transition-colors shadow-sm disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Community"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
