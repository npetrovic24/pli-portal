import { getContentBlocks, getUnitWithCourse } from "@/lib/actions/content-blocks";
import { ContentEditorClient } from "./content-editor-client";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string; unitId: string }>;
}

export default async function ContentEditorPage({ params }: PageProps) {
  const { id: courseId, unitId } = await params;

  try {
    const [unit, blocks] = await Promise.all([
      getUnitWithCourse(unitId),
      getContentBlocks(unitId),
    ]);

    const courseName =
      (unit as Record<string, unknown>).courses &&
      typeof (unit as Record<string, unknown>).courses === "object"
        ? ((unit as Record<string, unknown>).courses as { name: string }).name
        : "Lehrgang";

    return (
      <ContentEditorClient
        courseId={courseId}
        courseName={courseName}
        unitId={unitId}
        unitName={unit.name}
        initialBlocks={blocks}
      />
    );
  } catch {
    notFound();
  }
}
