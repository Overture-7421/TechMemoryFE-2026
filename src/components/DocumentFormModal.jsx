import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeHighlight from "rehype-highlight";
import { CATEGORIES } from "../constants.js";

function emptyForm(doc) {
  if (!doc) {
    return {
      title: "",
      category: CATEGORIES[0],
      author: "",
      authorEmail: "",
      tagsInput: "",
      content: "",
    };
  }
  return {
    title: doc.title,
    category: doc.category,
    author: doc.author || "",
    authorEmail: doc.author_email || "",
    tagsInput: (doc.tags || []).join(", "),
    content: doc.content,
  };
}

// mode "create": abierto a cualquiera, entra a la cola de pendientes.
// mode "edit": solo llega acá vía botón "Modificar". Este componente no
// sabe nada de auth de mentor — onSubmit(payload) es quien decide (App.jsx),
// pidiendo credenciales si hace falta antes de pegarle al backend. Si el
// mentor cancela ese prompt, onSubmit rechaza con Error("cancelled") y acá
// simplemente no pasa nada (el modal se queda abierto, sin mostrar error).
export default function DocumentFormModal({ mode = "create", doc = null, onClose, onSubmit, onSaved }) {
  const [form, setForm] = useState(() => emptyForm(doc));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const isEdit = mode === "edit";
  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    // author_email es obligatorio para docs nuevos (así se puede avisar si
    // un mentor pide cambios), pero no se le exige a un mentor editando un
    // doc viejo que nunca lo tuvo — no tiene sentido bloquear un typo fix
    // por un dato que no es el que se está corrigiendo.
    if (
      !form.title.trim() ||
      !form.author.trim() ||
      !form.content.trim() ||
      (!isEdit && !form.authorEmail.trim())
    ) {
      setError(
        isEdit
          ? "Título, nombre y contenido son obligatorios."
          : "Título, nombre, email y contenido son obligatorios."
      );
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const tags = form.tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const payload = {
        title: form.title.trim(),
        category: form.category,
        author: form.author.trim(),
        author_email: form.authorEmail.trim(),
        tags,
        content: form.content,
      };

      const saved = await onSubmit(payload);
      onSaved(saved);
    } catch (err) {
      if (err.message !== "cancelled") setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-4xl bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
          <h2 className="text-lg font-semibold text-white">
            {isEdit ? "Editar documento" : "Nuevo documento"}
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-200 text-xl leading-none"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        {!isEdit && (
          <p className="px-5 pt-3 text-xs text-neutral-500">
            Tu documento entra a revisión de un mentor antes de publicarse.
          </p>
        )}

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">Título</label>
            <input
              type="text"
              value={form.title}
              onChange={update("title")}
              className="w-full rounded-md bg-neutral-950 border border-neutral-700 px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Ej. Calibración del sensor de color"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Tu nombre</label>
              <input
                type="text"
                value={form.author}
                onChange={update("author")}
                className="w-full rounded-md bg-neutral-950 border border-neutral-700 px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Quién escribe este documento"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Tu email</label>
              <input
                type="email"
                value={form.authorEmail}
                onChange={update("authorEmail")}
                className="w-full rounded-md bg-neutral-950 border border-neutral-700 px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="para avisarte si hay que corregir algo"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Categoría</label>
              <select
                value={form.category}
                onChange={update("category")}
                className="w-full rounded-md bg-neutral-950 border border-neutral-700 px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">
                Tags (separados por coma)
              </label>
              <input
                type="text"
                value={form.tagsInput}
                onChange={update("tagsInput")}
                className="w-full rounded-md bg-neutral-950 border border-neutral-700 px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="ftc-sdk, motores"
              />
            </div>
          </div>

          {/* Editor + preview lado a lado — la preview es solo
             ReactMarkdown re-renderizando form.content, que ya se actualiza
             en cada tecla vía update("content"); no hace falta debounce ni
             estado aparte para que sea "en vivo". */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">
                Contenido (Markdown)
              </label>
              <textarea
                value={form.content}
                onChange={update("content")}
                className="w-full h-80 resize-none rounded-md bg-neutral-950 border border-neutral-700 px-3 py-2 text-sm text-neutral-100 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder={"## Introducción\n\nPega aquí el markdown del documento..."}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">
                Vista previa
              </label>
              <div className="h-80 overflow-y-auto rounded-md bg-neutral-950 border border-neutral-700 px-3 py-2">
                {form.content.trim() ? (
                  <div className="doc-content prose prose-invert prose-neutral prose-sm max-w-none prose-pre:bg-neutral-900 prose-pre:border prose-pre:border-neutral-800">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeSlug, rehypeHighlight]}
                    >
                      {form.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-xs text-neutral-600 italic">
                    La vista previa aparece acá a medida que escribís.
                  </p>
                )}
              </div>
            </div>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-md text-neutral-300 hover:bg-neutral-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm rounded-md bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium"
            >
              {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Enviar a revisión"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
