const STORAGE_KEY = 'board_state_v1';

export function saveBoard(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save board state:', e);
  }
}

export function loadBoard() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn('Failed to load board state:', e);
    return null;
  }
}

export function clearBoard() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('Failed to clear board state:', e);
  }
}
