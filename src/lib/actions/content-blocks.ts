"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import type { ContentBlockType } from "@/lib/types";

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

export async function getContentBlocks(unitId: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("content_blocks")
    .select("*")
    .eq("unit_id", unitId)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function getUnitWithCourse(unitId: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { data: unit, error } = await supabase
    .from("units")
    .select("*, courses(id, name)")
    .eq("id", unitId)
    .single();

  if (error) throw new Error(error.message);
  return unit;
}

export async function createContentBlock(
  unitId: string,
  type: ContentBlockType,
  content: Record<string, unknown>,
  courseId: string
) {
  await requireAdmin();
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("content_blocks")
    .select("sort_order")
    .eq("unit_id", unitId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0;

  const { data, error } = await supabase
    .from("content_blocks")
    .insert({
      unit_id: unitId,
      type,
      content,
      sort_order: nextOrder,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath(`/admin/courses/${courseId}/units/${unitId}`);
  return { data };
}

export async function updateContentBlock(
  blockId: string,
  content: Record<string, unknown>,
  courseId: string,
  unitId: string
) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("content_blocks")
    .update({ content })
    .eq("id", blockId);

  if (error) return { error: error.message };

  revalidatePath(`/admin/courses/${courseId}/units/${unitId}`);
  return { success: true };
}

export async function deleteContentBlock(
  blockId: string,
  courseId: string,
  unitId: string
) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("content_blocks")
    .delete()
    .eq("id", blockId);

  if (error) return { error: error.message };

  revalidatePath(`/admin/courses/${courseId}/units/${unitId}`);
  return { success: true };
}

export async function reorderContentBlocks(
  courseId: string,
  unitId: string,
  orderedIds: string[]
) {
  await requireAdmin();
  const supabase = await createClient();

  for (let i = 0; i < orderedIds.length; i++) {
    await supabase
      .from("content_blocks")
      .update({ sort_order: i })
      .eq("id", orderedIds[i]);
  }

  revalidatePath(`/admin/courses/${courseId}/units/${unitId}`);
  return { success: true };
}

export async function uploadFile(formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();

  const file = formData.get("file") as File;
  if (!file) return { error: "Keine Datei ausgewählt" };

  if (file.size > 50 * 1024 * 1024) {
    return { error: "Datei ist zu gross (max. 50MB)" };
  }

  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filePath = `content-files/${timestamp}_${safeName}`;

  const { data, error } = await admin.storage
    .from("content")
    .upload(filePath, file);

  if (error) return { error: error.message };

  const {
    data: { publicUrl },
  } = admin.storage.from("content").getPublicUrl(data.path);

  return {
    data: {
      fileName: file.name,
      fileSize: file.size,
      filePath: data.path,
      publicUrl,
    },
  };
}
