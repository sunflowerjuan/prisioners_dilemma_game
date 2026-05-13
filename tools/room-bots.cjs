const fs = require("node:fs");
const path = require("node:path");
const { io } = require("socket.io-client");

const backendUrl = process.argv[2];
const roomCode = (process.argv[3] || "").toUpperCase();
const requestedCount = Number(process.argv[4] || 0);
const transports = (process.env.BOT_TRANSPORTS || "websocket,polling")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

if (!backendUrl || !roomCode) {
  console.error("Usage: node tools/room-bots.cjs <backendUrl> <roomCode> [count]");
  process.exit(1);
}

const avatars = [
  "duck-chief",
  "jojo-segundo",
  "neon-bot",
  "pixel-punk",
  "byte-ghost",
  "arcade-ninja"
];

const names = [
  "Jotaro Bot",
  "Kakyoin Bot",
  "Polnareff Bot",
  "Iggy Bot",
  "Avdol Bot",
  "Dio Bot",
  "Josuke Bot",
  "Okuyasu Bot",
  "Koichi Bot",
  "Bruno Bot",
  "Mista Bot",
  "Narancia Bot",
  "Giorno Bot",
  "Jolyne Bot",
  "Weather Bot",
  "Pucci Bot",
  "Johnny Bot",
  "Gyro Bot",
  "Diego Bot",
  "Lucy Bot"
];

const sockets = [];

function onceAck(socket, event, payload) {
  return new Promise((resolve) => {
    socket.emit(event, payload, (response) => resolve(response));
  });
}

async function connectSocket() {
  const socket = io(backendUrl, {
    transports,
    reconnection: true
  });

  await new Promise((resolve, reject) => {
    socket.on("connect", resolve);
    socket.on("connect_error", reject);
  });

  return socket;
}

async function main() {
  const probe = await connectSocket();
  const peek = await onceAck(probe, "room:peek", { roomCode });
  probe.close();

  if (!peek?.ok) {
    throw new Error(peek?.message || "No se pudo leer la sala.");
  }

  const room = peek.room;
  const teams = room.teams.map((team) => ({
    id: team.id,
    name: team.name,
    freeSlots: Math.max(0, room.config.maxPlayersPerTeam - team.playerIds.length)
  }));

  const capacity = teams.reduce((sum, team) => sum + team.freeSlots, 0);
  const targetCount = requestedCount > 0 ? Math.min(requestedCount, capacity) : capacity;

  if (targetCount <= 0) {
    console.log(`No hay cupos disponibles en la sala ${roomCode}.`);
    return;
  }

  console.log(`Sala ${roomCode}: agregando ${targetCount} bots de ${capacity} cupos libres.`);

  let joined = 0;
  let nameIndex = 0;

  for (const team of teams) {
    for (let slot = 0; slot < team.freeSlots && joined < targetCount; slot += 1) {
      const socket = await connectSocket();
      const suffix = String(joined + 1).padStart(2, "0");
      const playerName = `${names[nameIndex % names.length]} ${suffix}`;
      const avatarId = avatars[joined % avatars.length];
      nameIndex += 1;

      const response = await onceAck(socket, "room:join", {
        roomCode,
        playerName,
        avatarId,
        teamId: team.id
      });

      if (!response?.ok) {
        console.error(`No se pudo unir ${playerName}: ${response?.message || "error"}`);
        socket.close();
        continue;
      }

      sockets.push(socket);
      joined += 1;
      console.log(`+ ${playerName} -> ${team.name}`);
    }
  }

  console.log(`Bots conectados y vivos: ${joined}`);

  setInterval(() => {
    console.log(`[${new Date().toISOString()}] ${sockets.length} bots activos en ${roomCode}`);
  }, 30000);
}

process.on("SIGINT", () => {
  sockets.forEach((socket) => socket.close());
  process.exit(0);
});

process.on("SIGTERM", () => {
  sockets.forEach((socket) => socket.close());
  process.exit(0);
});

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
