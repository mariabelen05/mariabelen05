"use client";

import { useState } from "react";
import Link from "next/link";
import { crearPlanificacion } from "@/lib/actions/planificacion-actions";
import { BookIcon, UserIcon, ChevronLeftIcon, SparkleIcon } from "@/components/icons";
import { FloatingPanel } from "@/components/ui/floating-panel";
import type { Docente } from "@prisma/client";

type Modo = "institucion" | "independiente";

export function NuevaPlanificacionForm({
  docente,
  provincias,
}: {
  docente: Docente;
  provincias: string[];
}) {
  const [modo, setModo] = useState<Modo | null>(null);

  if (!modo) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <ModoCard
          icon={<BookIcon className="h-5 w-5" />}
          titulo="Institución"
          descripcion="Trabajás en una escuela u organización. Usamos los datos de tu Ficha institucional como membrete."
          onClick={() => setModo("institucion")}
        />
        <ModoCard
          icon={<UserIcon className="h-5 w-5" />}
          titulo="Independiente"
          descripcion="Das clases particulares o no querés asociar esta planificación a una institución."
          onClick={() => setModo("independiente")}
        />
      </div>
    );
  }

  const fichaCompleta = Boolean(docente.institucion && docente.provincia && docente.localidad);
  const esEspecial = docente.modalidad === "especial";

  return (
    <FloatingPanel.Root>
      <form action={crearPlanificacion} className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-6">
        <input type="hidden" name="modo" value={modo} />

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setModo(null)}
            className="flex w-fit items-center gap-1 text-xs font-bold text-text-faint hover:text-primary"
          >
            <ChevronLeftIcon className="h-3 w-3" /> Cambiar modo
          </button>

          <FloatingPanel.Trigger className="flex items-center gap-2 rounded-full border border-purple/30 bg-purple-soft px-4 py-2 text-xs font-bold text-purple hover:bg-purple/15">
            <SparkleIcon className="h-3.5 w-3.5" />
            Ideas para escribir
          </FloatingPanel.Trigger>
        </div>

        {modo === "institucion" && (
          <FichaMembrete docente={docente} provincias={provincias} fichaCompleta={fichaCompleta} />
        )}

        {/* Encabezado tipo documento: título grande + metadatos en línea, en vez de un
            formulario apilado — da lugar al canvas de escritura libre de abajo. */}
        <div className="flex flex-col gap-3 border-b border-border-soft pb-4">
          <input
            name="titulo"
            required
            placeholder="Título de la planificación"
            className="w-full border-none bg-transparent text-2xl font-extrabold text-text outline-none placeholder:text-text-faint/60"
          />
          <div className="flex flex-wrap gap-2">
            <input
              name="materia"
              placeholder="Materia"
              className="rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-semibold text-text outline-none focus:border-primary"
            />
            <input
              name="curso"
              placeholder="Curso / año"
              className="rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-semibold text-text outline-none focus:border-primary"
            />
            {modo === "institucion" && (
              <input
                name="division"
                placeholder="División"
                className="w-24 rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-semibold text-text outline-none focus:border-primary"
              />
            )}
          </div>
        </div>

        {/* Canvas de escritura libre — reemplaza el textarea de formulario por una
            superficie tipo hoja en blanco; sigue mapeando a contextoLibre. */}
        <label className="flex flex-col gap-2">
          <span className="text-[13px] font-semibold text-text">
            ¿Qué querés que aprendan tus estudiantes?
          </span>
          <textarea
            name="contextoLibre"
            required
            rows={12}
            placeholder="Escribí acá, con tus palabras, lo que tenés en mente para esta clase — objetivos, ideas, contenidos que quieras cubrir. No hace falta que esté ordenado."
            className="min-h-[320px] resize-y rounded-2xl border border-border bg-surface px-5 py-4 text-[15px] leading-relaxed outline-none focus:border-primary"
          />
          <span className="text-xs text-text-faint">
            Escribí libremente — el asistente queda disponible como apoyo opcional (botón &quot;Ideas
            para escribir&quot;), no te va a proponer contenido antes de que vos escribas el tuyo.
          </span>
        </label>

        {esEspecial && (
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-semibold text-text">
              ¿Hay algo del grupo que quieras que Aulera tenga en cuenta al proponer contenidos y actividades?
            </span>
            <textarea
              name="contextoGrupo"
              rows={3}
              placeholder="Contalo en tus propias palabras — por ejemplo, ritmos de trabajo distintos, qué suele funcionar bien, qué evitar."
              className="resize-none rounded-[11px] border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary"
            />
            <span className="text-xs text-text-faint">
              Opcional. Aulera no pide ni infiere diagnósticos — solo usa lo que compartís acá, en
              lenguaje pedagógico común.
            </span>
          </label>
        )}

        <button
          type="submit"
          className="mt-2 w-fit rounded-[11px] bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary-hover"
        >
          Continuar al paso 1
        </button>
      </form>

      <FloatingPanel.Content title="Ideas para escribir">
        <p className="mb-3 text-xs text-text-faint">
          Preguntas para ayudarte a arrancar — no generan contenido por vos, son solo para pensar en
          voz alta mientras escribís en el canvas.
        </p>
        <ul className="flex flex-col gap-2.5 text-[13px] text-text">
          <li className="rounded-xl bg-surface px-3.5 py-2.5">
            ¿Qué tienen que poder hacer o entender al terminar la clase?
          </li>
          <li className="rounded-xl bg-surface px-3.5 py-2.5">
            ¿Hay algo de lo que ya vieron que se conecta con este tema?
          </li>
          <li className="rounded-xl bg-surface px-3.5 py-2.5">
            ¿Qué actividad o ejemplo te parece que suele funcionar bien con este grupo?
          </li>
          <li className="rounded-xl bg-surface px-3.5 py-2.5">
            ¿Cómo te gustaría comprobar que aprendieron?
          </li>
        </ul>
      </FloatingPanel.Content>
    </FloatingPanel.Root>
  );
}

function ModoCard({
  icon,
  titulo,
  descripcion,
  onClick,
}: {
  icon: React.ReactNode;
  titulo: string;
  descripcion: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-5 text-left hover:border-primary hover:bg-primary-soft/40"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-soft text-purple">
        {icon}
      </div>
      <div className="text-sm font-extrabold text-text">{titulo}</div>
      <p className="text-xs text-text-faint">{descripcion}</p>
    </button>
  );
}

function FichaMembrete({
  docente,
  provincias,
  fichaCompleta,
}: {
  docente: Docente;
  provincias: string[];
  fichaCompleta: boolean;
}) {
  if (fichaCompleta) {
    return (
      <div className="flex flex-col gap-1 rounded-xl bg-surface p-4">
        <div className="text-[11px] font-bold uppercase tracking-wide text-text-faint">
          Datos de tu institución (desde tu Ficha)
        </div>
        <div className="text-sm font-semibold text-text">
          {docente.institucion} · {docente.localidad}, {docente.provincia}
        </div>
        <Link href="/perfil" className="w-fit text-xs font-bold text-primary hover:text-primary-hover">
          Editar en Mi perfil →
        </Link>
        <input type="hidden" name="institucion" value={docente.institucion ?? ""} />
        <input type="hidden" name="provincia" value={docente.provincia ?? ""} />
        <input type="hidden" name="localidad" value={docente.localidad ?? ""} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-surface p-4">
      <div className="text-[11px] font-bold uppercase tracking-wide text-text-faint">
        Datos de tu institución
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-semibold text-text">Institución</span>
        <input
          name="institucion"
          defaultValue={docente.institucion ?? ""}
          placeholder="Escuela N.º 12 &quot;Manuel Belgrano&quot;"
          className="rounded-[11px] border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:border-primary"
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-text">Provincia</span>
          <select
            name="provincia"
            defaultValue={docente.provincia ?? ""}
            className="rounded-[11px] border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:border-primary"
          >
            <option value="">Sin especificar</option>
            {provincias.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-text">Localidad</span>
          <input
            name="localidad"
            defaultValue={docente.localidad ?? ""}
            placeholder="Bahía Blanca"
            className="rounded-[11px] border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:border-primary"
          />
        </label>
      </div>
      <label className="flex items-center gap-2 text-xs font-semibold text-text-faint">
        <input type="checkbox" name="guardarFicha" className="h-3.5 w-3.5" />
        Guardar en mi perfil para la próxima vez
      </label>
    </div>
  );
}
