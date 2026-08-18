import type {
  ObjetivosContenidos, MetodologiaActividades, InstrumentoEvaluacion, CoherenciaReporte,
} from "@/lib/planificacion-types";

export type PlanExportData = {
  titulo: string;
  materia: string | null;
  curso: string | null;
  provincia: string | null;
  docenteNombre: string;
  objetivos: ObjetivosContenidos;
  metodologia: MetodologiaActividades;
  evaluacion: InstrumentoEvaluacion;
  coherencia: CoherenciaReporte | null;
};

export function planSections(d: PlanExportData) {
  const bloques: { key: "inicio" | "desarrollo" | "cierre"; label: string }[] = [
    { key: "inicio", label: "Inicio" },
    { key: "desarrollo", label: "Desarrollo" },
    { key: "cierre", label: "Cierre" },
  ];

  return {
    encabezado: [
      d.titulo,
      [d.materia, d.curso, d.provincia].filter(Boolean).join(" · "),
      `Docente: ${d.docenteNombre}`,
    ],
    objetivoGeneral: d.objetivos.objetivoGeneral.texto,
    objetivosEspecificos: d.objetivos.objetivosEspecificos.map((o) => o.texto),
    unidades: d.objetivos.unidadesContenido.map((u) => ({
      titulo: `${u.titulo} (${u.tag})`,
      subtemas: u.subtemas.map((s) => s.texto),
    })),
    metodologia: d.metodologia.metodologia.texto,
    actividades: bloques.map(({ key, label }) => {
      const a = d.metodologia.actividades[key];
      return {
        label,
        lineas: [
          `Tipo: ${a.tipo}`,
          `Duración: ${a.duracion}`,
          `Objetivo: ${a.objetivo}`,
          `Consigna: ${a.consigna}`,
          `Modalidad: ${a.modalidad}`,
          `Recursos: ${a.recursos}`,
          `Resultado esperado: ${a.resultadoEsperado}`,
        ],
      };
    }),
    instrumento: d.evaluacion.instrumento.texto,
    criterios: d.evaluacion.criterios,
    coherencia: d.coherencia?.advertencias.map((a) => `${a.titulo}: ${a.descripcion}`) ?? [],
  };
}
