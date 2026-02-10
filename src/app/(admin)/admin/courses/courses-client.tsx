"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { toast } from "sonner";
import type { Course } from "@/lib/types";
import {
  createCourse,
  updateCourse,
  toggleCourseStatus,
  deleteCourse,
} from "@/lib/actions/courses";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  BookOpen,
  Pencil,
  Trash2,
  Layers,
  Calendar,
  Loader2,
  Shield,
} from "lucide-react";

interface CourseWithCounts extends Course {
  modules: { id: string }[];
  units: { id: string }[];
}

interface CoursesClientProps {
  initialCourses: CourseWithCounts[];
}

export function CoursesClient({ initialCourses }: CoursesClientProps) {
  const [courses, setCourses] = useState(initialCourses);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<CourseWithCounts | null>(null);
  const [loading, setLoading] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formTags, setFormTags] = useState("");

  function resetForm() {
    setFormName("");
    setFormDescription("");
    setFormTags("");
  }

  function openEditDialog(course: CourseWithCounts) {
    setSelectedCourse(course);
    setFormName(course.name);
    setFormDescription(course.description || "");
    setFormTags(course.category_tags.join(", "));
    setEditOpen(true);
  }

  function parseTags(input: string): string[] {
    return input
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }

  async function handleCreate() {
    if (!formName.trim()) {
      toast.error("Bitte einen Namen eingeben.");
      return;
    }

    setLoading(true);
    const result = await createCourse({
      name: formName,
      description: formDescription || undefined,
      categoryTags: parseTags(formTags),
    });
    setLoading(false);

    if ("error" in result && result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(`Lehrgang "${formName}" wurde erstellt.`);
    if (result.data) {
      setCourses((prev) => [
        ...prev,
        { ...result.data, modules: [], units: [] },
      ]);
    }
    setCreateOpen(false);
    resetForm();
  }

  async function handleUpdate() {
    if (!selectedCourse || !formName.trim()) return;

    setLoading(true);
    const result = await updateCourse(selectedCourse.id, {
      name: formName,
      description: formDescription || undefined,
      categoryTags: parseTags(formTags),
    });
    setLoading(false);

    if ("error" in result && result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(`Lehrgang "${formName}" wurde aktualisiert.`);
    setCourses((prev) =>
      prev.map((c) =>
        c.id === selectedCourse.id
          ? {
              ...c,
              name: formName,
              description: formDescription || null,
              category_tags: parseTags(formTags),
            }
          : c
      )
    );
    setEditOpen(false);
    setSelectedCourse(null);
    resetForm();
  }

  async function handleToggle(course: CourseWithCounts) {
    const newStatus = !course.is_active;
    setCourses((prev) =>
      prev.map((c) =>
        c.id === course.id ? { ...c, is_active: newStatus } : c
      )
    );

    const result = await toggleCourseStatus(course.id, newStatus);
    if (result.error) {
      toast.error(result.error);
      setCourses((prev) =>
        prev.map((c) =>
          c.id === course.id ? { ...c, is_active: !newStatus } : c
        )
      );
      return;
    }

    toast.success(
      newStatus
        ? `"${course.name}" wurde aktiviert.`
        : `"${course.name}" wurde deaktiviert.`
    );
  }

  async function handleDelete() {
    if (!selectedCourse) return;

    setLoading(true);
    const result = await deleteCourse(selectedCourse.id);
    setLoading(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(`"${selectedCourse.name}" wurde gelöscht.`);
    setCourses((prev) => prev.filter((c) => c.id !== selectedCourse.id));
    setDeleteOpen(false);
    setSelectedCourse(null);
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Lehrgänge</h1>
          <p className="text-sm text-muted-foreground">
            {courses.length} Lehrgänge,{" "}
            {courses.filter((c) => c.is_active).length} aktiv
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Neuer Lehrgang
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Neuer Lehrgang</DialogTitle>
              <DialogDescription>
                Erstelle einen neuen Lehrgang.
              </DialogDescription>
            </DialogHeader>
            <CourseForm
              name={formName}
              description={formDescription}
              tags={formTags}
              onNameChange={setFormName}
              onDescriptionChange={setFormDescription}
              onTagsChange={setFormTags}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleCreate} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Erstellen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Course Grid */}
      {courses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <BookOpen className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-lg font-medium text-muted-foreground">
              Noch keine Lehrgänge
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Erstelle deinen ersten Lehrgang.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Card
              key={course.id}
              className={`relative transition-opacity ${
                !course.is_active ? "opacity-60" : ""
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`/admin/courses/${course.id}`}
                    className="text-base font-semibold hover:text-primary transition-colors line-clamp-2"
                  >
                    {course.name}
                  </Link>
                  <Switch
                    checked={course.is_active}
                    onCheckedChange={() => handleToggle(course)}
                  />
                </div>
                {course.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {course.description}
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1 mb-3">
                  {course.category_tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <span className="flex items-center gap-1">
                    <Layers className="h-3.5 w-3.5" />
                    {course.modules.length} Module
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {course.units.length} Tage
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/admin/courses/${course.id}`}>
                      Verwalten
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(course)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/admin/courses/${course.id}/access`}>
                      <Shield className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => {
                      setSelectedCourse(course);
                      setDeleteOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lehrgang bearbeiten</DialogTitle>
            <DialogDescription>
              Bearbeite die Details des Lehrgangs.
            </DialogDescription>
          </DialogHeader>
          <CourseForm
            name={formName}
            description={formDescription}
            tags={formTags}
            onNameChange={setFormName}
            onDescriptionChange={setFormDescription}
            onTagsChange={setFormTags}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleUpdate} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Lehrgang löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchtest du &quot;{selectedCourse?.name}&quot; wirklich löschen?
              Alle Module, Tage und Inhalte werden ebenfalls gelöscht.
              Diese Aktion kann nicht rückgängig gemacht werden.
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

function CourseForm({
  name,
  description,
  tags,
  onNameChange,
  onDescriptionChange,
  onTagsChange,
}: {
  name: string;
  description: string;
  tags: string;
  onNameChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onTagsChange: (v: string) => void;
}) {
  return (
    <div className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label htmlFor="course-name">Name *</Label>
        <Input
          id="course-name"
          placeholder="z.B. ADHS Coach 2025"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="course-desc">Beschreibung</Label>
        <Textarea
          id="course-desc"
          placeholder="Optionale Beschreibung..."
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          rows={3}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="course-tags">Tags (kommagetrennt)</Label>
        <Input
          id="course-tags"
          placeholder="Coaching, Neurodivergenz, Leadership"
          value={tags}
          onChange={(e) => onTagsChange(e.target.value)}
        />
      </div>
    </div>
  );
}
