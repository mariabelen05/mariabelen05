import { getPlanConAcceso } from "@/lib/actions/planificacion-actions";
import { DirectionAwareTabs } from "@/components/ui/direction-aware-tabs";
import { StepTransition } from "@/components/planificacion/step-transition";

// Layout compartido por /planificaciones/[id]/paso-1..4 (y la página de
// redirect en [id]/page.tsx). Al no desmontarse entre esas rutas, la barra
// de pasos puede animar su indicador activo con una transición de layout
// compartida (motion layoutId), y StepTransition puede animar el contenido
// según la dirección de navegación.
export default async function PlanificacionStepsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { plan } = await getPlanConAcceso(id);

  return (
    <div className="flex flex-col gap-6">
      <DirectionAwareTabs
        basePath={`/planificaciones/${id}`}
        estados={[plan.paso1Estado, plan.paso2Estado, plan.paso3Estado, plan.paso4Estado]}
      />
      <StepTransition>{children}</StepTransition>
    </div>
  );
}
