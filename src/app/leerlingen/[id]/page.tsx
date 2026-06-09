import StudentDetail from "@/components/StudentDetail";

export const metadata = { title: "Leerling — Bijles" };

export default async function LeerlingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <StudentDetail studentId={id} />;
}
