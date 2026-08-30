import { useEffect, useRef, useState } from "react";

const NOTE_MAX_LEN = 2000;

// Modal propio en vez de window.prompt — a diferencia de MentorPasswordModal
// (un par de campos, sin más validación que "no vacío"), acá hace falta
// contador en vivo, límite de caracteres, y distinguir 400 (nota inválida,
// se corrige sin perderla) de 401/404 (no tiene sentido seguir editando,
// se cierra) de un error de red (se queda abierto para no perder lo ya
// escrito). onSubmit(note) es quien pega contra el backend — este
// componente no sabe nada de auth, mismo criterio que DocumentFormModal:
// App.jsx decide cómo conseguir credenciales de mentor antes de llamar a
// rejectDoc().
export default function RejectDocModal({
  docId,
  docTitle,
  open,
  onClose,
  onSubmit,
  onRejected,
  onDocGone,
}) {
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const textareaRef = useRef(null);
  const modalRef = useRef(null);

  // Se resetea cada vez que se abre (y de nuevo si cambia el doc, por si
  // dos rechazos seguidos reusan el mismo componente montado) — si no, un
  // cierre por error dejaría el textarea con el texto/estado del intento
  // anterior la próxima vez que se abra.
  useEffect(() => {
    if (!open) return;
    setNote("");
    setError(null);
    setSubmitting(false);
    const raf = requestAnimationFrame(() => textareaRef.current?.focus());
    return () => cancelAnimationFrame(raf);
  }, [open, docId]);

  // Escape cierra, Tab queda atrapado adentro del modal. Ninguno de los dos
  // hace nada mientras hay un submit en curso — no tiene sentido abandonar
  // ni saltar de foco a mitad de un request.
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e) {
      if (submitting) return;

      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === "Tab" && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll(
          'button:not(:disabled), textarea:not(:disabled), [href], [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, submitting, onClose]);

  if (!open) return null;

  const overLimit = note.length > NOTE_MAX_LEN;
  const canSubmit = note.trim().length > 0 && !overLimit && !submitting;

  const handleBackdropMouseDown = (e) => {
    if (submitting) return;
    if (e.target === e.currentTarget) onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);

    try {
      const doc = await onSubmit(note.trim());
      onRejected(doc);
      setNote("");
      onClose();
    } catch (err) {
      // Canceló el prompt de credenciales de mentor (requestMentorCreds) —
      // no es un error del rechazo en sí, se queda tal cual estaba.
      if (err.message === "cancelled") {
        setSubmitting(false);
        return;
      }
      if (err.status === 401) {
        onClose();
        alert("Sesión de mentor vencida, actualizá la página e iniciá sesión de nuevo.");
        return;
      }
      if (err.status === 404) {
        onClose();
        onDocGone(docId);
        alert("Este documento ya no existe.");
        return;
      }
      if (err.status === 400) {
        setError(err.message);
        setSubmitting(false);
        return;
      }
      // Red u otro error inesperado: se deja el modal abierto para no
      // perder la nota ya escrita.
      setError(err.message || "No se pudo pedir el cambio. Reintentá.");
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onMouseDown={handleBackdropMouseDown}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reject-modal-title"
        className="w-full max-w-lg bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
          <h2 id="reject-modal-title" className="text-base font-semibold text-white">
            Pedir cambios
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Cerrar"
            className="text-neutral-500 hover:text-neutral-200 text-xl leading-none disabled:opacity-40"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 pt-3 pb-5 space-y-3">
          <p className="text-xs text-neutral-500">
            ¿Qué tiene que corregir el autor de "{docTitle}"? Esto se le manda por email.
          </p>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div>
            <textarea
              ref={textareaRef}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={submitting}
              rows={6}
              className="w-full rounded-md bg-neutral-950 border border-neutral-700 px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60"
              placeholder="Ej. Falta la sección de troubleshooting y el título no coincide con el contenido."
            />
            <div className="flex justify-end mt-1">
              <span className={`text-[11px] ${overLimit ? "text-red-400" : "text-neutral-500"}`}>
                {note.length}/{NOTE_MAX_LEN}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-sm rounded-md text-neutral-300 hover:bg-neutral-800 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="px-4 py-2 text-sm rounded-md bg-amber-700 hover:bg-amber-600 disabled:opacity-50 text-white font-medium"
            >
              {submitting ? "Enviando..." : "Pedir cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
