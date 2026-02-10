"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import type { Course, Profile, AccessGrant } from "@/lib/types";
import { setAccessGrant, setCourseAccessForAll } from "@/lib/actions/access";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Loader2,
  Users,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface CourseAccessClientProps {
  course: Course;
  members: Profile[];
  initialGrants: AccessGrant[];
}

export function CourseAccessClient({
  course,
  members,
  initialGrants,
}: CourseAccessClientProps) {
  const [grants, setGrants] = useState(initialGrants);
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  function getMemberGrant(memberId: string): boolean {
    const grant = grants.find((g) => g.user_id === memberId);
    return grant ? grant.is_granted : false;
  }

  const grantedCount = members.filter((m) => getMemberGrant(m.id)).length;

  async function handleToggle(memberId: string, newValue: boolean) {
    setLoadingIds((prev) => new Set([...prev, memberId]));

    const result = await setAccessGrant({
      userId: memberId,
      courseId: course.id,
      isGranted: newValue,
    });

    if ("error" in result && result.error) {
      toast.error(result.error);
    } else {
      setGrants((prev) => {
        const existing = prev.findIndex((g) => g.user_id === memberId);
        if (existing >= 0) {
          return prev.map((g, i) =>
            i === existing ? { ...g, is_granted: newValue } : g
          );
        }
        return [
          ...prev,
          {
            id: crypto.randomUUID(),
            user_id: memberId,
            course_id: course.id,
            module_id: null,
            unit_id: null,
            is_granted: newValue,
            created_at: new Date().toISOString(),
          },
        ];
      });
    }

    setLoadingIds((prev) => {
      const next = new Set(prev);
      next.delete(memberId);
      return next;
    });
  }

  async function handleBulkAction(isGranted: boolean) {
    setBulkLoading(true);

    const result = await setCourseAccessForAll(course.id, isGranted);

    if ("error" in result && result.error) {
      toast.error(result.error);
    } else {
      // Update all grants locally
      setGrants(
        members.map((m) => ({
          id: crypto.randomUUID(),
          user_id: m.id,
          course_id: course.id,
          module_id: null,
          unit_id: null,
          is_granted: isGranted,
          created_at: new Date().toISOString(),
        }))
      );
      toast.success(
        isGranted
          ? "Alle Mitglieder freigeschaltet."
          : "Alle Mitglieder gesperrt."
      );
    }

    setBulkLoading(false);
  }

  return (
    <div>
      <div className="mb-6">
        <Button variant="ghost" size="sm" className="mb-2" asChild>
          <Link href={`/admin/courses/${course.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zu {course.name}
          </Link>
        </Button>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">
              Zugriffe: {course.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              {grantedCount} von {members.length} Mitgliedern freigeschaltet
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction(true)}
              disabled={bulkLoading}
            >
              {bulkLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="mr-2 h-4 w-4" />
              )}
              Alle freischalten
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction(false)}
              disabled={bulkLoading}
            >
              {bulkLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="mr-2 h-4 w-4" />
              )}
              Alle sperren
            </Button>
          </div>
        </div>
      </div>

      {members.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-lg font-medium text-muted-foreground">
              Noch keine Mitglieder
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>E-Mail</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Zugriff</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => {
                const hasAccess = getMemberGrant(member.id);
                return (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      {member.full_name || "–"}
                    </TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center gap-1 text-sm ${
                          hasAccess ? "text-green-600" : "text-red-500"
                        }`}
                      >
                        <span
                          className={`inline-block h-2 w-2 rounded-full ${
                            hasAccess ? "bg-green-500" : "bg-red-500"
                          }`}
                        />
                        {hasAccess ? "Freigeschaltet" : "Gesperrt"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {loadingIds.has(member.id) && (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        )}
                        <Switch
                          checked={hasAccess}
                          onCheckedChange={(v) =>
                            handleToggle(member.id, v)
                          }
                          disabled={loadingIds.has(member.id)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
