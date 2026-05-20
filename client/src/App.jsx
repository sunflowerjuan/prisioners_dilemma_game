import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { AVATARS, TEAM_LIMIT, THEMES, THEME_STORAGE_KEY } from "./lib/constants";
import { socket } from "./lib/socket";

const STORAGE_KEY = "prisionero-game-session";

const decisionLabels = {
  cooperate: "Cooperar",
  betray: "Traicionar"
};

function playSoundSequence(steps, volume = 0.035) {
  if (typeof window === "undefined") return;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;

  const audioCtx = new AudioContextClass();
  const now = audioCtx.currentTime;

  steps.forEach(({ frequency, duration, delay = 0, type = "square", gain = 1 }) => {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gainNode.gain.setValueAtTime(volume * gain, now + delay);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + delay + duration);
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.start(now + delay);
    oscillator.stop(now + delay + duration);
  });

  const totalDuration = steps.reduce((max, step) => Math.max(max, (step.delay || 0) + step.duration), 0);
  setTimeout(() => {
    audioCtx.close().catch(() => {});
  }, Math.ceil((totalDuration + 0.08) * 1000));
}

const SOUND_EFFECTS = {
  ui: [
    { frequency: 520, duration: 0.03, gain: 0.7, type: "square" },
    { frequency: 660, duration: 0.04, delay: 0.03, gain: 0.6, type: "square" }
  ],
  toggle: [
    { frequency: 460, duration: 0.03, gain: 0.6, type: "triangle" },
    { frequency: 720, duration: 0.05, delay: 0.035, gain: 0.7, type: "triangle" }
  ],
  cooperate: [
    { frequency: 440, duration: 0.05, gain: 0.7, type: "triangle" },
    { frequency: 554, duration: 0.07, delay: 0.04, gain: 0.7, type: "triangle" },
    { frequency: 659, duration: 0.09, delay: 0.09, gain: 0.7, type: "triangle" }
  ],
  betray: [
    { frequency: 620, duration: 0.05, gain: 0.7, type: "sawtooth" },
    { frequency: 480, duration: 0.08, delay: 0.045, gain: 0.75, type: "sawtooth" }
  ],
  success: [
    { frequency: 660, duration: 0.04, gain: 0.65, type: "square" },
    { frequency: 880, duration: 0.08, delay: 0.04, gain: 0.7, type: "square" }
  ],
  roundStart: [
    { frequency: 392, duration: 0.05, gain: 0.65, type: "triangle" },
    { frequency: 523, duration: 0.06, delay: 0.05, gain: 0.7, type: "triangle" },
    { frequency: 784, duration: 0.1, delay: 0.11, gain: 0.75, type: "triangle" }
  ],
  roundEnd: [
    { frequency: 784, duration: 0.04, gain: 0.6, type: "square" },
    { frequency: 659, duration: 0.05, delay: 0.045, gain: 0.6, type: "square" },
    { frequency: 523, duration: 0.09, delay: 0.095, gain: 0.7, type: "square" }
  ],
  warning: [
    { frequency: 320, duration: 0.08, gain: 0.55, type: "square" }
  ]
};

function triggerSound(effect, enabled = true) {
  if (!enabled) return;
  playSoundSequence(SOUND_EFFECTS[effect] || SOUND_EFFECTS.ui);
}

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

  const renderSprite = () => {
    switch (avatar.sprite) {
      case "duck":
        return (
          <>
            <div className="absolute inset-x-1 top-1 h-3 bg-[#ffe45a]" />
            <div className="absolute left-4 top-0 h-2 w-3 bg-[#ffe45a]" />
            <div className="absolute right-3 top-2 h-2 w-4 bg-[#ff9a3d]" />
          </>
        );
      case "jojo":
        return (
          <>
            <div className="absolute inset-x-1 top-0 h-3 bg-[#6d3a1d]" />
            <div className="absolute left-0 top-2 h-4 w-3 bg-[#6d3a1d]" />
            <div className="absolute right-0 top-2 h-4 w-3 bg-[#6d3a1d]" />
            <div className="absolute left-2 top-1 h-2 w-2 bg-[#c98f2e]" />
            <div className="absolute left-4 top-0 h-2 w-4 bg-[#c98f2e]" />
            <div className="absolute right-3 top-1 h-2 w-2 bg-[#c98f2e]" />
            <div className="absolute left-1 right-1 bottom-0 h-4 bg-[#bf2434]" />
            <div className="absolute left-0 bottom-2 h-3 w-2 bg-[#8d1b28]" />
            <div className="absolute right-0 bottom-2 h-3 w-2 bg-[#8d1b28]" />
            <div className="absolute left-6 bottom-1 h-3 w-1 bg-[#dbe9ff]" />
          </>
        );
      case "neon":
        return (
          <>
            <div className="absolute inset-x-2 top-1 h-3 bg-[#11395c]" />
            <div className="absolute left-1 top-2 h-5 w-2 bg-[#0edbff]" />
            <div className="absolute right-1 top-1 h-5 w-2 bg-[#0edbff]" />
            <div className="absolute right-2 top-0 h-2 w-2 bg-[#f9ff65]" />
            <div className="absolute left-1 right-1 bottom-0 h-4 bg-[#12365b]" />
            <div className="absolute left-5 bottom-2 h-2 w-6 bg-[#f2cc4d]" />
          </>
        );
      case "rei":
        return (
          <>
            <div className="absolute inset-x-1 top-0 h-3 bg-[#c5e2ff]" />
            <div className="absolute left-0 top-2 h-5 w-3 bg-[#c5e2ff]" />
            <div className="absolute right-0 top-2 h-5 w-3 bg-[#c5e2ff]" />
            <div className="absolute left-2 right-2 top-3 h-2 bg-[#fdfcff]" />
            <div className="absolute left-1 right-1 bottom-0 h-4 bg-[#fdfcff]" />
            <div className="absolute left-4 bottom-2 h-2 w-8 bg-[#d32235]" />
          </>
        );
      case "halo":
        return (
          <>
            <div className="absolute left-3 right-3 top-0 h-1 border border-[#54f7ff] bg-transparent" />
            <div className="absolute left-4 right-4 top-1 h-1 bg-[#54f7ff]" />
          </>
        );
      case "bandana":
        return (
          <>
            <div className="absolute inset-x-1 top-3 h-2 bg-[#ff7a59]" />
            <div className="absolute right-1 top-4 h-3 w-2 bg-[#ff7a59]" />
          </>
        );
      case "eva":
        return (
          <>
            <div className="absolute left-4 top-0 h-3 w-2 bg-[#80ff72]" />
            <div className="absolute right-4 top-0 h-3 w-2 bg-[#80ff72]" />
            <div className="absolute inset-x-2 top-1 h-3 bg-[#6fff61]" />
            <div className="absolute left-1 top-2 h-4 w-2 bg-[#3d1f69]" />
            <div className="absolute right-1 top-2 h-4 w-2 bg-[#3d1f69]" />
            <div className="absolute left-4 top-3 h-2 w-2 bg-[#111827]" />
            <div className="absolute right-4 top-3 h-2 w-2 bg-[#111827]" />
            <div className="absolute left-5 top-5 h-3 w-2 bg-[#111827]" />
            <div className="absolute inset-x-1 bottom-0 h-4 bg-[#4b2489]" />
            <div className="absolute left-3 bottom-2 h-2 w-2 bg-[#80ff72]" />
            <div className="absolute right-3 bottom-2 h-2 w-2 bg-[#80ff72]" />
          </>
        );
      case "freddy":
        return (
          <>
            <div className="absolute left-1 top-0 h-3 w-3 bg-[#5c3119]" />
            <div className="absolute right-1 top-0 h-3 w-3 bg-[#5c3119]" />
            <div className="absolute left-3 top-0 h-1 w-6 bg-[#111]" />
            <div className="absolute left-5 top-1 h-2 w-2 bg-[#111]" />
            <div className="absolute inset-x-2 top-1 h-4 bg-[#8f5a34]" />
            <div className="absolute left-4 right-4 top-4 h-3 bg-[#dcb48a]" />
            <div className="absolute left-2 top-6 h-2 w-2 bg-[#111]" />
            <div className="absolute right-2 top-6 h-2 w-2 bg-[#111]" />
            <div className="absolute left-5 top-6 h-2 w-2 bg-[#b30f17]" />
            <div className="absolute left-4 right-4 bottom-1 h-2 bg-[#3f2213]" />
          </>
        );
      case "chica":
        return (
          <>
            <div className="absolute left-1 top-1 h-3 w-3 bg-[#f6dd69]" />
            <div className="absolute right-1 top-1 h-3 w-3 bg-[#f6dd69]" />
            <div className="absolute left-5 top-0 h-2 w-2 bg-[#f35d7a]" />
            <div className="absolute inset-x-2 top-2 h-4 bg-[#f2d35b]" />
            <div className="absolute left-4 right-4 top-5 h-2 bg-[#fff3c7]" />
            <div className="absolute left-4 right-4 top-7 h-2 bg-[#ff8c00]" />
            <div className="absolute left-1 top-6 h-2 w-2 bg-[#111]" />
            <div className="absolute right-1 top-6 h-2 w-2 bg-[#111]" />
            <div className="absolute left-3 right-3 bottom-0 h-3 bg-[#ffffff]" />
          </>
        );
      case "bonny":
        return (
          <>
            <div className="absolute left-1 top-0 h-5 w-2 bg-[#6d63d8]" />
            <div className="absolute left-3 top-1 h-2 w-2 bg-[#c5bfff]" />
            <div className="absolute right-1 top-0 h-5 w-2 bg-[#6d63d8]" />
            <div className="absolute right-3 top-1 h-2 w-2 bg-[#c5bfff]" />
            <div className="absolute inset-x-2 top-2 h-4 bg-[#7b76c9]" />
            <div className="absolute left-4 right-4 top-5 h-3 bg-[#ddd3ee]" />
            <div className="absolute left-2 top-6 h-2 w-2 bg-[#111]" />
            <div className="absolute right-2 top-6 h-2 w-2 bg-[#111]" />
            <div className="absolute left-4 right-4 bottom-1 h-2 bg-[#5c4dbf]" />
            <div className="absolute left-5 bottom-0 h-2 w-6 bg-[#ff2b62]" />
          </>
        );
      case "turing":
        return (
          <>
            <div className="absolute inset-x-2 top-1 h-3 bg-[#574234]" />
            <div className="absolute left-1 top-2 h-4 w-2 bg-[#574234]" />
            <div className="absolute right-1 top-2 h-4 w-2 bg-[#574234]" />
            <div className="absolute left-3 right-3 top-0 h-1 bg-[#c6b06b]" />
            <div className="absolute left-1 right-1 bottom-0 h-4 bg-[#4e678c]" />
            <div className="absolute left-4 bottom-2 h-6 w-1 bg-[#f6f7fb]" />
            <div className="absolute left-5 bottom-1 h-2 w-6 bg-[#1c2f55]" />
          </>
        );
      case "twilight":
        return (
          <>
            <div className="absolute inset-x-2 top-1 h-3 bg-[#31225f]" />
            <div className="absolute left-0 top-1 h-4 w-2 bg-[#31225f]" />
            <div className="absolute right-0 top-1 h-4 w-2 bg-[#31225f]" />
            <div className="absolute left-2 top-0 h-2 w-2 bg-[#ff4fb0]" />
            <div className="absolute left-4 top-1 h-2 w-2 bg-[#8b6cff]" />
            <div className="absolute left-1 right-1 bottom-0 h-4 bg-[#a77cff]" />
            <div className="absolute right-1 top-5 h-3 w-2 bg-[#ff65c5]" />
            <div className="absolute left-4 bottom-2 h-8 w-2 bg-[#1ee0ff]" />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={clsx(
        "avatar-swatch relative overflow-hidden rounded-none border-2 border-white/20 shadow-arcade",
        sizing[size]
      )}
      style={{ background: `linear-gradient(180deg, ${avatar.accent}, ${avatar.skin})` }}
    >
      {renderSprite()}
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
    <div className="mx-auto flex min-h-screen max-w-7xl items-center px-4 py-4 lg:h-[100dvh] lg:overflow-hidden lg:px-6 lg:py-3">
      <div className="grid w-full gap-5 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-4">
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
            Equipos empresariales votan en tiempo real, usan una sola decision por ronda y se enfrentan contra todos los demas equipos para sobrevivir con estrategia, traicion y coins.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:mt-5">
            <MiniStat label="Jugadores por equipo" value={`Hasta ${TEAM_LIMIT}`} tone="pink" />
            <MiniStat label="Flujo de lobby" value="Admin controla equipos" tone="lime" />
          </div>
        </section>

        <Panel className="self-center p-4 md:p-5 lg:p-4">
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

          <div className="mt-4 space-y-3 lg:space-y-2.5">
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
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:gap-1.5">
                {AVATARS.map((avatar) => (
                  <button
                    type="button"
                    key={avatar.id}
                    className={clsx(
                      "theme-soft rounded-none border p-2 lg:p-1.5",
                      form.avatarId === avatar.id ? "border-neonPink bg-neonPink/10" : "border-white/10"
                    )}
                    onClick={() => setForm((current) => ({ ...current, avatarId: avatar.id }))}
                  >
                    <div className="mx-auto w-fit">
                      <PixelAvatar avatarId={avatar.id} size="sm" />
                    </div>
                    <div className="mt-2 text-center font-pixel text-[8px] theme-muted lg:mt-1.5 lg:text-[7px]">{avatar.name}</div>
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

function ResultsBoard({ room, selectedTeamId, onNavigate }) {
  const lastResult = room.currentRound?.results || room.history[0];
  const pairResults = (lastResult?.pairResults || []).slice();
  const orderedPairResults = [
    ...pairResults.filter((pair) => pair.teamAId === selectedTeamId || pair.teamBId === selectedTeamId),
    ...pairResults.filter((pair) => pair.teamAId !== selectedTeamId && pair.teamBId !== selectedTeamId)
  ];
  const myMatchCount = orderedPairResults.filter((pair) => pair.teamAId === selectedTeamId || pair.teamBId === selectedTeamId).length;
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setCurrentIndex(0);
  }, [room.roundNumber, orderedPairResults.length, selectedTeamId]);

  if (!lastResult) {
    return (
      <Panel>
        <div className="font-pixel text-xs theme-muted">Todavia no hay resultados.</div>
      </Panel>
    );
  }

  const safeIndex = orderedPairResults.length ? Math.min(currentIndex, orderedPairResults.length - 1) : 0;
  const currentPair = orderedPairResults[safeIndex];
  const isMyMatch = currentPair && (currentPair.teamAId === selectedTeamId || currentPair.teamBId === selectedTeamId);

  return (
    <Panel className="overflow-visible">
      <div className="results-toolbar flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-pixel text-xs text-neonPink">Resultado de la ronda {room.roundNumber}</div>
          <div className="mt-2 text-sm theme-muted">
            {orderedPairResults.length} enfrentamientos
            {myMatchCount > 0 ? ` · ${myMatchCount} de tu equipo` : ""}
          </div>
        </div>
        <div className="results-nav flex items-center gap-2">
          <ArcadeButton
            variant="ghost"
            className="results-nav-btn"
            disabled={safeIndex === 0}
            onClick={() => {
              setCurrentIndex((index) => Math.max(0, index - 1));
              onNavigate?.();
            }}
          >
            Anterior
          </ArcadeButton>
          <ArcadeButton
            variant="primary"
            className="results-nav-btn"
            disabled={safeIndex === orderedPairResults.length - 1}
            onClick={() => {
              setCurrentIndex((index) => Math.min(orderedPairResults.length - 1, index + 1));
              onNavigate?.();
            }}
          >
            Siguiente
          </ArcadeButton>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="font-pixel text-[9px] text-neonBlue">
          Enfrentamiento {orderedPairResults.length ? safeIndex + 1 : 0}/{orderedPairResults.length}
        </div>
        {isMyMatch && (
          <div className="results-highlight-chip font-pixel text-[8px] text-neonLime">
            Tu equipo participa aqui
          </div>
        )}
      </div>

      {currentPair && (
        <div
          key={`${currentPair.teamAId}-${currentPair.teamBId}-${safeIndex}`}
          className={clsx(
            "results-card theme-soft mt-4 border border-white/10 p-3",
            isMyMatch && "results-card-my-match"
          )}
        >
          <div className="results-pair-header flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0 font-pixel text-[10px] break-words">
              {currentPair.teamAName} vs {currentPair.teamBName}
            </div>
            <div className="font-pixel text-[8px] text-neonLime">
              {currentPair.winner ? `Gana ${currentPair.winner === currentPair.teamAId ? currentPair.teamAName : currentPair.teamBName}` : "Empate"}
            </div>
          </div>
          <div className="results-pair-grid mt-3 grid gap-2 md:grid-cols-2">
            <div
              className={clsx(
                "min-w-0 rounded-none border border-neonBlue/20 bg-neonBlue/5 p-3",
                currentPair.teamAId === selectedTeamId && "results-team-my-side"
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs theme-muted">{currentPair.teamAName}</div>
                {currentPair.teamAId === selectedTeamId && (
                  <div className="font-pixel text-[8px] text-neonLime">Tu equipo</div>
                )}
              </div>
              <div className="mt-2 font-pixel text-[10px] text-neonBlue">{decisionLabels[currentPair.decisionA] || "Descansa"}</div>
              <div className="mt-2 text-sm text-arcadeGold">
                {currentPair.deltaA >= 0 ? "+" : ""}
                {currentPair.deltaA} coins
              </div>
            </div>
            <div
              className={clsx(
                "min-w-0 rounded-none border border-neonPink/20 bg-neonPink/5 p-3",
                currentPair.teamBId === selectedTeamId && "results-team-my-side"
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs theme-muted">{currentPair.teamBName}</div>
                {currentPair.teamBId === selectedTeamId && (
                  <div className="font-pixel text-[8px] text-neonLime">Tu equipo</div>
                )}
              </div>
              <div className="mt-2 font-pixel text-[10px] text-neonPink">{decisionLabels[currentPair.decisionB] || "Descansa"}</div>
              <div className="mt-2 text-sm text-arcadeGold">
                {currentPair.deltaB >= 0 ? "+" : ""}
                {currentPair.deltaB} coins
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="results-index-strip mt-4 flex flex-wrap gap-2">
        {orderedPairResults.map((pair, index) => {
          const isActive = index === safeIndex;
          const isMine = pair.teamAId === selectedTeamId || pair.teamBId === selectedTeamId;
          return (
            <button
              key={`${pair.teamAId}-${pair.teamBId}-${index}`}
              type="button"
              className={clsx(
                "results-index-btn font-pixel text-[8px]",
                isActive && "results-index-btn-active",
                isMine && "results-index-btn-mine"
              )}
              onClick={() => {
                setCurrentIndex(index);
                onNavigate?.();
              }}
            >
              {index + 1}
            </button>
          );
        })}
      </div>
    </Panel>
  );
}

function RankingBoardContent({ teams }) {
  return (
    <div className="space-y-2">
      {teams.map((team, index) => (
        <div key={team.teamId} className="theme-soft flex items-center justify-between border border-white/10 px-3 py-2">
          <div>
            <div className="font-pixel text-[9px]">#{index + 1} {team.teamName}</div>
            <div className="mt-1 text-xs theme-muted">{team.roundsWon} rondas ganadas</div>
          </div>
          <div className="font-pixel text-[10px] text-arcadeGold">{team.coins}c</div>
        </div>
      ))}
    </div>
  );
}

function GameFinishedModal({ room, onBackToRoom, onLeave }) {
  const summary = room.gameSummary;
  if (!summary) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020617]/75 px-3 py-6 backdrop-blur-sm">
      <div className="modal-shell max-h-[92vh] w-full max-w-5xl overflow-y-auto">
        <Panel className="p-5 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="font-pixel text-sm text-neonLime">Juego finalizado</div>
              <div className="mt-4 text-3xl font-pixel md:text-5xl">{summary.winner?.teamName || "Sin ganador"}</div>
              <div className="mt-2 max-w-2xl theme-muted">
                La partida ya cerro. Puedes volver a la sala para revisar el tablero o salir al menu.
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <MiniStat label="Rondas" value={summary.totalRounds} tone="blue" />
            <MiniStat label="% Cooperacion" value={`${summary.cooperateRate}%`} tone="lime" />
            <MiniStat label="% Traicion" value={`${summary.betrayRate}%`} tone="pink" />
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
            <div className="space-y-4">
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

              <div className="flex flex-wrap gap-3">
                <ArcadeButton variant="ghost" onClick={onBackToRoom}>
                  Volver a sala
                </ArcadeButton>
                <ArcadeButton variant="gold" onClick={onLeave}>
                  Salir a menu
                </ArcadeButton>
              </div>
            </div>

            <Panel>
              <div className="font-pixel text-xs text-arcadeGold">Ranking final</div>
              <div className="mt-4 modal-ranking-scroll">
                <RankingBoardContent teams={summary.ranking.teams} />
              </div>
            </Panel>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function TeamListContent({ room, selectedTeamId }) {
  return (
    <div className="space-y-3">
      {room.teams.map((team) => (
        <TeamCard key={team.id} team={team} room={room} selectedTeamId={selectedTeamId} />
      ))}
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
  onRenameTeam,
  onDeleteTeam
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
              <ArcadeButton
                variant="danger"
                disabled={!canEditTeams || team.playerIds.length > 0 || room.teams.length <= 1}
                onClick={() => onDeleteTeam(team.id)}
              >
                Eliminar
              </ArcadeButton>
            </div>
            <div className="mt-2 text-sm theme-muted">
              {team.playerIds.length} / {TEAM_LIMIT} jugadores
              {team.playerIds.length > 0 ? " · Debe quedar vacio para eliminarse." : ""}
            </div>
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
  const [finishedModalOpen, setFinishedModalOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [teamDrafts, setTeamDrafts] = useState({});
  const timerRef = useRef(null);
  const previousStatusRef = useRef(null);
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
        setFinishedModalOpen(false);
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
    if (room?.status === "finished") {
      setFinishedModalOpen(true);
    }
  }, [room?.status]);

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
    triggerSound("warning", soundEnabled);
  }, [roundSecondsRemaining, room?.status, soundEnabled]);

  useEffect(() => {
    if (!soundEnabled || !room?.status) {
      previousStatusRef.current = room?.status || null;
      return;
    }

    const previousStatus = previousStatusRef.current;
    if (previousStatus && previousStatus !== room.status) {
      if (room.status === "round") triggerSound("roundStart", soundEnabled);
      if (room.status === "results") triggerSound("roundEnd", soundEnabled);
      if (room.status === "finished") triggerSound("success", soundEnabled);
    }

    previousStatusRef.current = room.status;
  }, [room?.status, soundEnabled]);

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
    setFinishedModalOpen(false);
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
      else {
        setError("");
        triggerSound("success", soundEnabled);
      }
    });
  }

  function emitVote(decision) {
    socket.emit("player:vote", { roomCode: room.code, playerId: livePlayer.id, decision }, (response) => {
      if (!response?.ok) setError(response?.message || "No se pudo registrar el voto.");
      else {
        setError("");
        triggerSound(decision === "cooperate" ? "cooperate" : "betray", soundEnabled);
      }
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

  function deleteTeamAction(teamId) {
    emitAdmin("admin:deleteTeam", { teamId });
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
  const canFinishGame = room.status === "round" || room.status === "results";
  const canManageLobbyTeams = room.status === "lobby" || room.status === "finished";
  const showRoundResults = room.status === "results" || Boolean(roundResults);

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
              <ArcadeButton variant="dark" className="flex-1 sm:flex-none" onClick={() => {
                setConfigOpen((current) => !current);
                triggerSound("toggle", soundEnabled);
              }}>
                Config
              </ArcadeButton>
              {isAdmin && (
                <ArcadeButton variant={adminPanelOpen ? "lime" : "ghost"} className="flex-1 sm:flex-none" onClick={() => {
                  setAdminPanelOpen((current) => !current);
                  triggerSound("toggle", soundEnabled);
                }}>
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
                  <ArcadeButton variant={soundEnabled ? "lime" : "ghost"} onClick={() => {
                    const nextEnabled = !soundEnabled;
                    setSoundEnabled(nextEnabled);
                    if (nextEnabled) {
                      playSoundSequence([
                        { frequency: 520, duration: 0.04, gain: 0.7, type: "triangle" },
                        { frequency: 780, duration: 0.08, delay: 0.04, gain: 0.75, type: "triangle" }
                      ]);
                    }
                  }}>
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
        {room.status === "lobby" && !isAdmin && (
          <div className="lobby-notice theme-panel border-neonLime/30 bg-neonLime/10 px-3 py-2.5 sm:px-4 sm:py-3">
            <div className="relative flex flex-wrap items-center justify-between gap-2">
              <div className="hidden sm:block">
                <div className="font-pixel text-[10px] text-neonLime">Lobby</div>
                <div className="mt-2 text-sm theme-muted">
                  Espera a que el administrador organice los equipos y active la primera ronda.
                </div>
              </div>
              <div className="sm:hidden font-pixel text-[10px] text-neonLime">Esperando inicio de partida</div>
              <div className="hidden sm:block font-pixel text-[10px] text-neonBlue">Pendiente de inicio</div>
            </div>
          </div>
        )}

        <div className="desktop-main-grid grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_380px]">
          <div className={clsx("flex flex-col gap-4", !showRoundResults && "h-full")}>
            <Panel className={clsx("decision-stage", !showRoundResults && "desktop-fill-stage h-full")}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-pixel text-xs text-neonPink">Centro de decision</div>
                  <div className="decision-copy mt-2 max-w-2xl text-sm theme-muted">{getCenterMessage(room.status, isAdmin)}</div>
                </div>
                <div className="round-chip theme-soft border border-white/10 px-3 py-2 font-pixel text-[10px] text-neonLime">
                  Ronda {room.roundNumber || 0}
                </div>
              </div>

              <div className="decision-actions mt-4 grid gap-3 sm:grid-cols-2">
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

              <div className="decision-meta mt-4 flex flex-wrap items-center gap-3 text-sm theme-muted">
                <span>Tu voto: <span className="font-pixel text-[10px]">{myVote ? decisionLabels[myVote] : "Pendiente"}</span></span>
                <span>Equipo: <span className="font-pixel text-[10px] text-neonBlue">{room.teams.find((team) => team.id === livePlayer.teamId)?.name || "Sin equipo"}</span></span>
              </div>

              {isAdmin && adminPanelOpen && (
                <div className="admin-panel-body mt-5 border-t border-white/10 pt-4">
                  <div className="grid gap-4">
                    <div className="admin-actions-grid grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                      {room.status === "lobby" && (
                        <ArcadeButton variant="lime" className="admin-action-btn" onClick={() => emitAdmin("admin:startGame")}>
                          Iniciar partida
                        </ArcadeButton>
                      )}
                      {room.status === "round" && (
                        <ArcadeButton variant="primary" className="admin-action-btn" onClick={() => emitAdmin("admin:resolveRound")}>
                          Cerrar ronda
                        </ArcadeButton>
                      )}
                      {room.status === "results" && (
                        <ArcadeButton variant="primary" className="admin-action-btn" onClick={() => emitAdmin("admin:nextRound")}>
                          Siguiente ronda
                        </ArcadeButton>
                      )}
                      <ArcadeButton variant="danger" className="admin-action-btn" disabled={!canFinishGame} onClick={() => emitAdmin("admin:finishGame")}>
                        Finalizar juego
                      </ArcadeButton>
                      <ArcadeButton variant="dark" className="admin-action-btn" onClick={() => emitAdmin("admin:resetGame")}>
                        Reiniciar
                      </ArcadeButton>
                      <ArcadeButton variant="danger" className="admin-action-btn" onClick={() => emitAdmin("admin:deleteRoom")}>
                        Eliminar sala
                      </ArcadeButton>
                    </div>

                    {canManageLobbyTeams ? (
                      <div className="admin-config-grid grid gap-3 md:grid-cols-2">
                        <label className="md:col-span-1">
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
                    ) : (
                      <label className="admin-config-single">
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
                    )}

                    {canManageLobbyTeams && (
                      <TeamAdminPanel
                        room={room}
                        teamDrafts={teamDrafts}
                        setTeamDrafts={setTeamDrafts}
                        newTeamName={newTeamName}
                        setNewTeamName={setNewTeamName}
                        onCreateTeam={createTeamAction}
                        onRenameTeam={renameTeamAction}
                        onDeleteTeam={deleteTeamAction}
                      />
                    )}
                  </div>
                </div>
              )}
            </Panel>

            {showRoundResults ? (
              <ResultsBoard room={room} selectedTeamId={livePlayer.teamId} onNavigate={() => triggerSound("ui", soundEnabled)} />
            ) : null}
          </div>

          <div className="flex h-full flex-col gap-4">
            <div className="xl:hidden">
              <SectionToggle
                title="Equipos"
                open={teamsOpen}
                onToggle={() => {
                  setTeamsOpen((current) => !current);
                  triggerSound("ui", soundEnabled);
                }}
                tone="blue"
              >
                <TeamListContent room={room} selectedTeamId={livePlayer.teamId} />
              </SectionToggle>
            </div>

            <Panel className="hidden xl:flex xl:flex-col">
              <div className="font-pixel text-xs text-neonBlue">Equipos</div>
              <div className="mt-4 flex-1 sidebar-scroll">
                <TeamListContent room={room} selectedTeamId={livePlayer.teamId} />
              </div>
            </Panel>

            <div className="xl:hidden">
              <SectionToggle
                title="Ranking global"
                open={rankingOpen}
                onToggle={() => {
                  setRankingOpen((current) => !current);
                  triggerSound("ui", soundEnabled);
                }}
                tone="gold"
              >
                <RankingBoardContent teams={room.ranking.teams} />
              </SectionToggle>
            </div>

            <Panel className="hidden xl:flex xl:flex-col">
              <div className="font-pixel text-xs text-arcadeGold">Ranking global</div>
              <div className="mt-2 text-sm theme-muted">Resumen persistente del avance por equipos.</div>
              <div className="mt-4 sidebar-scroll">
                <RankingBoardContent teams={room.ranking.teams} />
              </div>
            </Panel>
          </div>
        </div>
      </div>

      {room.status === "finished" && finishedModalOpen && (
        <GameFinishedModal
          room={room}
          onBackToRoom={() => setFinishedModalOpen(false)}
          onLeave={leaveRoomAction}
        />
      )}
    </div>
  );
}
