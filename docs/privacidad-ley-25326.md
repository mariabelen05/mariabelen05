# Privacidad y Ley 25.326 — checklist para Aulera

**Esto no es asesoramiento legal.** Es un relevamiento técnico de qué pide
la Ley de Protección de Datos Personales de Argentina (25.326) y su
normativa asociada, y qué de eso ya está resuelto en el código vs. qué
queda pendiente antes de lanzar Aulera a usuarios reales. Antes de un
lanzamiento real, esto lo tiene que revisar un abogado.

## Qué datos personales maneja Aulera hoy

| Dato | Modelo | Sensibilidad |
|---|---|---|
| Nombre, email, edad, provincia, modalidad | `Docente` | Datos personales básicos — pedidos en `/registro` |
| Institución, localidad, niveles/materias generales (Ficha institucional) | `Docente` | Datos personales básicos, **opcionales** — se piden únicamente en `/perfil`, después de iniciar sesión; nunca en `/registro` |
| Notas del docente sobre el grupo (Educación especial) | `Planificacion.contextoGrupo` | **Nunca un diagnóstico médico/clínico** — texto libre en lenguaje pedagógico que el docente decide compartir por planificación; el prompt a la API de Claude explicita no inferir diagnósticos a partir de esto |
| Contraseña (hasheada con bcrypt) | `Docente.passwordHash` | Credencial — nunca se guarda en texto plano |
| Documentos institucionales subidos (y su texto extraído) | `Documento` | Puede contener datos de terceros (alumnos, otros docentes) si el documento los incluye |
| Contenido de planificaciones, evaluaciones, banco de preguntas | `Planificacion`, `Evaluacion`, `ItemBanco` | Producción propia del docente |
| Email de colaboradores invitados | `PlanCollaborator` | Dato personal de un tercero, cargado por el docente que invita |

## Principios de la ley y estado actual

- **Consentimiento informado (art. 5).** Resuelto para lo básico:
  `/registro` exige tildar la aceptación de `/privacidad` antes de crear la
  cuenta, y se guarda `Docente.consintioPrivacidadEn` con el timestamp.
  Falta: el contenido de `/privacidad` es un resumen, no un texto legal
  completo — hay que reemplazarlo por la política real antes de producción.
- **Finalidad y calidad del dato (art. 4).** Los campos que se piden en
  `/registro` (nombre, email, edad opcional, provincia, modalidad) son
  razonables para el propósito del producto. No se pide más de lo
  necesario. La Ficha institucional (institución, localidad, niveles/
  materias) es enteramente opcional y vive solo en `/perfil`, nunca en el
  registro — separa explícitamente "necesario para crear la cuenta" de
  "útil para prellenar planificaciones institucionales". Lo mismo para
  `contextoGrupo` en Educación especial: es opcional, por planificación, y
  el prompt a la IA prohíbe explícitamente inferir diagnósticos a partir de
  ese texto.
- **Deber de confidencialidad y seguridad (art. 9, disposición AAIP
  11/2006 sobre medidas de seguridad).** Parcial:
  - Contraseñas hasheadas con bcrypt — hecho.
  - Autorización server-side en cada acción (`requireDocente`,
    `getPlanConAcceso`) para que un docente no pueda leer ni modificar
    datos de otro — hecho.
  - Falta: cifrado en reposo de la base y de los archivos subidos,
    rotación de `AUTH_SECRET`, política de backups, un `.env` real fuera
    del control de versiones (ya está en `.gitignore`, pero falta un
    gestor de secretos para producción).
  - Falta: HTTPS obligatorio y cabeceras de seguridad en el despliegue
    productivo (esto es responsabilidad del hosting, no del código).
- **Derechos ARCO — Acceso, Rectificación, Actualización, Cancelación/
  Supresión (arts. 14–16).**
  - Acceso y rectificación: resuelto — `/perfil` permite ver y editar los
    propios datos personales.
  - Supresión: resuelto a nivel de producto — `/perfil` tiene un botón
    "Eliminar cuenta" (`eliminarCuenta` en
    `src/lib/actions/perfil-actions.ts`) que borra en cascada las
    planificaciones, documentos, evaluaciones, banco de preguntas,
    recursos, eventos y archivos en disco del docente, y cierra la sesión.
  - Falta: un canal formal para que alguien pida acceso/rectificación/baja
    de sus datos *sin* tener que loguearse a hacerlo desde la app (por
    ejemplo si perdió el acceso a su cuenta) — hoy no hay un email o
    formulario de contacto para eso.
- **Inscripción en el Registro Nacional de Bases de Datos (art. 21,
  AAIP).** Falta: cualquier base de datos personales en Argentina con
  fines comerciales tiene que inscribirse ante la Agencia de Acceso a la
  Información Pública. Esto es un trámite administrativo, no de código,
  pero es un bloqueante legal antes de operar con usuarios reales.
- **Cesión y transferencia a terceros (arts. 2, 11).** Relevante para
  Aulera porque:
  - El texto de los documentos institucionales cargados por el docente
    (que puede incluir datos de alumnos u otros terceros) **se envía a la
    API de Claude (Anthropic)** como contexto para generar sugerencias.
    Esto es una transferencia de datos a un tercero (el proveedor del
    modelo) y tiene que estar contemplada explícitamente en la política de
    privacidad, con la base legal correspondiente.
  - Si en el futuro se usa un proveedor de email transaccional (para
    invitaciones de co-planificación) o un servicio de OCR en la nube,
    aplica lo mismo.
- **Datos de menores de edad.** Los docentes que se registran son adultos,
  pero los documentos institucionales que suben (listas, evaluaciones,
  legajos) pueden contener datos de estudiantes menores de edad. La ley no
  distingue un régimen especial tan detallado como el GDPR para menores,
  pero sí exige la misma calidad/finalidad/seguridad — y es un punto para
  que un abogado revise específicamente, dado el contexto educativo.
- **Notificación de brechas de seguridad.** Falta: no hay todavía un
  procedimiento documentado de qué hacer si se detecta un acceso no
  autorizado a la base de datos.

## Resumen de lo pendiente antes de producción

1. ~~Pantalla de Política de Privacidad con aceptación explícita en el
   registro.~~ Hecho (`/privacidad` + checkbox obligatorio en `/registro`).
2. ~~Flujo de baja/eliminación de cuenta (derecho de supresión).~~ Hecho
   (`/perfil` → "Eliminar cuenta").
3. Reemplazar el resumen de `/privacidad` por el texto legal real.
4. Un canal de contacto para ejercer derechos ARCO sin necesidad de login.
5. Inscripción de la base de datos ante la AAIP.
6. ~~Mencionar que el contenido de documentos cargados se envía a la API de
   Claude~~ Hecho (mencionado en `/privacidad` y en el checkbox de
   `/registro`).
7. Cifrado en reposo + gestión de secretos en el entorno de producción
   (fuera del alcance de este repo: es configuración de infraestructura).
8. Revisión de todo lo anterior por un abogado especializado en protección
   de datos antes de lanzar con usuarios reales.
