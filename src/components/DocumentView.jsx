import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeHighlight from "rehype-highlight";
import TableOfContents from "./TableOfContents.jsx";
import { extractHeadings } from "../utils/headings.js";

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// onEdit/onDelete/onPublish/onReject son opcionales — quién los pasa
// (App.jsx) decide qué acciones tiene sentido ofrecer para este doc. Los
// cuatro pegan directo contra rutas gateadas por auth de mentor en el
// backend; esta vista no sabe ni le importa si ya hay credenciales
// cacheadas.
export default function DocumentView({ doc, onEdit, onDelete, onPublish, onReject }) {
  const headings = useMemo(() => extractHeadings(doc.content), [doc.content]);
  const isPending = doc.status === "PENDING";
  const isRejected = doc.status === "REJECTED";

  return (
    <div className="flex-1 flex min-w-0">
      <article className="flex-1 min-w-0 overflow-y-auto px-8 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="inline-block text-xs font-semibold uppercase tracking-wide text-blue-400 bg-blue-950/60 px-2 py-1 rounded">
                  {doc.category}
                </span>
                {isPending && (
                  <span className="inline-block text-xs font-semibold uppercase tracking-wide text-amber-400 bg-amber-950/60 px-2 py-1 rounded">
                    Pendiente de revisión
                  </span>
                )}
                {isRejected && (
                  <span className="inline-block text-xs font-semibold uppercase tracking-wide text-red-400 bg-red-950/60 px-2 py-1 rounded">
                    Rechazado
                  </span>
                )}
              </div>

              {(onPublish || onEdit || onDelete || onReject) && (
                <div className="flex items-center gap-2">
                  {onPublish && (
                    <button
                      onClick={() => onPublish(doc)}
                      className="px-3 py-1.5 text-xs font-medium rounded-md bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                    >
                      Publicar
                    </button>
                  )}
                  {onEdit && (
                    <button
                      onClick={() => onEdit(doc)}
                      className="px-3 py-1.5 text-xs font-medium rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors"
                    >
                      Modificar
                    </button>
                  )}
                  {onReject && (
                    <button
                      onClick={() => onReject(doc)}
                      className="px-3 py-1.5 text-xs font-medium rounded-md bg-amber-900/60 hover:bg-amber-900 text-amber-300 transition-colors"
                    >
                      Pedir cambios
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(doc)}
                      className="px-3 py-1.5 text-xs font-medium rounded-md bg-red-900/60 hover:bg-red-900 text-red-300 transition-colors"
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              )}
            </div>

            {isRejected && doc.review_note && (
              <div className="mt-3 rounded-md border border-red-900/60 bg-red-950/30 px-3 py-2 text-sm text-red-300">
                <span className="font-semibold">Motivo del rechazo: </span>
                {doc.review_note}
              </div>
            )}

            <h1 className="text-3xl font-bold text-white mt-3">{doc.title}</h1>

            <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-neutral-500">
              {doc.author && <span>Por {doc.author}</span>}
              {doc.author && <span>·</span>}
              <span>Actualizado el {formatDate(doc.updated_at)}</span>
              {doc.tags?.length > 0 && (
                <>
                  <span>·</span>
                  <div className="flex flex-wrap gap-1.5">
                    {doc.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="doc-content prose prose-invert prose-neutral max-w-none prose-pre:bg-neutral-900 prose-pre:border prose-pre:border-neutral-800">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeSlug, rehypeHighlight]}
            >
              {doc.content}
            </ReactMarkdown>
          </div>
        </div>
      </article>

      <aside className="hidden xl:block w-64 shrink-0 border-l border-neutral-800 px-4 py-8 overflow-y-auto sticky top-0 h-screen">
        <TableOfContents headings={headings} />
      </aside>
    </div>
  );
}
