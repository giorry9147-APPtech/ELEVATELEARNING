import Classroom from "@/components/classroom/Classroom";

export default async function KlasPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  return <Classroom roomId={roomId} />;
}
