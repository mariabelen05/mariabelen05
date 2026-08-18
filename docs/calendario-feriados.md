# Calendario de feriados

`prisma/seed.ts` carga a mano el calendario 2026: los 16 feriados nacionales
de fecha fija o fácilmente calculable, más 3 feriados provinciales de
ejemplo (Tierra del Fuego, Córdoba, Buenos Aires) para mostrar cómo funciona
el campo `provincia` en el modelo `Feriado`.

## Qué falta para producción

- **No hay integración con una fuente oficial.** El Ministerio del Interior
  publica los feriados nacionales por decreto, y suele incluir "días
  puente" que se deciden año a año — no están en este seed porque no hay una
  API pública estable para consultarlos automáticamente.
- **Los feriados provinciales están incompletos.** Cada una de las 24
  jurisdicciones tiene su propio calendario (fundación de la provincia,
  fiestas patronales, etc.). Solo se cargaron 3 como ejemplo.
- **Hay que repetir el seed cada año.** `Feriado.anio` existe para poder
  filtrar por año, pero cargar el año siguiente es trabajo manual: editar
  `prisma/seed.ts` y volver a correr `npm run db:seed`.

## Cómo completar el calendario de una jurisdicción

Editá `prisma/seed.ts`, agregá las fechas que falten al arreglo
correspondiente (`NACIONALES_2026` o `PROVINCIALES_2026`, o un array nuevo
para el año que corresponda) y corré:

```bash
npm run db:seed
```

El seed es idempotente: correrlo de nuevo actualiza los nombres de los
feriados existentes en vez de duplicarlos.
