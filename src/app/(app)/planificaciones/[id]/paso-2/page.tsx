import { redirect } from "next/navigation";
import { getPlanConAcceso, getUltimaEdicion } from "@/lib/actions/planificacion-actions";
import { StepLayout } from "@/components/planificacion/step-layout";
import { Paso2Editor } from "./paso2-editor";
import type { MetodologiaActividades } from "@/lib/planificacion-types";

export default async function Paso2Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { plan, rol } = await getPlanConAcceso(id);
  if (plan.paso1Estado !== "COMPLETADO") redirect(`/planificaciones/${id}/paso-1`);
  const ultimaEdicion = await getUltimaEdicion(id, "paso2");

  const contenido = plan.metodologiaActividades
    ? (JSON.parse(plan.metodologiaActividades) as MetodologiaActividades)
    : null;

  return (
    <StepLayout
      planId={id}
      titulo={plan.titulo}
      current={2}
      estados={[plan.paso1Estado, plan.paso2Estado, plan.paso3Estado, plan.paso4Estado]}
      colaboradores={plan.colaboradores}
      esOwner={rol === "OWNER"}
      ultimaEdicion={ultimaEdicion}
    >
      <Paso2Editor planId={id} initialContenido={contenido} readOnly={rol === "VISOR"} />
    </StepLayout>
  );
}
