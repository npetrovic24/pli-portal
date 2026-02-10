"use server";

import { createAdminClient } from "@/lib/supabase/admin";
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

export async function getMembers() {
  await requireAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function createMember(formData: {
  email: string;
  password: string;
  fullName: string;
}) {
  await requireAdmin();
  const admin = createAdminClient();

  const { data, error } = await admin.auth.admin.createUser({
    email: formData.email,
    password: formData.password,
    email_confirm: true,
    user_metadata: {
      full_name: formData.fullName,
      role: "member",
    },
  });

  if (error) {
    if (error.message.includes("already been registered")) {
      return { error: "Diese E-Mail-Adresse ist bereits vergeben." };
    }
    return { error: error.message };
  }

  revalidatePath("/admin/members");
  return { data: data.user };
}

export async function toggleMemberStatus(memberId: string, isActive: boolean) {
  const currentUser = await requireAdmin();

  if (memberId === currentUser.id) {
    return { error: "Sie können sich nicht selbst deaktivieren." };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({ is_active: isActive })
    .eq("id", memberId);

  if (error) return { error: error.message };

  revalidatePath("/admin/members");
  return { success: true };
}

export async function resetMemberPassword(memberId: string, newPassword: string) {
  await requireAdmin();
  const admin = createAdminClient();

  const { error } = await admin.auth.admin.updateUserById(memberId, {
    password: newPassword,
  });

  if (error) return { error: error.message };
  return { success: true };
}
