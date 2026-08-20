import Link from "next/link";
import { requireDocente } from "@/lib/actions/session-actions";
import { prisma } from "@/lib/prisma";
import {
  BookIcon, ChalkboardIcon, ClockIcon, UploadIcon, PlusIcon,
  CalendarIcon, CheckIcon, FileIcon, ChevronLeftIcon, ChevronRightIcon,
} from "@/components/icons";

const ESTADO_LABEL: Record<string, { label: string; fg: string; bg: string }> = {
  BORRADOR: { label: "Borrador", fg: "text-text-faint", bg: "bg-surface" },
  EN_PROGRESO: { label: "En curso", fg: "text-primary", bg: "bg-primary-soft" },
  FINALIZADA: { label: "Completa", fg: "text-success", bg: "bg-success-soft" },
};

const QUICK_ACCESS = [
  { title: "Planificación anual", subtitle: "Armá el plan del año completo.", bg: "bg-purple-soft", fg: "text-purple", Icon: BookIcon, href: "/planificaciones/nueva?tipo=anual" },
  { title: "Secuencia didáctica", subtitle: "Organizá una serie de clases.", bg: "bg-[#E3E9FC]", fg: "text-primary", Icon: ChalkboardIcon, href: "/planificaciones/nueva?tipo=secuencia" },
  { title: "Plan de clase", subtitle: "Preparás una clase puntual.", bg: "bg-[#FFE7DB]", fg: "text-accent", Icon: ClockIcon, href: "/planificaciones/nueva?tipo=clase" },
  { title: "Cargar documento", subtitle: "Sumá normativa o programa.", bg: "bg-purple-soft", fg: "text-purple", Icon: UploadIcon, href: "/documentos" },
];

function buildMonthGrid(year: number, month: number, marked: Set<number>, today: number) {
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7; // Monday-first
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array(startOffset).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells.map((n) => ({
    n,
    isToday: n === today,
    isMarked: n !== null && marked.has(n),
  }));
}

export default async function DashboardPage() {
  const docente = await requireDocente();
  const now = new Date();

  const [planes, totalPlanes, proximosEventos, feriadosMes, eventosMes] = await Promise.all([
    prisma.planificacion.findMany({
      where: { OR: [{ docenteId: docente.id }, { colaboradores: { some: { docenteId: docente.id } } }] },
      orderBy: { updatedAt: "desc" },
      take: 3,
    }),
    prisma.planificacion.count({
      where: { OR: [{ docenteId: docente.id }, { colaboradores: { some: { docenteId: docente.id } } }] },
    }),
    prisma.eventoCalendario.findMany({
      where: { docenteId: docente.id, fecha: { gte: now } },
      orderBy: { fecha: "asc" },
      take: 4,
    }),
    prisma.feriado.findMany({
      where: {
        fecha: { gte: new Date(now.getFullYear(), now.getMonth(), 1), lt: new Date(now.getFullYear(), now.getMonth() + 1, 1) },
        OR: [{ alcance: "NACIONAL" }, { provincia: docente.provincia ?? "__none__" }],
      },
    }),
    prisma.eventoCalendario.findMany({
      where: {
        docenteId: docente.id,
        fecha: { gte: new Date(now.getFullYear(), now.getMonth(), 1), lt: new Date(now.getFullYear(), now.getMonth() + 1, 1) },
      },
    }),
  ]);

  const marked = new Set<number>([
    ...feriadosMes.map((f) => f.fecha.getUTCDate()),
    ...eventosMes.map((e) => e.fecha.getUTCDate()),
  ]);
  const monthGrid = buildMonthGrid(now.getFullYear(), now.getMonth(), marked, now.getDate());
  const monthLabel = now.toLocaleDateString("es-AR", { month: "long", year: "numeric" });
  const primerNombre = docente.nombre.split(" ")[0];

  return (
    <div className="flex flex-col gap-7 lg:flex-row lg:items-start">
      <div className="flex min-w-0 flex-1 flex-col gap-7">
        <div className="relative overflow-hidden rounded-[20px] bg-primary p-7 sm:p-9">
          <div className="relative z-10 flex flex-col gap-3">
            <div className="text-2xl font-extrabold text-white">Hola, {primerNombre} 👋</div>
            <div className="max-w-md text-[14.5px] leading-relaxed text-[#DCE3FA]">
              Este es tu espacio de trabajo: armá, organizá y seguí tus planificaciones cuando quieras.
            </div>
            <Link
              href="/planificaciones/nueva"
              className="mt-2 flex w-fit items-center gap-2 rounded-[11px] bg-white px-5 py-3 text-sm font-bold text-primary transition hover:bg-[#EEF1FD]"
            >
              <PlusIcon className="h-4 w-4" />
              Nueva planificación
            </Link>
          </div>
          <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-[#4A6DE5] opacity-50" />
        </div>

        <div className="flex flex-col gap-3.5">
          <div className="text-base font-extrabold text-text">Accesos rápidos</div>
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5">
            {QUICK_ACCESS.map((q) => (
              <Link
                key={q.title}
                href={q.href}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4"
              >
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${q.bg} ${q.fg}`}>
                  <q.Icon className="h-5 w-5" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <div className="text-[13.5px] font-bold text-text">{q.title}</div>
                  <div className="text-xs leading-snug text-text-faint">{q.subtitle}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3.5">
          <div className="flex items-center justify-between">
            <div className="text-base font-extrabold text-text">Tus planificaciones</div>
            {totalPlanes > 0 && (
              <Link href="/planificaciones" className="text-[13px] font-bold text-primary">
                Ver todas
              </Link>
            )}
          </div>

          {planes.length === 0 ? (
            <Link
              href="/planificaciones/nueva"
              className="flex flex-col items-center justify-center gap-3.5 rounded-2xl border-[1.5px] border-dashed border-[#D9D7F0] bg-card px-6 py-12 text-center"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-[13px] bg-purple-soft text-purple">
                <PlusIcon className="h-[22px] w-[22px]" />
              </div>
              <div className="text-[14.5px] font-bold text-text">Creá tu primera planificación</div>
            </Link>
          ) : (
            <div className="flex flex-col gap-2.5">
              {planes.map((p) => {
                const estado = ESTADO_LABEL[p.estado];
                return (
                  <Link
                    key={p.id}
                    href={`/planificaciones/${p.id}`}
                    className="flex items-center gap-3.5 rounded-2xl border border-border bg-card p-4"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-soft text-purple">
                      <ChalkboardIcon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13.5px] font-bold text-text">{p.titulo}</div>
                      <div className="text-xs text-text-faint">
                        {p.materia ?? "Sin materia"} {p.curso ? `— ${p.curso}` : ""}
                      </div>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${estado.fg} ${estado.bg}`}>
                      {estado.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="flex w-full flex-col gap-5 lg:w-[296px] lg:shrink-0">
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-[18px]">
          <div className="flex items-center justify-between">
            <div className="text-[13.5px] font-bold capitalize text-text">{monthLabel}</div>
            <div className="flex gap-1">
              <div className="flex h-[22px] w-[22px] items-center justify-center rounded-[7px] bg-surface">
                <ChevronLeftIcon className="h-2.5 w-2.5 text-text-faint" />
              </div>
              <div className="flex h-[22px] w-[22px] items-center justify-center rounded-[7px] bg-surface">
                <ChevronRightIcon className="h-2.5 w-2.5 text-text-faint" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[10.5px] font-bold text-text-muted">
            {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
              <div key={i}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {monthGrid.map((c, i) => (
              <div
                key={i}
                className={`flex aspect-square items-center justify-center rounded-lg text-[11.5px] ${
                  c.isToday
                    ? "bg-primary font-extrabold text-white"
                    : c.isMarked
                    ? "bg-primary-soft font-semibold text-primary"
                    : "font-medium text-text-faint"
                }`}
              >
                {c.n ?? ""}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3.5 rounded-2xl border border-border bg-card p-[18px]">
          <div className="text-[13.5px] font-bold text-text">Próximas actividades</div>
          {proximosEventos.length === 0 ? (
            <p className="text-xs text-text-faint">No tenés actividades cargadas todavía.</p>
          ) : (
            proximosEventos.map((act) => (
              <div key={act.id} className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-primary-soft text-primary">
                  {act.tipo === "evaluacion" ? <CheckIcon className="h-4 w-4" /> : act.tipo === "entrega" ? <FileIcon className="h-4 w-4" /> : <CalendarIcon className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[12.5px] font-bold text-text">{act.titulo}</div>
                  <div className="text-[11px] text-text-faint">
                    {act.fecha.toLocaleDateString("es-AR", { day: "numeric", month: "short" })}
                  </div>
                </div>
                <Link href="/calendario" className="shrink-0 text-[11.5px] font-bold text-primary">
                  Ver
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
