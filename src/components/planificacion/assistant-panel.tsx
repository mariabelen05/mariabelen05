"use client";

import { useState, useTransition } from "react";
import { SparkleIcon } from "@/components/icons";
import { TextAnimate } from "@/components/ui/text-animate";
import type { ChatMensaje } from "@/lib/planificacion-types";

export function AssistantPanel({
  chat,
  onAjuste,
  disabled,
}: {
  chat: ChatMensaje[];
  onAjuste: (mensaje: string) => Promise<string>;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [localChat, setLocalChat] = useState<ChatMensaje[]>(chat);
  const [pending, startTransition] = useTransition();
  // Mensajes de historial (ya cargados al montar) se muestran tal cual;
  // solo las respuestas nuevas de esta sesión "se escriben" con TextAnimate.
  const [historialCount] = useState(chat.length);

  const enviar = () => {
    const mensaje = draft.trim();
    if (!mensaje || pending) return;
    setDraft("");
    setLocalChat((c) => [...c, { from: "user", texto: mensaje }]);
    startTransition(async () => {
      try {
        const respuesta = await onAjuste(mensaje);
        setLocalChat((c) => [...c, { from: "aulera", texto: respuesta }]);
      } catch (err) {
        setLocalChat((c) => [
          ...c,
          { from: "aulera", texto: `No pude aplicar el ajuste: ${(err as Error).message}` },
        ]);
      }
    });
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-20 flex items-center gap-2 rounded-full bg-primary px-5 py-3.5 text-sm font-bold text-white shadow-[0_20px_50px_-12px_rgba(59,95,224,0.5)] lg:right-10"
      >
        <SparkleIcon className="h-4 w-4" />
        Asistente Aulera
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-20 flex h-[420px] w-[92vw] max-w-[360px] flex-col rounded-2xl border border-border bg-card shadow-[0_20px_50px_-12px_rgba(30,35,64,0.35)] lg:right-10">
      <div className="flex items-center justify-between rounded-t-2xl bg-primary px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          <SparkleIcon className="h-4 w-4" />
          Asistente Aulera
        </div>
        <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white">
          ✕
        </button>
      </div>

      <div className="flex-1 space-y-2.5 overflow-y-auto p-3.5">
        {localChat.length === 0 && (
          <p className="text-xs text-text-faint">
            Pedime ajustes sobre este paso — por ejemplo &quot;hacé los objetivos más simples&quot; o
            &quot;sumá algo sobre impacto ambiental&quot;.
          </p>
        )}
        {localChat.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] rounded-xl px-3 py-2 text-[12.5px] leading-relaxed ${
              m.from === "user" ? "ml-auto bg-primary text-white" : "bg-surface text-text"
            }`}
          >
            {m.from === "aulera" && i >= historialCount ? (
              <TextAnimate as="span" by="word" animation="fadeIn" duration={0.18} className="whitespace-pre-wrap">
                {m.texto}
              </TextAnimate>
            ) : (
              m.texto
            )}
          </div>
        ))}
        {pending && <div className="text-xs text-text-faint">Aulera está pensando…</div>}
      </div>

      <div className="flex items-center gap-2 border-t border-border-soft p-3">
        <input
          value={draft}
          disabled={disabled || pending}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && enviar()}
          placeholder="Pedí un ajuste..."
          className="flex-1 rounded-full border border-border bg-surface px-3.5 py-2 text-[13px] outline-none focus:border-primary disabled:opacity-50"
        />
        <button
          onClick={enviar}
          disabled={disabled || pending || !draft.trim()}
          className="rounded-full bg-primary px-4 py-2 text-[13px] font-bold text-white disabled:opacity-50"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
