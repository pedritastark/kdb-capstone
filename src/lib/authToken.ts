const STORAGE_KEY = "danny-tacos-token";

export function leerToken(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function guardarToken(token: string) {
  localStorage.setItem(STORAGE_KEY, token);
}

export function borrarToken() {
  localStorage.removeItem(STORAGE_KEY);
}
