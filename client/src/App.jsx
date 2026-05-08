import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { AVATARS, DEFAULT_TEAMS, TEAM_LIMIT, THEMES, THEME_STORAGE_KEY } from "./lib/constants";
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

function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
}

function loadTheme() {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return THEMES.some((theme) => theme.id === stored) ? stored : "light";
}

function saveTheme(theme) {
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

function getAvatar(avatarId) {
  return AVATARS.find((item) => item.id === avatarId) || AVATARS[0];
}

function PixelAvatar({ avatarId, size = "md" }) {
  const avatar = getAvatar(avatarId);
  const sizing = {
    sm: "h-12 w-12",
    md: "h-16 w-16",
    lg: "h-20 w-20"
  };

  return (
    <div
      className={clsx(
        "avatar-swatch relative overflow-hidden rounded-none border-2 border-white/20 shadow-arcade",
        sizing[size]
      )}
      style={{
        background: `linear-gradient(180deg, ${avatar.accent}, ${avatar.skin})`
      }}
    >
      {avatar.hat === "duck" && (
        <>
          <div className="absolute inset-x-1 top-1 h-3 bg-[#ffe45a]" />
          <div className="absolute left-4 top-0 h-2 w-3 bg-[#ffe45a]" />
          <div className="absolute right-3 top-2 h-2 w-4 bg-[#ff9a3d]" />
        </>
      )}

      {avatar.hat === "jojo" && (
        <>
          <div className="absolute inset-x-2 top-1 h-3 bg-[#1f2758]" />
          <div className="absolute left-1 top-2 h-3 w-3 bg-[#1f2758]" />
          <div className="absolute right-1 top-2 h-3 w-3 bg-[#1f2758]" />
          <div className="absolute left-5 top-0 h-2 w-2 bg-[#ffd447]" />
        </>
      )}

      {avatar.hat === "antenna" && (
        <>
          <div className="absolute inset-x-2 top-2 h-3 bg-[#273147]" />
          <div className="absolute left-[50%] top-0 h-3 w-1 -translate-x-1/2 bg-[#273147]" />
          <div className="absolute left-[50%] top-0 h-2 w-2 -translate-x-1/2 bg-[#ffd447]" />
        </>
      )}

      {avatar.hat === "mohawk" && (
        <>
          <div className="absolute left-[50%] top-0 h-6 w-2 -translate-x-1/2 bg-[#ff4fd8]" />
          <div className="absolute left-[50%] top-2 h-2 w-4 -translate-x-1/2 bg-[#7a5cff]" />
        </>
      )}

      {avatar.hat === "halo" && (
        <>
          <div className="absolute left-3 right-3 top-0 h-1 border border-[#54f7ff] bg-transparent" />
          <div className="absolute left-4 right-4 top-1 h-1 bg-[#54f7ff]" />
        </>
      )}

      {avatar.hat === "bandana" && (
        <>
          <div className="absolute inset-x-1 top-3 h-2 bg-[#ff7a59]" />
          <div className="absolute right-1 top-4 h-3 w-2 bg-[#ff7a59]" />
        </>
      )}

      <div className="absolute inset-x-2 top-5 h-5 bg-black/70" />
      <div className="absolute left-2 top-7 h-2 w-2" style={{ backgroundColor: avatar.eye }} />
      <div className="absolute right-2 top-7 h-2 w-2" style={{ backgroundColor: avatar.eye }} />
      <div className="absolute left-3 right-3 top-10 h-1 bg-[#111]" />
      <div className="absolute left-3 right-3 bottom-0 h-2 bg-black/15" />
    </div>
  );
}

function ArcadeButton({ children, className, variant = "primary", ...props }) {
  const variants = {
    primary: "bg-neonBlue text-ink",
    danger: "bg-neonPink text-white",
    lime: "bg-neonLime text-ink",
    dark: "bg-[#0f1530] text-neonBlue",
    ghost: "bg-[#0f1530] text-neonBlue",
    gold: "bg-arcadeGold text-ink"
  };

  return (
    <button
      className={clsx(
        "rounded-none border-b-4 border-r-4 border-black/40 px-4 py-3 font-pixel text-[10px] uppercase tracking-wide transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50",
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
    <div className={clsx("theme-panel p-4", className)}>
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(transparent_0%,rgba(84,247,255,0.06)_50%,transparent_100%)] opacity-60" />
      <div className="relative">{children}</div>
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
    <div className="theme-soft rounded-none border border-white/10 p-3">
      <div className="font-pixel text-[9px] theme-muted">{label}</div>
      <div className={clsx("mt-2 font-pixel text-sm", tones[tone])}>{value}</div>
    </div>
  );
}

function ThemeSwitcher({ theme, setTheme }) {
  return (
    <div className="flex items-center gap-3">
      <div>
        <div className="font-pixel text-[9px] theme-muted">Tema por defecto</div>
        <div className="mt-2 font-pixel text-[10px] text-neonLime">
          {theme === "light" ? "Light Neon" : "Black Neon"}
        </div>
      </div>
      <button
        type="button"
        aria-label="Cambiar tema"
        aria-pressed={theme === "dark"}
        className={clsx("theme-toggle", theme === "dark" && "theme-toggle-dark")}
        onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      >
        <span className="theme-toggle-track">
          {THEMES.map((item) => (
            <span key={item.id} className="theme-toggle-label">
              {item.id === "light" ? "L" : "D"}
            </span>
          ))}
        </span>
        <span className={clsx("theme-toggle-thumb", theme === "dark" && "theme-toggle-thumb-dark")} />
      </button>
    </div>
  );
}

function JoinScreen({
  form,
  setForm,
  mode,
  setMode,
  room,
  onCreate,
  onJoin,
  loading,
  error,
  theme,
  setTheme
}) {
  const teams = room?.teams?.length ? room.teams : DEFAULT_TEAMS;
  const showJoinTeams = mode === "join";

  return (
    <div className="mx-auto flex min-h-screen max-w-7xl items-center px-4 py-4 lg:px-6">
      <div className="grid w-full gap-5 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
      <section className="flex flex-col justify-center">
        <ThemeSwitcher theme={theme} setTheme={setTheme} />
        <h1 className="mt-4 max-w-3xl font-pixel text-4xl leading-[1.05] md:text-6xl xl:text-7xl">
          PRISIONERO
          <span className="block text-neonBlue">GAME</span>
        </h1>
        <div className="mt-4 inline-flex w-fit border border-neonPink/60 bg-neonPink/10 px-3 py-2 font-pixel text-[10px] text-neonPink">
          Multiplayer Corporate Prisoner Arcade
        </div>
        <p className="mt-4 max-w-2xl text-base theme-muted md:text-lg">
          Equipos empresariales votan en tiempo real, compiten 1 vs 1 y sobreviven ronda a ronda con estrategia, traicion y coins.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <MiniStat label="Jugadores por equipo" value={`Hasta ${TEAM_LIMIT}`} tone="pink" />
          <MiniStat label="Equipo inicial" value="Star Platinum" tone="lime" />
        </div>
      </section>

      <Panel className="self-center p-4 md:p-5">
        <div className="flex gap-3">
            <ArcadeButton
              variant={mode === "create" ? "lime" : "ghost"}
              className="flex-1"
              onClick={() => setMode("create")}
            >
              Crear sala
            </ArcadeButton>
            <ArcadeButton
              variant={mode === "join" ? "lime" : "ghost"}
              className="flex-1"
              onClick={() => setMode("join")}
            >
              Unirse
            </ArcadeButton>
        </div>

        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="mb-2 block font-pixel text-[10px] theme-muted">Nombre</span>
            <input
              className="arcade-input"
              value={form.playerName}
              maxLength={24}
              onChange={(event) => setForm((current) => ({ ...current, playerName: event.target.value }))}
              placeholder="Tu alias corporativo"
            />
          </label>

          {mode === "create" && (
            <div className="theme-soft border border-neonLime/30 p-3 text-sm theme-muted">
              Al crear sala se genera tu equipo base automaticamente con el nombre <span className="font-pixel text-[10px] text-neonLime">Star Platinum</span>.
            </div>
          )}

          {mode === "join" && (
            <label className="block">
              <span className="mb-2 block font-pixel text-[10px] theme-muted">Codigo de sala</span>
              <input
                className="arcade-input uppercase"
                value={form.roomCode}
                maxLength={6}
                onChange={(event) => setForm((current) => ({ ...current, roomCode: event.target.value.toUpperCase() }))}
                placeholder="ABC123"
              />
            </label>
          )}

          {mode === "join" && (
            <label className="block">
              <span className="mb-2 block font-pixel text-[10px] theme-muted">Nombre del equipo</span>
              <input
                className="arcade-input"
                value={form.teamName}
                maxLength={24}
                onChange={(event) => setForm((current) => ({ ...current, teamName: event.target.value }))}
                placeholder="Crear nuevo o elegir uno existente"
              />
            </label>
          )}

          {showJoinTeams && (
            <div>
              <div className="mb-2 font-pixel text-[10px] theme-muted">Equipos en la sala</div>
              <div className="grid gap-2 sm:grid-cols-2">
                {teams.map((team) => (
                  <button
                    type="button"
                    key={team.id}
                    className={clsx(
                      "theme-soft rounded-none border px-3 py-3 text-left font-body",
                      form.teamId === team.id
                        ? "border-neonBlue bg-neonBlue/10 text-neonBlue"
                        : "border-white/10"
                    )}
                    onClick={() => setForm((current) => ({ ...current, teamId: team.id, teamName: team.name }))}
                  >
                    <div className="font-pixel text-[10px]">{team.name}</div>
                    {"playerIds" in team && (
                      <div className="mt-2 text-sm theme-muted">{team.playerIds.length} jugadores</div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="mb-3 font-pixel text-[10px] theme-muted">Avatar pixel</div>
            <div className="grid grid-cols-3 gap-2 md:grid-cols-3">
              {AVATARS.map((avatar) => (
                <button
                  type="button"
                  key={avatar.id}
                  className={clsx(
                    "theme-soft rounded-none border p-2",
                    form.avatarId === avatar.id ? "border-neonPink bg-neonPink/10" : "border-white/10"
                  )}
                  onClick={() => setForm((current) => ({ ...current, avatarId: avatar.id }))}
                >
                  <div className="mx-auto w-fit">
                    <PixelAvatar avatarId={avatar.id} size="sm" />
                  </div>
                  <div className="mt-2 text-center font-pixel text-[8px] theme-muted">{avatar.name}</div>
                </button>
              ))}
            </div>
          </div>

          {showJoinTeams && room && (
            <div className="theme-soft border border-neonLime/30 p-3 text-sm theme-muted">
              Esta sala tiene {room.players.length} jugador(es) y {room.teams.length} equipo(s).
            </div>
          )}

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
    </div>
  );
}

function TeamCard({ team, room, selectedTeamId }) {
  return (
    <Panel className={clsx(team.id === selectedTeamId && "animate-glow")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-pixel text-xs text-neonBlue">{team.name}</div>
          <div className="mt-2 text-sm theme-muted">
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
            <div key={player.id} className="theme-soft flex items-center justify-between border border-white/10 p-2">
              <div className="flex items-center gap-2">
                <PixelAvatar avatarId={player.avatarId} size="sm" />
                <div>
                  <div className="font-pixel text-[9px]">{player.name}</div>
                  <div className="mt-1 text-xs theme-muted">{player.online ? "Conectado" : "Desconectado"}</div>
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
        <div className="font-pixel text-xs theme-muted">Todavia no hay resultados.</div>
      </Panel>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
      <Panel>
        <div className="font-pixel text-xs text-neonPink">Resultado de la ronda {room.roundNumber}</div>
        <div className="mt-4 space-y-3">
          {lastResult.pairResults.map((pair) => (
            <div key={`${pair.teamAId}-${pair.teamBId || "bye"}`} className="theme-soft border border-white/10 p-3">
              <div className="font-pixel text-[10px]">
                {pair.teamAName} vs {pair.teamBName}
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <div className="rounded-none border border-neonBlue/20 bg-neonBlue/5 p-3">
                  <div className="text-xs theme-muted">Decision {pair.teamAName}</div>
                  <div className="mt-2 font-pixel text-[10px] text-neonBlue">
                    {decisionLabels[pair.decisionA] || "Descansa"}
                  </div>
                  <div className="mt-2 text-sm text-arcadeGold">
                    {pair.deltaA >= 0 ? "+" : ""}
                    {pair.deltaA} coins
                  </div>
                </div>
                <div className="rounded-none border border-neonPink/20 bg-neonPink/5 p-3">
                  <div className="text-xs theme-muted">Decision {pair.teamBName}</div>
                  <div className="mt-2 font-pixel text-[10px] text-neonPink">
                    {decisionLabels[pair.decisionB] || "Descansa"}
                  </div>
                  <div className="mt-2 text-sm text-arcadeGold">
                    {pair.deltaB >= 0 ? "+" : ""}
                    {pair.deltaB} coins
                  </div>
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
              <div key={team.teamId} className="theme-soft flex items-center justify-between border border-white/10 px-3 py-2">
                <div>
                  <div className="font-pixel text-[9px]">
                    #{index + 1} {team.teamName}
                  </div>
                  <div className="mt-1 text-xs theme-muted">{team.roundsWon} rondas ganadas</div>
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

function GameFinished({ room, onLeave }) {
  const summary = room.gameSummary;
  if (!summary) return null;

  return (
    <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
      <Panel>
        <div className="font-pixel text-sm text-neonLime">Juego finalizado</div>
        <div className="mt-4 text-3xl font-pixel">{summary.winner?.teamName || "Sin ganador"}</div>
        <div className="mt-2 theme-muted">Puedes salir al menu y entrar a otra sala o crear una nueva.</div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <MiniStat label="Rondas" value={summary.totalRounds} tone="blue" />
          <MiniStat label="% Cooperacion" value={`${summary.cooperateRate}%`} tone="lime" />
          <MiniStat label="% Traicion" value={`${summary.betrayRate}%`} tone="pink" />
        </div>

        <div className="mt-6">
          <ArcadeButton variant="gold" onClick={onLeave}>
            Volver al menu
          </ArcadeButton>
        </div>
      </Panel>

      <Panel>
        <div className="font-pixel text-xs text-neonPink">MVP</div>
        <div className="mt-4 flex items-center gap-4">
          <PixelAvatar avatarId={summary.mvp?.avatarId || "jojo-segundo"} size="lg" />
          <div>
            <div className="font-pixel text-sm">{summary.mvp?.name || "N/A"}</div>
            <div className="mt-2 theme-muted">{summary.mvp?.teamName || "Sin equipo"}</div>
            <div className="mt-2 font-pixel text-[10px] text-arcadeGold">{summary.mvp?.coins || 0} coins</div>
          </div>
        </div>
      </Panel>
    </div>
  );
}

function TeamAdminPanel({
  room,
  teamDrafts,
  setTeamDrafts,
  newTeamName,
  setNewTeamName,
  onCreateTeam,
  onRenameTeam
}) {
  const canEditTeams = room.status === "lobby" || room.status === "finished";

  return (
    <Panel>
      <div className="font-pixel text-xs text-neonBlue">Equipos del lobby</div>
      <div className="mt-2 text-sm theme-muted">
        Puedes crear equipos nuevos y renombrarlos cuando la partida aun no ha empezado o despues de terminar.
      </div>

      <div className="mt-4 space-y-3">
        {room.teams.map((team) => (
          <div key={team.id} className="theme-soft border border-white/10 p-3">
            <div className="flex flex-col gap-3 md:flex-row">
              <input
                className="arcade-input"
                disabled={!canEditTeams}
                value={teamDrafts[team.id] ?? team.name}
                onChange={(event) =>
                  setTeamDrafts((current) => ({ ...current, [team.id]: event.target.value }))
                }
              />
              <ArcadeButton
                variant="primary"
                disabled={!canEditTeams}
                onClick={() => onRenameTeam(team.id, teamDrafts[team.id] ?? team.name)}
              >
                Guardar
              </ArcadeButton>
            </div>
            <div className="mt-2 text-sm theme-muted">{team.playerIds.length} / {TEAM_LIMIT} jugadores</div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-3 md:flex-row">
        <input
          className="arcade-input"
          disabled={!canEditTeams}
          value={newTeamName}
          onChange={(event) => setNewTeamName(event.target.value)}
          placeholder="Nombre del nuevo equipo"
        />
        <ArcadeButton variant="lime" disabled={!canEditTeams} onClick={onCreateTeam}>
          Crear equipo
        </ArcadeButton>
      </div>
    </Panel>
  );
}

export default function App() {
  const [room, setRoom] = useState(null);
  const [roomPreview, setRoomPreview] = useState(null);
  const [player, setPlayer] = useState(null);
  const [mode, setMode] = useState("create");
  const [theme, setTheme] = useState(loadTheme);
  const [form, setForm] = useState({
    playerName: "",
    roomCode: "",
    teamId: "",
    teamName: "Star Platinum",
    avatarId: AVATARS[0].id
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [teamDrafts, setTeamDrafts] = useState({});
  const timerRef = useRef(null);
  const currentRound = room?.currentRound;
  const roundSecondsRemaining = currentRound?.secondsRemaining;
  const roundEndsAt = currentRound?.endsAt;

  useEffect(() => {
    document.body.dataset.theme = theme;
    saveTheme(theme);
  }, [theme]);

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

    const onRoomUpdate = (nextRoom) => {
      setRoom(nextRoom);
    };

    socket.on("room:update", onRoomUpdate);
    return () => {
      socket.off("room:update", onRoomUpdate);
    };
  }, []);

  useEffect(() => {
    if (!room?.teams) return;
    setTeamDrafts(Object.fromEntries(room.teams.map((team) => [team.id, team.name])));
  }, [room?.teams]);

  useEffect(() => {
    if (mode === "create") {
      setForm((current) => ({ ...current, teamId: "", teamName: "Star Platinum" }));
    }
  }, [mode]);

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
  const visiblePreview = mode === "join" && form.roomCode.trim().length === 6 ? roomPreview : null;

  function resetToMenu() {
    clearSession();
    setRoom(null);
    setRoomPreview(null);
    setPlayer(null);
    setError("");
    setLoading(false);
    setNewTeamName("");
    setTeamDrafts({});
    setMode("create");
    setForm((current) => ({
      ...current,
      roomCode: "",
      teamId: "",
      teamName: "",
      avatarId: current.avatarId || AVATARS[0].id
    }));
  }

  function validateForm() {
    if (!form.playerName.trim()) return "Escribe un nombre.";
    if (mode === "join" && !form.roomCode.trim()) return "Ingresa el codigo de sala.";
    return "";
  }

  function handleResponse(response) {
    if (!response?.ok) {
      setError(response?.message || "No se pudo completar la accion.");
      return;
    }

    setRoom(response.room);
    setPlayer(response.player);
    saveSession({ roomCode: response.room.code, playerId: response.player.id });
    setError("");
  }

  function createRoomAction() {
    const validation = validateForm();
    if (validation) {
      setError(validation);
      return;
    }

    setLoading(true);
    socket.emit(
      "room:create",
      {
        playerName: form.playerName.trim(),
        avatarId: form.avatarId,
        teamName: "Star Platinum"
      },
      (response) => {
        setLoading(false);
        handleResponse(response);
      }
    );
  }

  function joinRoomAction() {
    const validation = validateForm();
    if (validation) {
      setError(validation);
      return;
    }

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
      if (!response?.ok) setError(response?.message || "No se pudo ejecutar la accion.");
      else setError("");
    });
  }

  function emitVote(decision) {
    socket.emit("player:vote", { roomCode: room.code, playerId: player.id, decision }, (response) => {
      if (!response?.ok) setError(response?.message || "No se pudo registrar el voto.");
      else setError("");
    });
  }

  function leaveRoomAction() {
    if (!room || !player) {
      resetToMenu();
      return;
    }

    socket.emit("room:leave", { roomCode: room.code, playerId: player.id }, () => {
      resetToMenu();
    });
  }

  function createTeamAction() {
    if (!newTeamName.trim()) {
      setError("Escribe un nombre para el nuevo equipo.");
      return;
    }

    emitAdmin("admin:createTeam", { teamName: newTeamName.trim() });
    setNewTeamName("");
  }

  function renameTeamAction(teamId, teamName) {
    emitAdmin("admin:renameTeam", { teamId, teamName });
  }

  if (!room || !player) {
    return (
      <div className="app-shell">
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
          theme={theme}
          setTheme={setTheme}
        />
      </div>
    );
  }

  const currentPlayerIndex = room.ranking.players.findIndex((entry) => entry.playerId === player.id);
  const currentPlayerRanking = currentPlayerIndex >= 0 ? currentPlayerIndex + 1 : "-";
  const teamHistory = player.history || [];

  return (
    <div className="app-shell px-4 py-4 md:px-6">
      <div className="crt-layer" />
      <div className="mx-auto flex max-w-7xl flex-col gap-4">
        <Panel className="overflow-visible">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <div className="font-pixel text-xs text-neonBlue">Sala {room.code}</div>
                <div className="mt-2 theme-muted">
                  Estado: <span className="font-pixel text-[10px] text-neonLime">{room.status}</span>
                </div>
                <div className="mt-2 text-sm theme-muted">Las coins solo pertenecen a esta partida actual.</div>
              </div>
              <div className="flex items-center gap-3">
                <PixelAvatar avatarId={player.avatarId} />
                <div>
                  <div className="font-pixel text-[10px]">{player.name}</div>
                  <div className="mt-2 text-sm theme-muted">{myTeam?.name}</div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 xl:items-end">
              <ThemeSwitcher theme={theme} setTheme={setTheme} />
              <div className="flex flex-wrap gap-3">
                <ArcadeButton variant="dark" onClick={() => setSoundEnabled((current) => !current)}>
                  Sonido {soundEnabled ? "OFF" : "ON"}
                </ArcadeButton>
                <ArcadeButton variant="gold" onClick={leaveRoomAction}>
                  Salir al menu
                </ArcadeButton>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            <MiniStat label="Coins" value={`${player.coins}c`} tone="gold" />
            <MiniStat label="Ranking" value={`#${currentPlayerRanking}`} tone="pink" />
            <MiniStat label="Tiempo" value={room.currentRound?.secondsRemaining ?? "--"} tone="blue" />
            <MiniStat label="Tema" value={theme === "light" ? "Light Neon" : "Black Neon"} tone="lime" />
          </div>
        </Panel>

        {error && <div className="border border-neonPink/40 bg-neonPink/10 p-3 text-sm text-neonPink">{error}</div>}

        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <Panel>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-pixel text-xs text-neonPink">Centro de decision</div>
                  <div className="mt-2 theme-muted">
                    Cada equipo decide por mayoria. En empate se mantiene la ultima decision del equipo o Cooperar.
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={room.status !== "round" || Boolean(myVote)}
                  className={clsx("vote-card border border-neonBlue/40", myVote === "cooperate" && "ring-2 ring-neonBlue")}
                  onClick={() => emitVote("cooperate")}
                >
                  <div className="font-pixel text-sm text-neonBlue">Cooperar</div>
                  <div className="mt-2 text-sm theme-muted">Jugar por estabilidad y beneficio mutuo.</div>
                  <div className="mt-4 font-pixel text-[10px] text-arcadeGold">+8 si ambos cooperan</div>
                </button>

                <button
                  type="button"
                  disabled={room.status !== "round" || Boolean(myVote)}
                  className={clsx("vote-card border border-neonPink/40", myVote === "betray" && "ring-2 ring-neonPink")}
                  onClick={() => emitVote("betray")}
                >
                  <div className="font-pixel text-sm text-neonPink">Traicionar</div>
                  <div className="mt-2 text-sm theme-muted">Buscar maxima ventaja a corto plazo.</div>
                  <div className="mt-4 font-pixel text-[10px] text-arcadeGold">+15 si el rival coopera</div>
                </button>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm theme-muted">
                <span>
                  Tu voto: <span className="font-pixel text-[10px]">{myVote ? decisionLabels[myVote] : "Pendiente"}</span>
                </span>
                <span>
                  Ronda: <span className="font-pixel text-[10px] text-neonLime">{room.roundNumber || 0}</span>
                </span>
              </div>
            </Panel>

            {room.status === "finished" ? (
              <GameFinished room={room} onLeave={leaveRoomAction} />
            ) : room.status === "results" || roundResults ? (
              <ResultsBoard room={room} player={player} />
            ) : (
              <Panel>
                <div className="font-pixel text-xs theme-muted">
                  {room.status === "lobby"
                    ? "Esperando que el administrador inicie la partida."
                    : "La ronda esta en curso. Los resultados apareceran automaticamente al finalizar el tiempo."}
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
                {teamHistory.length === 0 && <div className="text-sm theme-muted">Aun no tienes rondas registradas.</div>}
                {teamHistory.map((item) => (
                  <div key={item.round} className="theme-soft border border-white/10 p-3">
                    <div className="font-pixel text-[9px]">Ronda {item.round}</div>
                    <div className="mt-2 text-sm theme-muted">
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
              <>
                <Panel>
                  <div className="font-pixel text-xs text-neonPink">Panel Admin</div>
                  <div className="mt-4 grid gap-3">
                    <label>
                      <span className="mb-2 block font-pixel text-[10px] theme-muted">Tiempo por ronda (60-180s)</span>
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
                      <span className="mb-2 block font-pixel text-[10px] theme-muted">Minimo de jugadores por equipo</span>
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

                <TeamAdminPanel
                  room={room}
                  teamDrafts={teamDrafts}
                  setTeamDrafts={setTeamDrafts}
                  newTeamName={newTeamName}
                  setNewTeamName={setNewTeamName}
                  onCreateTeam={createTeamAction}
                  onRenameTeam={renameTeamAction}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
