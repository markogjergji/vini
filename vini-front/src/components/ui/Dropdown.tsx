import { useState, useRef, useEffect } from "react";

export interface DropdownOption {
  value: number | string;
  label: string;
  sub?: string;
  icon?: string;
}

interface Props {
  placeholder: string;
  value: number | string | null;
  options: DropdownOption[];
  onChange: (value: number | string | null) => void;
  disabled?: boolean;
  className?: string;
  /** "md" matches standard text input height; "lg" is the taller hero variant (default) */
  size?: "md" | "lg";
  searchable?: boolean;
}

export default function Dropdown({
  placeholder,
  value,
  options,
  onChange,
  disabled = false,
  className = "",
  size = "lg",
  searchable = true,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.value === value) ?? null;

  const filtered = searchable && query.trim()
    ? options.filter((o) =>
        o.label.toLowerCase().includes(query.toLowerCase())
      )
    : options;

  function close() {
    setOpen(false);
    setQuery("");
  }

  // Auto-focus search when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 0);
    }
  }, [open]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const handleSelect = (opt: DropdownOption) => {
    onChange(opt.value === value ? null : opt.value);
    close();
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={[
          "w-full flex items-center justify-between gap-2 bg-white text-sm transition-colors rounded-[inherit]",
          size === "lg" ? "h-12 px-4" : "px-3 py-2",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500",
          disabled
            ? "cursor-not-allowed bg-gray-50 text-gray-300"
            : open
            ? "text-gray-900"
            : "text-gray-700 hover:bg-gray-50",
        ].join(" ")}
      >
        <span className={`truncate min-w-0 ${selected ? "font-medium text-gray-900" : "text-gray-400"}`}>
          {selected ? selected.label : placeholder}
        </span>

        <span className="flex items-center gap-1.5 flex-shrink-0">
          {selected?.icon && (
            <img
              src={selected.icon}
              alt=""
              className="h-7 w-10 object-contain object-center opacity-80"
              onError={(e) => { e.currentTarget.style.display = "none"; }}
            />
          )}
          <svg
            className={[
              "w-4 h-4 transition-transform duration-200",
              disabled ? "text-gray-200" : "text-gray-400",
              open ? "rotate-180" : "",
            ].join(" ")}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>

      {/* Panel */}
      {open && !disabled && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 bg-white border border-gray-200 shadow-xl overflow-hidden">
          {/* Search input */}
          {searchable && (
            <div className="px-3 py-2 border-b border-gray-100">
              <div className="flex items-center gap-2 px-2 py-1.5 bg-gray-50 rounded-md">
                <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 111 11a6 6 0 0116 0z" />
                </svg>
                <input
                  ref={searchRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={`Search ${placeholder.toLowerCase()}…`}
                  className="flex-1 bg-transparent text-xs text-gray-700 placeholder-gray-400 outline-none"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Clear selection */}
          {value !== null && (
            <button
              type="button"
              onClick={() => { onChange(null); close(); }}
              className="w-full flex items-center gap-3 px-4 py-2 text-xs text-gray-400 hover:bg-gray-50 border-b border-gray-100 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear selection
            </button>
          )}

          {filtered.length === 0 ? (
            <div className="px-4 py-3 text-xs text-gray-400 italic">
              {query ? `No results for "${query}"` : "No options available"}
            </div>
          ) : (
            <ul className="max-h-60 overflow-y-auto">
              {filtered.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <li key={opt.value}>
                    <button
                      type="button"
                      onClick={() => handleSelect(opt)}
                      className={[
                        "w-full flex items-center justify-between gap-3 px-4 py-2.5 text-sm text-left transition-colors",
                        isSelected
                          ? "bg-blue-50 text-blue-700 font-medium"
                          : "text-gray-700 hover:bg-gray-50",
                      ].join(" ")}
                    >
                      <span className="truncate flex-1 min-w-0">{opt.label}</span>
                      <span className="flex items-center gap-1.5 flex-shrink-0">
                        {opt.sub && (
                          <span className="text-xs text-gray-400">{opt.sub}</span>
                        )}
                        {opt.icon && (
                          <img
                            src={opt.icon}
                            alt=""
                            className="h-7 w-10 object-contain object-center opacity-70"
                            onError={(e) => { e.currentTarget.style.display = "none"; }}
                          />
                        )}
                        {isSelected && (
                          <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
