import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUnitContent } from "@/lib/access";
import { UnitViewClient } from "./unit-view-client";

export default async function UnitViewPage({
  params,
}: {
  params: Promise<{ id: string; unitId: string }>;
}) {
  const { id, unitId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const unitData = await getUnitContent(user.id, id, unitId);

  if (!unitData) {
    // No access to this unit — redirect to course page
    redirect(`/courses/${id}`);
  }

  return (
    <UnitViewClient
      course={unitData.course}
      unit={unitData.unit}
      blocks={unitData.blocks}
      prevUnit={unitData.prevUnit}
      nextUnit={unitData.nextUnit}
      courseId={id}
    />
  );
}
