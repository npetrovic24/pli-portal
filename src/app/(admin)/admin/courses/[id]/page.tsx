import { getCourseDetail } from "@/lib/actions/modules-units";
import { CourseDetailClient } from "./course-detail-client";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CourseDetailPage({ params }: PageProps) {
  const { id } = await params;

  try {
    const { course, modules, units } = await getCourseDetail(id);
    return (
      <CourseDetailClient
        course={course}
        modules={modules}
        units={units}
      />
    );
  } catch {
    notFound();
  }
}
