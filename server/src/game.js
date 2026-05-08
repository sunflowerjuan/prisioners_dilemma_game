import { customAlphabet } from "nanoid";
import {
  DEFAULT_ROUND_DURATION,
  ROUND_MAX,
  ROUND_MIN,
  SCORE_MATRIX,
  TEAM_LIMIT
} from "./config.js";
import { saveRoom, saveRoundResult } from "./db.js";

const roomCode = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6);
const entityId = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 10);

const rooms = new Map();
const roomTimers = new Map();

function normalizeName(value, fallback) {
  const trimmed = String(value || "").trim();
  return trimmed || fallback;
}

function persistRoom(room) {
  saveRoom(serializableRoom(room)).catch((error) => {
    console.error("Failed to persist room", error);
  });
}

function persistRound(roomCode, roundNumber, payload) {
  saveRoundResult(roomCode, roundNumber, payload).catch((error) => {
    console.error("Failed to persist round", error);
  });
}

function now() {
  return new Date().toISOString();
}

function clampDuration(seconds) {
  return Math.max(ROUND_MIN, Math.min(ROUND_MAX, Number(seconds) || DEFAULT_ROUND_DURATION));
}

function shuffle(items) {
  const list = [...items];
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

function serializableRoom(room) {
  return JSON.parse(JSON.stringify(room));
}

function createBaseTeam(name, id = entityId()) {
  return {
    id,
    name: normalizeName(name, "Equipo"),
    playerIds: [],
    coins: 0,
    roundsWon: 0,
    stats: {
      cooperate: 0,
      betray: 0
    }
  };
}

function computeRanking(room) {
  const teams = room.teams
    .map((team) => ({
      teamId: team.id,
      teamName: team.name,
      coins: team.coins,
      roundsWon: team.roundsWon,
      players: team.playerIds.length
    }))
    .sort((a, b) => b.coins - a.coins || b.roundsWon - a.roundsWon || a.teamName.localeCompare(b.teamName));

  const players = room.players
    .map((player) => ({
      playerId: player.id,
      name: player.name,
      avatarId: player.avatarId,
      teamId: player.teamId,
      teamName: room.teams.find((team) => team.id === player.teamId)?.name ?? "Sin equipo",
      coins: player.coins,
      online: player.online
    }))
    .sort((a, b) => b.coins - a.coins || a.name.localeCompare(b.name));

  return { teams, players };
}

function majorityDecision(room, teamId) {
  const currentRound = room.currentRound;
  const teamVotes = room.players
    .filter((player) => player.teamId === teamId)
    .map((player) => currentRound.votes[player.id])
    .filter(Boolean);

  const cooperateCount = teamVotes.filter((vote) => vote === "cooperate").length;
  const betrayCount = teamVotes.filter((vote) => vote === "betray").length;

  if (betrayCount > cooperateCount) return "betray";
  if (cooperateCount > betrayCount) return "cooperate";
  return room.lastTeamDecisions[teamId] || "cooperate";
}

function scorePair(decisionA, decisionB) {
  return SCORE_MATRIX[`${decisionA}_${decisionB}`];
}

function generatePairings(room) {
  const teamIds = shuffle(room.teams.map((team) => team.id));
  const previousPairs = new Set(
    (room.lastPairings || []).map((pair) => `${pair[0]}:${pair[1]}`)
  );

  const pairs = [];
  while (teamIds.length > 1) {
    const first = teamIds.shift();
    let matchIndex = teamIds.findIndex((candidate) => {
      return !previousPairs.has(`${first}:${candidate}`) && !previousPairs.has(`${candidate}:${first}`);
    });
    if (matchIndex === -1) matchIndex = 0;
    const second = teamIds.splice(matchIndex, 1)[0];
    pairs.push([first, second]);
  }

  if (teamIds.length === 1) {
    pairs.push([teamIds[0], null]);
  }

  room.lastPairings = pairs;
  return pairs;
}

function clearRoomTimer(code) {
  const timer = roomTimers.get(code);
  if (timer) clearTimeout(timer);
  roomTimers.delete(code);
}

function scheduleRoundEnd(room, onExpire) {
  clearRoomTimer(room.code);
  const ms = Math.max(0, room.currentRound.endsAt - Date.now());
  const timer = setTimeout(() => onExpire(room.code), ms);
  roomTimers.set(room.code, timer);
}

function applyCoins(room, teamId, delta) {
  const team = room.teams.find((item) => item.id === teamId);
  if (!team) return;

  team.coins += delta;
  team.playerIds.forEach((playerId) => {
    const player = room.players.find((item) => item.id === playerId);
    if (player) player.coins += delta;
  });
}

export function getRoom(code) {
  return rooms.get(code.toUpperCase());
}

export function createRoom({ playerName, avatarId, teamName }) {
  const code = roomCode();
  const adminId = entityId();
  const team = createBaseTeam(teamName || "Alpha Corp");
  const player = {
    id: adminId,
    name: playerName,
    avatarId,
    teamId: team.id,
    isAdmin: true,
    coins: 0,
    history: [],
    online: true,
    connectedAt: now()
  };

  team.playerIds.push(player.id);

  const room = {
    code,
    createdAt: now(),
    status: "lobby",
    adminId,
    config: {
      roundDuration: DEFAULT_ROUND_DURATION,
      minPlayersPerTeam: 1,
      maxPlayersPerTeam: TEAM_LIMIT
    },
    teams: [team],
    players: [player],
    roundNumber: 0,
    currentRound: null,
    history: [],
    lastPairings: [],
    lastTeamDecisions: {},
    chat: [],
    gameSummary: null
  };

  rooms.set(code, room);
  persistRoom(room);
  return { room, player };
}

export function addPlayerToRoom(room, { playerName, avatarId, teamId, teamName }) {
  const selectedTeam =
    room.teams.find((team) => team.id === teamId) ||
    (teamName ? room.teams.find((team) => team.name.toLowerCase() === teamName.toLowerCase()) : null);

  let team = selectedTeam;
  if (!team) {
    team = createBaseTeam(teamName || `Equipo ${room.teams.length + 1}`);
    room.teams.push(team);
  }

  if (team.playerIds.length >= room.config.maxPlayersPerTeam) {
    throw new Error("Ese equipo ya está lleno.");
  }

  const player = {
    id: entityId(),
    name: playerName,
    avatarId,
    teamId: team.id,
    isAdmin: false,
    coins: 0,
    history: [],
    online: true,
    connectedAt: now()
  };

  team.playerIds.push(player.id);
  room.players.push(player);
  persistRoom(room);
  return player;
}

export function createTeam(room, teamName) {
  if (!["lobby", "finished"].includes(room.status)) {
    throw new Error("Solo puedes crear equipos antes de iniciar o cuando el juego ya termino.");
  }

  const finalName = normalizeName(teamName, `Equipo ${room.teams.length + 1}`);
  const duplicated = room.teams.some(
    (team) => team.name.toLowerCase() === finalName.toLowerCase()
  );

  if (duplicated) {
    throw new Error("Ya existe un equipo con ese nombre.");
  }

  const team = createBaseTeam(finalName);
  room.teams.push(team);
  persistRoom(room);
  return team;
}

export function renameTeam(room, teamId, teamName) {
  if (!["lobby", "finished"].includes(room.status)) {
    throw new Error("Solo puedes editar equipos antes de iniciar o cuando el juego ya termino.");
  }

  const team = room.teams.find((item) => item.id === teamId);
  if (!team) {
    throw new Error("Equipo no encontrado.");
  }

  const finalName = normalizeName(teamName, team.name);
  const duplicated = room.teams.some(
    (item) => item.id !== teamId && item.name.toLowerCase() === finalName.toLowerCase()
  );

  if (duplicated) {
    throw new Error("Ya existe un equipo con ese nombre.");
  }

  team.name = finalName;
  persistRoom(room);
  return team;
}

export function reconnectPlayer(room, playerId) {
  const player = room.players.find((item) => item.id === playerId);
  if (!player) return null;
  player.online = true;
  persistRoom(room);
  return player;
}

export function markPlayerOffline(playerId) {
  rooms.forEach((room) => {
    const player = room.players.find((item) => item.id === playerId);
    if (player) {
      player.online = false;
      persistRoom(room);
    }
  });
}

export function leavePlayer(room, playerId) {
  const player = room.players.find((item) => item.id === playerId);
  if (!player) {
    return { room, removed: false, deletedRoom: false };
  }

  if (room.status === "round") {
    player.online = false;
    persistRoom(room);
    return { room, removed: false, deletedRoom: false, downgradedToOffline: true };
  }

  room.players = room.players.filter((item) => item.id !== playerId);
  room.teams.forEach((team) => {
    team.playerIds = team.playerIds.filter((id) => id !== playerId);
  });
  room.teams = room.teams.filter((team) => team.playerIds.length > 0);

  if (room.players.length === 0) {
    clearRoomTimer(room.code);
    rooms.delete(room.code);
    return { room: null, removed: true, deletedRoom: true };
  }

  if (room.adminId === playerId) {
    const nextAdmin = room.players[0];
    room.players.forEach((item) => {
      item.isAdmin = item.id === nextAdmin.id;
    });
    room.adminId = nextAdmin.id;
  }

  if (!room.teams.find((team) => team.id === room.players[0]?.teamId) && room.teams.length === 0) {
    clearRoomTimer(room.code);
    rooms.delete(room.code);
    return { room: null, removed: true, deletedRoom: true };
  }

  persistRoom(room);
  return { room, removed: true, deletedRoom: false };
}

export function updateRoomConfig(room, payload) {
  if (payload.roundDuration) {
    room.config.roundDuration = clampDuration(payload.roundDuration);
  }
  if (payload.minPlayersPerTeam) {
    room.config.minPlayersPerTeam = Math.max(1, Number(payload.minPlayersPerTeam));
  }
  persistRoom(room);
}

export function canStart(room) {
  if (room.teams.length < 2) return false;
  return room.teams.every((team) => team.playerIds.length >= room.config.minPlayersPerTeam);
}

export function startRound(room) {
  room.roundNumber += 1;
  room.status = "round";
  room.currentRound = {
    number: room.roundNumber,
    startedAt: Date.now(),
    endsAt: Date.now() + room.config.roundDuration * 1000,
    votes: {},
    results: null,
    pairings: generatePairings(room)
  };
  persistRoom(room);
  return room.currentRound;
}

export function registerVote(room, playerId, decision) {
  if (room.status !== "round" || !room.currentRound) {
    throw new Error("No hay una ronda activa.");
  }

  if (!["cooperate", "betray"].includes(decision)) {
    throw new Error("Decisión inválida.");
  }

  if (room.currentRound.votes[playerId]) {
    throw new Error("Tu voto ya fue registrado.");
  }

  room.currentRound.votes[playerId] = decision;
  persistRoom(room);
}

export function resolveRound(room) {
  if (!room.currentRound || room.status !== "round") return room;

  clearRoomTimer(room.code);
  const teamDecisions = Object.fromEntries(
    room.teams.map((team) => [team.id, majorityDecision(room, team.id)])
  );

  const pairResults = room.currentRound.pairings.map(([teamAId, teamBId]) => {
    const teamA = room.teams.find((item) => item.id === teamAId);
    if (!teamBId) {
      return {
        teamAId,
        teamAName: teamA?.name,
        teamBId: null,
        teamBName: "Descansa",
        decisionA: teamDecisions[teamAId],
        decisionB: null,
        deltaA: 0,
        deltaB: 0,
        winner: teamAId
      };
    }

    const teamB = room.teams.find((item) => item.id === teamBId);
    const decisionA = teamDecisions[teamAId];
    const decisionB = teamDecisions[teamBId];
    const score = scorePair(decisionA, decisionB);
    applyCoins(room, teamAId, score.a);
    applyCoins(room, teamBId, score.b);

    if (score.a > score.b && teamA) teamA.roundsWon += 1;
    if (score.b > score.a && teamB) teamB.roundsWon += 1;
    if (decisionA === "cooperate") teamA.stats.cooperate += 1;
    else teamA.stats.betray += 1;
    if (decisionB === "cooperate") teamB.stats.cooperate += 1;
    else teamB.stats.betray += 1;

    return {
      teamAId,
      teamAName: teamA?.name,
      teamBId,
      teamBName: teamB?.name,
      decisionA,
      decisionB,
      deltaA: score.a,
      deltaB: score.b,
      winner: score.a === score.b ? null : score.a > score.b ? teamAId : teamBId
    };
  });

  room.players.forEach((player) => {
    const teamDecision = teamDecisions[player.teamId];
    const pair = pairResults.find(
      (result) => result.teamAId === player.teamId || result.teamBId === player.teamId
    );
    const rivalDecision =
      pair?.teamAId === player.teamId ? pair?.decisionB : pair?.decisionA;
    const coinsDelta = pair?.teamAId === player.teamId ? pair?.deltaA ?? 0 : pair?.deltaB ?? 0;
    player.history.unshift({
      round: room.roundNumber,
      vote: room.currentRound.votes[player.id] || null,
      teamDecision,
      rivalDecision,
      coinsDelta
    });
    player.history = player.history.slice(0, 10);
  });

  room.lastTeamDecisions = teamDecisions;
  room.currentRound.results = {
    teamDecisions,
    pairResults,
    ranking: computeRanking(room)
  };
  room.history.unshift(room.currentRound.results);
  room.history = room.history.slice(0, 20);
  room.status = "results";

  persistRound(room.code, room.roundNumber, room.currentRound.results);
  persistRoom(room);
  return room;
}

export function scheduleCurrentRound(room, onExpire) {
  scheduleRoundEnd(room, onExpire);
}

export function finishGame(room) {
  if (room.status === "round") {
    resolveRound(room);
  }

  const ranking = computeRanking(room);
  const winner = ranking.teams[0] || null;
  const mvp = ranking.players[0] || null;
  const totalTeamCooperate = room.teams.reduce((sum, team) => sum + team.stats.cooperate, 0);
  const totalTeamBetray = room.teams.reduce((sum, team) => sum + team.stats.betray, 0);
  const totalDecisions = totalTeamCooperate + totalTeamBetray || 1;

  room.gameSummary = {
    ranking,
    winner,
    mvp,
    totalRounds: room.roundNumber,
    cooperateRate: Math.round((totalTeamCooperate / totalDecisions) * 100),
    betrayRate: Math.round((totalTeamBetray / totalDecisions) * 100)
  };
  room.status = "finished";
  clearRoomTimer(room.code);
  persistRoom(room);
}

export function resetGame(room) {
  clearRoomTimer(room.code);
  room.status = "lobby";
  room.roundNumber = 0;
  room.currentRound = null;
  room.history = [];
  room.lastPairings = [];
  room.lastTeamDecisions = {};
  room.gameSummary = null;
  room.teams.forEach((team) => {
    team.coins = 0;
    team.roundsWon = 0;
    team.stats = { cooperate: 0, betray: 0 };
  });
  room.players.forEach((player) => {
    player.coins = 0;
    player.history = [];
  });
  persistRoom(room);
}

export function publicRoomState(room) {
  return {
    code: room.code,
    createdAt: room.createdAt,
    status: room.status,
    adminId: room.adminId,
    config: room.config,
    roundNumber: room.roundNumber,
    teams: room.teams.map((team) => ({
      ...team,
      onlinePlayers: team.playerIds.filter((id) => room.players.find((player) => player.id === id)?.online).length
    })),
    players: room.players,
    currentRound: room.currentRound
      ? {
          ...room.currentRound,
          secondsRemaining: Math.max(0, Math.ceil((room.currentRound.endsAt - Date.now()) / 1000))
        }
      : null,
    history: room.history,
    gameSummary: room.gameSummary,
    ranking: computeRanking(room)
  };
}
