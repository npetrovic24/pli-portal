import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCourseWithAccess } from "@/lib/access";
import { CourseViewClient } from "./course-view-client";

export default async function CourseViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const courseData = await getCourseWithAccess(user.id, id);

  if (!courseData) {
    redirect("/dashboard");
  }

  // Find the first accessible unit to redirect to
  const firstAccessibleUnit = courseData.units.find((u) => u.hasAccess);

  if (firstAccessibleUnit) {
    redirect(`/courses/${id}/units/${firstAccessibleUnit.id}`);
  }

  // No accessible units - show course page with message
  return (
    <CourseViewClient
      course={courseData.course}
      modules={courseData.modules}
      units={courseData.units}
      currentUnitId={null}
    />
  );
}
