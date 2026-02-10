"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import type { Profile, Course, Module, Unit, AccessGrant } from "@/lib/types";
import { setAccessGrant, setCourseLevelAccess } from "@/lib/actions/access";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Layers,
  Calendar,
  Loader2,
} from "lucide-react";

interface MemberAccessClientProps {
  member: Profile;
  courses: Course[];
  modules: Module[];
  units: Unit[];
  initialGrants: AccessGrant[];
}

export function MemberAccessClient({
  member,
  courses,
  modules,
  units,
  initialGrants,
}: MemberAccessClientProps) {
  const [grants, setGrants] = useState(initialGrants);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());

  function toggleExpanded(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const isGranted = useCallback(
    (type: "course" | "module" | "unit", id: string): boolean | null => {
      const grant = grants.find((g) => {
        if (type === "course")
          return g.course_id === id && !g.module_id && !g.unit_id;
        if (type === "module") return g.module_id === id && !g.unit_id;
        return g.unit_id === id;
      });
      return grant ? grant.is_granted : null;
    },
    [grants]
  );

  function getEffectiveAccess(
    type: "course" | "module" | "unit",
    id: string,
    courseId?: string,
    moduleId?: string | null
  ): boolean {
    // Check specific grant
    const specific = isGranted(type, id);
    if (specific !== null) return specific;

    // Fall back to parent
    if (type === "unit" && moduleId) {
      const moduleGrant = isGranted("module", moduleId);
      if (moduleGrant !== null) return moduleGrant;
    }
    if (type === "unit" || type === "module") {
      const courseGrant = isGranted("course", courseId!);
      if (courseGrant !== null) return courseGrant;
    }

    return false; // Default: no access
  }

  function getCourseStatus(courseId: string): "full" | "partial" | "none" {
    const courseGrant = isGranted("course", courseId);
    const courseModules = modules.filter((m) => m.course_id === courseId);
    const courseUnits = units.filter((u) => u.course_id === courseId);

    // Check if any specific overrides exist
    const hasModuleGrants = courseModules.some(
      (m) => isGranted("module", m.id) !== null
    );
    const hasUnitGrants = courseUnits.some(
      (u) => isGranted("unit", u.id) !== null
    );

    if (courseGrant === true && !hasModuleGrants && !hasUnitGrants) return "full";
    if (courseGrant === true && (hasModuleGrants || hasUnitGrants))
      return "partial";
    if (courseGrant === false || courseGrant === null) {
      // Check if any lower-level grants exist
      if (hasModuleGrants || hasUnitGrants) return "partial";
      return "none";
    }
    return "none";
  }

  async function handleToggleCourse(courseId: string, newValue: boolean) {
    const key = `course-${courseId}`;
    setLoadingIds((prev) => new Set([...prev, key]));

    const result = await setCourseLevelAccess({
      userId: member.id,
      courseId,
      isGranted: newValue,
    });

    if ("error" in result && result.error) {
      toast.error(result.error);
    } else {
      // Update local state: set course grant, remove sub-grants
      setGrants((prev) => {
        const filtered = prev.filter((g) => {
          // Remove all grants related to this course's modules/units
          const courseModuleIds = modules
            .filter((m) => m.course_id === courseId)
            .map((m) => m.id);
          const courseUnitIds = units
            .filter((u) => u.course_id === courseId)
            .map((u) => u.id);
          if (g.module_id && courseModuleIds.includes(g.module_id)) return false;
          if (g.unit_id && courseUnitIds.includes(g.unit_id)) return false;
          if (g.course_id === courseId && !g.module_id && !g.unit_id)
            return false;
          return true;
        });
        return [
          ...filtered,
          {
            id: crypto.randomUUID(),
            user_id: member.id,
            course_id: courseId,
            module_id: null,
            unit_id: null,
            is_granted: newValue,
            created_at: new Date().toISOString(),
          },
        ];
      });
      toast.success(
        newValue ? "Lehrgang freigeschaltet." : "Lehrgang gesperrt."
      );
    }

    setLoadingIds((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }

  async function handleToggleModule(moduleId: string, newValue: boolean) {
    const key = `module-${moduleId}`;
    setLoadingIds((prev) => new Set([...prev, key]));

    const result = await setAccessGrant({
      userId: member.id,
      moduleId,
      isGranted: newValue,
    });

    if ("error" in result && result.error) {
      toast.error(result.error);
    } else {
      setGrants((prev) => {
        const existing = prev.findIndex(
          (g) => g.module_id === moduleId && !g.unit_id
        );
        if (existing >= 0) {
          return prev.map((g, i) =>
            i === existing ? { ...g, is_granted: newValue } : g
          );
        }
        return [
          ...prev,
          {
            id: crypto.randomUUID(),
            user_id: member.id,
            course_id: null,
            module_id: moduleId,
            unit_id: null,
            is_granted: newValue,
            created_at: new Date().toISOString(),
          },
        ];
      });
    }

    setLoadingIds((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }

  async function handleToggleUnit(unitId: string, newValue: boolean) {
    const key = `unit-${unitId}`;
    setLoadingIds((prev) => new Set([...prev, key]));

    const result = await setAccessGrant({
      userId: member.id,
      unitId,
      isGranted: newValue,
    });

    if ("error" in result && result.error) {
      toast.error(result.error);
    } else {
      setGrants((prev) => {
        const existing = prev.findIndex((g) => g.unit_id === unitId);
        if (existing >= 0) {
          return prev.map((g, i) =>
            i === existing ? { ...g, is_granted: newValue } : g
          );
        }
        return [
          ...prev,
          {
            id: crypto.randomUUID(),
            user_id: member.id,
            course_id: null,
            module_id: null,
            unit_id: unitId,
            is_granted: newValue,
            created_at: new Date().toISOString(),
          },
        ];
      });
    }

    setLoadingIds((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }

  return (
    <div>
      <div className="mb-6">
        <Button variant="ghost" size="sm" className="mb-2" asChild>
          <Link href="/admin/members">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zu Mitglieder
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">
          Zugriffe: {member.full_name}
        </h1>
        <p className="text-sm text-muted-foreground">{member.email}</p>
      </div>

      {courses.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Noch keine Lehrgänge vorhanden.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {courses.map((course) => {
            const status = getCourseStatus(course.id);
            const isExpanded = expanded.has(course.id);
            const courseModules = modules.filter(
              (m) => m.course_id === course.id
            );
            const courseUnits = units.filter(
              (u) => u.course_id === course.id
            );
            const courseGrantValue = isGranted("course", course.id);

            return (
              <Card key={course.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 shrink-0"
                      onClick={() => toggleExpanded(course.id)}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{course.name}</span>
                        <span
                          className={`inline-block h-2 w-2 rounded-full ${
                            status === "full"
                              ? "bg-green-500"
                              : status === "partial"
                              ? "bg-orange-500"
                              : "bg-red-500"
                          }`}
                        />
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Layers className="h-3 w-3" />
                          {courseModules.length} Module
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {courseUnits.length} Tage
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {loadingIds.has(`course-${course.id}`) && (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                      <Switch
                        checked={courseGrantValue === true}
                        onCheckedChange={(v) =>
                          handleToggleCourse(course.id, v)
                        }
                        disabled={loadingIds.has(`course-${course.id}`)}
                      />
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="space-y-2 pt-0">
                    {/* Modules */}
                    {courseModules.map((mod) => {
                      const moduleUnits = courseUnits.filter(
                        (u) => u.module_id === mod.id
                      );
                      const isModExpanded = expanded.has(mod.id);
                      const modAccess = getEffectiveAccess(
                        "module",
                        mod.id,
                        course.id
                      );

                      return (
                        <div key={mod.id} className="ml-4">
                          <div className="flex items-center gap-2 rounded-md border bg-white px-3 py-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => toggleExpanded(mod.id)}
                            >
                              {isModExpanded ? (
                                <ChevronDown className="h-3 w-3" />
                              ) : (
                                <ChevronRight className="h-3 w-3" />
                              )}
                            </Button>
                            <span className="flex-1 text-sm font-medium">
                              {mod.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {moduleUnits.length} Tage
                            </span>
                            {loadingIds.has(`module-${mod.id}`) && (
                              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                            )}
                            <Switch
                              checked={modAccess}
                              onCheckedChange={(v) =>
                                handleToggleModule(mod.id, v)
                              }
                              disabled={loadingIds.has(`module-${mod.id}`)}
                              className="scale-90"
                            />
                          </div>
                          {isModExpanded &&
                            moduleUnits.map((unit) => {
                              const unitAccess = getEffectiveAccess(
                                "unit",
                                unit.id,
                                course.id,
                                mod.id
                              );
                              return (
                                <div
                                  key={unit.id}
                                  className="ml-8 mt-1 flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-1.5"
                                >
                                  <span className="flex-1 text-sm">
                                    {unit.name}
                                  </span>
                                  {loadingIds.has(`unit-${unit.id}`) && (
                                    <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                                  )}
                                  <Switch
                                    checked={unitAccess}
                                    onCheckedChange={(v) =>
                                      handleToggleUnit(unit.id, v)
                                    }
                                    disabled={loadingIds.has(
                                      `unit-${unit.id}`
                                    )}
                                    className="scale-75"
                                  />
                                </div>
                              );
                            })}
                        </div>
                      );
                    })}

                    {/* Units without module */}
                    {courseUnits
                      .filter((u) => !u.module_id)
                      .map((unit) => {
                        const unitAccess = getEffectiveAccess(
                          "unit",
                          unit.id,
                          course.id,
                          null
                        );
                        return (
                          <div
                            key={unit.id}
                            className="ml-4 flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-1.5"
                          >
                            <span className="flex-1 text-sm">{unit.name}</span>
                            {loadingIds.has(`unit-${unit.id}`) && (
                              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                            )}
                            <Switch
                              checked={unitAccess}
                              onCheckedChange={(v) =>
                                handleToggleUnit(unit.id, v)
                              }
                              disabled={loadingIds.has(`unit-${unit.id}`)}
                              className="scale-75"
                            />
                          </div>
                        );
                      })}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
