import { useState } from "react";

// Prompt propio, no el diálogo nativo del navegador — a propósito. El
// nativo cachea la credencial hasta que se cierra el navegador entero y no
// se puede forzar a re-preguntar para una acción puntual (ver borrado en
// App.jsx). Este modal no persiste nada por su cuenta; quien lo dispara
// decide qué hacer con lo que se manda a onSubmit.
export default function MentorPasswordModal({ message, error, onSubmit, onCancel }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!user || !pass) return;
    onSubmit({ user, pass });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-sm bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl">
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-white">Acceso de mentor</h2>
            <p className="text-xs text-neutral-500 mt-1">{message}</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">Usuario</label>
            <input
              type="text"
              autoFocus
              value={user}
              onChange={(e) => setUser(e.target.value)}
              className="w-full rounded-md bg-neutral-950 border border-neutral-700 px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">Contraseña</label>
            <input
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              className="w-full rounded-md bg-neutral-950 border border-neutral-700 px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm rounded-md text-neutral-300 hover:bg-neutral-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium"
            >
              Continuar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
