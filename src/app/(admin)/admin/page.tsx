import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Users, BookOpen, BarChart3 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [
    { count: membersCount },
    { count: activeMembersCount },
    { count: coursesCount },
    { count: activeGrantsCount },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true)
      .eq("role", "member"),
    supabase.from("courses").select("*", { count: "exact", head: true }),
    supabase
      .from("access_grants")
      .select("*", { count: "exact", head: true })
      .eq("is_granted", true),
  ]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Admin Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
              <Users className="h-5 w-5 text-accent-foreground" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              Mitglieder
            </p>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{membersCount ?? 0}</p>
            <p className="text-xs text-muted-foreground">
              {activeMembersCount ?? 0} aktive Mitglieder
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
              <BookOpen className="h-5 w-5 text-accent-foreground" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              Lehrgänge
            </p>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{coursesCount ?? 0}</p>
            <p className="text-xs text-muted-foreground">
              Erstellte Lehrgänge
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
              <BarChart3 className="h-5 w-5 text-accent-foreground" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              Aktive Zugriffe
            </p>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{activeGrantsCount ?? 0}</p>
            <p className="text-xs text-muted-foreground">
              Freigeschaltete Zugriffe
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
