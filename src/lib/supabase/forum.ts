import { SupabaseClient } from "@supabase/supabase-js";
import { Community, CommunityPost, CommunityComment } from "../types";

export async function fetchCommunities(
  supabase: SupabaseClient,
  searchQuery?: string,
) {
  let query = supabase.from("communities").select("*").order("created_at", { ascending: false });
  
  if (searchQuery) {
    query = query.or(`name.ilike.%${searchQuery}%,slug.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching communities:", error);
    return [];
  }
  return data as Community[];
}

export async function fetchCommunityBySlug(
  supabase: SupabaseClient,
  slug: string,
) {
  const { data, error } = await supabase
    .from("communities")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) {
    console.error("Error fetching community by slug:", error);
    return null;
  }
  return data as Community;
}

export async function fetchCommunityPosts(
  supabase: SupabaseClient,
  communityId: string,
) {
  // Using a view or join is better, but since we don't have a view for upvotes/comment_count yet,
  // we could do a direct query and rely on nextjs/supabase to format it.
  // Actually, we can join profiles to get the anonymous_name.
  // Upvotes and comment counts would ideally be in a view or computed column,
  // but for simplicity we can fetch them separately or use inner joins if possible.
  // Supabase supports `comments:community_comments(count)` natively.
  
  const { data, error } = await supabase
    .from("community_posts")
    .select(`
      *,
      profiles:user_id(anonymous_name),
      comments:community_comments(count)
    `)
    .eq("community_id", communityId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching community posts:", error);
    return [];
  }

  return data.map((post: any) => ({
    ...post,
    authorName: post.profiles?.anonymous_name || "Anonymous",
    commentCount: post.comments[0]?.count || 0,
    upvotes: 0 // Placeholder, implement real upvotes if requested later via a view
  })) as CommunityPost[];
}

export async function fetchAllPosts(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("community_posts")
    .select(`
      *,
      profiles:user_id(anonymous_name),
      community:community_id(name, slug),
      comments:community_comments(count)
    `)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Error fetching all posts:", error);
    return [];
  }

  return data.map((post: any) => ({
    ...post,
    authorName: post.profiles?.anonymous_name || "Anonymous",
    communityName: post.community?.name,
    communitySlug: post.community?.slug,
    commentCount: post.comments[0]?.count || 0,
    upvotes: 0
  })) as CommunityPost[];
}

export async function fetchPostDetails(
  supabase: SupabaseClient,
  postId: string,
) {
  const { data, error } = await supabase
    .from("community_posts")
    .select(`
      *,
      profiles:user_id(anonymous_name),
      community:community_id(name, slug)
    `)
    .eq("id", postId)
    .single();

  if (error) {
    console.error("Error fetching post details:", error);
    return null;
  }

  return {
    ...data,
    authorName: data.profiles?.anonymous_name || "Anonymous",
    communityName: data.community?.name,
    communitySlug: data.community?.slug,
    upvotes: 0
  } as CommunityPost;
}

export async function fetchPostComments(
  supabase: SupabaseClient,
  postId: string,
) {
  const { data, error } = await supabase
    .from("community_comments")
    .select(`
      *,
      profiles:user_id(anonymous_name)
    `)
    .eq("post_id", postId)
    .order("created_at", { ascending: true }); // older comments first, to build tree

  if (error) {
    console.error("Error fetching post comments:", error);
    return [];
  }

  return data.map((comment: any) => ({
    ...comment,
    authorName: comment.profiles?.anonymous_name || "Anonymous",
    upvotes: 0
  })) as CommunityComment[];
}
