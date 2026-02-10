"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import type { Profile } from "@/lib/types";
import {
  createMember,
  toggleMemberStatus,
  resetMemberPassword,
} from "@/lib/actions/members";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
  UserPlus,
  Search,
  KeyRound,
  Shield,
  ShieldOff,
  Loader2,
} from "lucide-react";
import Link from "next/link";

interface MembersClientProps {
  initialMembers: Profile[];
}

export function MembersClient({ initialMembers }: MembersClientProps) {
  const [members, setMembers] = useState(initialMembers);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetMember, setResetMember] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);

  // Create form state
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Reset form state
  const [newResetPassword, setNewResetPassword] = useState("");

  const filteredMembers = useMemo(() => {
    if (!search) return members;
    const q = search.toLowerCase();
    return members.filter(
      (m) =>
        m.full_name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q)
    );
  }, [members, search]);

  const activeCount = members.filter((m) => m.is_active).length;

  async function handleCreate() {
    if (!newName.trim() || !newEmail.trim() || !newPassword.trim()) {
      toast.error("Bitte alle Felder ausfüllen.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Passwort muss mindestens 8 Zeichen haben.");
      return;
    }

    setLoading(true);
    const result = await createMember({
      email: newEmail,
      password: newPassword,
      fullName: newName,
    });
    setLoading(false);

    if ("error" in result && result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(`Mitglied "${newName}" wurde angelegt.`);
    // Add to local state
    if (result.data) {
      setMembers((prev) => [
        {
          id: result.data.id,
          email: newEmail,
          full_name: newName,
          role: "member",
          is_active: true,
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);
    }
    setCreateOpen(false);
    setNewName("");
    setNewEmail("");
    setNewPassword("");
  }

  async function handleToggle(member: Profile) {
    const newStatus = !member.is_active;
    setMembers((prev) =>
      prev.map((m) => (m.id === member.id ? { ...m, is_active: newStatus } : m))
    );

    const result = await toggleMemberStatus(member.id, newStatus);
    if (result.error) {
      toast.error(result.error);
      setMembers((prev) =>
        prev.map((m) =>
          m.id === member.id ? { ...m, is_active: !newStatus } : m
        )
      );
      return;
    }

    toast.success(
      newStatus
        ? `${member.full_name} wurde aktiviert.`
        : `${member.full_name} wurde deaktiviert.`
    );
  }

  async function handleResetPassword() {
    if (!resetMember || !newResetPassword.trim()) return;
    if (newResetPassword.length < 8) {
      toast.error("Passwort muss mindestens 8 Zeichen haben.");
      return;
    }

    setLoading(true);
    const result = await resetMemberPassword(resetMember.id, newResetPassword);
    setLoading(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(`Passwort für ${resetMember.full_name} wurde zurückgesetzt.`);
    setResetOpen(false);
    setResetMember(null);
    setNewResetPassword("");
  }

  function openResetDialog(member: Profile) {
    setResetMember(member);
    setNewResetPassword("");
    setResetOpen(true);
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Mitglieder</h1>
          <p className="text-sm text-muted-foreground">
            {members.length} Mitglieder total, {activeCount} aktiv
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Neues Mitglied
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Neues Mitglied anlegen</DialogTitle>
              <DialogDescription>
                Erstelle ein neues Mitglied mit E-Mail und Passwort.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="Vorname Nachname"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">E-Mail *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Passwort * (min. 8 Zeichen)</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setCreateOpen(false)}
              >
                Abbrechen
              </Button>
              <Button onClick={handleCreate} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Anlegen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="mb-4 flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Nach Name oder E-Mail suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>E-Mail</TableHead>
              <TableHead>Rolle</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Erstellt am</TableHead>
              <TableHead className="text-right">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMembers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {search ? "Keine Mitglieder gefunden." : "Noch keine Mitglieder vorhanden."}
                </TableCell>
              </TableRow>
            ) : (
              filteredMembers.map((member) => (
                <TableRow
                  key={member.id}
                  className={!member.is_active ? "opacity-50" : ""}
                >
                  <TableCell className="font-medium">
                    {member.full_name || "–"}
                  </TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant={member.role === "admin" ? "default" : "secondary"}
                    >
                      {member.role === "admin" ? (
                        <><Shield className="mr-1 h-3 w-3" />Admin</>
                      ) : (
                        "Mitglied"
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={member.is_active}
                        onCheckedChange={() => handleToggle(member)}
                        disabled={member.role === "admin"}
                      />
                      <span className="text-sm">
                        {member.is_active ? (
                          <span className="text-green-600">Aktiv</span>
                        ) : (
                          <span className="text-red-500">Inaktiv</span>
                        )}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(member.created_at).toLocaleDateString("de-CH")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {member.role !== "admin" && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openResetDialog(member)}
                            title="Passwort zurücksetzen"
                          >
                            <KeyRound className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" asChild>
                            <Link
                              href={`/admin/members/${member.id}/access`}
                              title="Zugriffssteuerung"
                            >
                              {member.is_active ? (
                                <Shield className="h-4 w-4" />
                              ) : (
                                <ShieldOff className="h-4 w-4" />
                              )}
                            </Link>
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Reset Password Dialog */}
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Passwort zurücksetzen</DialogTitle>
            <DialogDescription>
              Neues Passwort für {resetMember?.full_name || resetMember?.email} setzen.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="reset-password">Neues Passwort (min. 8 Zeichen)</Label>
              <Input
                id="reset-password"
                type="password"
                placeholder="••••••••"
                value={newResetPassword}
                onChange={(e) => setNewResetPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleResetPassword} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Zurücksetzen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
