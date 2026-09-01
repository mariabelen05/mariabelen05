"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { registrarDocente } from "@/lib/actions/auth-actions";
import { Onboarding } from "@/components/ui/onboarding";
import { MagneticButton } from "@/components/ui/magnetic-button";
import { BookIcon, UserIcon, ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";

const PROVINCIAS = [
  "Buenos Aires", "CABA", "Catamarca", "Chaco", "Chubut", "Córdoba",
  "Corrientes", "Entre Ríos", "Formosa", "Jujuy", "La Pampa", "La Rioja",
  "Mendoza", "Misiones", "Neuquén", "Río Negro", "Salta", "San Juan",
  "San Luis", "Santa Cruz", "Santa Fe", "Santiago del Estero",
  "Tierra del Fuego", "Tucumán",
];

const MODALIDADES = [
  { value: "aula", label: "Aula común" },
  { value: "rural", label: "Educación rural" },
  { value: "plurigrado", label: "Plurigrado" },
  { value: "especial", label: "Educación especial" },
];

type Modo = "institucion" | "independiente";

const STEP_LABELS = ["Cuenta", "Cómo trabajás", "Contexto"];

export default function OnboardingPage() {
  const [state, formAction, pending] = useActionState(registrarDocente, undefined);
  const [step, setStep] = useState(0);
  const [modoPreview, setModoPreview] = useState<Modo | null>(null);
  const [aceptaPrivacidad, setAceptaPrivacidad] = useState(false);

  // Solo lo mínimo se controla en React — lo justo para habilitar "Siguiente".
  // El resto de los campos son no controlados y viajan en el FormData del
  // <form> único que envuelve los 3 pasos (todos quedan montados, solo se
  // desplazan visualmente — así no se pierden valores al navegar entre pasos).
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const puedeAvanzarPaso0 = nombre.trim() !== "" && email.trim() !== "" && password.length >= 8;

  return (
    <div className="flex min-h-screen items-center justify-center bg-app-bg px-4 py-10">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-8 shadow-[0_30px_80px_-30px_rgba(30,35,64,0.25)]">
        <div className="mb-6 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-primary text-[17px] font-extrabold text-white">
            A
          </div>
          <div className="text-[19px] font-extrabold tracking-tight text-text">Aulera</div>
        </div>

        <form action={formAction} className="flex flex-col gap-6">
          <Onboarding step={step} labels={STEP_LABELS}>
            {/* Paso 1 — Cuenta */}
            <div className="flex flex-col gap-4">
              <div>
                <h1 className="text-xl font-extrabold text-text">Creá tu cuenta</h1>
                <p className="mt-1 text-sm text-text-faint">
                  Contanos un poco sobre vos para armar tu espacio de trabajo.
                </p>
              </div>
              <Field
                label="Nombre completo" name="nombre" placeholder="Marina García" required
                value={nombre} onChange={setNombre}
              />
              <Field
                label="Email" name="email" type="email" placeholder="marina.garcia@mail.com" required
                value={email} onChange={setEmail}
              />
              <Field
                label="Contraseña" name="password" type="password" placeholder="Mínimo 8 caracteres" required
                value={password} onChange={setPassword}
              />
            </div>

            {/* Paso 2 — Modo A/B (solo informativo: no se guarda en la cuenta;
                el modo real se elige cada vez que se crea una planificación). */}
            <div className="flex flex-col gap-4">
              <div>
                <h1 className="text-xl font-extrabold text-text">Así vas a trabajar en Aulera</h1>
                <p className="mt-1 text-sm text-text-faint">
                  Cuando crees una planificación vas a poder elegir el modo cada vez — esto es solo
                  para que sepas qué esperar. No queda guardado en tu cuenta.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <ModoPreviewCard
                  icon={<BookIcon className="h-5 w-5" />}
                  titulo="Institución"
                  descripcion="Trabajás en una escuela u organización. Aulera puede usar los datos de tu Ficha institucional como membrete."
                  selected={modoPreview === "institucion"}
                  onClick={() => setModoPreview("institucion")}
                />
                <ModoPreviewCard
                  icon={<UserIcon className="h-5 w-5" />}
                  titulo="Independiente"
                  descripcion="Das clases particulares o no querés asociar tus planificaciones a una institución."
                  selected={modoPreview === "independiente"}
                  onClick={() => setModoPreview("independiente")}
                />
              </div>
            </div>

            {/* Paso 3 — Contexto */}
            <div className="flex flex-col gap-4">
              <div>
                <h1 className="text-xl font-extrabold text-text">Un poco de contexto</h1>
                <p className="mt-1 text-sm text-text-faint">
                  Nos ayuda a ajustar las sugerencias a tu realidad. Todo esto es opcional salvo la
                  Política de Privacidad.
                </p>
              </div>

              <Field label="Edad (opcional)" name="edad" type="number" placeholder="34" />

              <label className="flex flex-col gap-1.5">
                <span className="text-[13px] font-semibold text-text">Provincia</span>
                <select
                  name="provincia"
                  className="rounded-[11px] border border-border bg-surface px-3.5 py-2.5 text-sm text-text outline-none focus:border-primary"
                >
                  <option value="">Seleccioná tu provincia</option>
                  {PROVINCIAS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-[13px] font-semibold text-text">Modalidad</span>
                <select
                  name="modalidad"
                  className="rounded-[11px] border border-border bg-surface px-3.5 py-2.5 text-sm text-text outline-none focus:border-primary"
                >
                  <option value="">Seleccioná una modalidad</option>
                  {MODALIDADES.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </label>

              <label className="flex items-start gap-2 text-xs text-text-faint">
                <input
                  type="checkbox"
                  name="aceptaPrivacidad"
                  required
                  checked={aceptaPrivacidad}
                  onChange={(e) => setAceptaPrivacidad(e.target.checked)}
                  className="mt-0.5"
                />
                <span>
                  Acepto la{" "}
                  <Link href="/privacidad" target="_blank" className="font-semibold text-primary hover:text-primary-hover">
                    Política de Privacidad
                  </Link>{" "}
                  de Aulera, incluyendo que el texto de los documentos que suba puede enviarse a la
                  API de Gemini (Google) para generar sugerencias.
                </span>
              </label>

              {state?.error && (
                <p className="rounded-[10px] bg-danger-soft px-3.5 py-2.5 text-[13px] text-danger">
                  {state.error}
                </p>
              )}
            </div>
          </Onboarding>

          <div className="flex items-center justify-between">
            {step > 0 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="flex items-center gap-1 rounded-[11px] px-4 py-2.5 text-sm font-bold text-text-faint hover:text-primary"
              >
                <ChevronLeftIcon className="h-3.5 w-3.5" /> Atrás
              </button>
            ) : (
              <span />
            )}

            {step < STEP_LABELS.length - 1 ? (
              <button
                type="button"
                disabled={step === 0 && !puedeAvanzarPaso0}
                onClick={() => setStep((s) => s + 1)}
                className="flex items-center gap-1 rounded-[11px] bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-hover disabled:opacity-50"
              >
                Siguiente <ChevronRightIcon className="h-3.5 w-3.5" />
              </button>
            ) : (
              <MagneticButton
                type="submit"
                disabled={pending || !aceptaPrivacidad}
                className="rounded-[11px] bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary-hover disabled:opacity-50"
              >
                {pending ? "Creando cuenta…" : "Crear cuenta"}
              </MagneticButton>
            )}
          </div>
        </form>

        <p className="mt-6 text-center text-[13px] text-text-faint">
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" className="font-semibold text-primary hover:text-primary-hover">
            Iniciá sesión
          </Link>
        </p>
      </div>
    </div>
  );
}

function Field(props: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  value?: string;
  onChange?: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-semibold text-text">{props.label}</span>
      <input
        name={props.name}
        type={props.type ?? "text"}
        placeholder={props.placeholder}
        required={props.required}
        {...(props.onChange
          ? { value: props.value, onChange: (e: React.ChangeEvent<HTMLInputElement>) => props.onChange!(e.target.value) }
          : { defaultValue: props.value })}
        className="rounded-[11px] border border-border bg-surface px-3.5 py-2.5 text-sm text-text outline-none focus:border-primary"
      />
    </label>
  );
}

function ModoPreviewCard({
  icon,
  titulo,
  descripcion,
  selected,
  onClick,
}: {
  icon: React.ReactNode;
  titulo: string;
  descripcion: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-start gap-3 rounded-2xl border p-5 text-left ${
        selected ? "border-primary bg-primary-soft/40" : "border-border bg-card hover:border-primary"
      }`}
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-soft text-purple">
        {icon}
      </div>
      <div className="text-sm font-extrabold text-text">{titulo}</div>
      <p className="text-xs text-text-faint">{descripcion}</p>
    </button>
  );
}
