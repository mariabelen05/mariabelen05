// Manually-curated starter calendar for the current year (2026), per the
// brief: "si no hay una fuente de datos oficial fácil de integrar, para una
// primera versión alcanza con una tabla propia cargada a mano". This is NOT
// pulled from any official source and does NOT include every "puente
// turístico" decreed by the national government (those are usually
// announced the year before and would need to be updated by hand each year).
// See docs/calendario-feriados.md.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const NACIONALES_2026: { fecha: string; nombre: string }[] = [
  { fecha: "2026-01-01", nombre: "Año Nuevo" },
  { fecha: "2026-02-16", nombre: "Carnaval" },
  { fecha: "2026-02-17", nombre: "Carnaval" },
  { fecha: "2026-03-24", nombre: "Día Nacional de la Memoria por la Verdad y la Justicia" },
  { fecha: "2026-04-02", nombre: "Día del Veterano y de los Caídos en la Guerra de Malvinas" },
  { fecha: "2026-04-03", nombre: "Viernes Santo" },
  { fecha: "2026-05-01", nombre: "Día del Trabajador" },
  { fecha: "2026-05-25", nombre: "Día de la Revolución de Mayo" },
  { fecha: "2026-06-17", nombre: "Paso a la Inmortalidad del Gral. Martín Miguel de Güemes (observado)" },
  { fecha: "2026-06-20", nombre: "Día de la Bandera" },
  { fecha: "2026-07-09", nombre: "Día de la Independencia" },
  { fecha: "2026-08-17", nombre: "Paso a la Inmortalidad del Gral. José de San Martín" },
  { fecha: "2026-10-12", nombre: "Día del Respeto a la Diversidad Cultural" },
  { fecha: "2026-11-20", nombre: "Día de la Soberanía Nacional" },
  { fecha: "2026-12-08", nombre: "Inmaculada Concepción de María" },
  { fecha: "2026-12-25", nombre: "Navidad" },
];

// Illustrative only — each province has its own set and this needs to be
// completed by hand for the provinces actual users teach in.
const PROVINCIALES_2026: { fecha: string; nombre: string; provincia: string }[] = [
  { fecha: "2026-06-10", nombre: "Día de la Afirmación de los Derechos Argentinos sobre Malvinas (feriado provincial Tierra del Fuego)", provincia: "Tierra del Fuego" },
  { fecha: "2026-07-06", nombre: "Fundación de la ciudad de Córdoba (asueto administrativo)", provincia: "Córdoba" },
  { fecha: "2026-11-07", nombre: "Día de la Tradición", provincia: "Buenos Aires" },
];

async function main() {
  for (const f of NACIONALES_2026) {
    // SQLite treats NULL as distinct in unique constraints, so a compound
    // upsert on a null provincia can't reliably match — find-then-write instead.
    const existing = await prisma.feriado.findFirst({ where: { fecha: new Date(f.fecha), provincia: null } });
    if (existing) {
      await prisma.feriado.update({ where: { id: existing.id }, data: { nombre: f.nombre } });
    } else {
      await prisma.feriado.create({
        data: { fecha: new Date(f.fecha), nombre: f.nombre, alcance: "NACIONAL", provincia: null, anio: 2026 },
      });
    }
  }

  for (const f of PROVINCIALES_2026) {
    await prisma.feriado.upsert({
      where: { fecha_provincia: { fecha: new Date(f.fecha), provincia: f.provincia } },
      update: { nombre: f.nombre },
      create: { fecha: new Date(f.fecha), nombre: f.nombre, alcance: "PROVINCIAL", provincia: f.provincia, anio: 2026 },
    });
  }

  console.log(`Sembrados ${NACIONALES_2026.length} feriados nacionales y ${PROVINCIALES_2026.length} provinciales (2026).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
