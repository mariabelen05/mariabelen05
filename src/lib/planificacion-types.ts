// Shared shapes for the 4-step planning wizard's JSON content columns.
// Every AI-generated field carries estado: "sugerencia" until the teacher
// edits or explicitly approves it — never presented as a taken decision.

export type EstadoContenido = "sugerencia" | "aprobado" | "editado";

export type ChatMensaje = { from: "user" | "aulera"; texto: string };

export type ObjetivosContenidos = {
  objetivoGeneral: { texto: string; estado: EstadoContenido };
  objetivosEspecificos: { id: string; texto: string; estado: EstadoContenido }[];
  unidadesContenido: {
    id: string;
    titulo: string;
    tag: "Conceptual" | "Procedimental" | "Actitudinal";
    subtemas: { id: string; texto: string }[];
  }[];
  fuente: { basadoEnDocumentos: boolean; nota: string };
  chat: ChatMensaje[];
};

export type Actividad = {
  titulo: string;
  tipo: string;
  objetivo: string;
  duracion: string;
  consigna: string;
  modalidad: string;
  recursos: string;
  resultadoEsperado: string;
};

export type MetodologiaActividades = {
  recursosDisponibles: string[];
  metodologia: { texto: string; motivo: string; estado: EstadoContenido };
  actividades: { inicio: Actividad; desarrollo: Actividad; cierre: Actividad };
  chat: ChatMensaje[];
};

export type InstrumentoEvaluacion = {
  tiposEvaluacion: string[];
  instrumento: { texto: string; motivo: string; estado: EstadoContenido };
  criterios: string[];
  chat: ChatMensaje[];
};

export type CoherenciaReporte = {
  cadena: {
    clave: "contenidos" | "objetivos" | "actividades" | "evidencias" | "evaluacion";
    label: string;
    estado: "ok" | "warning";
    detalle: string;
  }[];
  advertencias: { titulo: string; descripcion: string }[];
  generadoEn: string;
};

export type ResultadoFinal = {
  resumen: string;
  aprobadoEn: string;
};
