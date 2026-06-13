export const CLOCK_THEME = {
  AM_ACTIVE: "var(--clock-am-active)",
  PM_ACTIVE: "var(--clock-pm-active)",
  COMPLETED: "var(--clock-completed)",
  DIAL_MAJOR: "var(--clock-dial-major)",
  DIAL_MINOR: "var(--clock-dial-minor)",
  TEXT: "var(--clock-dial-text)",
  HAND: "var(--clock-hand)",
};

export const CATEGORIES = [
  { id: "work",     label: "Work",     color: "var(--theme-work)",     icon: "💼" },
  { id: "study",    label: "Study",    color: "var(--theme-study)",    icon: "📚" },
  { id: "exercise", label: "Exercise", color: "var(--theme-exercise)", icon: "🏃" },
  { id: "leisure",  label: "Leisure",  color: "var(--theme-leisure)",  icon: "🎮" },
  { id: "sleep",    label: "Sleep",    color: "var(--theme-sleep)",    icon: "😴" },
  { id: "other",    label: "Other",    color: "var(--theme-other)",    icon: "✨" },
];

export const CX = 170;
export const CY = 170;
export const OUTER_R = 140;
export const INNER_R = 110;
export const ARC_W = 16;
export const GAP = 4;

export const BASE_R = OUTER_R;

export const CLOCK_FONT = {
  DEFAULT_SIZE: 12,
  MIN_SIZE: 9,
  CHAR_RATIO: 0.55,
  PADDING: 4,
};
