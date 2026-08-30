import DocumentView from "./DocumentView.jsx";

// Cola de pendientes: solo se llega acá por el botón de Sidebar, que ya
// dispara fetchPendingDocs() — si el navegador no tiene credenciales de
// mentor cacheadas todavía, el prompt nativo salta ahí, antes de que este
// componente exista.
export default function PendingView({
  docs,
  loading,
  error,
  selectedId,
  onSelect,
  onBack,
  onPublish,
  onEdit,
  onDelete,
  onReject,
}) {
  const selected = docs.find((d) => d.id === selectedId);

  return (
    <div className="flex-1 flex min-w-0">
      <aside className="w-72 shrink-0 h-screen sticky top-0 flex flex-col bg-neutral-950 border-r border-neutral-800">
        <div className="px-4 py-4 border-b border-neutral-800 flex items-center justify-between gap-2">
          <div>
            <h1 className="text-base font-semibold text-white">Pendientes</h1>
            <p className="text-xs text-neutral-500 mt-0.5">Solo mentores</p>
          </div>
          <button
            onClick={onBack}
            className="text-xs text-neutral-400 hover:text-neutral-200 shrink-0"
          >
            ← Biblioteca
          </button>
        </div>

        <ul className="flex-1 overflow-y-auto py-2">
          {docs.length === 0 && !loading && !error && (
            <li className="px-4 py-2 text-xs text-neutral-600 italic">
              No hay documentos pendientes.
            </li>
          )}
          {docs.map((doc) => (
            <li key={doc.id}>
              <button
                onClick={() => onSelect(doc.id)}
                className={`w-full text-left px-4 py-2 text-sm truncate transition-colors ${
                  doc.id === selectedId
                    ? "bg-neutral-800 text-white border-l-2 border-amber-500"
                    : "text-neutral-400 hover:text-neutral-100 hover:bg-neutral-900 border-l-2 border-transparent"
                }`}
                title={doc.title}
              >
                <span className="block truncate">{doc.title}</span>
                <span className="block text-[11px] text-neutral-600 truncate">
                  por {doc.author || "?"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {loading && (
        <div className="flex-1 flex items-center justify-center text-neutral-500 text-sm">
          Cargando pendientes...
        </div>
      )}

      {!loading && error && (
        <div className="flex-1 flex items-center justify-center text-red-400 text-sm px-8 text-center">
          {error}
        </div>
      )}

      {!loading && !error && selected && (
        <DocumentView
          doc={selected}
          onPublish={onPublish}
          onEdit={onEdit}
          onDelete={onDelete}
          onReject={onReject}
        />
      )}

      {!loading && !error && !selected && docs.length > 0 && (
        <div className="flex-1 flex items-center justify-center text-neutral-500 text-sm">
          Elegí un documento pendiente.
        </div>
      )}
    </div>
  );
}
