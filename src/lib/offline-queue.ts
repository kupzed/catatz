"use client";

import { openDB } from "idb";
import type { IDBPDatabase } from "idb";
import {
  createTransaksi,
  deleteTransaksi,
  updateTransaksi,
} from "@/actions/transaksi-action";
import type { TransaksiFormValues } from "@/types/transaksi";

export type QueuedAction = {
  id: string;
  type: "CREATE_TRANSAKSI" | "UPDATE_TRANSAKSI" | "DELETE_TRANSAKSI";
  payload: unknown;
  timestamp: number;
  retries: number;
};

type QueuedActionInput = Omit<QueuedAction, "id" | "timestamp" | "retries">;

type CatatZQueueDB = {
  actions: {
    key: string;
    value: QueuedAction;
    indexes: {
      "by-timestamp": number;
    };
  };
};

const dbName = "catatz-offline-queue";
const dbVersion = 1;
const storeName = "actions";

export const offlineQueueChangedEvent = "catatz:offline-queue-changed";

function isIndexedDBAvailable() {
  return typeof window !== "undefined" && "indexedDB" in window;
}

function createQueueId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

async function getDB(): Promise<IDBPDatabase<CatatZQueueDB> | null> {
  if (!isIndexedDBAvailable()) {
    return null;
  }

  try {
    return await openDB<CatatZQueueDB>(dbName, dbVersion, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(storeName)) {
          const store = db.createObjectStore(storeName, { keyPath: "id" });
          store.createIndex("by-timestamp", "timestamp");
        }
      },
    });
  } catch (error) {
    console.error("[offline-queue] IndexedDB unavailable", error);
    return null;
  }
}

function dispatchQueueChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(offlineQueueChangedEvent));
  }
}

function isCreatePayload(payload: unknown): payload is TransaksiFormValues {
  return typeof payload === "object" && payload !== null && "tipe" in payload;
}

function isUpdatePayload(
  payload: unknown,
): payload is { id: string; values: Partial<TransaksiFormValues> } {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "id" in payload &&
    "values" in payload
  );
}

function isDeletePayload(payload: unknown): payload is { id: string } {
  return typeof payload === "object" && payload !== null && "id" in payload;
}

async function incrementRetries(action: QueuedAction) {
  const db = await getDB();

  if (!db) {
    return;
  }

  await db.put(storeName, { ...action, retries: action.retries + 1 });
}

export async function addToQueue(action: QueuedActionInput): Promise<QueuedAction | null> {
  const db = await getDB();

  if (!db) {
    return null;
  }

  const queuedAction: QueuedAction = {
    ...action,
    id: createQueueId(),
    timestamp: Date.now(),
    retries: 0,
  };

  await db.put(storeName, queuedAction);
  dispatchQueueChanged();

  return queuedAction;
}

export async function getQueue(): Promise<QueuedAction[]> {
  const db = await getDB();

  if (!db) {
    return [];
  }

  return db.getAllFromIndex(storeName, "by-timestamp");
}

export async function removeFromQueue(id: string): Promise<void> {
  const db = await getDB();

  if (!db) {
    return;
  }

  await db.delete(storeName, id);
  dispatchQueueChanged();
}

export async function processQueue(): Promise<{ success: number; failed: number }> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return { success: 0, failed: 0 };
  }

  const queue = await getQueue();
  let success = 0;
  let failed = 0;

  for (const action of queue) {
    try {
      let result: { success: boolean; error?: string };

      if (action.type === "CREATE_TRANSAKSI" && isCreatePayload(action.payload)) {
        result = await createTransaksi(action.payload);
      } else if (action.type === "UPDATE_TRANSAKSI" && isUpdatePayload(action.payload)) {
        result = await updateTransaksi(action.payload.id, action.payload.values);
      } else if (action.type === "DELETE_TRANSAKSI" && isDeletePayload(action.payload)) {
        result = await deleteTransaksi(action.payload.id);
      } else {
        result = { success: false, error: "Payload queue tidak valid" };
      }

      if (result.success) {
        await removeFromQueue(action.id);
        success++;
      } else {
        await incrementRetries(action);
        failed++;
      }
    } catch (error) {
      console.error("[offline-queue] Failed processing queued action", error);
      await incrementRetries(action);
      failed++;
    }
  }

  if (success > 0) {
    dispatchQueueChanged();
  }

  return { success, failed };
}
