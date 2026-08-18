-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "EstadoPaso" AS ENUM ('PENDIENTE', 'EN_PROGRESO', 'COMPLETADO');

-- CreateEnum
CREATE TYPE "EstadoPlanificacion" AS ENUM ('BORRADOR', 'EN_PROGRESO', 'FINALIZADA');

-- CreateEnum
CREATE TYPE "RolColaborador" AS ENUM ('EDITOR', 'VISOR');

-- CreateEnum
CREATE TYPE "EstadoInvitacion" AS ENUM ('PENDIENTE', 'ACEPTADA');

-- CreateEnum
CREATE TYPE "EstadoDocumento" AS ENUM ('PROCESANDO', 'PROCESADO', 'ERROR');

-- CreateEnum
CREATE TYPE "AlcanceFeriado" AS ENUM ('NACIONAL', 'PROVINCIAL');

-- CreateTable
CREATE TABLE "Docente" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "edad" INTEGER,
    "fotoUrl" TEXT,
    "provincia" TEXT,
    "modalidad" TEXT,
    "materias" TEXT,
    "consintioPrivacidadEn" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Docente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Planificacion" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "docenteId" TEXT NOT NULL,
    "materia" TEXT,
    "curso" TEXT,
    "provincia" TEXT,
    "modalidad" TEXT,
    "contextoLibre" TEXT,
    "paso1Estado" "EstadoPaso" NOT NULL DEFAULT 'PENDIENTE',
    "objetivosContenidos" TEXT,
    "paso2Estado" "EstadoPaso" NOT NULL DEFAULT 'PENDIENTE',
    "metodologiaActividades" TEXT,
    "paso3Estado" "EstadoPaso" NOT NULL DEFAULT 'PENDIENTE',
    "instrumentoEvaluacion" TEXT,
    "coherenciaReporte" TEXT,
    "paso4Estado" "EstadoPaso" NOT NULL DEFAULT 'PENDIENTE',
    "resultadoFinal" TEXT,
    "estado" "EstadoPlanificacion" NOT NULL DEFAULT 'BORRADOR',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Planificacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanCollaborator" (
    "id" TEXT NOT NULL,
    "planificacionId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "docenteId" TEXT,
    "rol" "RolColaborador" NOT NULL DEFAULT 'VISOR',
    "estado" "EstadoInvitacion" NOT NULL DEFAULT 'PENDIENTE',
    "token" TEXT NOT NULL,
    "invitadoPorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanCollaborator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanActivity" (
    "id" TEXT NOT NULL,
    "planificacionId" TEXT NOT NULL,
    "docenteId" TEXT NOT NULL,
    "paso" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Documento" (
    "id" TEXT NOT NULL,
    "docenteId" TEXT NOT NULL,
    "planificacionId" TEXT,
    "nombreArchivo" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "clasificacion" TEXT,
    "estado" "EstadoDocumento" NOT NULL DEFAULT 'PROCESANDO',
    "textoExtraido" TEXT,
    "errorMensaje" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Documento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evaluacion" (
    "id" TEXT NOT NULL,
    "docenteId" TEXT NOT NULL,
    "planificacionId" TEXT,
    "titulo" TEXT NOT NULL,
    "tipo" TEXT,
    "contenido" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Evaluacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemBanco" (
    "id" TEXT NOT NULL,
    "docenteId" TEXT NOT NULL,
    "evaluacionId" TEXT,
    "enunciado" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "opciones" TEXT,
    "respuestaCorrecta" TEXT,
    "tema" TEXT,
    "dificultad" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ItemBanco_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recurso" (
    "id" TEXT NOT NULL,
    "docenteId" TEXT NOT NULL,
    "planificacionId" TEXT,
    "titulo" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "url" TEXT,
    "storagePath" TEXT,
    "descripcion" TEXT,
    "tags" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Recurso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventoCalendario" (
    "id" TEXT NOT NULL,
    "docenteId" TEXT NOT NULL,
    "planificacionId" TEXT,
    "titulo" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "tipo" TEXT NOT NULL,
    "descripcion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventoCalendario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feriado" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "nombre" TEXT NOT NULL,
    "alcance" "AlcanceFeriado" NOT NULL,
    "provincia" TEXT,
    "anio" INTEGER NOT NULL,

    CONSTRAINT "Feriado_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Docente_email_key" ON "Docente"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PlanCollaborator_token_key" ON "PlanCollaborator"("token");

-- CreateIndex
CREATE UNIQUE INDEX "PlanCollaborator_planificacionId_email_key" ON "PlanCollaborator"("planificacionId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "Feriado_fecha_provincia_key" ON "Feriado"("fecha", "provincia");

-- AddForeignKey
ALTER TABLE "Planificacion" ADD CONSTRAINT "Planificacion_docenteId_fkey" FOREIGN KEY ("docenteId") REFERENCES "Docente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanCollaborator" ADD CONSTRAINT "PlanCollaborator_planificacionId_fkey" FOREIGN KEY ("planificacionId") REFERENCES "Planificacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanCollaborator" ADD CONSTRAINT "PlanCollaborator_docenteId_fkey" FOREIGN KEY ("docenteId") REFERENCES "Docente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanCollaborator" ADD CONSTRAINT "PlanCollaborator_invitadoPorId_fkey" FOREIGN KEY ("invitadoPorId") REFERENCES "Docente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanActivity" ADD CONSTRAINT "PlanActivity_planificacionId_fkey" FOREIGN KEY ("planificacionId") REFERENCES "Planificacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanActivity" ADD CONSTRAINT "PlanActivity_docenteId_fkey" FOREIGN KEY ("docenteId") REFERENCES "Docente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_docenteId_fkey" FOREIGN KEY ("docenteId") REFERENCES "Docente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_planificacionId_fkey" FOREIGN KEY ("planificacionId") REFERENCES "Planificacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluacion" ADD CONSTRAINT "Evaluacion_docenteId_fkey" FOREIGN KEY ("docenteId") REFERENCES "Docente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluacion" ADD CONSTRAINT "Evaluacion_planificacionId_fkey" FOREIGN KEY ("planificacionId") REFERENCES "Planificacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemBanco" ADD CONSTRAINT "ItemBanco_docenteId_fkey" FOREIGN KEY ("docenteId") REFERENCES "Docente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemBanco" ADD CONSTRAINT "ItemBanco_evaluacionId_fkey" FOREIGN KEY ("evaluacionId") REFERENCES "Evaluacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recurso" ADD CONSTRAINT "Recurso_docenteId_fkey" FOREIGN KEY ("docenteId") REFERENCES "Docente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recurso" ADD CONSTRAINT "Recurso_planificacionId_fkey" FOREIGN KEY ("planificacionId") REFERENCES "Planificacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoCalendario" ADD CONSTRAINT "EventoCalendario_docenteId_fkey" FOREIGN KEY ("docenteId") REFERENCES "Docente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoCalendario" ADD CONSTRAINT "EventoCalendario_planificacionId_fkey" FOREIGN KEY ("planificacionId") REFERENCES "Planificacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

