export default function SearchBar({ value, onChange }) {
  return (
    <div className="px-3 py-3 border-b border-neutral-800">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Buscar por título..."
        className="w-full rounded-md bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
      />
    </div>
  );
}
