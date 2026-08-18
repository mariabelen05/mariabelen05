"use client";

import { useEffect, useRef, useState } from "react";
import {
  guardarBorradorLocal, leerBorradorLocal, marcarSincronizado,
} from "@/lib/offline/draft-store";

export type SyncStatus = "sincronizado" | "guardado-local" | "sin-conexion" | "sincronizando" | "error";

// Autosaves `contenido` into IndexedDB on every change (instant, local, works
// offline) and pushes it to the server via `guardarEnServidor` once a
// connection is available. On mount it also surfaces any draft left behind
// by a previous session that never made it to the server, so the editor can
// offer to restore it instead of silently discarding in-progress work.
export function useOfflineDraft<T>(
  planId: string,
  paso: string,
  contenido: T | null,
  guardarEnServidor: (contenido: T) => Promise<unknown>
) {
  const [status, setStatus] = useState<SyncStatus>("sincronizado");
  const [borradorRecuperado, setBorradorRecuperado] = useState<T | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const guardarRef = useRef(guardarEnServidor);
  guardarRef.current = guardarEnServidor;

  // Recover any draft from a session that ended without syncing.
  useEffect(() => {
    let cancelled = false;
    leerBorradorLocal(planId, paso).then((draft) => {
      if (!cancelled && draft && !draft.synced) {
        setBorradorRecuperado(draft.contenido as T);
        setStatus("guardado-local");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [planId, paso]);

  const intentarSincronizar = async (valor: T) => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setStatus("sin-conexion");
      return;
    }
    setStatus("sincronizando");
    try {
      await guardarRef.current(valor);
      await marcarSincronizado(planId, paso);
      setStatus("sincronizado");
    } catch {
      setStatus("guardado-local");
    }
  };

  // Debounced autosave whenever the caller's content changes.
  useEffect(() => {
    if (contenido === null) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      guardarBorradorLocal(planId, paso, contenido);
      intentarSincronizar(contenido);
    }, 1200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId, paso, JSON.stringify(contenido)]);

  // Retry as soon as the connection comes back.
  useEffect(() => {
    const onOnline = () => {
      if (contenido !== null) intentarSincronizar(contenido);
    };
    const onOffline = () => setStatus("sin-conexion");
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(contenido)]);

  const descartarBorradorRecuperado = () => {
    setBorradorRecuperado(null);
    marcarSincronizado(planId, paso);
  };

  return { status, borradorRecuperado, descartarBorradorRecuperado };
}
