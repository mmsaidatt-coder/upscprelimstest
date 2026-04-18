"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createCommunity(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in to create a community.");
  }

  const name = formData.get("name") as string;
  const slug = formData.get("slug") as string;
  const description = formData.get("description") as string;

  if (!name || !slug) {
    throw new Error("Name and slug are required");
  }

  // Enforce slug format server-side
  if (!slug.match(/^[a-z0-9-]+$/)) {
    throw new Error("Slug must contain only lowercase letters, numbers, and hyphens");
  }

  const { data, error } = await supabase
    .from("communities")
    .insert({
      name,
      slug,
      description,
      created_by: user.id
    })
    .select()
    .single();

  if (error) {
    console.error("Create community error:", error);
    if (error.code === '23505') {
       throw new Error("This community slug is already taken.");
    }
    throw new Error("Failed to create community.");
  }

  revalidatePath("/app/forum");
  redirect(`/app/forum/c/${data.slug}`);
}

export async function createPost(communityId: string, communitySlug: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in to post.");
  }

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;

  if (!title || !content) {
    throw new Error("Title and content are required.");
  }

  const { data, error } = await supabase
    .from("community_posts")
    .insert({
      community_id: communityId,
      user_id: user.id,
      title,
      content,
    })
    .select()
    .single();

  if (error) {
    console.error("Create post error:", error);
    throw new Error("Failed to create post.");
  }

  revalidatePath(`/app/forum/c/${communitySlug}`);
  redirect(`/app/forum/c/${communitySlug}/${data.id}`);
}

export async function updateAnonymousName(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in to update your profile.");
  }

  const name = formData.get("anonymous_name") as string;

  if (!name || name.trim() === "") {
    throw new Error("Anonymous name cannot be empty.");
  }

  const { error } = await supabase
    .from("profiles")
    .update({ anonymous_name: name.trim() })
    .eq("id", user.id);

  if (error) {
    console.error("Update profile error:", error);
    if (error.code === '23505') {
      throw new Error("This anonymous name is already taken. Please choose another.");
    }
    throw new Error("Failed to update profile.");
  }

  revalidatePath("/app/settings");
  revalidatePath("/app/forum");
}

export async function addComment(postId: string, content: string, parentId?: string | null) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in to comment.");
  }

  if (!content || content.trim() === "") {
    throw new Error("Comment cannot be empty.");
  }

  const { error } = await supabase
    .from("community_comments")
    .insert({
      post_id: postId,
      user_id: user.id,
      content: content.trim(),
      parent_id: parentId || null
    });

  if (error) {
    console.error("Add comment error:", error);
    throw new Error("Failed to add comment.");
  }

  // We rely on the caller to revalidate the path or trigger a router.refresh() 
  // since the submit comment logic might be a client side action component.
}
