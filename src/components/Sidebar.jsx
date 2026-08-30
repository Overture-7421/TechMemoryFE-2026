import { useState } from "react";
import SearchBar from "./SearchBar.jsx";
import { CATEGORIES } from "../constants.js";

function CategorySection({ category, docs, selectedDocId, onSelect }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="border-b border-neutral-800">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400 hover:text-neutral-200"
      >
        <span>{category}</span>
        <span className="flex items-center gap-2">
          <span className="text-[10px] text-neutral-600">{docs.length}</span>
          <span className={`transition-transform ${open ? "rotate-90" : ""}`}>›</span>
        </span>
      </button>

      {open && (
        <ul className="pb-2">
          {docs.length === 0 && (
            <li className="px-4 py-1 text-xs text-neutral-600 italic">Sin resultados</li>
          )}
          {docs.map((doc) => (
            <li key={doc.id}>
              <button
                onClick={() => onSelect(doc.id)}
                className={`w-full text-left px-4 py-1.5 text-sm rounded-none truncate transition-colors ${
                  doc.id === selectedDocId
                    ? "bg-neutral-800 text-white border-l-2 border-blue-500"
                    : "text-neutral-400 hover:text-neutral-100 hover:bg-neutral-900 border-l-2 border-transparent"
                }`}
                title={doc.title}
              >
                {doc.title}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function Sidebar({
  docs,
  selectedDocId,
  onSelect,
  searchQuery,
  onSearchChange,
  onNewDoc,
  onShowPending,
}) {
  const query = searchQuery.trim().toLowerCase();

  return (
    <aside className="w-72 shrink-0 h-screen sticky top-0 flex flex-col bg-neutral-950 border-r border-neutral-800">
      <div className="px-4 py-4 border-b border-neutral-800">
        <h1 className="text-base font-semibold text-white">Overture Docs</h1>
        <p className="text-xs text-neutral-500 mt-0.5">Wiki interno del equipo</p>
      </div>

      <SearchBar value={searchQuery} onChange={onSearchChange} />

      <div className="px-3 py-2 space-y-2">
        <button
          onClick={onNewDoc}
          className="w-full rounded-md bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium py-2 transition-colors"
        >
          + Nuevo documento
        </button>
        <button
          onClick={onShowPending}
          className="w-full rounded-md bg-neutral-900 border border-neutral-700 hover:bg-neutral-800 text-neutral-300 text-xs font-medium py-1.5 transition-colors"
          title="Requiere credenciales de mentor"
        >
          📋 Pendientes (mentor)
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto">
        {CATEGORIES.map((category) => {
          const categoryDocs = docs
            .filter((d) => d.category === category)
            .filter((d) => d.title.toLowerCase().includes(query));

          return (
            <CategorySection
              key={category}
              category={category}
              docs={categoryDocs}
              selectedDocId={selectedDocId}
              onSelect={onSelect}
            />
          );
        })}
      </nav>
    </aside>
  );
}
