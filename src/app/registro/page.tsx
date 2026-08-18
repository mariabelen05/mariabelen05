"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registrarDocente } from "@/lib/actions/auth-actions";

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

export default function RegistroPage() {
  const [state, formAction, pending] = useActionState(registrarDocente, undefined);

  return (
    <div className="flex min-h-screen items-center justify-center bg-app-bg px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-[0_30px_80px_-30px_rgba(30,35,64,0.25)]">
        <div className="mb-6 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-primary text-[17px] font-extrabold text-white">
            A
          </div>
          <div className="text-[19px] font-extrabold tracking-tight text-text">Aulera</div>
        </div>

        <h1 className="text-2xl font-extrabold text-text">Creá tu cuenta</h1>
        <p className="mt-1 text-sm text-text-faint">
          Contanos un poco sobre vos para armar tu espacio de trabajo.
        </p>

        <form action={formAction} className="mt-6 flex flex-col gap-4">
          <Field label="Nombre completo" name="nombre" placeholder="Marina García" required />
          <Field label="Email" name="email" type="email" placeholder="marina.garcia@mail.com" required />
          <Field label="Contraseña" name="password" type="password" placeholder="Mínimo 8 caracteres" required />
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

          {state?.error && (
            <p className="rounded-[10px] bg-danger-soft px-3.5 py-2.5 text-[13px] text-danger">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="mt-2 rounded-[11px] bg-primary px-5 py-3 text-sm font-bold text-white transition hover:bg-primary-hover disabled:opacity-60"
          >
            {pending ? "Creando cuenta…" : "Crear cuenta"}
          </button>
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
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-semibold text-text">{props.label}</span>
      <input
        name={props.name}
        type={props.type ?? "text"}
        placeholder={props.placeholder}
        required={props.required}
        className="rounded-[11px] border border-border bg-surface px-3.5 py-2.5 text-sm text-text outline-none focus:border-primary"
      />
    </label>
  );
}
