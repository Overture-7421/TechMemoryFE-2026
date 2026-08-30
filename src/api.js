// Vacío en dev (queda relativo, lo resuelve el proxy de vite.config.js).
// En build de producción (GitHub Pages) hace falta VITE_API_BASE_URL
// apuntando al server desplegado — ver .env.example.
const API_ROOT = import.meta.env.VITE_API_BASE_URL || "";
const BASE_URL = `${API_ROOT}/api/docs`;

async function handle(res) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.error || `Error ${res.status}`);
    err.status = res.status;
    throw err;
  }
  if (res.status === 204) return null;
  return res.json();
}

// Basic Auth armado a mano en vez de dejar que el navegador lo maneje: así
// las credenciales de mentor viven solo en memoria de React (App.jsx) y se
// pierden en cualquier reload — nunca las cachea el navegador por su cuenta.
// btoa no banca UTF-8 directo, de ahí el paso por TextEncoder.
function authHeader(creds) {
  if (!creds) return {};
  const bytes = new TextEncoder().encode(`${creds.user}:${creds.pass}`);
  const b64 = btoa(String.fromCharCode(...bytes));
  return { Authorization: `Basic ${b64}` };
}

export function fetchDocs(category) {
  const url = category ? `${BASE_URL}?category=${encodeURIComponent(category)}` : BASE_URL;
  return fetch(url).then(handle);
}

export function fetchDoc(id) {
  return fetch(`${BASE_URL}/${id}`).then(handle);
}

// Público — sin credenciales. Entra siempre como PENDING (decidido en el
// servidor, no acá).
export function createDoc(payload) {
  return fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).then(handle);
}

// Mentor-only — todas de acá para abajo requieren `creds` ({ user, pass }),
// provisto por App.jsx vía el prompt propio (ver requestMentorCreds).
export function updateDoc(id, payload, creds) {
  return fetch(`${BASE_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeader(creds) },
    body: JSON.stringify(payload),
  }).then(handle);
}

export function deleteDoc(id, creds) {
  return fetch(`${BASE_URL}/${id}`, { method: "DELETE", headers: authHeader(creds) }).then(handle);
}

export function fetchPendingDocs(creds) {
  return fetch(`${BASE_URL}/pending`, { headers: authHeader(creds) }).then(handle);
}

export function publishDoc(id, creds) {
  return fetch(`${BASE_URL}/${id}/publish`, { method: "POST", headers: authHeader(creds) }).then(
    handle
  );
}

// Distinto de deleteDoc: preserva el doc como REJECTED con `note` y le
// dispara un email al autor (ver server/routes/docs.js).
export function rejectDoc(id, note, creds) {
  return fetch(`${BASE_URL}/${id}/reject`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader(creds) },
    body: JSON.stringify({ note }),
  }).then(handle);
}
