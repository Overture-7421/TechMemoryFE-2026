import { useEffect } from "react";

// Autoplay-first embed nocookie: no guarda cookies de tracking hasta que
// alguien le da play, tiene el mismo player que youtube.com/embed.
const VIDEO_ID = "LDU_Txk06tM";
const EMBED_SRC = `https://www.youtube-nocookie.com/embed/${VIDEO_ID}`;

// Popup de bienvenida con el video tutorial embebido — pensado para gente
// que recién llega y no leyó el documento "¿Cómo usar la memoria técnica?"
// (ver categoría Ayuda). Cualquier forma de cerrarlo (X, Escape, click en el
// fondo) cuenta como "ya lo vi": no vuelve a aparecer solo en ese navegador,
// para no molestar a quien ya sabe usar la app. onDismiss (en App.jsx) es
// quien decide dónde persistir eso — este componente solo avisa que se
// cerró.
export default function WelcomeVideoModal({ open, onDismiss }) {
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e) {
      if (e.key === "Escape") onDismiss();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onDismiss]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onDismiss();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Video tutorial: cómo usar la memoria técnica"
        className="w-full max-w-2xl bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
          <div>
            <h2 className="text-base font-semibold text-white">
              ¿Cómo usar la memoria técnica?
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Un vistazo rápido en video. Si ya sabés cómo funciona, cerrá esto y listo.
            </p>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Cerrar"
            className="text-neutral-500 hover:text-neutral-200 text-xl leading-none shrink-0 ml-4"
          >
            ×
          </button>
        </div>

        <div className="p-5">
          <div className="aspect-video w-full overflow-hidden rounded-md border border-neutral-800 bg-black">
            <iframe
              className="w-full h-full"
              src={EMBED_SRC}
              title="Video tutorial: cómo usar la memoria técnica"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </div>
      </div>
    </div>
  );
}
