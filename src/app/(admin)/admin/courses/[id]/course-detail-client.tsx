"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Course, Module, Unit } from "@/lib/types";
import {
  createModule,
  updateModule,
  deleteModule,
  createUnit,
  updateUnit,
  deleteUnit,
  reorderModules,
  reorderUnits,
} from "@/lib/actions/modules-units";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  FileText,
  Layers,
  Calendar,
  ArrowLeft,
  Loader2,
  Shield,
  Pencil,
  Check,
  X,
} from "lucide-react";

interface UnitWithBlocks extends Unit {
  content_blocks: { id: string }[];
}

interface CourseDetailClientProps {
  course: Course;
  modules: Module[];
  units: UnitWithBlocks[];
}

export function CourseDetailClient({
  course,
  modules: initialModules,
  units: initialUnits,
}: CourseDetailClientProps) {
  const router = useRouter();
  const [modules, setModules] = useState(initialModules);
  const [units, setUnits] = useState(initialUnits);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set(initialModules.map((m) => m.id))
  );
  const [loading, setLoading] = useState(false);

  // Add module/unit dialog
  const [addModuleOpen, setAddModuleOpen] = useState(false);
  const [addUnitOpen, setAddUnitOpen] = useState(false);
  const [addUnitModuleId, setAddUnitModuleId] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState("");

  // Inline editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

  // Delete confirmation
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "module" | "unit";
    id: string;
    name: string;
    childCount?: number;
  } | null>(null);

  const unassignedUnits = units.filter((u) => !u.module_id);

  function toggleModule(moduleId: string) {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  }

  function startEdit(id: string, name: string) {
    setEditingId(id);
    setEditingName(name);
    setTimeout(() => editInputRef.current?.focus(), 0);
  }

  async function saveEdit(type: "module" | "unit") {
    if (!editingId || !editingName.trim()) {
      setEditingId(null);
      return;
    }

    if (type === "module") {
      const result = await updateModule(editingId, editingName, course.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        setModules((prev) =>
          prev.map((m) =>
            m.id === editingId ? { ...m, name: editingName } : m
          )
        );
      }
    } else {
      const result = await updateUnit(editingId, editingName, course.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        setUnits((prev) =>
          prev.map((u) =>
            u.id === editingId ? { ...u, name: editingName } : u
          )
        );
      }
    }
    setEditingId(null);
  }

  async function handleAddModule() {
    if (!newItemName.trim()) return;

    setLoading(true);
    const result = await createModule(course.id, newItemName);
    setLoading(false);

    if ("error" in result && result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(`Modul "${newItemName}" wurde erstellt.`);
    if (result.data) {
      setModules((prev) => [...prev, result.data]);
      setExpandedModules((prev) => new Set([...prev, result.data.id]));
    }
    setAddModuleOpen(false);
    setNewItemName("");
  }

  async function handleAddUnit() {
    if (!newItemName.trim()) return;

    setLoading(true);
    const result = await createUnit(course.id, newItemName, addUnitModuleId);
    setLoading(false);

    if ("error" in result && result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(`Tag "${newItemName}" wurde erstellt.`);
    if (result.data) {
      setUnits((prev) => [...prev, { ...result.data, content_blocks: [] }]);
    }
    setAddUnitOpen(false);
    setNewItemName("");
    setAddUnitModuleId(null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    setLoading(true);
    const result =
      deleteTarget.type === "module"
        ? await deleteModule(deleteTarget.id, course.id)
        : await deleteUnit(deleteTarget.id, course.id);
    setLoading(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(`"${deleteTarget.name}" wurde gelöscht.`);
    if (deleteTarget.type === "module") {
      setModules((prev) => prev.filter((m) => m.id !== deleteTarget.id));
      // Units that were in this module become unassigned (handled by DB ON DELETE SET NULL)
      setUnits((prev) =>
        prev.map((u) =>
          u.module_id === deleteTarget.id ? { ...u, module_id: null } : u
        )
      );
    } else {
      setUnits((prev) => prev.filter((u) => u.id !== deleteTarget.id));
    }
    setDeleteOpen(false);
    setDeleteTarget(null);
  }

  async function moveModule(moduleId: string, direction: "up" | "down") {
    const idx = modules.findIndex((m) => m.id === moduleId);
    if (
      (direction === "up" && idx === 0) ||
      (direction === "down" && idx === modules.length - 1)
    )
      return;

    const newModules = [...modules];
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    [newModules[idx], newModules[swapIdx]] = [newModules[swapIdx], newModules[idx]];
    setModules(newModules);

    await reorderModules(
      course.id,
      newModules.map((m) => m.id)
    );
  }

  async function moveUnit(
    unitId: string,
    moduleId: string | null,
    direction: "up" | "down"
  ) {
    const moduleUnits = units
      .filter((u) => u.module_id === moduleId)
      .sort((a, b) => a.sort_order - b.sort_order);

    const idx = moduleUnits.findIndex((u) => u.id === unitId);
    if (
      (direction === "up" && idx === 0) ||
      (direction === "down" && idx === moduleUnits.length - 1)
    )
      return;

    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    const newUnits = [...moduleUnits];
    [newUnits[idx], newUnits[swapIdx]] = [newUnits[swapIdx], newUnits[idx]];

    // Update sort_order in local state
    const updatedUnits = units.map((u) => {
      const newIdx = newUnits.findIndex((nu) => nu.id === u.id);
      if (newIdx !== -1) return { ...u, sort_order: newIdx };
      return u;
    });
    setUnits(updatedUnits);

    await reorderUnits(
      course.id,
      newUnits.map((u) => u.id)
    );
  }

  function renderUnit(unit: UnitWithBlocks, moduleUnits: UnitWithBlocks[]) {
    const idx = moduleUnits.findIndex((u) => u.id === unit.id);
    const isEditing = editingId === unit.id;

    return (
      <div
        key={unit.id}
        className="flex items-center gap-2 rounded-md border bg-white px-3 py-2 hover:bg-muted/50 transition-colors"
      >
        <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />

        {isEditing ? (
          <div className="flex flex-1 items-center gap-1">
            <Input
              ref={editInputRef}
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              className="h-7 text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") saveEdit("unit");
                if (e.key === "Escape") setEditingId(null);
              }}
            />
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => saveEdit("unit")}
            >
              <Check className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setEditingId(null)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <Link
            href={`/admin/courses/${course.id}/units/${unit.id}`}
            className="flex-1 text-sm font-medium hover:text-primary transition-colors"
          >
            {unit.name}
          </Link>
        )}

        <span className="text-xs text-muted-foreground">
          {unit.content_blocks.length} Blöcke
        </span>

        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => moveUnit(unit.id, unit.module_id, "up")}
            disabled={idx === 0}
          >
            <ArrowUp className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => moveUnit(unit.id, unit.module_id, "down")}
            disabled={idx === moduleUnits.length - 1}
          >
            <ArrowDown className="h-3 w-3" />
          </Button>
          {!isEditing && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => startEdit(unit.id, unit.name)}
            >
              <Pencil className="h-3 w-3" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
            onClick={() => {
              setDeleteTarget({
                type: "unit",
                id: unit.id,
                name: unit.name,
                childCount: unit.content_blocks.length,
              });
              setDeleteOpen(true);
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" className="mb-2" asChild>
          <Link href="/admin/courses">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zu Lehrgänge
          </Link>
        </Button>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{course.name}</h1>
            {course.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {course.description}
              </p>
            )}
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Layers className="h-3.5 w-3.5" />
                {modules.length} Module
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {units.length} Tage
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href={`/admin/courses/${course.id}/access`}>
                <Shield className="mr-2 h-4 w-4" />
                Zugriffe
              </Link>
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setNewItemName("");
                setAddModuleOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Modul
            </Button>
            <Button
              onClick={() => {
                setNewItemName("");
                setAddUnitModuleId(null);
                setAddUnitOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Tag
            </Button>
          </div>
        </div>
      </div>

      {/* Modules & Units */}
      {modules.length === 0 && units.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Layers className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-lg font-medium text-muted-foreground">
              Noch keine Inhalte
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Füge Module oder Tage hinzu um den Lehrgang zu strukturieren.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {/* Unassigned Units */}
        {unassignedUnits.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">
                  Tage ohne Modul
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setNewItemName("");
                    setAddUnitModuleId(null);
                    setAddUnitOpen(true);
                  }}
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Tag
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {unassignedUnits
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((unit) => renderUnit(unit, unassignedUnits))}
            </CardContent>
          </Card>
        )}

        {/* Modules with Units */}
        {modules.map((mod, modIdx) => {
          const isExpanded = expandedModules.has(mod.id);
          const moduleUnits = units
            .filter((u) => u.module_id === mod.id)
            .sort((a, b) => a.sort_order - b.sort_order);
          const isEditingModule = editingId === mod.id;

          return (
            <Card key={mod.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => toggleModule(mod.id)}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>

                  {isEditingModule ? (
                    <div className="flex flex-1 items-center gap-1">
                      <Input
                        ref={editInputRef}
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="h-7 text-sm"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit("module");
                          if (e.key === "Escape") setEditingId(null);
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => saveEdit("module")}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => setEditingId(null)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <span className="flex-1 font-semibold">{mod.name}</span>
                  )}

                  <span className="text-xs text-muted-foreground">
                    {moduleUnits.length} Tage
                  </span>

                  <div className="flex items-center gap-0.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => moveModule(mod.id, "up")}
                      disabled={modIdx === 0}
                    >
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => moveModule(mod.id, "down")}
                      disabled={modIdx === modules.length - 1}
                    >
                      <ArrowDown className="h-3 w-3" />
                    </Button>
                    {!isEditingModule && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => startEdit(mod.id, mod.name)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => {
                        setNewItemName("");
                        setAddUnitModuleId(mod.id);
                        setAddUnitOpen(true);
                      }}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      onClick={() => {
                        setDeleteTarget({
                          type: "module",
                          id: mod.id,
                          name: mod.name,
                          childCount: moduleUnits.length,
                        });
                        setDeleteOpen(true);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {isExpanded && (
                <CardContent className="space-y-2">
                  {moduleUnits.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2 text-center">
                      Keine Einheiten
                    </p>
                  ) : (
                    moduleUnits.map((unit) => renderUnit(unit, moduleUnits))
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Add Module Dialog */}
      <Dialog open={addModuleOpen} onOpenChange={setAddModuleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neues Modul</DialogTitle>
            <DialogDescription>
              Erstelle ein neues Modul im Lehrgang.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="z.B. Modul 1 – Einführung"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddModule();
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddModuleOpen(false)}
            >
              Abbrechen
            </Button>
            <Button onClick={handleAddModule} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Erstellen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Unit Dialog */}
      <Dialog open={addUnitOpen} onOpenChange={setAddUnitOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neuer Tag</DialogTitle>
            <DialogDescription>
              {addUnitModuleId
                ? `Tag zu "${modules.find((m) => m.id === addUnitModuleId)?.name}" hinzufügen.`
                : "Tag direkt zum Lehrgang hinzufügen (ohne Modul)."}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="z.B. Tag 1 – Grundlagen"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddUnit();
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddUnitOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleAddUnit} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Erstellen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteTarget?.type === "module" ? "Modul" : "Tag"} löschen?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Möchtest du &quot;{deleteTarget?.name}&quot; wirklich löschen?
              {deleteTarget?.type === "module" &&
                deleteTarget.childCount &&
                deleteTarget.childCount > 0 &&
                ` Die ${deleteTarget.childCount} enthaltenen Tage werden dem Lehrgang ohne Modul zugeordnet.`}
              {deleteTarget?.type === "unit" &&
                deleteTarget.childCount &&
                deleteTarget.childCount > 0 &&
                ` Die ${deleteTarget.childCount} Content-Blöcke werden ebenfalls gelöscht.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
