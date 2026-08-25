# Aulera

Planificaciones docentes asistidas por IA. Next.js (App Router) + Prisma +
Auth.js, con la API de Gemini (Google) como el motor de generación pedagógica.

El diseño visual viene de un proyecto de Claude Design importado a este
repo; este README cubre todo lo que ese diseño no resuelve por sí solo
(base de datos, autenticación real, integración con la API de Gemini,
extracción/OCR de documentos, exportación real a PDF/Word, co-planificación,
calendario de feriados y guardado offline).

## Puesta en marcha

La base es PostgreSQL (mismo motor que producción — sin esto no arranca
ninguna acción que toque la base). Para local, la forma más simple es
`docker compose up -d`; si preferís un Postgres ya instalado, andá directo
al segundo bloque.

```bash
npm install                   # el postinstall corre `prisma generate` solo
cp .env.example .env          # completá GEMINI_API_KEY y un AUTH_SECRET propio
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
| `GEMINI_API_KEY` | **Requerida** para todo lo que genera IA: los 3 pasos de "Nueva planificación", el chat del asistente lateral y la verificación de coherencia. Sin esta clave esas acciones fallan con un error explícito (no rompen el resto de la app). Se genera gratis, sin tarjeta, en [Google AI Studio](https://aistudio.google.com/apikey) — "Get API key" en la barra lateral. |
| `GEMINI_MODEL` | Modelo a usar (default `gemini-3.5-flash` — el modelo del nivel gratuito, 60 pedidos/minuto sin costo). |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Almacenamiento de archivos (Documentos/Recursos) vía Supabase Storage. **Requeridas en producción** — el filesystem de Vercel es de solo lectura, así que sin esto las subidas fallan con `ENOENT`. En local son opcionales: sin ellas, los archivos se guardan en `./uploads` en disco. La service role key es de Settings → API → Project API keys en Supabase (no la `anon`/pública — esta necesita permiso para escribir en Storage sin pasar por RLS). |
| `SUPABASE_STORAGE_BUCKET` | Nombre del bucket (default `aulera-uploads`). El bucket se crea solo, privado, la primera vez que se sube un archivo — no hace falta crearlo a mano en el dashboard. |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Mismo proyecto que `SUPABASE_URL`, pero la URL pública y la `anon` key (sí, la pública — es segura de exponer al navegador, a diferencia de la service role key). Habilitan que Documentos/Recursos suban el archivo directo del navegador a Storage con una URL firmada, sin pasar por una Server Action — así se evita el límite de ~4.5MB por payload de las Serverless Functions de Vercel. Opcionales: sin ellas la subida sigue funcionando, pero pasa por el servidor con el límite más chico (`MAX_UPLOAD_BYTES` en `src/lib/upload-limits.ts`). Ambas están en Settings → API del proyecto de Supabase. |

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
   `AUTH_SECRET`, `GEMINI_API_KEY`, `SUPABASE_URL` y
   `SUPABASE_SERVICE_ROLE_KEY` (esta última en Supabase → Settings → API).
   No hace falta `AUTH_URL` ni `AUTH_TRUST_HOST`: Auth.js v5 detecta Vercel
   solo, y el bucket de Storage se crea solo en la primera subida.
   Sumá también `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   (mismo proyecto, Settings → API) para que Documentos/Recursos suban
   directo al navegador y no queden atados al límite de payload de las
   funciones de Vercel — sin ellas la app funciona igual, pero con un
   límite de tamaño de archivo más chico.
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
- **IA** (`src/lib/planificacion-ai.ts`, `src/lib/gemini.ts`): llamadas
  reales a la API de Gemini para cada paso del asistente. Todo lo generado
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
- **Archivos** (`src/lib/storage.ts`): Documentos y Recursos suben a
  Supabase Storage (bucket privado, se autocrea en la primera subida) —
  necesario en Vercel porque su filesystem es de solo lectura. Sin
  `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` cae a `./uploads` en disco
  (pensado para desarrollo local, no para producción). Cada descarga pasa
  por una ruta propia que primero verifica ownership (`requireDocente`) —
  el bucket es privado, nadie accede al archivo sin pasar por esa acción.
  Con `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` configuradas,
  el navegador sube el archivo directo a Storage con una URL firmada de un
  solo uso (`iniciarSubidaDirecta` en `src/lib/actions/upload-actions.ts` la
  emite; `subirArchivoDirecto` en `src/lib/upload-direct.ts` la usa) — el
  archivo nunca pasa por una Server Action, así que el límite pasa de ser el
  de Vercel (~4.5MB por función) a `MAX_DIRECT_UPLOAD_BYTES` (50MB, en
  `src/lib/upload-limits.ts` — el máximo real por archivo del plan gratis
  de Supabase Storage). Sin esas dos variables, o al subir desde disco
  local, cae de vuelta a subir a través del servidor con el límite más
  chico (`MAX_UPLOAD_BYTES`, 3.5MB) — ambos caminos terminan en el mismo
  `subirDocumento`/`crearRecurso`, que acepta el archivo ya subido
  (`archivoStoragePath`) o los bytes crudos (`archivo`), lo que haya llegado.
  Ojo: el plan gratis de Supabase tiene 1GB de almacenamiento total para
  todo el proyecto — con archivos de hasta 50MB eso se llena rápido si se
  suben varios; no hay chequeo de cuota restante antes de subir, solo el
  error de Supabase si se pasa (se le muestra al docente como mensaje, no
  como pantalla rota — ver `subirArchivoDirecto` en `src/lib/upload-direct.ts`).
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

1. Revisá `docs/privacidad-ley-25326.md` antes de operar con datos
   personales reales.
