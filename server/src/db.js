import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(currentDir, "..", "data");
const storageFile = path.join(dataDir, "storage.json");

fs.mkdirSync(dataDir, { recursive: true });

let initialized = false;
let writeQueue = Promise.resolve();
let storage = {
  rooms: {},
  roundResults: []
};

function loadStorage() {
  if (initialized) return;

  if (fs.existsSync(storageFile)) {
    try {
      const raw = fs.readFileSync(storageFile, "utf8");
      const parsed = JSON.parse(raw);
      storage = {
        rooms: parsed.rooms || {},
        roundResults: Array.isArray(parsed.roundResults) ? parsed.roundResults : []
      };
    } catch (error) {
      console.error("Failed to read storage.json, starting with empty storage", error);
    }
  }

  initialized = true;
}

function persistStorage() {
  const snapshot = JSON.stringify(storage);
  writeQueue = writeQueue
    .then(() => fs.promises.writeFile(storageFile, snapshot))
    .catch((error) => {
      console.error("Failed to persist storage.json", error);
    });

  return writeQueue;
}

export async function saveRoom(room) {
  loadStorage();
  storage.rooms[room.code] = {
    code: room.code,
    createdAt: room.createdAt,
    config: room.config,
    latestState: room
  };
  await persistStorage();
}

export async function saveRoundResult(roomCode, roundNumber, payload) {
  loadStorage();
  storage.roundResults.push({
    roomCode,
    roundNumber,
    createdAt: new Date().toISOString(),
    payload
  });

  if (storage.roundResults.length > 1000) {
    storage.roundResults = storage.roundResults.slice(-1000);
  }

  await persistStorage();
}
