// utils/clientId.js
function fallbackUUID() {
  // Generates a v4-compliant UUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : ((r & 0x3) | 0x8);
    return v.toString(16);
  });
}

export function getClientId() {
  let id = localStorage.getItem("client_id");
  if (!id) {
    const uuid = (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : fallbackUUID();
    localStorage.setItem("client_id", uuid);
    id = uuid;
  }
  return id;
}

/**
 * Refresh client ID (generate new one)
 * Useful for new sessions or connection issues
 */
export const refreshClientId = () => {
  const uuid = (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : fallbackUUID();
  localStorage.setItem("client_id", uuid);
  return uuid;
};

/**
 * Clear client ID from storage
 */
export const clearClientId = () => {
  localStorage.removeItem("client_id");
};

/**
 * Check if client ID exists
 */
export const hasClientId = () => {
  return !!localStorage.getItem("client_id");
};