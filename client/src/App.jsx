import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { AVATARS, DEFAULT_TEAMS, TEAM_LIMIT } from "./lib/constants";
import { socket } from "./lib/socket";

const STORAGE_KEY = "prisionero-game-session";

const decisionLabels = {
  cooperate: "Cooperar",
  betray: "Traicionar"
};

function saveSession(session) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

function loadSession() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
  } catch {
    return null;
  }
}

function PixelAvatar({ avatarId, size = "md" }) {
  const avatar = AVATARS.find((item) => item.id === avatarId) || AVATARS[0];
  const sizing = {
    sm: "h-12 w-12",
    md: "h-16 w-16",
    lg: "h-20 w-20"
  };

  return (
    <div
      className={clsx(
        "relative overflow-hidden rounded-none border-2 border-white/20 shadow-arcade animate-floaty",
        sizing[size]
      )}
      style={{
        background: `linear-gradient(180deg, ${avatar.accent}, ${avatar.skin})`
      }}
    >
      <div className="absolute inset-x-3 top-3 h-3 bg-black/70" />
      <div
        className="absolute inset-x-2 top-4 h-2"
        style={{ backgroundColor: avatar.visor }}
      />
      <div className="absolute left-2 top-8 h-2 w-2 bg-[#111]" />
      <div className="absolute right-2 top-8 h-2 w-2 bg-[#111]" />
      <div className="absolute left-3 right-3 top-11 h-1 bg-[#111]" />
    </div>
  );
}

function ArcadeButton({ children, className, variant = "primary", ...props }) {
  const variants = {
    primary: "bg-neonBlue text-ink",
    danger: "bg-neonPink text-white",
    lime: "bg-neonLime text-ink",
    dark: "bg-[#0f1530] text-neonBlue"
  };

  return (
    <button
      className={clsx(
        "rounded-none border-b-4 border-r-4 border-black/50 px-4 py-3 font-pixel text-[10px] uppercase tracking-wide transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function Panel({ children, className }) {
  return (
    <div
      className={clsx(
        "relative overflow-hidden rounded-none border border-white/10 bg-[#0b1025]/90 p-4 shadow-panel backdrop-blur",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(transparent_0%,rgba(84,247,255,0.06)_50%,transparent_100%)] opacity-60" />
      {children}
    </div>
  );
}

function MiniStat({ label, value, tone = "blue" }) {
  const tones = {
    blue: "text-neonBlue",
    pink: "text-neonPink",
    lime: "text-neonLime",
    gold: "text-arcadeGold"
  };

  return (
    <div className="rounded-none border border-white/10 bg-black/20 p-3">
      <div className="font-pixel text-[9px] text-white/60">{label}</div>
      <div className={clsx("mt-2 font-pixel text-sm", tones[tone])}>{value}</div>
    </div>
  );
}

function JoinScreen({ form, setForm, mode, setMode, room, onCreate, onJoin, loading, error }) {
  const teams = room?.teams?.length ? room.teams : DEFAULT_TEAMS;

  return (
    <div className="mx-auto grid min-h-screen max-w-7xl gap-8 px-4 py-8 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="flex flex-col justify-center">
        <div className="mb-6 inline-flex w-fit border border-neonPink/60 bg-neonPink/10 px-3 py-2 font-pixel text-[10px] text-neonPink">
          Multiplayer Corporate Prisoner Arcade
        </div>
        <h1 className="max-w-3xl font-pixel text-3xl leading-tight text-white md:text-5xl">
          PRISIONERO
          <span className="block text-neonBlue">GAME</span>
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-white/70">
          Equipos empresariales votan en tiempo real, compiten 1 vs 1 y sobreviven ronda a ronda con estrategia, traición y coins.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <MiniStat label="Tiempo real" value="Socket.IO" tone="blue" />
          <MiniStat label="Jugadores por equipo" value={`Hasta ${TEAM_LIMIT}`} tone="pink" />
          <MiniStat label="Estilo" value="Retro Neon" tone="lime" />
        </div>
      </section>

      <Panel className="self-center p-6">
        <div className="flex gap-3">
          <ArcadeButton
            variant={mode === "create" ? "lime" : "dark"}
            className="flex-1"
            onClick={() => setMode("create")}
          >
            Crear sala
          </ArcadeButton>
          <ArcadeButton
            variant={mode === "join" ? "lime" : "dark"}
            className="flex-1"
            onClick={() => setMode("join")}
          >
            Unirse
          </ArcadeButton>
        </div>

        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-2 block font-pixel text-[10px] text-white/70">Nombre</span>
            <input
              className="arcade-input"
              value={form.playerName}
              maxLength={24}
              onChange={(event) => setForm((current) => ({ ...current, playerName: event.target.value }))}
              placeholder="Tu alias corporativo"
            />
          </label>

          {mode === "join" && (
            <label className="block">
              <span className="mb-2 block font-pixel text-[10px] text-white/70">Código de sala</span>
              <input
                className="arcade-input uppercase"
                value={form.roomCode}
                maxLength={6}
                onChange={(event) => setForm((current) => ({ ...current, roomCode: event.target.value.toUpperCase() }))}
                placeholder="ABC123"
              />
            </label>
          )}

          <label className="block">
            <span className="mb-2 block font-pixel text-[10px] text-white/70">Nombre del equipo</span>
            <input
              className="arcade-input"
              value={form.teamName}
              maxLength={24}
              onChange={(event) => setForm((current) => ({ ...current, teamName: event.target.value }))}
              placeholder={mode === "create" ? "Alpha Corp" : "Crear nuevo o dejar el existente"}
            />
          </label>

          <div>
            <div className="mb-2 font-pixel text-[10px] text-white/70">Equipos en la sala</div>
            <div className="grid gap-2 sm:grid-cols-2">
              {teams.map((team) => (
                <button
                  type="button"
                  key={team.id}
                  className={clsx(
                    "rounded-none border px-3 py-3 text-left font-body",
                    form.teamId === team.id
                      ? "border-neonBlue bg-neonBlue/10 text-neonBlue"
                      : "border-white/10 bg-black/20 text-white/70"
                  )}
                  onClick={() => setForm((current) => ({ ...current, teamId: team.id, teamName: team.name }))}
                >
                  <div className="font-pixel text-[10px]">{team.name}</div>
                  {"playerIds" in team && (
                    <div className="mt-2 text-sm">{team.playerIds.length} jugadores</div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-3 font-pixel text-[10px] text-white/70">Avatar pixel</div>
            <div className="grid grid-cols-3 gap-3">
              {AVATARS.map((avatar) => (
                <button
                  type="button"
                  key={avatar.id}
                  className={clsx(
                    "rounded-none border p-2",
                    form.avatarId === avatar.id ? "border-neonPink bg-neonPink/10" : "border-white/10 bg-black/20"
                  )}
                  onClick={() => setForm((current) => ({ ...current, avatarId: avatar.id }))}
                >
                  <div className="mx-auto w-fit">
                    <PixelAvatar avatarId={avatar.id} size="sm" />
                  </div>
                  <div className="mt-2 text-center font-pixel text-[8px] text-white/70">{avatar.name}</div>
                </button>
              ))}
            </div>
          </div>

          {error && <div className="border border-neonPink/40 bg-neonPink/10 p-3 text-sm text-neonPink">{error}</div>}

          <ArcadeButton
            variant="primary"
            className="w-full justify-center"
            disabled={loading}
            onClick={mode === "create" ? onCreate : onJoin}
          >
            {loading ? "Conectando..." : mode === "create" ? "Crear partida" : "Entrar a sala"}
          </ArcadeButton>
        </div>
      </Panel>
    </div>
  );
}

function TeamCard({ team, room, selectedTeamId }) {
  return (
    <Panel className={clsx(team.id === selectedTeamId && "animate-glow")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-pixel text-xs text-neonBlue">{team.name}</div>
          <div className="mt-2 text-sm text-white/60">
            {team.playerIds.length} jugadores · {team.onlinePlayers} online
          </div>
        </div>
        <div className="font-pixel text-lg text-arcadeGold">{team.coins}c</div>
      </div>

      <div className="mt-4 space-y-2">
        {team.playerIds.map((playerId) => {
          const player = room.players.find((entry) => entry.id === playerId);
          if (!player) return null;
          return (
            <div key={player.id} className="flex items-center justify-between border border-white/10 bg-black/20 p-2">
              <div className="flex items-center gap-2">
                <PixelAvatar avatarId={player.avatarId} size="sm" />
                <div>
                  <div className="font-pixel text-[9px] text-white">{player.name}</div>
                  <div className="mt-1 text-xs text-white/60">{player.online ? "Conectado" : "Desconectado"}</div>
                </div>
              </div>
              <div className="font-pixel text-[10px] text-neonLime">{player.coins}c</div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function ResultsBoard({ room, player }) {
  const lastResult = room.currentRound?.results || room.history[0];
  const myEntry = room.ranking.players.find((entry) => entry.playerId === player.id);
  const myRankIndex = room.ranking.players.findIndex((entry) => entry.playerId === player.id);

  if (!lastResult) {
    return (
      <Panel>
        <div className="font-pixel text-xs text-white/70">Todavía no hay resultados.</div>
      </Panel>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
      <Panel>
        <div className="font-pixel text-xs text-neonPink">Resultado de la ronda {room.roundNumber}</div>
        <div className="mt-4 space-y-3">
          {lastResult.pairResults.map((pair) => (
            <div key={`${pair.teamAId}-${pair.teamBId || "bye"}`} className="border border-white/10 bg-black/20 p-3">
              <div className="font-pixel text-[10px] text-white">
                {pair.teamAName} vs {pair.teamBName}
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <div className="rounded-none border border-neonBlue/20 bg-neonBlue/5 p-3">
                  <div className="text-xs text-white/60">Decisión {pair.teamAName}</div>
                  <div className="mt-2 font-pixel text-[10px] text-neonBlue">
                    {decisionLabels[pair.decisionA] || "Descansa"}
                  </div>
                  <div className="mt-2 text-sm text-arcadeGold">{pair.deltaA >= 0 ? "+" : ""}{pair.deltaA} coins</div>
                </div>
                <div className="rounded-none border border-neonPink/20 bg-neonPink/5 p-3">
                  <div className="text-xs text-white/60">Decisión {pair.teamBName}</div>
                  <div className="mt-2 font-pixel text-[10px] text-neonPink">
                    {decisionLabels[pair.decisionB] || "Descansa"}
                  </div>
                  <div className="mt-2 text-sm text-arcadeGold">{pair.deltaB >= 0 ? "+" : ""}{pair.deltaB} coins</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <div className="space-y-4">
        <Panel>
          <div className="font-pixel text-xs text-neonLime">Tu estado</div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <MiniStat label="Coins" value={`${myEntry?.coins ?? 0}c`} tone="gold" />
            <MiniStat label="Ranking" value={`#${myRankIndex >= 0 ? myRankIndex + 1 : "-"}`} tone="pink" />
          </div>
        </Panel>

        <Panel>
          <div className="font-pixel text-xs text-neonBlue">Ranking global</div>
          <div className="mt-4 space-y-2">
            {room.ranking.teams.map((team, index) => (
              <div key={team.teamId} className="flex items-center justify-between border border-white/10 bg-black/20 px-3 py-2">
                <div>
                  <div className="font-pixel text-[9px] text-white">
                    #{index + 1} {team.teamName}
                  </div>
                  <div className="mt-1 text-xs text-white/60">{team.roundsWon} rondas ganadas</div>
                </div>
                <div className="font-pixel text-[10px] text-arcadeGold">{team.coins}c</div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function GameFinished({ room }) {
  const summary = room.gameSummary;
  if (!summary) return null;

  return (
    <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
      <Panel>
        <div className="font-pixel text-sm text-neonLime">Juego finalizado</div>
        <div className="mt-4 text-3xl font-pixel text-white">{summary.winner?.teamName || "Sin ganador"}</div>
        <div className="mt-2 text-white/70">Equipo líder del torneo corporativo.</div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <MiniStat label="Rondas" value={summary.totalRounds} tone="blue" />
          <MiniStat label="% Cooperación" value={`${summary.cooperateRate}%`} tone="lime" />
          <MiniStat label="% Traición" value={`${summary.betrayRate}%`} tone="pink" />
        </div>
      </Panel>

      <Panel>
        <div className="font-pixel text-xs text-neonPink">MVP</div>
        <div className="mt-4 flex items-center gap-4">
          <PixelAvatar avatarId="cyber-fox" size="lg" />
          <div>
            <div className="font-pixel text-sm text-white">{summary.mvp?.name || "N/A"}</div>
            <div className="mt-2 text-white/60">{summary.mvp?.teamName || "Sin equipo"}</div>
            <div className="mt-2 font-pixel text-[10px] text-arcadeGold">{summary.mvp?.coins || 0} coins</div>
          </div>
        </div>
      </Panel>
    </div>
  );
}

export default function App() {
  const [room, setRoom] = useState(null);
  const [roomPreview, setRoomPreview] = useState(null);
  const [player, setPlayer] = useState(null);
  const [mode, setMode] = useState("create");
  const [form, setForm] = useState({
    playerName: "",
    roomCode: "",
    teamId: "",
    teamName: "",
    avatarId: AVATARS[0].id
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(false);
  const timerRef = useRef(null);
  const currentRound = room?.currentRound;
  const roundSecondsRemaining = room?.currentRound?.secondsRemaining;
  const roundEndsAt = room?.currentRound?.endsAt;

  useEffect(() => {
    const session = loadSession();
    if (session?.roomCode && session?.playerId) {
      socket.emit("room:reconnect", session, (response) => {
        if (response?.ok) {
          setRoom(response.room);
          setPlayer(response.player);
        }
      });
    }

    socket.on("room:update", (nextRoom) => {
      setRoom(nextRoom);
    });

    return () => {
      socket.off("room:update");
    };
  }, []);

  useEffect(() => {
    if (mode !== "join" || form.roomCode.trim().length !== 6) return;

    const timeout = setTimeout(() => {
      socket.emit("room:peek", { roomCode: form.roomCode.trim() }, (response) => {
        if (response?.ok) setRoomPreview(response.room);
        else setRoomPreview(null);
      });
    }, 250);

    return () => clearTimeout(timeout);
  }, [form.roomCode, mode]);

  const visiblePreview = mode === "join" && form.roomCode.trim().length === 6 ? roomPreview : null;

  useEffect(() => {
    if (!soundEnabled || room?.status !== "round") return;
    if (roundSecondsRemaining > 5 || roundSecondsRemaining === 0) return;
    const audioCtx = new window.AudioContext();
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = "square";
    oscillator.frequency.value = 320;
    gain.gain.value = 0.03;
    oscillator.connect(gain);
    gain.connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.08);
    return () => audioCtx.close();
  }, [roundSecondsRemaining, room?.status, soundEnabled]);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (room?.status !== "round" || !currentRound) return;

    timerRef.current = setInterval(() => {
      setRoom((current) => {
        if (!current?.currentRound) return current;
        const secondsRemaining = Math.max(0, Math.ceil((current.currentRound.endsAt - Date.now()) / 1000));
        return {
          ...current,
          currentRound: {
            ...current.currentRound,
            secondsRemaining
          }
        };
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [currentRound, room?.status, roundEndsAt]);

  const myTeam = useMemo(
    () => room?.teams.find((team) => team.id === player?.teamId),
    [room, player]
  );

  const myVote = room?.currentRound?.votes?.[player?.id];
  const isAdmin = player?.isAdmin;
  const roundResults = room?.currentRound?.results;

  function validateForm() {
    if (!form.playerName.trim()) return "Escribe un nombre.";
    if (mode === "join" && !form.roomCode.trim()) return "Ingresa el código de sala.";
    return "";
  }

  function handleResponse(response) {
    if (!response?.ok) {
      setError(response?.message || "No se pudo completar la acción.");
      return;
    }
    setRoom(response.room);
    setPlayer(response.player);
    saveSession({ roomCode: response.room.code, playerId: response.player.id });
    setError("");
  }

  function createRoomAction() {
    const validation = validateForm();
    if (validation) return setError(validation);
    setLoading(true);
    socket.emit(
      "room:create",
      {
        playerName: form.playerName.trim(),
        avatarId: form.avatarId,
        teamName: form.teamName.trim() || "Alpha Corp"
      },
      (response) => {
        setLoading(false);
        handleResponse(response);
      }
    );
  }

  function joinRoomAction() {
    const validation = validateForm();
    if (validation) return setError(validation);
    setLoading(true);
    socket.emit(
      "room:join",
      {
        roomCode: form.roomCode.trim(),
        playerName: form.playerName.trim(),
        avatarId: form.avatarId,
        teamId: form.teamId || undefined,
        teamName: form.teamName.trim() || undefined
      },
      (response) => {
        setLoading(false);
        handleResponse(response);
      }
    );
  }

  function emitAdmin(event, payload = {}) {
    socket.emit(event, { roomCode: room.code, playerId: player.id, ...payload }, (response) => {
      if (!response?.ok) setError(response?.message || "No se pudo ejecutar la acción.");
      else setError("");
    });
  }

  function emitVote(decision) {
    socket.emit("player:vote", { roomCode: room.code, playerId: player.id, decision }, (response) => {
      if (!response?.ok) setError(response?.message || "No se pudo registrar el voto.");
      else setError("");
    });
  }

  if (!room || !player) {
    return (
      <div className="min-h-screen bg-ink text-white">
        <div className="crt-layer" />
        <JoinScreen
          form={form}
          setForm={setForm}
          mode={mode}
          setMode={setMode}
          room={visiblePreview}
          onCreate={createRoomAction}
          onJoin={joinRoomAction}
          loading={loading}
          error={error}
        />
      </div>
    );
  }

  const currentPlayerIndex = room.ranking.players.findIndex((entry) => entry.playerId === player.id);
  const currentPlayerRanking = currentPlayerIndex >= 0 ? currentPlayerIndex + 1 : "-";
  const teamHistory = player.history || [];

  return (
    <div className="min-h-screen bg-ink px-4 py-4 text-white md:px-6">
      <div className="crt-layer" />
      <div className="mx-auto flex max-w-7xl flex-col gap-4">
        <Panel className="overflow-visible">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <div className="font-pixel text-xs text-neonBlue">Sala {room.code}</div>
                <div className="mt-2 text-white/70">
                  Estado: <span className="font-pixel text-[10px] text-neonLime">{room.status}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <PixelAvatar avatarId={player.avatarId} />
                <div>
                  <div className="font-pixel text-[10px] text-white">{player.name}</div>
                  <div className="mt-2 text-sm text-white/60">{myTeam?.name}</div>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-4">
              <MiniStat label="Coins" value={`${player.coins}c`} tone="gold" />
              <MiniStat label="Ranking" value={`#${currentPlayerRanking}`} tone="pink" />
              <MiniStat label="Tiempo" value={room.currentRound?.secondsRemaining ?? "--"} tone="blue" />
              <MiniStat label="Sonido" value={soundEnabled ? "ON" : "OFF"} tone="lime" />
            </div>
          </div>
        </Panel>

        {error && <div className="border border-neonPink/40 bg-neonPink/10 p-3 text-sm text-neonPink">{error}</div>}

        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <Panel>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-pixel text-xs text-neonPink">Centro de decisión</div>
                  <div className="mt-2 text-white/70">
                    Cada equipo decide por mayoría. En empate se mantiene la última decisión del equipo o Cooperar.
                  </div>
                </div>
                <ArcadeButton variant="dark" onClick={() => setSoundEnabled((current) => !current)}>
                  Sonido {soundEnabled ? "OFF" : "ON"}
                </ArcadeButton>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={room.status !== "round" || Boolean(myVote)}
                  className={clsx(
                    "vote-card border-neonBlue/40",
                    myVote === "cooperate" && "ring-2 ring-neonBlue"
                  )}
                  onClick={() => emitVote("cooperate")}
                >
                  <div className="font-pixel text-sm text-neonBlue">Cooperar</div>
                  <div className="mt-2 text-sm text-white/70">Jugar por estabilidad y beneficio mutuo.</div>
                  <div className="mt-4 font-pixel text-[10px] text-arcadeGold">+8 si ambos cooperan</div>
                </button>

                <button
                  type="button"
                  disabled={room.status !== "round" || Boolean(myVote)}
                  className={clsx(
                    "vote-card border-neonPink/40",
                    myVote === "betray" && "ring-2 ring-neonPink"
                  )}
                  onClick={() => emitVote("betray")}
                >
                  <div className="font-pixel text-sm text-neonPink">Traicionar</div>
                  <div className="mt-2 text-sm text-white/70">Buscar máxima ventaja a corto plazo.</div>
                  <div className="mt-4 font-pixel text-[10px] text-arcadeGold">+15 si el rival coopera</div>
                </button>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-white/60">
                <span>Tu voto: <span className="font-pixel text-[10px] text-white">{myVote ? decisionLabels[myVote] : "Pendiente"}</span></span>
                <span>Ronda: <span className="font-pixel text-[10px] text-neonLime">{room.roundNumber || 0}</span></span>
              </div>
            </Panel>

            {room.status === "finished" ? (
              <GameFinished room={room} />
            ) : room.status === "results" || roundResults ? (
              <ResultsBoard room={room} player={player} />
            ) : (
              <Panel>
                <div className="font-pixel text-xs text-white/70">
                  {room.status === "lobby"
                    ? "Esperando que el administrador inicie la partida."
                    : "La ronda está en curso. Los resultados aparecerán automáticamente al finalizar el tiempo."}
                </div>
              </Panel>
            )}
          </div>

          <div className="space-y-4">
            <Panel>
              <div className="font-pixel text-xs text-neonBlue">Equipos</div>
              <div className="mt-4 space-y-3">
                {room.teams.map((team) => (
                  <TeamCard key={team.id} team={team} room={room} selectedTeamId={player.teamId} />
                ))}
              </div>
            </Panel>

            <Panel>
              <div className="font-pixel text-xs text-neonLime">Historial personal</div>
              <div className="mt-4 space-y-2">
                {teamHistory.length === 0 && <div className="text-sm text-white/60">Aún no tienes rondas registradas.</div>}
                {teamHistory.map((item) => (
                  <div key={item.round} className="border border-white/10 bg-black/20 p-3">
                    <div className="font-pixel text-[9px] text-white">Ronda {item.round}</div>
                    <div className="mt-2 text-sm text-white/70">
                      Equipo: {decisionLabels[item.teamDecision] || "Pendiente"} · Rival: {decisionLabels[item.rivalDecision] || "Descansa"}
                    </div>
                    <div className="mt-2 font-pixel text-[10px] text-arcadeGold">
                      {item.coinsDelta >= 0 ? "+" : ""}
                      {item.coinsDelta} coins
                    </div>
                  </div>
                ))}
              </div>
            </Panel>

            {isAdmin && (
              <Panel>
                <div className="font-pixel text-xs text-neonPink">Panel Admin</div>
                <div className="mt-4 grid gap-3">
                  <label>
                    <span className="mb-2 block font-pixel text-[10px] text-white/70">Tiempo por ronda (60-180s)</span>
                    <input
                      className="arcade-input"
                      type="number"
                      min="60"
                      max="180"
                      value={room.config.roundDuration}
                      onChange={(event) =>
                        emitAdmin("admin:updateConfig", {
                          config: { roundDuration: Number(event.target.value) }
                        })
                      }
                    />
                  </label>

                  <label>
                    <span className="mb-2 block font-pixel text-[10px] text-white/70">Mínimo de jugadores por equipo</span>
                    <input
                      className="arcade-input"
                      type="number"
                      min="1"
                      max="8"
                      value={room.config.minPlayersPerTeam}
                      onChange={(event) =>
                        emitAdmin("admin:updateConfig", {
                          config: { minPlayersPerTeam: Number(event.target.value) }
                        })
                      }
                    />
                  </label>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {room.status === "lobby" && (
                      <ArcadeButton variant="lime" onClick={() => emitAdmin("admin:startGame")}>
                        Iniciar partida
                      </ArcadeButton>
                    )}
                    {room.status === "round" && (
                      <ArcadeButton variant="primary" onClick={() => emitAdmin("admin:resolveRound")}>
                        Cerrar ronda
                      </ArcadeButton>
                    )}
                    {room.status === "results" && (
                      <ArcadeButton variant="primary" onClick={() => emitAdmin("admin:nextRound")}>
                        Siguiente ronda
                      </ArcadeButton>
                    )}
                    <ArcadeButton variant="danger" onClick={() => emitAdmin("admin:finishGame")}>
                      Finalizar juego
                    </ArcadeButton>
                    <ArcadeButton variant="dark" onClick={() => emitAdmin("admin:resetGame")}>
                      Reiniciar
                    </ArcadeButton>
                  </div>
                </div>
              </Panel>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
