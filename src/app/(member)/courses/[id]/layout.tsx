import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCourseWithAccess } from "@/lib/access";
import { CourseSidebar } from "./course-sidebar";

export default async function CourseLayout({
  children,
  params,
}: {
  children: React.ReactNode;
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

  return (
    <div className="flex h-full">
      <CourseSidebar
        course={courseData.course}
        modules={courseData.modules}
        units={courseData.units}
        courseId={id}
      />
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
