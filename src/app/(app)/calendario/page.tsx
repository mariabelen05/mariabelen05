import Link from "next/link";
import { requireDocente } from "@/lib/actions/session-actions";
import { prisma } from "@/lib/prisma";
import { crearEvento } from "@/lib/actions/calendario-actions";
import { EventoRow } from "./evento-row";
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon } from "@/components/icons";

const DIAS = ["L", "M", "M", "J", "V", "S", "D"];
const TIPO_COLOR: Record<string, string> = {
  clase: "bg-primary",
  entrega: "bg-accent",
  evaluacion: "bg-purple",
  reunion: "bg-success",
  otro: "bg-text-faint",
};

function buildMonthGrid(year: number, month: number) {
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array(startOffset).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const docente = await requireDocente();
  const { mes } = await searchParams;

  const now = new Date();
  const [year, month] = mes
    ? mes.split("-").map(Number)
    : [now.getFullYear(), now.getMonth() + 1];
  const monthIndex = month - 1;

  const inicioMes = new Date(year, monthIndex, 1);
  const finMes = new Date(year, monthIndex + 1, 1);
  const mesAnterior = new Date(year, monthIndex - 1, 1);
  const mesSiguiente = new Date(year, monthIndex + 1, 1);

  const [feriados, eventos, planificaciones] = await Promise.all([
    prisma.feriado.findMany({
      where: {
        fecha: { gte: inicioMes, lt: finMes },
        OR: [{ alcance: "NACIONAL" }, { provincia: docente.provincia ?? "__none__" }],
      },
      orderBy: { fecha: "asc" },
    }),
    prisma.eventoCalendario.findMany({
      where: { docenteId: docente.id, fecha: { gte: inicioMes, lt: finMes } },
      orderBy: { fecha: "asc" },
    }),
    prisma.planificacion.findMany({
      where: { docenteId: docente.id },
      select: { id: true, titulo: true },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const feriadosPorDia = new Map<number, string[]>();
  feriados.forEach((f) => {
    const d = f.fecha.getUTCDate();
    feriadosPorDia.set(d, [...(feriadosPorDia.get(d) ?? []), f.nombre]);
  });
  const eventosPorDia = new Map<number, typeof eventos>();
  eventos.forEach((e) => {
    const d = e.fecha.getUTCDate();
    eventosPorDia.set(d, [...(eventosPorDia.get(d) ?? []), e]);
  });

  const grid = buildMonthGrid(year, monthIndex);
  const monthLabel = inicioMes.toLocaleDateString("es-AR", { month: "long", year: "numeric" });
  const isToday = (d: number) =>
    d === now.getDate() && monthIndex === now.getMonth() && year === now.getFullYear();

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <div className="flex min-w-0 flex-1 flex-col gap-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold capitalize text-text">{monthLabel}</h1>
            <p className="text-sm text-text-faint">
              Feriados nacionales{docente.provincia ? ` y de ${docente.provincia}` : ""} + tus actividades.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/calendario?mes=${mesAnterior.getFullYear()}-${String(mesAnterior.getMonth() + 1).padStart(2, "0")}`}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card"
            >
              <ChevronLeftIcon className="h-3.5 w-3.5 text-text-faint" />
            </Link>
            <Link
              href={`/calendario?mes=${mesSiguiente.getFullYear()}-${String(mesSiguiente.getMonth() + 1).padStart(2, "0")}`}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card"
            >
              <ChevronRightIcon className="h-3.5 w-3.5 text-text-faint" />
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-text-faint">
            {DIAS.map((d, i) => <div key={i}>{d}</div>)}
          </div>
          <div className="mt-2 grid grid-cols-7 gap-2">
            {grid.map((d, i) => (
              <div
                key={i}
                className={`flex min-h-[74px] flex-col gap-1 rounded-xl p-1.5 text-xs ${
                  d && isToday(d) ? "bg-primary-soft" : "bg-surface"
                } ${!d ? "opacity-0" : ""}`}
              >
                <span className={`font-bold ${d && isToday(d) ? "text-primary" : "text-text"}`}>{d}</span>
                {d && feriadosPorDia.get(d)?.map((n, j) => (
                  <span key={j} className="truncate rounded bg-warning-soft px-1 py-0.5 text-[9.5px] font-bold text-warning" title={n}>
                    {n}
                  </span>
                ))}
                {d && eventosPorDia.get(d)?.map((e) => (
                  <span key={e.id} className={`truncate rounded px-1 py-0.5 text-[9.5px] font-bold text-white ${TIPO_COLOR[e.tipo] ?? TIPO_COLOR.otro}`} title={e.titulo}>
                    {e.titulo}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <h2 className="text-sm font-extrabold text-text">Actividades del mes</h2>
          {eventos.length === 0 ? (
            <p className="text-sm text-text-faint">No cargaste actividades para este mes.</p>
          ) : (
            eventos.map((e) => <EventoRow key={e.id} evento={e} />)
          )}
        </div>
      </div>

      <div className="w-full lg:w-[300px] lg:shrink-0">
        <form action={crearEvento} className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-sm font-bold text-text">
            <CalendarIcon className="h-4 w-4 text-primary" /> Nueva actividad
          </div>
          <input name="titulo" required placeholder="Título" className="rounded-[10px] border border-border bg-surface px-3 py-2 text-[13px] outline-none focus:border-primary" />
          <input name="fecha" type="date" required className="rounded-[10px] border border-border bg-surface px-3 py-2 text-[13px] outline-none focus:border-primary" />
          <select name="tipo" className="rounded-[10px] border border-border bg-surface px-3 py-2 text-[13px]" defaultValue="clase">
            <option value="clase">Clase</option>
            <option value="entrega">Entrega</option>
            <option value="evaluacion">Evaluación</option>
            <option value="reunion">Reunión</option>
            <option value="otro">Otro</option>
          </select>
          <select name="planificacionId" className="rounded-[10px] border border-border bg-surface px-3 py-2 text-[13px]" defaultValue="">
            <option value="">Sin vincular a una planificación</option>
            {planificaciones.map((p) => (
              <option key={p.id} value={p.id}>{p.titulo}</option>
            ))}
          </select>
          <textarea name="descripcion" rows={2} placeholder="Notas (opcional)" className="resize-none rounded-[10px] border border-border bg-surface px-3 py-2 text-[13px] outline-none focus:border-primary" />
          <button type="submit" className="rounded-[10px] bg-primary px-4 py-2.5 text-[13px] font-bold text-white hover:bg-primary-hover">
            Agregar
          </button>
        </form>
      </div>
    </div>
  );
}
