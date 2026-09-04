"use client";

import { Reorder, useDragControls } from "motion/react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

function GripHandle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 12 20" fill="currentColor" className={className} aria-hidden>
      {[3, 9].map((cx) =>
        [3, 10, 17].map((cy) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.4" />),
      )}
    </svg>
  );
}

interface SortableListProps<T> {
  items: T[];
  onReorder: (items: T[]) => void;
  getKey: (item: T) => string;
  renderItem: (item: T, dragHandle: ReactNode) => ReactNode;
  className?: string;
}

/**
 * Lista reordenable por drag & drop, sobre Reorder de motion (ya instalado,
 * sin sumar dnd-kit ni otra dependencia nueva). El handle solo dispara el
 * drag con pointer-down explícito, así el resto del ítem (inputs, botones
 * de borrar) sigue funcionando normal.
 */
export function SortableList<T>({ items, onReorder, getKey, renderItem, className }: SortableListProps<T>) {
  return (
    <Reorder.Group
      axis="y"
      values={items}
      onReorder={onReorder}
      className={cn("flex flex-col gap-2", className)}
    >
      {items.map((item) => (
        <SortableListRow key={getKey(item)} item={item} renderItem={renderItem} />
      ))}
    </Reorder.Group>
  );
}

function SortableListRow<T>({
  item,
  renderItem,
}: {
  item: T;
  renderItem: SortableListProps<T>["renderItem"];
}) {
  const controls = useDragControls();

  return (
    <Reorder.Item value={item} dragListener={false} dragControls={controls} className="list-none">
      {renderItem(
        item,
        <button
          type="button"
          onPointerDown={(e) => controls.start(e)}
          aria-label="Reordenar"
          className="cursor-grab touch-none rounded p-1 text-text-faint hover:bg-surface hover:text-primary active:cursor-grabbing"
        >
          <GripHandle className="h-4 w-4" />
        </button>,
      )}
    </Reorder.Item>
  );
}
