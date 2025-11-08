/**
 * Redux persist utilities
 * Persists Redux state to localStorage (client-side only)
 */

export const loadState = (): any => {
  if (typeof window === "undefined") {
    return undefined;
  }

  try {
    const serializedState = localStorage.getItem("redux_state");
    if (serializedState === null) {
      return undefined;
    }
    return JSON.parse(serializedState);
  } catch (err) {
    console.error("Error loading state from localStorage:", err);
    return undefined;
  }
};

export const saveState = (state: any): void => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem("redux_state", serializedState);
  } catch (err) {
    console.error("Error saving state to localStorage:", err);
  }
};

