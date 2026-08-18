import { openDB, type IDBPDatabase } from "idb";

// Local-first draft cache so a teacher mid-edit doesn't lose work when the
// connection drops — built for the "Educación Rural" / low-connectivity
// case called out in the brief. Not full offline-first (no offline auth,
// no queued AI generation), just: never lose in-progress step edits.
const DB_NAME = "aulera-offline";
const STORE = "drafts";

export type DraftRecord = {
  key: string; // `${planId}:${paso}`
  planId: string;
  paso: string;
  contenido: unknown;
  updatedAt: number;
  synced: boolean;
};

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb() {
  if (typeof window === "undefined") return null;
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: "key" });
        }
      },
    });
  }
  return dbPromise;
}

export async function guardarBorradorLocal(planId: string, paso: string, contenido: unknown) {
  const db = await getDb();
  if (!db) return;
  const record: DraftRecord = {
    key: `${planId}:${paso}`,
    planId,
    paso,
    contenido,
    updatedAt: Date.now(),
    synced: false,
  };
  await db.put(STORE, record);
}

export async function leerBorradorLocal(planId: string, paso: string): Promise<DraftRecord | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  return db.get(STORE, `${planId}:${paso}`);
}

export async function marcarSincronizado(planId: string, paso: string) {
  const db = await getDb();
  if (!db) return;
  await db.delete(STORE, `${planId}:${paso}`);
}

export async function listarBorradoresPendientes(): Promise<DraftRecord[]> {
  const db = await getDb();
  if (!db) return [];
  const all = (await db.getAll(STORE)) as DraftRecord[];
  return all.filter((d) => !d.synced);
}
