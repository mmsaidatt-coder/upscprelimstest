import Link from "next/link";
import { MessageSquare, ArrowBigUp } from "lucide-react";
import { CommunityPost } from "@/lib/types";

export function PostCard({ post }: { post: CommunityPost }) {
  // Truncate content for the preview
  const previewContent = post.content.length > 200 
    ? post.content.substring(0, 200) + "..." 
    : post.content;

  return (
    <div className="card-elevated p-4 sm:p-5 flex gap-4 my-4">
      {/* Upvote Column */}
      <div className="flex flex-col items-center gap-1 text-muted">
        <button className="hover:text-accent transition-colors p-1" aria-label="Upvote">
          <ArrowBigUp className="w-6 h-6" />
        </button>
        <span className="font-semibold text-sm">{post.upvotes}</span>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-xs text-muted mb-2">
          {post.communitySlug ? (
            <Link 
              href={`/app/forum/c/${post.communitySlug}`}
              className="font-bold text-foreground hover:underline"
            >
              c/{post.communitySlug}
            </Link>
          ) : null}
          {post.communitySlug && <span>•</span>}
          <span>Posted by <span className="font-medium text-foreground">{post.authorName || "Anonymous"}</span></span>
          <span>•</span>
          <span>{new Date((post as any).created_at ?? post.createdAt).toLocaleDateString()}</span>
        </div>

        <Link href={`/app/forum/c/${post.communitySlug ?? post.communityId}/${post.id}`}>
          <h3 className="text-lg font-bold mb-2 leading-tight hover:text-accent transition-colors">
            {post.title}
          </h3>
          <p className="text-sm text-foreground/80 line-clamp-3 mb-4">
            {previewContent}
          </p>
        </Link>

        {/* Action Row */}
        <div className="flex items-center gap-4 text-xs font-medium text-muted">
          <Link 
            href={`/app/forum/c/${post.communitySlug ?? post.communityId}/${post.id}`}
            className="flex items-center gap-1.5 hover:bg-black/5 p-1.5 -ml-1.5 rounded-md transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            {post.commentCount} Comments
          </Link>
        </div>
      </div>
    </div>
  );
}
