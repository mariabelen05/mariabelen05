# Aulera

Planificaciones docentes asistidas por IA. Next.js (App Router) + Prisma +
Auth.js, con la API de Claude como el motor de generación pedagógica.

El diseño visual viene de un proyecto de Claude Design importado a este
repo; este README cubre todo lo que ese diseño no resuelve por sí solo
(base de datos, autenticación real, integración con la API de Claude,
extracción/OCR de documentos, exportación real a PDF/Word, co-planificación,
calendario de feriados y guardado offline).

## Puesta en marcha

La base es PostgreSQL (mismo motor que producción — sin esto no arranca
ninguna acción que toque la base). Para local, la forma más simple es
`docker compose up -d`; si preferís un Postgres ya instalado, andá directo
al segundo bloque.

```bash
npm install                   # el postinstall corre `prisma generate` solo
cp .env.example .env          # completá ANTHROPIC_API_KEY y un AUTH_SECRET propio
docker compose up -d          # levanta Postgres local en :5432 (o usá el tuyo)
npm run build                 # aplica el esquema (prisma migrate deploy) y build
npm run db:seed               # carga el calendario de feriados 2026
npm run dev
```

Abrí http://localhost:3000 — te redirige a `/registro` la primera vez.

### Variables de entorno (`.env`)

| Variable | Para qué |
|---|---|
| `DATABASE_URL` | Conexión **pooleada** (PgBouncer) que usa la app para las queries normales. Local por defecto: `postgresql://aulera:aulera@localhost:5432/aulera` (la crea `docker compose up -d`). |
| `DIRECT_URL` | Conexión **directa**, sin pooler — la usa `prisma migrate deploy` (necesita un advisory lock que PgBouncer en modo transacción no soporta). En local, mismo valor que `DATABASE_URL`. |
| `AUTH_SECRET` | Firma las sesiones de Auth.js. **Sin esto, la app tira "problema con la configuración del servidor" apenas entrás** (Auth.js la exige en cuanto corre en modo producción). Generá una propia con `openssl rand -base64 32`. |
| `ANTHROPIC_API_KEY` | **Requerida** para todo lo que genera IA: los 3 pasos de "Nueva planificación", el chat del asistente lateral y la verificación de coherencia. Sin esta clave esas acciones fallan con un error explícito (no rompen el resto de la app). |
| `ANTHROPIC_MODEL` | Modelo a usar (default `claude-sonnet-4-5`). |

### Deploy en Vercel + Supabase

Las migraciones se aplican solas: `npm run build` corre
`prisma migrate deploy && next build` (ver `package.json`), así que cada
deploy de Vercel deja el esquema al día antes de compilar. No hace falta
correr nada a mano ni pegar el connection string en ningún lado.

1. En Supabase → Settings → Database → Connection string, copiá **dos**
   URLs:
   - **Transaction pooler** (puerto 6543) → variable `DATABASE_URL`.
   - **Direct connection** (puerto 5432) → variable `DIRECT_URL`.
2. En Vercel → Settings → Environment Variables, cargá esas dos más
   `AUTH_SECRET` y `ANTHROPIC_API_KEY`. No hace falta `AUTH_URL` ni
   `AUTH_TRUST_HOST`: Auth.js v5 detecta Vercel solo.
3. Redeploy (o el próximo push a la rama). El log del build va a mostrar
   `prisma migrate deploy` aplicando lo pendiente antes de `next build`.
4. (Opcional, una sola vez) `DATABASE_URL="..." npm run db:seed` desde tu
   máquina para cargar el calendario de feriados en producción — el seed
   no está en el flujo de build a propósito, para no repetirlo en cada
   deploy.

**Nota:** correr una migración automáticamente en cada build es cómodo
pero tiene un costo — si una migración tiene un error, se aplica sola
contra producción en el próximo push. Para una app en esta etapa está
bien; si más adelante el equipo crece o las migraciones se vuelven más
delicadas, conviene pasar a un paso manual o a un gate de CI antes del
deploy.

## Qué hace cada parte

- **Base de datos** (`prisma/schema.prisma`): docentes, planificaciones (con
  estado por paso + versión final), colaboradores, documentos, evaluaciones
  + banco de preguntas, recursos, eventos de calendario y feriados.
- **Autenticación** (`src/lib/auth.ts`): Auth.js con Credentials provider
  sobre la tabla `Docente` (contraseña hasheada con bcrypt). Cada acción de
  servidor verifica ownership antes de leer o escribir (`requireDocente`,
  `getPlanConAcceso`).
- **IA** (`src/lib/planificacion-ai.ts`, `src/lib/anthropic.ts`): llamadas
  reales a la API de Claude para cada paso del asistente. Todo lo generado
  se guarda con `estado: "sugerencia"` y el docente lo edita/aprueba
  explícitamente — nunca se presenta como una decisión ya tomada. Si hay
  documentos cargados y vinculados a la planificación, su texto extraído se
  pasa como contexto; si no, el prompt se lo aclara al modelo para que no
  invente contenido normativo.
- **Documentos** (`src/lib/document-extraction.ts`): extracción real de
  texto — PDF (pdf-parse), Word (mammoth), imágenes vía OCR
  (tesseract.js, español + inglés). Los estados Procesado/Procesando/Error
  reflejan el resultado real, no un mock. Limitación conocida: un PDF
  escaneado sin capa de texto no se convierte automáticamente a imagen
  para OCR — hay que subir esas páginas como imagen.
- **Exportación** (`src/app/api/planificaciones/[id]/export/route.ts`):
  genera un PDF real (pdfkit) y un .docx real (paquete `docx`) a partir
  del contenido aprobado, no una captura de pantalla.
- **Co-planificación**: invitar por email con rol `EDITOR` o `VISOR`,
  bloqueado server-side (no solo en la UI). Ver
  `src/lib/actions/planificacion-actions.ts`.
- **Calendario**: `prisma/seed.ts` carga a mano el calendario 2026
  (nacional + ejemplos provinciales) — no hay integración con una fuente
  oficial en vivo. Detalle en `docs/calendario-feriados.md`.
- **Modo de baja conectividad**: `src/lib/offline/` guarda en IndexedDB
  cada cambio de los pasos 1–3 y sincroniza solo cuando hay conexión;
  si una sesión se corta antes de sincronizar, la próxima visita ofrece
  recuperar ese borrador.
- **Privacidad**: `/privacidad` (resumen para el usuario) y
  `docs/privacidad-ley-25326.md` (checklist técnico de qué pide la Ley
  25.326 y qué falta antes de un lanzamiento real — no es asesoramiento
  legal).

## Comandos útiles

```bash
npm run dev        # servidor de desarrollo
npm run build      # build de producción
npm run lint       # ESLint
npx prisma studio  # explorar la base de datos con una UI
npm run db:seed    # recargar el calendario de feriados
```

## Producción

Para desplegar con usuarios reales, además de lo de arriba:

1. Los archivos subidos (`uploads/`) hoy se guardan en disco local — para
   un despliegue con múltiples instancias o serverless (Vercel incluido:
   su filesystem no persiste entre requests), migrar a un almacenamiento
   de objetos (S3 o similar).
2. Revisá `docs/privacidad-ley-25326.md` antes de operar con datos
   personales reales.
