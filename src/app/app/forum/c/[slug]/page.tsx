export const dynamic = "force-dynamic";

import { fetchCommunityBySlug, fetchCommunityPosts } from "@/lib/supabase/forum";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { PostCard } from "@/components/forum/post-card";
import Link from "next/link";
import { PenSquare } from "lucide-react";

export default async function CommunityPage({ params }: { params: Promise<{ slug: string }> }) {
  const supabase = await createClient();
  const slug = (await params).slug;

  const community = await fetchCommunityBySlug(supabase, slug);

  if (!community) {
    notFound();
  }

  const posts = await fetchCommunityPosts(supabase, community.id);

  return (
    <div className="space-y-8 fade-up">
      <div className="panel border border-border bg-white/80 p-6 sm:p-8 rounded-2xl shadow-sm text-center sm:text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h1 className="heading text-3xl sm:text-4xl font-bold mb-2 text-foreground">{community.name}</h1>
            <p className="text-[15px] text-accent font-bold tracking-wide uppercase mb-4">c/{community.slug}</p>
            <p className="text-muted text-[16px] max-w-2xl leading-relaxed">{community.description}</p>
          </div>
          <Link
            href={`/app/forum/c/${community.slug}/submit`}
            className="flex items-center justify-center gap-2 bg-accent text-white px-6 py-3.5 rounded-xl font-semibold hover:bg-accent/90 transition-transform active:scale-95 shadow-sm min-w-max shrink-0"
          >
            <PenSquare className="w-5 h-5" />
            Create Post
          </Link>
        </div>
      </div>

      {/* Feed */}
      <div>
        <h2 className="text-lg font-bold mb-4 px-1">Posts</h2>
        {posts.length > 0 ? (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={{ ...post, communitySlug: community.slug }} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 px-4 bg-white/60 rounded-2xl border border-dashed border-border/70 shadow-sm flex flex-col items-center">
            <h3 className="text-2xl font-bold mb-3 text-foreground">It's quiet in here...</h3>
            <p className="text-muted text-[16px] max-w-sm mb-8">Be the first to create a post in {community.name}!</p>
            <Link
              href={`/app/forum/c/${community.slug}/submit`}
              className="inline-flex items-center gap-2 bg-accent text-white px-6 py-3.5 rounded-xl font-semibold hover:bg-accent/90 transition-transform active:scale-95 shadow-sm"
            >
              <PenSquare className="w-5 h-5" />
              Create Post
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
