-- CreateTable
CREATE TABLE "Docente" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "edad" INTEGER,
    "fotoUrl" TEXT,
    "provincia" TEXT,
    "modalidad" TEXT,
    "materias" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Planificacion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titulo" TEXT NOT NULL,
    "docenteId" TEXT NOT NULL,
    "materia" TEXT,
    "curso" TEXT,
    "provincia" TEXT,
    "modalidad" TEXT,
    "contextoLibre" TEXT,
    "paso1Estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "objetivosContenidos" TEXT,
    "paso2Estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "metodologiaActividades" TEXT,
    "paso3Estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "instrumentoEvaluacion" TEXT,
    "coherenciaReporte" TEXT,
    "paso4Estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "resultadoFinal" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'BORRADOR',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Planificacion_docenteId_fkey" FOREIGN KEY ("docenteId") REFERENCES "Docente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PlanCollaborator" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "planificacionId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "docenteId" TEXT,
    "rol" TEXT NOT NULL DEFAULT 'VISOR',
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "token" TEXT NOT NULL,
    "invitadoPorId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PlanCollaborator_planificacionId_fkey" FOREIGN KEY ("planificacionId") REFERENCES "Planificacion" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PlanCollaborator_docenteId_fkey" FOREIGN KEY ("docenteId") REFERENCES "Docente" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PlanCollaborator_invitadoPorId_fkey" FOREIGN KEY ("invitadoPorId") REFERENCES "Docente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PlanActivity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "planificacionId" TEXT NOT NULL,
    "docenteId" TEXT NOT NULL,
    "paso" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PlanActivity_planificacionId_fkey" FOREIGN KEY ("planificacionId") REFERENCES "Planificacion" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PlanActivity_docenteId_fkey" FOREIGN KEY ("docenteId") REFERENCES "Docente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Documento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "docenteId" TEXT NOT NULL,
    "planificacionId" TEXT,
    "nombreArchivo" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "clasificacion" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'PROCESANDO',
    "textoExtraido" TEXT,
    "errorMensaje" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Documento_docenteId_fkey" FOREIGN KEY ("docenteId") REFERENCES "Docente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Documento_planificacionId_fkey" FOREIGN KEY ("planificacionId") REFERENCES "Planificacion" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Evaluacion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "docenteId" TEXT NOT NULL,
    "planificacionId" TEXT,
    "titulo" TEXT NOT NULL,
    "tipo" TEXT,
    "contenido" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Evaluacion_docenteId_fkey" FOREIGN KEY ("docenteId") REFERENCES "Docente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Evaluacion_planificacionId_fkey" FOREIGN KEY ("planificacionId") REFERENCES "Planificacion" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ItemBanco" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "docenteId" TEXT NOT NULL,
    "evaluacionId" TEXT,
    "enunciado" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "opciones" TEXT,
    "respuestaCorrecta" TEXT,
    "tema" TEXT,
    "dificultad" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ItemBanco_docenteId_fkey" FOREIGN KEY ("docenteId") REFERENCES "Docente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ItemBanco_evaluacionId_fkey" FOREIGN KEY ("evaluacionId") REFERENCES "Evaluacion" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Recurso" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "docenteId" TEXT NOT NULL,
    "planificacionId" TEXT,
    "titulo" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "url" TEXT,
    "storagePath" TEXT,
    "descripcion" TEXT,
    "tags" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Recurso_docenteId_fkey" FOREIGN KEY ("docenteId") REFERENCES "Docente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Recurso_planificacionId_fkey" FOREIGN KEY ("planificacionId") REFERENCES "Planificacion" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EventoCalendario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "docenteId" TEXT NOT NULL,
    "planificacionId" TEXT,
    "titulo" TEXT NOT NULL,
    "fecha" DATETIME NOT NULL,
    "tipo" TEXT NOT NULL,
    "descripcion" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EventoCalendario_docenteId_fkey" FOREIGN KEY ("docenteId") REFERENCES "Docente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EventoCalendario_planificacionId_fkey" FOREIGN KEY ("planificacionId") REFERENCES "Planificacion" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Feriado" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fecha" DATETIME NOT NULL,
    "nombre" TEXT NOT NULL,
    "alcance" TEXT NOT NULL,
    "provincia" TEXT,
    "anio" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Docente_email_key" ON "Docente"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PlanCollaborator_token_key" ON "PlanCollaborator"("token");

-- CreateIndex
CREATE UNIQUE INDEX "PlanCollaborator_planificacionId_email_key" ON "PlanCollaborator"("planificacionId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "Feriado_fecha_provincia_key" ON "Feriado"("fecha", "provincia");
