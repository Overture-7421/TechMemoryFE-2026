import GithubSlugger from "github-slugger";

// Extrae los headings h2/h3 de markdown crudo para armar la TOC.
// Usa github-slugger, la misma librería que usa rehype-slug internamente,
// para que los slugs generados aquí coincidan con los id="" del contenido renderizado.
export function extractHeadings(markdown) {
  const slugger = new GithubSlugger();
  const headings = [];
  let inCodeBlock = false;

  for (const rawLine of markdown.split("\n")) {
    const line = rawLine.trim();

    if (line.startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    const match = line.match(/^(#{2,3})\s+(.+)$/);
    if (!match) continue;

    const depth = match[1].length;
    const text = match[2].trim();
    headings.push({ depth, text, slug: slugger.slug(text) });
  }

  return headings;
}
