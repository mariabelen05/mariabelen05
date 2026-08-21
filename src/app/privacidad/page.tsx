export const metadata = { title: "Privacidad — Aulera" };

export default function PrivacidadPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5 px-5 py-12">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-primary text-[17px] font-extrabold text-white">A</div>
        <div className="text-[19px] font-extrabold tracking-tight text-text">Aulera</div>
      </div>

      <h1 className="text-2xl font-extrabold text-text">Cómo tratamos tus datos</h1>
      <p className="text-sm text-text-faint">
        Este resumen no reemplaza asesoramiento legal. Aulera aplica los principios de la Ley
        25.326 de Protección de Datos Personales de Argentina.
      </p>

      <Seccion titulo="Qué datos guardamos">
        Tu nombre (para saludarte), email (para iniciar sesión), edad si la compartís, provincia
        y modalidad de enseñanza. Si completás la Ficha institucional en Mi perfil — institución,
        localidad, niveles o materias que dictás — también se guarda, pero es opcional y solo se
        pide ahí, nunca al registrarte. Si trabajás con Educación especial y elegís contarle a
        Aulera algo del grupo para que lo tenga en cuenta al proponer contenidos, eso también se
        guarda — en tus propias palabras, nunca como un diagnóstico. También el contenido que
        generás en la app: planificaciones, evaluaciones, banco de preguntas, recursos y
        documentos que subís.
      </Seccion>

      <Seccion titulo="Para qué los usamos">
        Únicamente para darte el servicio: identificarte, mostrarte tus propias planificaciones (y
        las que compartan con vos por co-planificación), y generar sugerencias pedagógicas.
      </Seccion>

      <Seccion titulo="Con quién los compartimos">
        El texto de tus documentos y de tus planificaciones se envía a la API de Gemini
        (Google) para generar las sugerencias — objetivos, actividades, instrumentos de
        evaluación y verificación de coherencia. No vendemos ni compartimos tus datos con fines
        publicitarios.
      </Seccion>

      <Seccion titulo="Tus derechos">
        Podés acceder y corregir tus datos personales desde{" "}
        <a href="/perfil" className="font-semibold text-primary">Mi perfil</a>. Podés pedir la
        eliminación de tu cuenta y de todo tu contenido desde esa misma sección.
      </Seccion>

      <Seccion titulo="Seguridad">
        Tu contraseña se guarda con hash (nunca en texto plano) y cada acción del sistema verifica
        que solo vos (o quien invites explícitamente a una planificación) pueda acceder a tus
        datos.
      </Seccion>

      <p className="text-xs text-text-faint">
        Para un detalle técnico completo de qué cumple la ley y qué falta antes de un lanzamiento
        con usuarios reales, ver <code className="text-[11px]">docs/privacidad-ley-25326.md</code>{" "}
        en el repositorio del proyecto.
      </p>
    </div>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-1.5 rounded-2xl border border-border bg-card p-5">
      <h2 className="text-sm font-extrabold text-text">{titulo}</h2>
      <p className="text-[13px] leading-relaxed text-text-faint">{children}</p>
    </section>
  );
}
