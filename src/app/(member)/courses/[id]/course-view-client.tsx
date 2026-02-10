"use client";

import { BookOpen } from "lucide-react";
import type { Course, Module, Unit } from "@/lib/types";

interface UnitWithAccess extends Unit {
  hasAccess: boolean;
}

interface ModuleWithAccess extends Module {
  hasAccess: boolean;
}

interface CourseViewClientProps {
  course: Course;
  modules: ModuleWithAccess[];
  units: UnitWithAccess[];
  currentUnitId: string | null;
}

export function CourseViewClient({ course }: CourseViewClientProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <BookOpen className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="text-lg font-semibold">{course.name}</h2>
      {course.description && (
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          {course.description}
        </p>
      )}
      <p className="mt-4 text-sm text-muted-foreground">
        Dieser Lehrgang hat noch keine freigeschalteten Inhalte.
      </p>
    </div>
  );
}
