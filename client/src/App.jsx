import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { AVATARS, TEAM_LIMIT, THEMES, THEME_STORAGE_KEY } from "./lib/constants";
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
      style={{ background: `linear-gradient(180deg, ${avatar.accent}, ${avatar.skin})` }}
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

function MiniStat({ label, value, tone = "blue", compact = false }) {
  const tones = {
    blue: "text-neonBlue",
    pink: "text-neonPink",
    lime: "text-neonLime",
    gold: "text-arcadeGold"
  };

  return (
    <div className={clsx("theme-soft rounded-none border border-white/10", compact ? "p-2.5" : "p-3")}>
      <div className="font-pixel text-[8px] theme-muted">{label}</div>
      <div className={clsx("mt-1.5 font-pixel", compact ? "text-[11px]" : "text-sm", tones[tone])}>{value}</div>
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
        className="theme-toggle"
        onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      >
        <span className="theme-toggle-track">
          <span className="theme-toggle-label">L</span>
          <span className="theme-toggle-label">D</span>
        </span>
        <span className={clsx("theme-toggle-thumb", theme === "dark" && "theme-toggle-thumb-dark")} />
      </button>
    </div>
  );
}

function SectionToggle({ title, subtitle, open, onToggle, tone = "blue", children }) {
  const tones = {
    blue: "text-neonBlue",
    pink: "text-neonPink",
    lime: "text-neonLime",
    gold: "text-arcadeGold"
  };

  return (
    <Panel>
      <button
        type="button"
        className="flex w-full items-center justify-between gap-4 text-left"
        onClick={onToggle}
      >
        <div>
          <div className={clsx("font-pixel text-xs", tones[tone])}>{title}</div>
          {subtitle && <div className="mt-2 text-sm theme-muted">{subtitle}</div>}
        </div>
        <div className="font-pixel text-[10px] text-arcadeGold">{open ? "Ocultar" : "Ver"}</div>
      </button>
      {open && <div className="mt-4">{children}</div>}
    </Panel>
  );
}

function JoinScreen({
  form,
  setForm,
  mode,
  setMode,
  room,
  roomLookupState,
  onCreate,
  onJoin,
  loading,
  error,
  notice,
  theme,
  setTheme
}) {
  const teams = room?.teams || [];
  const roomIsValid = roomLookupState === "valid" && Boolean(room);
  const teamSelectDisabled = !roomIsValid;
  const helperMessage =
    roomLookupState === "checking"
      ? "Buscando sala..."
      : roomLookupState === "invalid"
        ? "Ingresa un codigo valido para cargar equipos."
        : teamSelectDisabled
          ? "Primero escribe un codigo de sala valido."
          : "La lista se actualiza automaticamente con los cambios del lobby.";

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
            <MiniStat label="Flujo de lobby" value="Admin controla equipos" tone="lime" />
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
                Tu equipo: <span className="font-pixel text-[10px] text-neonLime">Star Platinum</span>
              </div>
            )}

            {mode === "join" && (
              <>
                <label className="block">
                  <span className="mb-2 block font-pixel text-[10px] theme-muted">Codigo de sala</span>
                  <input
                    className="arcade-input uppercase"
                    value={form.roomCode}
                    maxLength={6}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        roomCode: event.target.value.toUpperCase(),
                        teamId: ""
                      }))
                    }
                    placeholder="ABC123"
                  />
                </label>

                <div className="space-y-2">
                  <select
                    className={clsx("arcade-input", teamSelectDisabled && "cursor-not-allowed opacity-60")}
                    value={form.teamId}
                    disabled={teamSelectDisabled}
                    onChange={(event) => {
                      const team = teams.find((item) => item.id === event.target.value);
                      setForm((current) => ({
                        ...current,
                        teamId: event.target.value,
                        teamName: team?.name || ""
                      }));
                    }}
                  >
                    <option value="">{roomIsValid ? "Selecciona un equipo" : "Bloqueado hasta validar la sala"}</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                  <div className="text-sm theme-muted">{helperMessage}</div>
                </div>
              </>
            )}

            <div>
              <div className="mb-3 font-pixel text-[10px] theme-muted">Avatar pixel</div>
              <div className="grid grid-cols-3 gap-2">
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

            {notice && <div className="border border-neonBlue/40 bg-neonBlue/10 p-3 text-sm text-neonBlue">{notice}</div>}
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
    <div className={clsx("theme-soft border border-white/10 p-3", team.id === selectedTeamId && "ring-1 ring-neonBlue")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-pixel text-[10px] text-neonBlue">{team.name}</div>
          <div className="mt-2 text-sm theme-muted">
            {team.playerIds.length} jugadores · {team.onlinePlayers} online
          </div>
        </div>
        <div className="font-pixel text-[10px] text-arcadeGold">{team.coins}c</div>
      </div>

      <div className="mt-3 space-y-2">
        {team.playerIds.map((playerId) => {
          const member = room.players.find((entry) => entry.id === playerId);
          if (!member) return null;

          return (
            <div key={member.id} className="flex items-center justify-between gap-2 border border-white/10 px-2 py-2">
              <div className="flex min-w-0 items-center gap-2">
                <PixelAvatar avatarId={member.avatarId} size="sm" />
                <div className="min-w-0">
                  <div className="truncate font-pixel text-[8px]">{member.name}</div>
                  <div className="mt-1 text-xs theme-muted">{member.online ? "Conectado" : "Desconectado"}</div>
                </div>
              </div>
              <div className="font-pixel text-[9px] text-neonLime">{member.coins}c</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ResultsBoard({ room, rankingOpen, setRankingOpen }) {
  const lastResult = room.currentRound?.results || room.history[0];

  if (!lastResult) {
    return (
      <Panel>
        <div className="font-pixel text-xs theme-muted">Todavia no hay resultados.</div>
      </Panel>
    );
  }

  return (
    <div className="space-y-4">
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
                  <div className="mt-2 font-pixel text-[10px] text-neonBlue">{decisionLabels[pair.decisionA] || "Descansa"}</div>
                  <div className="mt-2 text-sm text-arcadeGold">
                    {pair.deltaA >= 0 ? "+" : ""}
                    {pair.deltaA} coins
                  </div>
                </div>
                <div className="rounded-none border border-neonPink/20 bg-neonPink/5 p-3">
                  <div className="text-xs theme-muted">Decision {pair.teamBName}</div>
                  <div className="mt-2 font-pixel text-[10px] text-neonPink">{decisionLabels[pair.decisionB] || "Descansa"}</div>
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

      <SectionToggle
        title="Ranking global"
        subtitle="Se movio a un bloque secundario para dejar el foco en la decision y el resultado."
        open={rankingOpen}
        onToggle={() => setRankingOpen((current) => !current)}
        tone="blue"
      >
        <div className="space-y-2">
          {room.ranking.teams.map((team, index) => (
            <div key={team.teamId} className="theme-soft flex items-center justify-between border border-white/10 px-3 py-2">
              <div>
                <div className="font-pixel text-[9px]">#{index + 1} {team.teamName}</div>
                <div className="mt-1 text-xs theme-muted">{team.roundsWon} rondas ganadas</div>
              </div>
              <div className="font-pixel text-[10px] text-arcadeGold">{team.coins}c</div>
            </div>
          ))}
        </div>
      </SectionToggle>
    </div>
  );
}

function GameFinished({ room, onLeave, rankingOpen, setRankingOpen }) {
  const summary = room.gameSummary;
  if (!summary) return null;

  return (
    <div className="space-y-4">
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
          <ArcadeButton variant="gold" onClick={onLeave}>Volver al menu</ArcadeButton>
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

      <SectionToggle
        title="Ranking final"
        subtitle="Resumen completo por equipos."
        open={rankingOpen}
        onToggle={() => setRankingOpen((current) => !current)}
        tone="gold"
      >
        <div className="space-y-2">
          {summary.ranking.teams.map((team, index) => (
            <div key={team.teamId} className="theme-soft flex items-center justify-between border border-white/10 px-3 py-2">
              <div>
                <div className="font-pixel text-[9px]">#{index + 1} {team.teamName}</div>
                <div className="mt-1 text-xs theme-muted">{team.roundsWon} rondas ganadas</div>
              </div>
              <div className="font-pixel text-[10px] text-arcadeGold">{team.coins}c</div>
            </div>
          ))}
        </div>
      </SectionToggle>
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
    <div className="space-y-4">
      <div>
        <div className="font-pixel text-xs text-neonBlue">Equipos del lobby</div>
        <div className="mt-2 text-sm theme-muted">
          Puedes crear equipos nuevos y renombrarlos cuando la partida aun no ha empezado o despues de terminar.
        </div>
      </div>

      <div className="space-y-3">
        {room.teams.map((team) => (
          <div key={team.id} className="theme-soft border border-white/10 p-3">
            <div className="flex flex-col gap-3 md:flex-row">
              <input
                className="arcade-input"
                disabled={!canEditTeams}
                value={teamDrafts[team.id] ?? team.name}
                onChange={(event) => setTeamDrafts((current) => ({ ...current, [team.id]: event.target.value }))}
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

      <div className="flex flex-col gap-3 md:flex-row">
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
    </div>
  );
}

function getCenterMessage(roomStatus, isAdmin) {
  if (roomStatus === "lobby") {
    return isAdmin
      ? "Todo esta listo para organizar equipos y lanzar la partida desde el panel admin."
      : "Configura tu equipo. El administrador iniciara la partida cuando el lobby este listo.";
  }

  if (roomStatus === "round") {
    return "La ronda esta corriendo. Vota cuanto antes para influir en la decision de tu equipo.";
  }

  if (roomStatus === "results") {
    return "Resultados listos. Revisa el enfrentamiento y prepara la siguiente decision.";
  }

  return "La partida termino. Puedes revisar el resumen o volver al menu.";
}

export default function App() {
  const [room, setRoom] = useState(null);
  const [roomPreview, setRoomPreview] = useState(null);
  const [roomLookupState, setRoomLookupState] = useState("idle");
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
  const [notice, setNotice] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);
  const [teamsOpen, setTeamsOpen] = useState(false);
  const [rankingOpen, setRankingOpen] = useState(false);
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
          setNotice("");
        }
      });
    }

    const onRoomUpdate = (nextRoom) => {
      setRoom(nextRoom);
    };

    const onRoomClosed = ({ roomCode, message }) => {
      setRoom((currentRoom) => {
        if (!currentRoom || currentRoom.code !== roomCode) return currentRoom;
        clearSession();
        setPlayer(null);
        setRoomPreview(null);
        setRoomLookupState("idle");
        setLoading(false);
        setError("");
        setNotice(message || "La sala fue cerrada.");
        setAdminPanelOpen(false);
        setTeamsOpen(false);
        setRankingOpen(false);
        return null;
      });
    };

    socket.on("room:update", onRoomUpdate);
    socket.on("room:closed", onRoomClosed);

    return () => {
      socket.off("room:update", onRoomUpdate);
      socket.off("room:closed", onRoomClosed);
    };
  }, []);

  useEffect(() => {
    if (!room?.teams) return;
    setTeamDrafts(Object.fromEntries(room.teams.map((team) => [team.id, team.name])));
  }, [room?.teams]);

  useEffect(() => {
    if (mode === "create") {
      setRoomPreview(null);
      setRoomLookupState("idle");
      setForm((current) => ({ ...current, teamId: "", teamName: "Star Platinum" }));
    }
  }, [mode]);

  useEffect(() => {
    if (mode !== "join") return;

    const roomCode = form.roomCode.trim();
    if (roomCode.length !== 6) {
      setRoomPreview(null);
      setRoomLookupState(roomCode.length === 0 ? "idle" : "typing");
      return;
    }

    let active = true;
    const fetchPreview = () => {
      setRoomLookupState((current) => (current === "valid" ? current : "checking"));
      socket.emit("room:peek", { roomCode }, (response) => {
        if (!active) return;
        if (response?.ok) {
          setRoomPreview(response.room);
          setRoomLookupState("valid");
        } else {
          setRoomPreview(null);
          setRoomLookupState("invalid");
        }
      });
    };

    fetchPreview();
    const interval = setInterval(fetchPreview, 1500);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [form.roomCode, mode]);

  useEffect(() => {
    if (mode !== "join") return;
    if (!roomPreview?.teams?.length) {
      setForm((current) => (current.teamId ? { ...current, teamId: "", teamName: "" } : current));
      return;
    }

    if (!roomPreview.teams.some((team) => team.id === form.teamId)) {
      setForm((current) => ({ ...current, teamId: "", teamName: "" }));
    }
  }, [form.teamId, mode, roomPreview]);

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

  const visiblePreview = mode === "join" && roomLookupState === "valid" ? roomPreview : null;
  const livePlayer = room?.players.find((entry) => entry.id === player?.id) || player;
  const myVote = room?.currentRound?.votes?.[livePlayer?.id];
  const isAdmin = livePlayer?.isAdmin;
  const roundResults = room?.currentRound?.results;

  function resetToMenu(message = "") {
    clearSession();
    setRoom(null);
    setRoomPreview(null);
    setRoomLookupState("idle");
    setPlayer(null);
    setError("");
    setNotice(message);
    setLoading(false);
    setConfigOpen(false);
    setAdminPanelOpen(false);
    setTeamsOpen(false);
    setRankingOpen(false);
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
    if (mode === "join" && !visiblePreview) return "Ingresa un codigo de sala valido.";
    if (mode === "join" && !form.teamId) return "Selecciona un equipo para entrar.";
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
    setNotice("");
    setAdminPanelOpen(Boolean(response.player.isAdmin));
    setTeamsOpen(false);
    setRankingOpen(false);
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
    if (validation) return setError(validation);

    setLoading(true);
    socket.emit(
      "room:join",
      {
        roomCode: form.roomCode.trim(),
        playerName: form.playerName.trim(),
        avatarId: form.avatarId,
        teamId: form.teamId
      },
      (response) => {
        setLoading(false);
        handleResponse(response);
      }
    );
  }

  function emitAdmin(event, payload = {}) {
    socket.emit(event, { roomCode: room.code, playerId: livePlayer.id, ...payload }, (response) => {
      if (!response?.ok) setError(response?.message || "No se pudo ejecutar la accion.");
      else setError("");
    });
  }

  function emitVote(decision) {
    socket.emit("player:vote", { roomCode: room.code, playerId: livePlayer.id, decision }, (response) => {
      if (!response?.ok) setError(response?.message || "No se pudo registrar el voto.");
      else setError("");
    });
  }

  function leaveRoomAction() {
    if (!room || !livePlayer) return resetToMenu();
    socket.emit("room:leave", { roomCode: room.code, playerId: livePlayer.id }, () => resetToMenu());
  }

  function createTeamAction() {
    if (!newTeamName.trim()) return setError("Escribe un nombre para el nuevo equipo.");
    emitAdmin("admin:createTeam", { teamName: newTeamName.trim() });
    setNewTeamName("");
  }

  function renameTeamAction(teamId, teamName) {
    emitAdmin("admin:renameTeam", { teamId, teamName });
  }

  if (!room || !livePlayer) {
    return (
      <div className="app-shell">
        <div className="crt-layer" />
        <JoinScreen
          form={form}
          setForm={setForm}
          mode={mode}
          setMode={setMode}
          room={visiblePreview}
          roomLookupState={roomLookupState}
          onCreate={createRoomAction}
          onJoin={joinRoomAction}
          loading={loading}
          error={error}
          notice={notice}
          theme={theme}
          setTheme={setTheme}
        />
      </div>
    );
  }

  const currentPlayerIndex = room.ranking.players.findIndex((entry) => entry.playerId === livePlayer.id);
  const currentPlayerRanking = currentPlayerIndex >= 0 ? currentPlayerIndex + 1 : "-";

  return (
    <div className="app-shell px-3 py-3 sm:px-4 md:px-6">
      <div className="crt-layer" />
      <div className="mx-auto flex max-w-7xl flex-col gap-4">
        <Panel className="overflow-visible">
          <div className="mobile-header-layout gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <PixelAvatar avatarId={livePlayer.avatarId} />
              <div className="min-w-0">
                <div className="truncate font-pixel text-[10px]">{livePlayer.name}</div>
                <div className="mt-2 font-pixel text-xs text-neonBlue">Sala {room.code}</div>
                <div className="mt-2 text-sm theme-muted">
                  Estado: <span className="font-pixel text-[10px] text-neonLime">{room.status}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <MiniStat label="Coins" value={`${livePlayer.coins}c`} tone="gold" compact />
              <MiniStat label="Ranking" value={`#${currentPlayerRanking}`} tone="pink" compact />
              <MiniStat label="Tiempo" value={room.currentRound?.secondsRemaining ?? "--"} tone="blue" compact />
            </div>

            <div className="flex flex-wrap gap-2">
              <ArcadeButton variant="dark" className="flex-1 sm:flex-none" onClick={() => setConfigOpen((current) => !current)}>
                Config
              </ArcadeButton>
              {isAdmin && (
                <ArcadeButton variant={adminPanelOpen ? "lime" : "ghost"} className="flex-1 sm:flex-none" onClick={() => setAdminPanelOpen((current) => !current)}>
                  Panel admin
                </ArcadeButton>
              )}
              <ArcadeButton variant="gold" className="flex-1 sm:flex-none" onClick={leaveRoomAction}>
                Salir
              </ArcadeButton>
            </div>
          </div>

          {configOpen && (
            <div className="mt-4 theme-soft border border-white/10 p-4">
              <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
                <ThemeSwitcher theme={theme} setTheme={setTheme} />
                <div className="flex flex-wrap gap-3">
                  <ArcadeButton variant={soundEnabled ? "lime" : "ghost"} onClick={() => setSoundEnabled((current) => !current)}>
                    Sonido {soundEnabled ? "ON" : "OFF"}
                  </ArcadeButton>
                  <ArcadeButton variant="dark" onClick={() => setConfigOpen(false)}>
                    Cerrar
                  </ArcadeButton>
                </div>
              </div>
            </div>
          )}
        </Panel>

        {error && <div className="border border-neonPink/40 bg-neonPink/10 p-3 text-sm text-neonPink">{error}</div>}

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_360px]">
          <div className="space-y-4">
            <Panel className="decision-stage">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-pixel text-xs text-neonPink">Centro de decision</div>
                  <div className="mt-2 max-w-2xl text-sm theme-muted">{getCenterMessage(room.status, isAdmin)}</div>
                </div>
                <div className="theme-soft border border-white/10 px-3 py-2 font-pixel text-[10px] text-neonLime">
                  Ronda {room.roundNumber || 0}
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
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
                <span>Tu voto: <span className="font-pixel text-[10px]">{myVote ? decisionLabels[myVote] : "Pendiente"}</span></span>
                <span>Equipo: <span className="font-pixel text-[10px] text-neonBlue">{room.teams.find((team) => team.id === livePlayer.teamId)?.name || "Sin equipo"}</span></span>
              </div>

              {isAdmin && adminPanelOpen && (
                <div className="mt-5 border-t border-white/10 pt-4">
                  <div className="grid gap-4">
                    <div className="grid gap-3 md:grid-cols-2">
                      <label>
                        <span className="mb-2 block font-pixel text-[10px] theme-muted">Tiempo por ronda (60-180s)</span>
                        <input
                          className="arcade-input"
                          type="number"
                          min="60"
                          max="180"
                          value={room.config.roundDuration}
                          onChange={(event) => emitAdmin("admin:updateConfig", { config: { roundDuration: Number(event.target.value) } })}
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
                          onChange={(event) => emitAdmin("admin:updateConfig", { config: { minPlayersPerTeam: Number(event.target.value) } })}
                        />
                      </label>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
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
                      <ArcadeButton variant="danger" onClick={() => emitAdmin("admin:deleteRoom")}>
                        Eliminar sala
                      </ArcadeButton>
                    </div>

                    <TeamAdminPanel
                      room={room}
                      teamDrafts={teamDrafts}
                      setTeamDrafts={setTeamDrafts}
                      newTeamName={newTeamName}
                      setNewTeamName={setNewTeamName}
                      onCreateTeam={createTeamAction}
                      onRenameTeam={renameTeamAction}
                    />
                  </div>
                </div>
              )}
            </Panel>

            {room.status === "finished" ? (
              <GameFinished room={room} onLeave={leaveRoomAction} rankingOpen={rankingOpen} setRankingOpen={setRankingOpen} />
            ) : room.status === "results" || roundResults ? (
              <ResultsBoard room={room} rankingOpen={rankingOpen} setRankingOpen={setRankingOpen} />
            ) : null}
          </div>

          <div className="space-y-4">
            <SectionToggle
              title="Equipos"
              subtitle="Vista secundaria del lobby y del avance general."
              open={teamsOpen}
              onToggle={() => setTeamsOpen((current) => !current)}
              tone="blue"
            >
              <div className="space-y-3">
                {room.teams.map((team) => (
                  <TeamCard key={team.id} team={team} room={room} selectedTeamId={livePlayer.teamId} />
                ))}
              </div>
            </SectionToggle>

            {room.status === "lobby" && !isAdmin && (
              <Panel>
                <div className="font-pixel text-xs text-neonLime">Lobby</div>
                <div className="mt-2 text-sm theme-muted">
                  Espera a que el administrador organice los equipos y active la primera ronda.
                </div>
              </Panel>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
