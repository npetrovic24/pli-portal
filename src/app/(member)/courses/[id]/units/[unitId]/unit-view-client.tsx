"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Download,
  ExternalLink,
  FileIcon,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { ContentBlock, Course, Unit } from "@/lib/types";
import { CanvaEmbed } from "./canva-embed";

interface UnitViewClientProps {
  course: Course;
  unit: Unit;
  blocks: ContentBlock[];
  prevUnit: Unit | null;
  nextUnit: Unit | null;
  courseId: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function ContentBlockRenderer({ block }: { block: ContentBlock }) {
  const content = block.content as Record<string, unknown>;

  switch (block.type) {
    case "canva_embed":
      return <CanvaEmbed blockId={block.id} title={content.title as string} />;

    case "text":
      return (
        <div
          className="prose prose-sm max-w-none text-foreground"
          dangerouslySetInnerHTML={{
            __html: (content.html as string) || "",
          }}
        />
      );

    case "file":
      return (
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              <FileIcon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm truncate">
                {(content.fileName as string) || "Datei"}
              </p>
              {typeof content.fileSize === "number" && (
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(content.fileSize)}
                </p>
              )}
            </div>
            <Button asChild variant="outline" size="sm">
              <a
                href={content.publicUrl as string}
                download
                target="_blank"
                rel="noopener noreferrer"
              >
                <Download className="mr-2 h-4 w-4" />
                Herunterladen
              </a>
            </Button>
          </CardContent>
        </Card>
      );

    case "link":
      return (
        <Card>
          <CardContent className="p-4">
            <a
              href={content.url as string}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 text-primary hover:underline"
            >
              <ExternalLink className="h-5 w-5 shrink-0" />
              <span className="text-sm font-medium">
                {(content.title as string) || (content.url as string)}
              </span>
            </a>
          </CardContent>
        </Card>
      );

    default:
      return (
        <Card className="border-destructive/20">
          <CardContent className="flex items-center gap-3 p-4 text-muted-foreground">
            <AlertTriangle className="h-5 w-5" />
            <span className="text-sm">
              Unbekannter Inhaltstyp: {block.type}
            </span>
          </CardContent>
        </Card>
      );
  }
}

export function UnitViewClient({
  course,
  unit,
  blocks,
  prevUnit,
  nextUnit,
  courseId,
}: UnitViewClientProps) {
  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/dashboard" className="hover:text-foreground transition-colors">
          Dashboard
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link
          href={`/courses/${courseId}`}
          className="hover:text-foreground transition-colors"
        >
          {course.name}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium">{unit.name}</span>
      </nav>

      {/* Unit title */}
      <h1 className="text-xl font-semibold mb-6">{unit.name}</h1>

      {/* Content blocks */}
      {blocks.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center">
          <p className="text-muted-foreground">
            Dieser Tag hat noch keine Inhalte.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {blocks.map((block) => (
            <ContentBlockRenderer key={block.id} block={block} />
          ))}
        </div>
      )}

      {/* Previous / Next navigation */}
      <Separator className="my-8" />
      <div className="flex items-center justify-between gap-4">
        {prevUnit ? (
          <Button asChild variant="outline">
            <Link href={`/courses/${courseId}/units/${prevUnit.id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {prevUnit.name}
            </Link>
          </Button>
        ) : (
          <div />
        )}
        {nextUnit ? (
          <Button asChild variant="outline">
            <Link href={`/courses/${courseId}/units/${nextUnit.id}`}>
              {nextUnit.name}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}
