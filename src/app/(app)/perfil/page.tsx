import { requireDocente } from "@/lib/actions/session-actions";
import { subidaDirectaDisponible } from "@/lib/storage";
import { obtenerUsoAlmacenamiento } from "@/lib/storage-usage";
import { PerfilForm } from "./perfil-form";
import { FichaForm } from "./ficha-form";
import { PasswordForm } from "./password-form";
import { EliminarCuenta } from "./eliminar-cuenta";
import { AlmacenamientoCard } from "./almacenamiento-card";

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

export default async function PerfilPage() {
  const docente = await requireDocente();
  const uso = subidaDirectaDisponible() ? await obtenerUsoAlmacenamiento() : null;

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold text-text">Mi perfil y configuración</h1>
        <p className="text-sm text-text-faint">{docente.email}</p>
      </div>

      <PerfilForm docente={docente} modalidades={MODALIDADES} />
      <FichaForm docente={docente} provincias={PROVINCIAS} />
      {uso && <AlmacenamientoCard usadoBytes={uso.usadoBytes} cuotaBytes={uso.cuotaBytes} />}
      <PasswordForm />
      <EliminarCuenta />

      <div className="rounded-2xl border border-border bg-card p-5 text-xs text-text-faint">
        Aulera guarda tus datos personales (nombre, email y, si cargás documentos institucionales,
        su contenido) para poder ofrecerte el servicio. Consultá{" "}
        <a href="/privacidad" className="font-semibold text-primary">
          cómo tratamos esos datos
        </a>.
      </div>
    </div>
  );
}
