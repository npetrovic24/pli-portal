"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht authentifiziert");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") throw new Error("Keine Berechtigung");
  return user;
}

export async function getCourses() {
  await requireAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("courses")
    .select("*, modules(id), units(id)")
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function createCourse(formData: {
  name: string;
  description?: string;
  categoryTags: string[];
}) {
  await requireAdmin();
  const supabase = await createClient();

  // Get max sort_order
  const { data: existing } = await supabase
    .from("courses")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0;

  const { data, error } = await supabase
    .from("courses")
    .insert({
      name: formData.name,
      description: formData.description || null,
      category_tags: formData.categoryTags,
      sort_order: nextOrder,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/admin/courses");
  return { data };
}

export async function updateCourse(
  courseId: string,
  formData: {
    name: string;
    description?: string;
    categoryTags: string[];
  }
) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("courses")
    .update({
      name: formData.name,
      description: formData.description || null,
      category_tags: formData.categoryTags,
    })
    .eq("id", courseId);

  if (error) return { error: error.message };

  revalidatePath("/admin/courses");
  return { success: true };
}

export async function toggleCourseStatus(courseId: string, isActive: boolean) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("courses")
    .update({ is_active: isActive })
    .eq("id", courseId);

  if (error) return { error: error.message };

  revalidatePath("/admin/courses");
  return { success: true };
}

export async function deleteCourse(courseId: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from("courses").delete().eq("id", courseId);

  if (error) return { error: error.message };

  revalidatePath("/admin/courses");
  return { success: true };
}
