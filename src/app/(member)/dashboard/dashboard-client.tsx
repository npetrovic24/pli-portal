"use client";

import Link from "next/link";
import Image from "next/image";
import { BookOpen, GraduationCap, Tag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Course } from "@/lib/types";

interface DashboardClientProps {
  userName: string;
  courses: Course[];
}

export function DashboardClient({ userName, courses }: DashboardClientProps) {
  const firstName = userName.split(" ")[0];

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">
          Willkommen{firstName ? `, ${firstName}` : ""}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Deine freigeschalteten Lehrgänge im Überblick.
        </p>
      </div>

      {courses.length === 0 ? (
        <Card className="mx-auto max-w-md border-dashed">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <GraduationCap className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium text-muted-foreground">
              Noch keine Lehrgänge
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Du hast noch keine Lehrgänge freigeschaltet. Sobald dir ein
              Lehrgang zugewiesen wird, erscheint er hier.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Link key={course.id} href={`/courses/${course.id}`}>
              <Card className="group overflow-hidden transition-shadow hover:shadow-md">
                <div className="relative aspect-[16/9] bg-muted">
                  {course.thumbnail_url ? (
                    <Image
                      src={course.thumbnail_url}
                      alt={course.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <BookOpen className="h-12 w-12 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <h2 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {course.name}
                  </h2>
                  {course.description && (
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {course.description}
                    </p>
                  )}
                  {course.category_tags && course.category_tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {course.category_tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="text-xs"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
