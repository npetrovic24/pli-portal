import { getMemberAccess } from "@/lib/actions/access";
import { MemberAccessClient } from "./member-access-client";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function MemberAccessPage({ params }: PageProps) {
  const { id } = await params;

  try {
    const { member, courses, modules, units, grants } =
      await getMemberAccess(id);

    if (!member) notFound();

    return (
      <MemberAccessClient
        member={member}
        courses={courses}
        modules={modules}
        units={units}
        initialGrants={grants}
      />
    );
  } catch {
    notFound();
  }
}
