import Link from "next/link";
import { getEvaluacionConAcceso } from "@/lib/actions/evaluaciones-actions";
import { EvaluacionEditor } from "./evaluacion-editor";
import type { EvaluacionContenido } from "@/lib/evaluacion-types";

export default async function EvaluacionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { evaluacion } = await getEvaluacionConAcceso(id);
  const contenido = parseContenido(evaluacion.contenido);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Link href="/evaluaciones" className="w-fit text-xs font-bold text-text-faint hover:text-primary">
          ← Volver a evaluaciones
        </Link>
        <h1 className="text-xl font-extrabold text-text sm:text-2xl">{evaluacion.titulo}</h1>
        <span className="text-[11.5px] font-semibold text-text-faint">{evaluacion.tipo ?? "Sin tipo"}</span>
      </div>

      <EvaluacionEditor evaluacionId={id} initialContenido={contenido} />
    </div>
  );
}

// Guards against pre-existing rows whose `contenido` predates this shape
// (e.g. leftover from the old preguntas prearmadas scheme) so a malformed or
// partial JSON blob can't crash the canvas.
function parseContenido(raw: string | null): EvaluacionContenido | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.texto !== "string") return null;
    return {
      texto: parsed.texto,
      estado: parsed.estado === "sugerencia" || parsed.estado === "aprobado" ? parsed.estado : "editado",
      chat: Array.isArray(parsed.chat) ? parsed.chat : [],
    };
  } catch {
    return null;
  }
}
