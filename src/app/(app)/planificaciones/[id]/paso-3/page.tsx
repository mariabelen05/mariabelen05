import { redirect } from "next/navigation";
import { getPlanConAcceso } from "@/lib/actions/planificacion-actions";
import { StepLayout } from "@/components/planificacion/step-layout";
import { Paso3Editor } from "./paso3-editor";
import type { InstrumentoEvaluacion, CoherenciaReporte } from "@/lib/planificacion-types";

export default async function Paso3Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { plan, rol } = await getPlanConAcceso(id);
  if (plan.paso2Estado !== "COMPLETADO") redirect(`/planificaciones/${id}/paso-2`);

  const contenido = plan.instrumentoEvaluacion
    ? (JSON.parse(plan.instrumentoEvaluacion) as InstrumentoEvaluacion)
    : null;
  const coherencia = plan.coherenciaReporte
    ? (JSON.parse(plan.coherenciaReporte) as CoherenciaReporte)
    : null;

  return (
    <StepLayout
      planId={id}
      titulo={plan.titulo}
      current={3}
      estados={[plan.paso1Estado, plan.paso2Estado, plan.paso3Estado, plan.paso4Estado]}
    >
      <Paso3Editor
        planId={id}
        initialContenido={contenido}
        initialCoherencia={coherencia}
        readOnly={rol === "VISOR"}
      />
    </StepLayout>
  );
}
