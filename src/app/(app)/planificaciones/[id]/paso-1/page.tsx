import { getPlanConAcceso, getUltimaEdicion } from "@/lib/actions/planificacion-actions";
import { StepLayout } from "@/components/planificacion/step-layout";
import { Paso1Editor } from "./paso1-editor";
import type { ObjetivosContenidos } from "@/lib/planificacion-types";

export default async function Paso1Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { plan, rol } = await getPlanConAcceso(id);
  const ultimaEdicion = await getUltimaEdicion(id, "paso1");

  const contenido = plan.objetivosContenidos
    ? (JSON.parse(plan.objetivosContenidos) as ObjetivosContenidos)
    : null;

  return (
    <StepLayout
      planId={id}
      titulo={plan.titulo}
      current={1}
      estados={[plan.paso1Estado, plan.paso2Estado, plan.paso3Estado, plan.paso4Estado]}
      colaboradores={plan.colaboradores}
      esOwner={rol === "OWNER"}
      ultimaEdicion={ultimaEdicion}
    >
      <Paso1Editor
        planId={id}
        contextoLibre={plan.contextoLibre ?? ""}
        initialContenido={contenido}
        readOnly={rol === "VISOR"}
      />
    </StepLayout>
  );
}
