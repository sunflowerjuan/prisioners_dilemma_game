import express from "express";
import cors from "cors";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { PORT } from "./config.js";
import {
  addPlayerToRoom,
  canStart,
  createTeam,
  createRoom,
  deleteRoom,
  finishGame,
  getRoom,
  leavePlayer,
  markPlayerOffline,
  publicRoomState,
  reconnectPlayer,
  registerVote,
  renameTeam,
  resetGame,
  resolveRound,
  scheduleCurrentRound,
  startRound,
  updateRoomConfig
} from "./game.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "prisionero-game-server" });
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*"
  }
});

const socketPlayers = new Map();

function emitRoom(room) {
  io.to(room.code).emit("room:update", publicRoomState(room));
}

function fail(callback, error) {
  callback?.({ ok: false, message: error instanceof Error ? error.message : "Error inesperado" });
}

function resolveAndBroadcast(code) {
  const room = getRoom(code);
  if (!room) return;
  resolveRound(room);
  emitRoom(room);
}

io.on("connection", (socket) => {
  socket.on("room:create", (payload, callback) => {
    try {
      const { room, player } = createRoom(payload);
      socket.join(room.code);
      socketPlayers.set(socket.id, { roomCode: room.code, playerId: player.id });
      callback?.({ ok: true, room: publicRoomState(room), player });
      emitRoom(room);
    } catch (error) {
      fail(callback, error);
    }
  });

  socket.on("room:join", ({ roomCode, playerName, avatarId, teamId, teamName }, callback) => {
    try {
      const room = getRoom(roomCode);
      if (!room) throw new Error("La sala no existe.");
      const player = addPlayerToRoom(room, { playerName, avatarId, teamId, teamName });
      socket.join(room.code);
      socketPlayers.set(socket.id, { roomCode: room.code, playerId: player.id });
      callback?.({ ok: true, room: publicRoomState(room), player });
      emitRoom(room);
    } catch (error) {
      fail(callback, error);
    }
  });

  socket.on("room:peek", ({ roomCode }, callback) => {
    try {
      const room = getRoom(roomCode);
      if (!room) throw new Error("La sala no existe.");
      callback?.({ ok: true, room: publicRoomState(room) });
    } catch (error) {
      fail(callback, error);
    }
  });

  socket.on("room:reconnect", ({ roomCode, playerId }, callback) => {
    try {
      const room = getRoom(roomCode);
      if (!room) throw new Error("Sala no encontrada.");
      const player = reconnectPlayer(room, playerId);
      if (!player) throw new Error("Jugador no encontrado.");
      socket.join(room.code);
      socketPlayers.set(socket.id, { roomCode: room.code, playerId: player.id });
      callback?.({ ok: true, room: publicRoomState(room), player });
      emitRoom(room);
    } catch (error) {
      fail(callback, error);
    }
  });

  socket.on("room:leave", ({ roomCode, playerId }, callback) => {
    try {
      const room = getRoom(roomCode);
      if (!room) {
        socketPlayers.delete(socket.id);
        callback?.({ ok: true, deletedRoom: true });
        return;
      }

      const result = leavePlayer(room, playerId);
      socket.leave(roomCode);
      socketPlayers.delete(socket.id);
      callback?.({
        ok: true,
        deletedRoom: result.deletedRoom,
        removed: result.removed,
        downgradedToOffline: result.downgradedToOffline || false
      });

      if (result.room) {
        emitRoom(result.room);
      }
    } catch (error) {
      fail(callback, error);
    }
  });

  socket.on("admin:updateConfig", ({ roomCode, playerId, config }, callback) => {
    try {
      const room = getRoom(roomCode);
      if (!room || room.adminId !== playerId) throw new Error("No autorizado.");
      updateRoomConfig(room, config);
      callback?.({ ok: true });
      emitRoom(room);
    } catch (error) {
      fail(callback, error);
    }
  });

  socket.on("admin:createTeam", ({ roomCode, playerId, teamName }, callback) => {
    try {
      const room = getRoom(roomCode);
      if (!room || room.adminId !== playerId) throw new Error("No autorizado.");
      createTeam(room, teamName);
      callback?.({ ok: true });
      emitRoom(room);
    } catch (error) {
      fail(callback, error);
    }
  });

  socket.on("admin:renameTeam", ({ roomCode, playerId, teamId, teamName }, callback) => {
    try {
      const room = getRoom(roomCode);
      if (!room || room.adminId !== playerId) throw new Error("No autorizado.");
      renameTeam(room, teamId, teamName);
      callback?.({ ok: true });
      emitRoom(room);
    } catch (error) {
      fail(callback, error);
    }
  });

  socket.on("admin:startGame", ({ roomCode, playerId }, callback) => {
    try {
      const room = getRoom(roomCode);
      if (!room || room.adminId !== playerId) throw new Error("No autorizado.");
      if (!canStart(room)) throw new Error("Faltan equipos o jugadores mínimos para iniciar.");
      startRound(room);
      scheduleCurrentRound(room, resolveAndBroadcast);
      callback?.({ ok: true });
      emitRoom(room);
    } catch (error) {
      fail(callback, error);
    }
  });

  socket.on("admin:nextRound", ({ roomCode, playerId }, callback) => {
    try {
      const room = getRoom(roomCode);
      if (!room || room.adminId !== playerId) throw new Error("No autorizado.");
      if (room.status === "round") resolveRound(room);
      startRound(room);
      scheduleCurrentRound(room, resolveAndBroadcast);
      callback?.({ ok: true });
      emitRoom(room);
    } catch (error) {
      fail(callback, error);
    }
  });

  socket.on("admin:resolveRound", ({ roomCode, playerId }, callback) => {
    try {
      const room = getRoom(roomCode);
      if (!room || room.adminId !== playerId) throw new Error("No autorizado.");
      resolveRound(room);
      callback?.({ ok: true });
      emitRoom(room);
    } catch (error) {
      fail(callback, error);
    }
  });

  socket.on("admin:finishGame", ({ roomCode, playerId }, callback) => {
    try {
      const room = getRoom(roomCode);
      if (!room || room.adminId !== playerId) throw new Error("No autorizado.");
      finishGame(room);
      callback?.({ ok: true });
      emitRoom(room);
    } catch (error) {
      fail(callback, error);
    }
  });

  socket.on("admin:resetGame", ({ roomCode, playerId }, callback) => {
    try {
      const room = getRoom(roomCode);
      if (!room || room.adminId !== playerId) throw new Error("No autorizado.");
      resetGame(room);
      callback?.({ ok: true });
      emitRoom(room);
    } catch (error) {
      fail(callback, error);
    }
  });

  socket.on("admin:deleteRoom", ({ roomCode, playerId }, callback) => {
    try {
      const room = getRoom(roomCode);
      if (!room || room.adminId !== playerId) throw new Error("No autorizado.");
      io.to(room.code).emit("room:closed", {
        roomCode: room.code,
        message: "La sala fue eliminada por el administrador."
      });
      deleteRoom(room.code);
      callback?.({ ok: true, deletedRoom: true });
    } catch (error) {
      fail(callback, error);
    }
  });

  socket.on("player:vote", ({ roomCode, playerId, decision }, callback) => {
    try {
      const room = getRoom(roomCode);
      if (!room) throw new Error("Sala no encontrada.");
      registerVote(room, playerId, decision);
      callback?.({ ok: true });
      emitRoom(room);
    } catch (error) {
      fail(callback, error);
    }
  });

  socket.on("disconnect", () => {
    const socketPlayer = socketPlayers.get(socket.id);
    if (socketPlayer) {
      markPlayerOffline(socketPlayer.playerId);
      const room = getRoom(socketPlayer.roomCode);
      if (room) emitRoom(room);
    }
    socketPlayers.delete(socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
