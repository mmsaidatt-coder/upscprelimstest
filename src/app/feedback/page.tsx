"use client"

import { useState, useEffect } from "react";
import { MessageSquarePlus, Lightbulb, Bug, ChevronUp, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Feedback = {
  id: string;
  title: string;
  description: string;
  type: "mistake" | "feature";
  status: "open" | "under_review" | "planned" | "done" | "rejected";
  user_id: string | null;
  upvotes: number;
  created_at: string;
};

export default function FeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"feature" | "mistake">("feature");
  const [showForm, setShowForm] = useState(false);
  
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formType, setFormType] = useState<"feature" | "mistake">("feature");
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState("");

  const supabase = createClient();

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/feedback?sort=top");
      const json = await res.json();
      if (json.success) {
        setFeedbacks(json.data);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleVote = async (id: string, currentUpvotes: number) => {
    // Optimistic UI update
    setFeedbacks(prev => prev.map(f => {
      if (f.id === id) {
        // We guess toggle up if we just clicked, but properly we should know if user already voted.
        // For simple UI, let's just increment and let the API response correct it if we want.
        // But since we want toggle: just call API and refetch
        return { ...f, upvotes: currentUpvotes + 1 };
      }
      return f;
    }));

    try {
      const res = await fetch(`/api/feedback/${id}/vote`, { method: "POST" });
      const json = await res.json();
      
      if (!json.success) {
        if (json.error === "Unauthorized") {
          alert("You must be logged in to vote!");
        }
        fetchFeedbacks(); // revert
      } else {
        // Refetch to get accurate counts
        fetchFeedbacks();
      }
    } catch (e) {
      fetchFeedbacks();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setAuthError("");

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formTitle,
          description: formDesc,
          type: formType,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setShowForm(false);
        setFormTitle("");
        setFormDesc("");
        fetchFeedbacks();
      } else {
        if (json.error === "Unauthorized") {
          setAuthError("You must be logged in to submit feedback.");
        } else {
          setAuthError(json.error || "Failed to submit.");
        }
      }
    } catch (error) {
      setAuthError("Something went wrong.");
    }

    setSubmitting(false);
  };

  const filteredFeedbacks = feedbacks.filter(f => f.type === activeTab);

  return (
    <div className="min-h-screen bg-background pb-20 pt-8 sm:pt-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        
        {/* Header */}
        <div className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="heading text-4xl text-foreground">Community Feedback</h1>
            <p className="mt-2 text-lg text-muted">Help us improve the platform by requesting features or reporting mistakes.</p>
          </div>
          <button 
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 rounded-xl bg-foreground px-5 py-3 font-medium text-background transition-transform hover:scale-105 active:scale-95"
          >
            <MessageSquarePlus className="h-5 w-5" />
            New Post
          </button>
        </div>

        {/* Form Modal/Inline */}
        {showForm && (
          <div className="mb-10 rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
            <h2 className="mb-6 font-serif text-2xl font-bold text-foreground">Submit Feedback</h2>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {authError && <div className="rounded-lg bg-danger/10 p-4 text-danger font-medium">{authError}</div>}
              
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setFormType("feature")}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl border p-4 transition-all ${formType === "feature" ? "border-accent bg-accent/5 text-accent" : "border-border text-muted hover:bg-muted/5"}`}
                >
                  <Lightbulb className="h-5 w-5" />
                  <span className="font-medium">Feature Request</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormType("mistake")}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl border p-4 transition-all ${formType === "mistake" ? "border-danger bg-danger/5 text-danger" : "border-border text-muted hover:bg-muted/5"}`}
                >
                  <Bug className="h-5 w-5" />
                  <span className="font-medium">Report Mistake</span>
                </button>
              </div>

              <div>
                <label className="mb-2 block font-medium text-foreground">Title</label>
                <input 
                  type="text"
                  required
                  placeholder="Short, descriptive summary..."
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background p-3 text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div>
                <label className="mb-2 block font-medium text-foreground">Description</label>
                <textarea 
                  required
                  rows={4}
                  placeholder={formType === "mistake" ? "What's the issue? Include question year or topic if applicable." : "Describe how this feature would help you."}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full resize-none rounded-xl border border-border bg-background p-3 text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowForm(false)}
                  className="rounded-xl px-5 py-3 font-medium text-muted hover:bg-muted/10 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="flex items-center gap-2 rounded-xl bg-accent px-6 py-3 font-medium text-white transition-transform hover:scale-105 active:scale-95 disabled:opacity-70 disabled:hover:scale-100"
                >
                  {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Submit"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 flex gap-4 border-b border-border">
          <button 
            onClick={() => setActiveTab("feature")}
            className={`border-b-2 pb-3 px-1 font-medium transition-colors ${activeTab === "feature" ? "border-accent text-accent" : "border-transparent text-muted hover:text-foreground"}`}
          >
            <div className="flex items-center gap-2"><Lightbulb className="h-4 w-4" /> Feature Requests</div>
          </button>
          <button 
            onClick={() => setActiveTab("mistake")}
            className={`border-b-2 pb-3 px-1 font-medium transition-colors ${activeTab === "mistake" ? "border-danger text-danger" : "border-transparent text-muted hover:text-foreground"}`}
          >
            <div className="flex items-center gap-2"><Bug className="h-4 w-4" /> Mistakes & Bugs</div>
          </button>
        </div>

        {/* List */}
        <div className="flex flex-col gap-4">
          {loading ? (
            <div className="flex py-20 justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted" />
            </div>
          ) : filteredFeedbacks.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
              <MessageSquarePlus className="mb-4 h-10 w-10 text-muted/50" />
              <h3 className="text-xl font-medium text-foreground">No posts yet</h3>
              <p className="mt-2 text-muted">Be the first to share your thoughts!</p>
            </div>
          ) : (
            filteredFeedbacks.map((f) => (
              <div key={f.id} className="group flex gap-4 rounded-2xl border border-border bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
                
                {/* Upvote Column */}
                <div className="flex flex-col items-center">
                  <button 
                    onClick={() => handleVote(f.id, f.upvotes)}
                    className="flex flex-col items-center rounded-lg border border-border p-2 min-w-[56px] transition-colors hover:border-accent hover:bg-accent/5 active:scale-95"
                  >
                    <ChevronUp className="h-6 w-6 text-muted group-hover:text-accent font-bold" />
                    <span className="text-lg font-bold text-foreground">{f.upvotes || 0}</span>
                  </button>
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col justify-center">
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <h3 className="font-serif text-xl font-semibold text-foreground break-words">{f.title}</h3>
                    {f.status !== 'open' && (
                      <span className="whitespace-nowrap rounded-full bg-muted/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-muted">
                        {f.status.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                  <p className="text-muted line-clamp-2 md:line-clamp-none">{f.description}</p>
                  <p className="mt-4 text-xs font-medium text-muted/70">
                    {new Date(f.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>

              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
