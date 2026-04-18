"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, ArrowBigUp } from "lucide-react";
import { CommunityComment } from "@/lib/types";
import { addComment } from "@/app/app/forum/actions";

export function CommentNode({
  comment,
  replies,
  postId,
}: {
  comment: CommunityComment;
  replies: CommunityComment[];
  postId: string;
}) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [replyError, setReplyError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  return (
    <div className="flex gap-3 my-4 pl-4 border-l-2 border-border/50">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-xs text-muted mb-1">
          <span className="font-medium text-foreground">
            {comment.authorName || "Anonymous"}
          </span>
          <span>•</span>
          <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
        </div>

        <p className="text-sm text-foreground/90 mb-2 whitespace-pre-wrap">
          {comment.content}
        </p>

        {/* Action Row */}
        <div className="flex items-center gap-3 text-xs font-medium text-muted">
          <div className="flex items-center gap-1">
            <button className="hover:text-accent transition-colors p-1 -ml-1 rounded-sm" aria-label="Upvote">
              <ArrowBigUp className="w-4 h-4" />
            </button>
            <span>{comment.upvotes}</span>
          </div>
          <button 
            onClick={() => setShowReplyForm(!showReplyForm)}
            className="flex items-center gap-1.5 hover:bg-black/5 px-2 py-1 rounded-md transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Reply
          </button>
        </div>

        {showReplyForm && (
          <div className="mt-3">
            {replyError && (
              <div className="mb-2 px-3 py-2 bg-danger/10 text-danger text-xs rounded-lg border border-danger/20 font-medium">
                {replyError}
              </div>
            )}
            <textarea 
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              className="w-full text-sm p-3 rounded-xl border border-border bg-background focus:ring-1 focus:ring-accent outline-none min-h-[80px]"
              placeholder="What are your thoughts?"
            />
            <div className="flex justify-end gap-2 mt-2">
              <button 
                type="button"
                onClick={() => { setShowReplyForm(false); setReplyContent(""); setReplyError(null); }}
                className="px-3 py-1.5 text-xs font-medium bg-black/5 hover:bg-black/10 rounded-full transition-colors"
              >
                Cancel
              </button>
              <button 
                type="button"
                disabled={submitting || !replyContent.trim()}
                onClick={async () => {
                  if (!replyContent.trim()) return;
                  setSubmitting(true);
                  setReplyError(null);
                  try {
                    await addComment(postId, replyContent.trim(), comment.id);
                    setReplyContent("");
                    setShowReplyForm(false);
                    router.refresh();
                  } catch (err: any) {
                    setReplyError(err.message?.includes("logged in") ? "You must be logged in to reply." : (err.message || "Failed to reply."));
                  }
                  setSubmitting(false);
                }}
                className="px-3 py-1.5 text-xs font-medium bg-accent text-white rounded-full hover:bg-accent/90 transition-colors shadow-sm disabled:opacity-50"
              >
                {submitting ? "Replying..." : "Reply"}
              </button>
            </div>
          </div>
        )}

        {/* Render child replies */}
        {replies.length > 0 && (
          <div className="mt-2">
            {replies.map((reply) => (
              <CommentNode key={reply.id} comment={reply} replies={[]} postId={postId} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function CommentTree({ comments, postId, slug }: { comments: CommunityComment[], postId: string, slug: string }) {
  // Simple 1-level threading for display purposes:
  // Find top level comments (parentId === null)
  const topLevelComments = comments.filter((c) => !c.parentId);

  if (comments.length === 0) {
    return <div className="text-sm text-muted py-8 text-center border-t border-border mt-8">No comments yet. Be the first to share your thoughts!</div>;
  }

  return (
    <div className="mt-8 pt-8 border-t border-border flex flex-col gap-2">
      {topLevelComments.map((comment) => {
        const replies = comments.filter((c) => c.parentId === comment.id);
        return <CommentNode key={comment.id} comment={comment} replies={replies} postId={postId} />;
      })}
    </div>
  );
}
