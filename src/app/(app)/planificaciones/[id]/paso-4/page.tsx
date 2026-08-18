import { redirect } from "next/navigation";
import { getPlanConAcceso, getUltimaEdicion } from "@/lib/actions/planificacion-actions";
import { StepLayout } from "@/components/planificacion/step-layout";
import { Paso4Resultado } from "./paso4-resultado";
import type {
  ObjetivosContenidos, MetodologiaActividades, InstrumentoEvaluacion, CoherenciaReporte,
} from "@/lib/planificacion-types";

export default async function Paso4Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { plan, rol } = await getPlanConAcceso(id);
  if (plan.paso3Estado !== "COMPLETADO") redirect(`/planificaciones/${id}/paso-3`);
  const ultimaEdicion = await getUltimaEdicion(id, "paso4");

  return (
    <StepLayout
      planId={id}
      titulo={plan.titulo}
      current={4}
      estados={[plan.paso1Estado, plan.paso2Estado, plan.paso3Estado, plan.paso4Estado]}
      colaboradores={plan.colaboradores}
      esOwner={rol === "OWNER"}
      ultimaEdicion={ultimaEdicion}
    >
      <Paso4Resultado
        planId={id}
        finalizada={plan.estado === "FINALIZADA"}
        readOnly={rol === "VISOR"}
        objetivos={JSON.parse(plan.objetivosContenidos!) as ObjetivosContenidos}
        metodologia={JSON.parse(plan.metodologiaActividades!) as MetodologiaActividades}
        evaluacion={JSON.parse(plan.instrumentoEvaluacion!) as InstrumentoEvaluacion}
        coherencia={plan.coherenciaReporte ? (JSON.parse(plan.coherenciaReporte) as CoherenciaReporte) : null}
      />
    </StepLayout>
  );
}
