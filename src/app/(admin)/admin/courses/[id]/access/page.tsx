import { getCourseAccess } from "@/lib/actions/access";
import { CourseAccessClient } from "./course-access-client";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CourseAccessPage({ params }: PageProps) {
  const { id } = await params;

  try {
    const { course, members, grants } = await getCourseAccess(id);

    if (!course) notFound();

    return (
      <CourseAccessClient
        course={course}
        members={members}
        initialGrants={grants}
      />
    );
  } catch {
    notFound();
  }
}
