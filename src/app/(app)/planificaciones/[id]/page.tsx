import { redirect } from "next/navigation";
import { getPlanConAcceso } from "@/lib/actions/planificacion-actions";

export default async function PlanificacionRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { plan } = await getPlanConAcceso(id);

  if (plan.paso1Estado !== "COMPLETADO") redirect(`/planificaciones/${id}/paso-1`);
  if (plan.paso2Estado !== "COMPLETADO") redirect(`/planificaciones/${id}/paso-2`);
  if (plan.paso3Estado !== "COMPLETADO") redirect(`/planificaciones/${id}/paso-3`);
  redirect(`/planificaciones/${id}/paso-4`);
}
