-- AlterTable
ALTER TABLE "Docente" ADD COLUMN     "institucion" TEXT,
ADD COLUMN     "localidad" TEXT;

-- AlterTable
ALTER TABLE "Planificacion" ADD COLUMN     "contextoGrupo" TEXT,
ADD COLUMN     "division" TEXT,
ADD COLUMN     "institucion" TEXT,
ADD COLUMN     "localidad" TEXT,
ADD COLUMN     "modo" TEXT;
