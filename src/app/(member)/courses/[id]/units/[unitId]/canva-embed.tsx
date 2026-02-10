"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface CanvaEmbedProps {
  blockId: string;
  title?: string;
}

export function CanvaEmbed({ blockId, title }: CanvaEmbedProps) {
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUrl() {
      try {
        const res = await fetch(`/api/embed-url/${blockId}`);
        if (!res.ok) {
          throw new Error("Embed konnte nicht geladen werden");
        }
        const data = await res.json();
        setEmbedUrl(data.url);
      } catch {
        setError("Inhalt konnte nicht geladen werden.");
      } finally {
        setLoading(false);
      }
    }
    fetchUrl();
  }, [blockId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-border bg-muted/30 py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !embedUrl) {
    return (
      <Card className="border-destructive/20">
        <CardContent className="flex items-center gap-3 p-4">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <span className="text-sm text-muted-foreground">
            {error || "Embed konnte nicht geladen werden."}
          </span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {title && (
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
      )}
      <div className="relative w-full overflow-hidden rounded-lg border border-border" style={{ paddingBottom: "56.25%" }}>
        <iframe
          src={embedUrl}
          className="absolute inset-0 h-full w-full"
          loading="lazy"
          allowFullScreen
          allow="fullscreen"
          title={title || "Canva Präsentation"}
        />
      </div>
    </div>
  );
}
