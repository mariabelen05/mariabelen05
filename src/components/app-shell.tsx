"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  HomeIcon, FolderIcon, PlusIcon, FileIcon, ArchiveIcon, CheckIcon,
  CalendarIcon, GearIcon, BellIcon, SearchIcon, ChevronDownIcon, MenuIcon,
} from "@/components/icons";
import { signOutAction } from "@/lib/actions/session-actions";

const NAV_ITEMS = [
  { key: "inicio", label: "Inicio", href: "/", Icon: HomeIcon },
  { key: "planificaciones", label: "Planificaciones", href: "/planificaciones", Icon: FolderIcon },
  { key: "nueva", label: "Nueva planificación", href: "/planificaciones/nueva", Icon: PlusIcon },
  { key: "documentos", label: "Documentos", href: "/documentos", Icon: FileIcon },
  { key: "recursos", label: "Recursos", href: "/recursos", Icon: ArchiveIcon },
  { key: "evaluaciones", label: "Evaluaciones", href: "/evaluaciones", Icon: CheckIcon },
  { key: "calendario", label: "Calendario", href: "/calendario", Icon: CalendarIcon },
  { key: "config", label: "Mi perfil y configuración", href: "/perfil", Icon: GearIcon },
];

function initials(nombre: string) {
  const parts = nombre.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "U";
}

function Sidebar({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <div className="flex h-full w-[236px] shrink-0 flex-col bg-card px-4 py-6">
      <div className="flex items-center gap-2.5 px-2 pb-7">
        <div className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-primary text-[17px] font-extrabold text-white">
          A
        </div>
        <div className="text-[19px] font-extrabold tracking-tight text-text">Aulera</div>
      </div>

      <nav className="flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.key}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[14.5px] transition-colors ${
                active ? "bg-purple-soft font-bold text-primary" : "font-semibold text-text-faint hover:bg-surface"
              }`}
            >
              <item.Icon className="h-5 w-5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex-1" />

      <div className="flex items-center gap-2 border-t border-border-soft pt-3.5">
        <Image src="/identiq-icon.png" alt="Identiq" width={16} height={16} className="opacity-55" />
        <div className="text-[11.5px] font-semibold text-text-faint">Hecho por Identiq</div>
      </div>
    </div>
  );
}

export function AppShell({
  nombre,
  email,
  children,
}: {
  nombre: string;
  email: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-app-bg">
      <div className="hidden border-r border-border lg:block">
        <Sidebar pathname={pathname} />
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-30 flex lg:hidden" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-[rgba(30,35,64,0.4)]" />
          <div className="relative z-10" onClick={(e) => e.stopPropagation()}>
            <Sidebar pathname={pathname} onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-[72px] shrink-0 items-center justify-between gap-4 border-b border-border bg-surface px-4 sm:px-7">
          <button
            className="rounded-[9px] bg-card p-2 lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menú"
          >
            <MenuIcon className="h-4 w-4 text-text" />
          </button>

          <div className="hidden w-[360px] items-center gap-2.5 rounded-xl border border-border bg-card px-3.5 py-2.5 sm:flex">
            <SearchIcon className="h-[17px] w-[17px] text-text-faint" />
            <span className="text-[13.5px] text-text-faint">
              Buscar planificaciones, documentos, recursos...
            </span>
          </div>

          <div className="flex items-center gap-4 sm:gap-[18px]">
            <div className="relative flex h-[38px] w-[38px] items-center justify-center rounded-[11px] bg-card">
              <BellIcon className="h-[19px] w-[19px] text-text" />
              <div className="absolute right-[7px] top-[6px] h-2 w-2 rounded-full border-[1.5px] border-surface bg-accent" />
            </div>

            <div className="relative">
              <button
                className="flex items-center gap-2 rounded-[11px] p-1"
                onClick={() => setAvatarOpen((v) => !v)}
              >
                <div className="flex h-[38px] w-[38px] items-center justify-center rounded-[11px] bg-purple-soft text-sm font-bold text-purple">
                  {initials(nombre)}
                </div>
                <ChevronDownIcon className="h-3.5 w-3.5 text-text-faint" />
              </button>
              {avatarOpen && (
                <div className="absolute right-0 top-12 z-20 w-[200px] rounded-2xl border border-border bg-card p-2 shadow-[0_20px_50px_-12px_rgba(30,35,64,0.25)]">
                  <div className="mb-1.5 border-b border-border-soft px-3 pb-3 pt-2.5">
                    <div className="text-[13.5px] font-bold text-text">{nombre}</div>
                    <div className="truncate text-xs text-text-faint">{email}</div>
                  </div>
                  <Link
                    href="/perfil"
                    className="block rounded-[9px] px-3 py-2 text-[13px] text-text hover:bg-surface"
                    onClick={() => setAvatarOpen(false)}
                  >
                    Mi perfil
                  </Link>
                  <Link
                    href="/perfil"
                    className="block rounded-[9px] px-3 py-2 text-[13px] text-text hover:bg-surface"
                    onClick={() => setAvatarOpen(false)}
                  >
                    Configuración
                  </Link>
                  <button
                    className="block w-full rounded-[9px] px-3 py-2 text-left text-[13px] text-accent hover:bg-surface"
                    onClick={async () => {
                      await signOutAction();
                      router.push("/login");
                    }}
                  >
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-7">{children}</div>
      </div>
    </div>
  );
}
