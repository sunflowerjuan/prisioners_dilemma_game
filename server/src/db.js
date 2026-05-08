import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(currentDir, "..", "data", "pglite");
fs.mkdirSync(dataDir, { recursive: true });

const db = new PGlite(dataDir);

let initialized = false;

async function init() {
  if (initialized) return;
  await db.exec(`
    CREATE TABLE IF NOT EXISTS rooms (
      code TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      config_json TEXT NOT NULL,
      latest_state_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS round_results (
      id SERIAL PRIMARY KEY,
      room_code TEXT NOT NULL,
      round_number INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      payload_json TEXT NOT NULL
    );
  `);
  initialized = true;
}

export async function saveRoom(room) {
  await init();
  await db.query(
    `
      INSERT INTO rooms (code, created_at, config_json, latest_state_json)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (code)
      DO UPDATE SET
        config_json = EXCLUDED.config_json,
        latest_state_json = EXCLUDED.latest_state_json
    `,
    [room.code, room.createdAt, JSON.stringify(room.config), JSON.stringify(room)]
  );
}

export async function saveRoundResult(roomCode, roundNumber, payload) {
  await init();
  await db.query(
    `
      INSERT INTO round_results (room_code, round_number, created_at, payload_json)
      VALUES ($1, $2, $3, $4)
    `,
    [roomCode, roundNumber, new Date().toISOString(), JSON.stringify(payload)]
  );
}
