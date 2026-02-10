"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { toast } from "sonner";
import type { ContentBlock, ContentBlockType } from "@/lib/types";
import {
  createContentBlock,
  updateContentBlock,
  deleteContentBlock,
  reorderContentBlocks,
  uploadFile,
} from "@/lib/actions/content-blocks";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  Loader2,
  Pencil,
  FileText,
  LinkIcon,
  Type,
  Presentation,
  Upload,
  ExternalLink,
  File,
  Save,
} from "lucide-react";

interface ContentEditorClientProps {
  courseId: string;
  courseName: string;
  unitId: string;
  unitName: string;
  initialBlocks: ContentBlock[];
}

const blockTypeLabels: Record<ContentBlockType, string> = {
  canva_embed: "Canva-Embed",
  text: "Text",
  link: "Link",
  file: "Datei",
};

const blockTypeIcons: Record<ContentBlockType, typeof Presentation> = {
  canva_embed: Presentation,
  text: Type,
  link: LinkIcon,
  file: File,
};

export function ContentEditorClient({
  courseId,
  courseName,
  unitId,
  unitName,
  initialBlocks,
}: ContentEditorClientProps) {
  const [blocks, setBlocks] = useState(initialBlocks);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<ContentBlock | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Add form state
  const [blockType, setBlockType] = useState<ContentBlockType>("canva_embed");
  const [contentUrl, setContentUrl] = useState("");
  const [contentTitle, setContentTitle] = useState("");
  const [contentText, setContentText] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  function resetForm() {
    setBlockType("canva_embed");
    setContentUrl("");
    setContentTitle("");
    setContentText("");
  }

  function openEditDialog(block: ContentBlock) {
    setSelectedBlock(block);
    const c = block.content as Record<string, string>;
    if (block.type === "canva_embed") {
      setContentUrl(c.url || "");
    } else if (block.type === "text") {
      setContentText(c.text || "");
    } else if (block.type === "link") {
      setContentUrl(c.url || "");
      setContentTitle(c.title || "");
    }
    setEditOpen(true);
  }

  function buildContent(): Record<string, unknown> {
    switch (blockType) {
      case "canva_embed":
        return { url: contentUrl };
      case "text":
        return { text: contentText };
      case "link":
        return { url: contentUrl, title: contentTitle };
      default:
        return {};
    }
  }

  function buildEditContent(): Record<string, unknown> {
    if (!selectedBlock) return {};
    switch (selectedBlock.type) {
      case "canva_embed":
        return { url: contentUrl };
      case "text":
        return { text: contentText };
      case "link":
        return { url: contentUrl, title: contentTitle };
      default:
        return selectedBlock.content;
    }
  }

  async function handleAdd() {
    if (blockType === "canva_embed" && !contentUrl.trim()) {
      toast.error("Bitte eine URL eingeben.");
      return;
    }
    if (blockType === "text" && !contentText.trim()) {
      toast.error("Bitte einen Text eingeben.");
      return;
    }
    if (blockType === "link" && !contentUrl.trim()) {
      toast.error("Bitte eine URL eingeben.");
      return;
    }

    setLoading(true);
    const result = await createContentBlock(
      unitId,
      blockType,
      buildContent(),
      courseId
    );
    setLoading(false);

    if ("error" in result && result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Block wurde hinzugefügt.");
    if (result.data) {
      setBlocks((prev) => [...prev, result.data]);
    }
    setAddOpen(false);
    resetForm();
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      toast.error("Datei ist zu gross (max. 50MB).");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    const uploadResult = await uploadFile(formData);

    if ("error" in uploadResult && uploadResult.error) {
      setUploading(false);
      toast.error(uploadResult.error);
      return;
    }

    if (uploadResult.data) {
      const result = await createContentBlock(
        unitId,
        "file",
        {
          fileName: uploadResult.data.fileName,
          fileSize: uploadResult.data.fileSize,
          filePath: uploadResult.data.filePath,
          publicUrl: uploadResult.data.publicUrl,
        },
        courseId
      );

      if ("error" in result && result.error) {
        setUploading(false);
        toast.error(result.error);
        return;
      }

      if (result.data) {
        setBlocks((prev) => [...prev, result.data]);
      }
      toast.success(`"${uploadResult.data.fileName}" wurde hochgeladen.`);
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleUpdate() {
    if (!selectedBlock) return;

    setLoading(true);
    const result = await updateContentBlock(
      selectedBlock.id,
      buildEditContent(),
      courseId,
      unitId
    );
    setLoading(false);

    if ("error" in result && result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Block wurde aktualisiert.");
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === selectedBlock.id
          ? { ...b, content: buildEditContent() }
          : b
      )
    );
    setEditOpen(false);
    setSelectedBlock(null);
    resetForm();
  }

  async function handleDelete() {
    if (!selectedBlock) return;

    setLoading(true);
    const result = await deleteContentBlock(selectedBlock.id, courseId, unitId);
    setLoading(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Block wurde gelöscht.");
    setBlocks((prev) => prev.filter((b) => b.id !== selectedBlock.id));
    setDeleteOpen(false);
    setSelectedBlock(null);
  }

  async function moveBlock(blockId: string, direction: "up" | "down") {
    const idx = blocks.findIndex((b) => b.id === blockId);
    if (
      (direction === "up" && idx === 0) ||
      (direction === "down" && idx === blocks.length - 1)
    )
      return;

    const newBlocks = [...blocks];
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    [newBlocks[idx], newBlocks[swapIdx]] = [newBlocks[swapIdx], newBlocks[idx]];
    setBlocks(newBlocks);

    await reorderContentBlocks(
      courseId,
      unitId,
      newBlocks.map((b) => b.id)
    );
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function renderBlockContent(block: ContentBlock) {
    const c = block.content as Record<string, string | number>;

    switch (block.type) {
      case "canva_embed":
        return (
          <div>
            <p className="text-sm text-muted-foreground truncate">
              {(c.url as string) || "Keine URL"}
            </p>
            {c.url && (
              <div className="mt-2 rounded border bg-muted/50 p-2">
                <iframe
                  src={c.url as string}
                  className="h-48 w-full rounded"
                  allowFullScreen
                  title="Canva Embed Preview"
                />
              </div>
            )}
          </div>
        );
      case "text":
        return (
          <div className="text-sm whitespace-pre-wrap line-clamp-4">
            {(c.text as string) || "Kein Text"}
          </div>
        );
      case "link":
        return (
          <div className="flex items-center gap-2 text-sm">
            <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="font-medium">{(c.title as string) || (c.url as string)}</p>
              <p className="text-muted-foreground truncate text-xs">
                {c.url as string}
              </p>
            </div>
          </div>
        );
      case "file":
        return (
          <div className="flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="font-medium">{c.fileName as string}</p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(c.fileSize as number)}
              </p>
            </div>
          </div>
        );
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" className="mb-2" asChild>
          <Link href={`/admin/courses/${courseId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zu {courseName}
          </Link>
        </Button>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{unitName}</h1>
            <p className="text-sm text-muted-foreground">
              {blocks.length} Content-Blöcke
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              Datei hochladen
            </Button>
            <Button
              onClick={() => {
                resetForm();
                setAddOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Block hinzufügen
            </Button>
          </div>
        </div>
      </div>

      {/* Blocks */}
      {blocks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-lg font-medium text-muted-foreground">
              Noch keine Inhalte
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Füge Content-Blöcke hinzu (Canva-Embed, Text, Links, Dateien).
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {blocks.map((block, idx) => {
            const Icon = blockTypeIcons[block.type];
            return (
              <Card key={block.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">
                        {blockTypeLabels[block.type]}
                      </span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => moveBlock(block.id, "up")}
                        disabled={idx === 0}
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => moveBlock(block.id, "down")}
                        disabled={idx === blocks.length - 1}
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                      {block.type !== "file" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => openEditDialog(block)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        onClick={() => {
                          setSelectedBlock(block);
                          setDeleteOpen(true);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>{renderBlockContent(block)}</CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Block Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Block hinzufügen</DialogTitle>
            <DialogDescription>
              Wähle den Typ und fülle die Inhalte aus.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Typ</Label>
              <Select
                value={blockType}
                onValueChange={(v) => setBlockType(v as ContentBlockType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="canva_embed">Canva-Embed</SelectItem>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="link">Link</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {blockType === "canva_embed" && (
              <div className="grid gap-2">
                <Label htmlFor="canva-url">Canva-Embed URL</Label>
                <Input
                  id="canva-url"
                  placeholder="https://www.canva.com/design/..."
                  value={contentUrl}
                  onChange={(e) => setContentUrl(e.target.value)}
                />
              </div>
            )}

            {blockType === "text" && (
              <div className="grid gap-2">
                <Label htmlFor="text-content">Text</Label>
                <Textarea
                  id="text-content"
                  placeholder="Text eingeben..."
                  value={contentText}
                  onChange={(e) => setContentText(e.target.value)}
                  rows={6}
                />
              </div>
            )}

            {blockType === "link" && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="link-url">URL</Label>
                  <Input
                    id="link-url"
                    placeholder="https://..."
                    value={contentUrl}
                    onChange={(e) => setContentUrl(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="link-title">Titel (optional)</Label>
                  <Input
                    id="link-title"
                    placeholder="Titel des Links"
                    value={contentTitle}
                    onChange={(e) => setContentTitle(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleAdd} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Hinzufügen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Block Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Block bearbeiten</DialogTitle>
            <DialogDescription>
              {selectedBlock && blockTypeLabels[selectedBlock.type]} bearbeiten.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {selectedBlock?.type === "canva_embed" && (
              <div className="grid gap-2">
                <Label htmlFor="edit-canva-url">Canva-Embed URL</Label>
                <Input
                  id="edit-canva-url"
                  value={contentUrl}
                  onChange={(e) => setContentUrl(e.target.value)}
                />
              </div>
            )}

            {selectedBlock?.type === "text" && (
              <div className="grid gap-2">
                <Label htmlFor="edit-text">Text</Label>
                <Textarea
                  id="edit-text"
                  value={contentText}
                  onChange={(e) => setContentText(e.target.value)}
                  rows={6}
                />
              </div>
            )}

            {selectedBlock?.type === "link" && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="edit-link-url">URL</Label>
                  <Input
                    id="edit-link-url"
                    value={contentUrl}
                    onChange={(e) => setContentUrl(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-link-title">Titel</Label>
                  <Input
                    id="edit-link-title"
                    value={contentTitle}
                    onChange={(e) => setContentTitle(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleUpdate} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Block löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchtest du diesen{" "}
              {selectedBlock && blockTypeLabels[selectedBlock.type]}-Block
              wirklich löschen?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
