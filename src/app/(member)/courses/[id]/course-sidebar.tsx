"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  Lock,
  Menu,
  ArrowLeft,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Course, Module, Unit } from "@/lib/types";

interface UnitWithAccess extends Unit {
  hasAccess: boolean;
}

interface ModuleWithAccess extends Module {
  hasAccess: boolean;
}

interface CourseSidebarProps {
  course: Course;
  modules: ModuleWithAccess[];
  units: UnitWithAccess[];
  courseId: string;
}

function SidebarContent({
  course,
  modules,
  units,
  courseId,
  onNavigate,
}: CourseSidebarProps & { onNavigate?: () => void }) {
  const pathname = usePathname();
  const [expandedModules, setExpandedModules] = useState<Set<string>>(() => {
    // Expand all modules by default
    return new Set(modules.map((m) => m.id));
  });

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  const isCurrentUnit = (unitId: string) =>
    pathname.includes(`/units/${unitId}`);

  // Units without a module (standalone)
  const standaloneUnits = units.filter((u) => !u.module_id);

  return (
    <div className="flex h-full flex-col">
      {/* Course header */}
      <div className="border-b border-border p-4">
        <Link
          href="/dashboard"
          className="mb-3 flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          onClick={onNavigate}
        >
          <ArrowLeft className="h-3 w-3" />
          Zurück zu Meine Lehrgänge
        </Link>
        <h2 className="font-semibold text-sm leading-tight">{course.name}</h2>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1">
        <nav className="p-2">
          {/* Modules */}
          {modules.map((mod) => {
            const moduleUnits = units.filter((u) => u.module_id === mod.id);
            const isExpanded = expandedModules.has(mod.id);

            return (
              <div key={mod.id} className="mb-1">
                <button
                  onClick={() => toggleModule(mod.id)}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  <span className="text-left">{mod.name}</span>
                </button>

                {isExpanded && (
                  <div className="ml-2 border-l border-border">
                    {moduleUnits.length === 0 ? (
                      <p className="px-5 py-2 text-xs text-muted-foreground">
                        Keine Einheiten
                      </p>
                    ) : (
                      moduleUnits.map((unit) => (
                        <UnitNavItem
                          key={unit.id}
                          unit={unit}
                          courseId={courseId}
                          isCurrent={isCurrentUnit(unit.id)}
                          onNavigate={onNavigate}
                        />
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Standalone units (no module) */}
          {standaloneUnits.length > 0 && (
            <div className="mt-1">
              {modules.length > 0 && (
                <div className="my-2 border-t border-border" />
              )}
              {standaloneUnits.map((unit) => (
                <UnitNavItem
                  key={unit.id}
                  unit={unit}
                  courseId={courseId}
                  isCurrent={isCurrentUnit(unit.id)}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          )}
        </nav>
      </ScrollArea>
    </div>
  );
}

function UnitNavItem({
  unit,
  courseId,
  isCurrent,
  onNavigate,
}: {
  unit: UnitWithAccess;
  courseId: string;
  isCurrent: boolean;
  onNavigate?: () => void;
}) {
  if (!unit.hasAccess) {
    return (
      <div className="flex items-center gap-2 rounded-md px-5 py-2 text-sm text-muted-foreground/50 cursor-not-allowed">
        <Lock className="h-3.5 w-3.5 shrink-0" />
        <span>{unit.name}</span>
      </div>
    );
  }

  return (
    <Link
      href={`/courses/${courseId}/units/${unit.id}`}
      onClick={onNavigate}
      className={`flex items-center gap-2 rounded-md px-5 py-2 text-sm transition-colors ${
        isCurrent
          ? "bg-accent text-accent-foreground font-medium"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      <FileText className="h-3.5 w-3.5 shrink-0" />
      <span>{unit.name}</span>
    </Link>
  );
}

export function CourseSidebar(props: CourseSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile trigger */}
      <div className="fixed bottom-4 right-4 z-40 lg:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button size="icon" className="h-12 w-12 rounded-full shadow-lg">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Navigation öffnen</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SidebarContent
              {...props}
              onNavigate={() => setMobileOpen(false)}
            />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-72 shrink-0 flex-col border-r border-border bg-white">
        <SidebarContent {...props} />
      </aside>
    </>
  );
}
