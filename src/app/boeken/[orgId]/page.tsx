import BookingFlow from "@/components/BookingFlow";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";

export const metadata = { title: "Les boeken — Bijles" };

export default async function BoekenPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const admin = createAdminClient();
  if (!admin) return <Notice text="Boeken is nog niet beschikbaar." />;

  const { data: org } = await admin
    .from("organizations")
    .select("name, lesson_minutes")
    .eq("id", orgId)
    .maybeSingle();
  if (!org) return <Notice text="Deze boekingspagina bestaat niet." />;

  const { data: avail } = await admin
    .from("availability")
    .select("weekday,start_min,end_min")
    .eq("org_id", orgId);

  const { data: bk } = await admin
    .from("bookings")
    .select("starts_at")
    .eq("org_id", orgId)
    .neq("status", "cancelled")
    .gte("starts_at", new Date().toISOString());

  const windows = ((avail as { weekday: number; start_min: number; end_min: number }[]) ?? []).map(
    (r) => ({ weekday: r.weekday, startMin: r.start_min, endMin: r.end_min }),
  );
  const bookedStarts = ((bk as { starts_at: string }[]) ?? []).map((r) =>
    new Date(r.starts_at).getTime(),
  );

  return (
    <BookingFlow
      orgId={orgId}
      orgName={org.name as string}
      windows={windows}
      bookedStarts={bookedStarts}
      lessonMin={(org.lesson_minutes as number) ?? 60}
    />
  );
}

function Notice({ text }: { text: string }) {
  return (
    <main className="flex min-h-screen flex-1 items-center justify-center app-surface px-4">
      <Container size="md">
        <Card className="p-10 text-center text-muted-foreground">{text}</Card>
      </Container>
    </main>
  );
}
