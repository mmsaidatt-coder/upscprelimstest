export const dynamic = "force-dynamic";

import { GlobalSearch } from "@/components/forum/global-search";
import { PostCard } from "@/components/forum/post-card";
import { fetchAllPosts, fetchCommunities } from "@/lib/supabase/forum";
import { createClient } from "@/lib/supabase/server";
import { UsernameBanner } from "@/components/forum/username-banner";
import Link from "next/link";
import { Users } from "lucide-react";

export default async function ForumPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const supabase = await createClient();
  const q = (await searchParams).q || "";

  // If searching, show communities. Otherwise, show global feed + popular communities.
  const matchingCommunities = q ? await fetchCommunities(supabase, q) : [];
  const posts = !q ? await fetchAllPosts(supabase) : [];
  const popularCommunities = !q ? await fetchCommunities(supabase) : [];

  return (
    <div className="space-y-8 fade-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="heading text-4xl mb-2 text-foreground">Community Forum</h1>
          <p className="text-[17px] text-muted">Discuss, learn, and grow with fellow UPSC aspirants.</p>
        </div>
        <div>
          <Link
            href="/app/forum/create"
            className="flex items-center gap-2 bg-accent text-white px-5 py-3 rounded-xl font-semibold hover:bg-accent/90 transition-transform active:scale-95 shadow-sm min-h-[44px]"
          >
            <Users className="w-5 h-5" />
            Create Community
          </Link>
        </div>
      </div>

      <UsernameBanner />
      <GlobalSearch />

      {q ? (
        <div>
          <h2 className="text-xl font-bold mb-4">Search Results for "{q}"</h2>
          {matchingCommunities.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {matchingCommunities.map((c) => (
                <Link key={c.id} href={`/app/forum/c/${c.slug}`} className="card-elevated p-5 hover:border-accent transition-colors block">
                  <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
                    <Users className="w-4 h-4 text-accent" />
                    {c.name}
                  </h3>
                  <p className="text-sm text-muted">c/{c.slug}</p>
                  <p className="text-sm mt-3 line-clamp-2 text-foreground/80">{c.description}</p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-muted py-8 text-center bg-white/50 rounded-2xl">No communities found. Why not create one?</p>
          )}
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Feed */}
          <div className="flex-1">
            <h2 className="text-xl font-bold mb-4 px-1">Global Feed</h2>
            {posts.length > 0 ? (
              <div className="space-y-4">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <p className="text-muted py-16 text-center bg-white/60 rounded-2xl card border border-dashed border-border/70 text-[15px] font-medium shadow-sm">
                No posts yet. Be the first to start a discussion!
              </p>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:w-[340px] shrink-0 space-y-6">
            <div className="panel border border-border bg-white/80 p-6 shadow-sm rounded-2xl">
              <h3 className="font-bold text-[17px] mb-5 text-foreground">Explore Communities</h3>
              {popularCommunities.length > 0 ? (
                <div className="space-y-3">
                  {popularCommunities.slice(0, 10).map((c) => (
                    <Link key={c.id} href={`/app/forum/c/${c.slug}`} className="flex flex-col group p-3 hover:bg-muted/5 rounded-xl transition-all border border-transparent hover:border-border/50">
                      <span className="font-semibold text-[15px] text-foreground group-hover:text-accent transition-colors">{c.name}</span>
                      <span className="text-sm font-medium text-muted/80 mt-0.5">c/{c.slug}</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-[15px] text-muted/80 font-medium py-3 text-center border border-dashed rounded-xl border-border/60 bg-muted/5">No communities created yet.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
