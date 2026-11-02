// Küchenplaner – Rückgängig/Wiederholen als reiner Reducer.
// Aufeinanderfolgende Änderungen mit derselben `group` (z. B. Schieberegler,
// Ziehen eines Moduls) werden innerhalb von 800 ms zu einem Schritt zusammengefasst.
export const HISTORY_LIMIT = 80;
const MERGE_MS = 800;

export function initHistory(present) {
  return { past: [], present, future: [], group: null, at: 0 };
}

export function historyReducer(state, action) {
  switch (action.type) {
    case "set": {
      const next = typeof action.update === "function" ? action.update(state.present) : action.update;
      if (next === state.present) return state;
      const now = action.now ?? Date.now();
      const merge = action.group && action.group === state.group && now - state.at < MERGE_MS;
      return {
        past: merge ? state.past : [...state.past, state.present].slice(-HISTORY_LIMIT),
        present: next,
        future: [],
        group: action.group || null,
        at: now,
      };
    }
    case "undo": {
      if (!state.past.length) return state;
      const prev = state.past[state.past.length - 1];
      return { past: state.past.slice(0, -1), present: prev, future: [state.present, ...state.future], group: null, at: 0 };
    }
    case "redo": {
      if (!state.future.length) return state;
      const [next, ...rest] = state.future;
      return { past: [...state.past, state.present], present: next, future: rest, group: null, at: 0 };
    }
    case "reset":
      return initHistory(action.present);
    default:
      return state;
  }
}
