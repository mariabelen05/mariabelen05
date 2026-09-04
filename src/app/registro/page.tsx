import { redirect } from "next/navigation";

// El registro se reemplazó por el flujo de onboarding en pasos (/onboarding).
// Se mantiene esta ruta como redirect para no romper enlaces existentes.
export default function RegistroPage() {
  redirect("/onboarding");
}
