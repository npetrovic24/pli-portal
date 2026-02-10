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

export async function getCourseDetail(courseId: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("*")
    .eq("id", courseId)
    .single();

  if (courseError) throw new Error(courseError.message);

  const { data: modules } = await supabase
    .from("modules")
    .select("*")
    .eq("course_id", courseId)
    .order("sort_order", { ascending: true });

  const { data: units } = await supabase
    .from("units")
    .select("*, content_blocks(id)")
    .eq("course_id", courseId)
    .order("sort_order", { ascending: true });

  return {
    course,
    modules: modules || [],
    units: units || [],
  };
}

export async function createModule(courseId: string, name: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("modules")
    .select("sort_order")
    .eq("course_id", courseId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0;

  const { data, error } = await supabase
    .from("modules")
    .insert({ course_id: courseId, name, sort_order: nextOrder })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath(`/admin/courses/${courseId}`);
  return { data };
}

export async function updateModule(moduleId: string, name: string, courseId: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("modules")
    .update({ name })
    .eq("id", moduleId);

  if (error) return { error: error.message };

  revalidatePath(`/admin/courses/${courseId}`);
  return { success: true };
}

export async function deleteModule(moduleId: string, courseId: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from("modules").delete().eq("id", moduleId);

  if (error) return { error: error.message };

  revalidatePath(`/admin/courses/${courseId}`);
  return { success: true };
}

export async function createUnit(
  courseId: string,
  name: string,
  moduleId: string | null
) {
  await requireAdmin();
  const supabase = await createClient();

  const query = supabase
    .from("units")
    .select("sort_order")
    .eq("course_id", courseId)
    .order("sort_order", { ascending: false })
    .limit(1);

  if (moduleId) {
    query.eq("module_id", moduleId);
  } else {
    query.is("module_id", null);
  }

  const { data: existing } = await query;
  const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0;

  const { data, error } = await supabase
    .from("units")
    .insert({
      course_id: courseId,
      module_id: moduleId,
      name,
      sort_order: nextOrder,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath(`/admin/courses/${courseId}`);
  return { data };
}

export async function updateUnit(unitId: string, name: string, courseId: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("units")
    .update({ name })
    .eq("id", unitId);

  if (error) return { error: error.message };

  revalidatePath(`/admin/courses/${courseId}`);
  return { success: true };
}

export async function deleteUnit(unitId: string, courseId: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from("units").delete().eq("id", unitId);

  if (error) return { error: error.message };

  revalidatePath(`/admin/courses/${courseId}`);
  return { success: true };
}

export async function reorderModules(
  courseId: string,
  orderedIds: string[]
) {
  await requireAdmin();
  const supabase = await createClient();

  for (let i = 0; i < orderedIds.length; i++) {
    await supabase
      .from("modules")
      .update({ sort_order: i })
      .eq("id", orderedIds[i]);
  }

  revalidatePath(`/admin/courses/${courseId}`);
  return { success: true };
}

export async function reorderUnits(
  courseId: string,
  orderedIds: string[]
) {
  await requireAdmin();
  const supabase = await createClient();

  for (let i = 0; i < orderedIds.length; i++) {
    await supabase
      .from("units")
      .update({ sort_order: i })
      .eq("id", orderedIds[i]);
  }

  revalidatePath(`/admin/courses/${courseId}`);
  return { success: true };
}
