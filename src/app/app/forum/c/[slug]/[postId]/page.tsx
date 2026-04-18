export const dynamic = "force-dynamic";

import { fetchPostDetails, fetchPostComments } from "@/lib/supabase/forum";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MessageSquare, ArrowBigUp, ArrowLeft } from "lucide-react";
import { CommentTree } from "@/components/forum/comment-tree";
import { CommentForm } from "@/components/forum/comment-form";

export default async function PostPage({ params }: { params: Promise<{ slug: string, postId: string }> }) {
  const supabase = await createClient();
  const { slug, postId } = await params;

  const post = await fetchPostDetails(supabase, postId);

  if (!post) {
    notFound();
  }

  const comments = await fetchPostComments(supabase, postId);

  return (
    <div className="max-w-4xl mx-auto space-y-6 fade-up">
      <Link 
        href={`/app/forum/c/${slug}`}
        className="inline-flex items-center gap-2 text-sm font-bold text-muted hover:text-foreground transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to c/{slug}
      </Link>

      <div className="card-elevated p-6 sm:p-8">
        <div className="flex gap-4">
          <div className="flex flex-col items-center gap-1 text-muted">
            <button className="hover:text-accent transition-colors p-1" aria-label="Upvote">
              <ArrowBigUp className="w-8 h-8" />
            </button>
            <span className="font-bold text-lg">{post.upvotes}</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-sm text-muted mb-3 pb-3 border-b border-border/50">
              <span className="font-medium text-foreground">{post.authorName || "Anonymous"}</span>
              <span>•</span>
              <span>{new Date((post as any).created_at ?? post.createdAt).toLocaleDateString()}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-foreground leading-tight">
              {post.title}
            </h1>

            <div className="prose prose-sm sm:prose-base max-w-none text-foreground/90 whitespace-pre-wrap mb-8">
              {post.content}
            </div>

            <div className="flex items-center gap-2 text-sm font-bold text-muted mb-8">
              <MessageSquare className="w-5 h-5" />
              {comments.length} Comments
            </div>

            {/* Comment Form */}
            <CommentForm postId={postId} slug={slug} />

            {/* Comments Tree */}
            <CommentTree comments={comments} postId={postId} slug={slug} />
          </div>
        </div>
      </div>
    </div>
  );
}
