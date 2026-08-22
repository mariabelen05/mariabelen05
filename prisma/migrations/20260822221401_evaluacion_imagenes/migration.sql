-- CreateTable
CREATE TABLE "EvaluacionImagen" (
    "id" TEXT NOT NULL,
    "evaluacionId" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvaluacionImagen_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "EvaluacionImagen" ADD CONSTRAINT "EvaluacionImagen_evaluacionId_fkey" FOREIGN KEY ("evaluacionId") REFERENCES "Evaluacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
