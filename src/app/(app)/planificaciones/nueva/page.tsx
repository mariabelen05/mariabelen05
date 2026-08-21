import { requireDocente } from "@/lib/actions/session-actions";
import { NuevaPlanificacionForm } from "./nueva-planificacion-form";

const PROVINCIAS = [
  "Buenos Aires", "CABA", "Catamarca", "Chaco", "Chubut", "Córdoba",
  "Corrientes", "Entre Ríos", "Formosa", "Jujuy", "La Pampa", "La Rioja",
  "Mendoza", "Misiones", "Neuquén", "Río Negro", "Salta", "San Juan",
  "San Luis", "Santa Cruz", "Santa Fe", "Santiago del Estero",
  "Tierra del Fuego", "Tucumán",
];

export default async function NuevaPlanificacionPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>;
}) {
  const { tipo } = await searchParams;
  const tipoLabel =
    tipo === "anual" ? "Planificación anual" : tipo === "secuencia" ? "Secuencia didáctica" : "Plan de clase";
  const docente = await requireDocente();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-bold uppercase tracking-wide text-primary">{tipoLabel}</span>
        <h1 className="text-2xl font-extrabold text-text">Nueva planificación</h1>
        <p className="text-sm text-text-faint">
          Contanos qué querés armar, en tus palabras. Aulera te va a proponer objetivos y contenidos
          en el paso siguiente — vos revisás y aprobás cada parte.
        </p>
      </div>

      <NuevaPlanificacionForm docente={docente} provincias={PROVINCIAS} />
    </div>
  );
}
