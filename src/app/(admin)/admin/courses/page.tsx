import { getCourses } from "@/lib/actions/courses";
import { CoursesClient } from "./courses-client";

export default async function CoursesPage() {
  const courses = await getCourses();

  return <CoursesClient initialCourses={courses} />;
}
