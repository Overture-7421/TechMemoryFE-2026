export default function TableOfContents({ headings }) {
  if (headings.length === 0) {
    return (
      <div className="text-xs text-neutral-600 italic px-1">
        Este documento no tiene subtítulos.
      </div>
    );
  }

  const handleClick = (e, slug) => {
    e.preventDefault();
    document.getElementById(slug)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <nav className="text-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-2 px-1">
        En esta página
      </p>
      <ul className="space-y-1">
        {headings.map((h) => (
          <li key={h.slug} style={{ paddingLeft: h.depth === 3 ? "0.75rem" : 0 }}>
            <a
              href={`#${h.slug}`}
              onClick={(e) => handleClick(e, h.slug)}
              className="block px-1 py-0.5 text-neutral-400 hover:text-neutral-100 truncate"
              title={h.text}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
