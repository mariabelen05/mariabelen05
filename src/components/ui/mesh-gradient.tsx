"use client";

import { motion } from "motion/react";

/**
 * Fondo de gradiente tipo "mesh": varios blobs de color de la paleta
 * (primary/purple/accent) desenfocados y animados suavemente, sobre el
 * app-bg. Pensado como fondo de página completa (absolute inset-0, detrás
 * del contenido) en pantallas sin chrome propio como login/onboarding.
 */
export function MeshGradient({ className }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden bg-app-bg ${className ?? ""}`}>
      <motion.div
        className="absolute -left-[10%] -top-[15%] h-[55vw] w-[55vw] max-h-[560px] max-w-[560px] rounded-full bg-primary opacity-40 blur-[110px]"
        animate={{ x: [0, 30, -10, 0], y: [0, 20, -15, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -right-[12%] top-[5%] h-[50vw] w-[50vw] max-h-[520px] max-w-[520px] rounded-full bg-purple opacity-40 blur-[110px]"
        animate={{ x: [0, -25, 15, 0], y: [0, 25, -10, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[-15%] left-[20%] h-[45vw] w-[45vw] max-h-[480px] max-w-[480px] rounded-full bg-accent opacity-30 blur-[110px]"
        animate={{ x: [0, 20, -20, 0], y: [0, -20, 10, 0] }}
        transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
