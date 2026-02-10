import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasUnitAccess } from "@/lib/access";
import type { AccessGrant, Unit } from "@/lib/types";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ blockId: string }> }
) {
  const { blockId } = await params;
  const supabase = await createClient();

  // Check auth
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  }

  // Get the content block
  const { data: block } = await supabase
    .from("content_blocks")
    .select("*")
    .eq("id", blockId)
    .eq("type", "canva_embed")
    .single();

  if (!block) {
    return NextResponse.json({ error: "Block nicht gefunden" }, { status: 404 });
  }

  // Get the unit to check access
  const { data: unit } = await supabase
    .from("units")
    .select("*")
    .eq("id", block.unit_id)
    .single();

  if (!unit) {
    return NextResponse.json({ error: "Einheit nicht gefunden" }, { status: 404 });
  }

  // Check user role - admins always have access
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    // Check access grants for member
    const { data: grants } = await supabase
      .from("access_grants")
      .select("*")
      .eq("user_id", user.id);

    if (!hasUnitAccess((grants || []) as AccessGrant[], unit as Unit)) {
      return NextResponse.json({ error: "Kein Zugriff" }, { status: 403 });
    }
  }

  const content = block.content as Record<string, unknown>;
  const url = content.url as string;

  if (!url) {
    return NextResponse.json({ error: "Keine URL vorhanden" }, { status: 404 });
  }

  return NextResponse.json({ url });
}
