import { requireDocente } from "@/lib/actions/session-actions";
import { AppShell } from "@/components/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const docente = await requireDocente();

  return (
    <AppShell nombre={docente.nombre} email={docente.email}>
      {children}
    </AppShell>
  );
}
