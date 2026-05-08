export const PORT = Number(process.env.PORT || 4000);
export const ROUND_MIN = 60;
export const ROUND_MAX = 180;
export const TEAM_LIMIT = 8;
export const DEFAULT_ROUND_DURATION = 90;
export const SCORE_MATRIX = {
  cooperate_cooperate: { a: 8, b: 8 },
  betray_cooperate: { a: 15, b: -2 },
  cooperate_betray: { a: -2, b: 15 },
  betray_betray: { a: 1, b: 1 }
};
