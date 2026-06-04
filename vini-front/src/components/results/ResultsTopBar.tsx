import { useNavigate, useSearchParams } from "react-router-dom";
import Dropdown from "../ui/Dropdown";

const SORT_OPTIONS = [
  { value: "newest",     label: "Newest First" },
  { value: "price_asc",  label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

const CONDITION_OPTIONS = [
  { value: "used",          label: "Used" },
  { value: "refurbished",   label: "Refurbished" },
  { value: "new_old_stock", label: "New Old Stock" },
];

interface Props {
  total: number;
}

export default function ResultsTopBar({ total }: Props) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const sort = searchParams.get("sort") ?? "newest";
  const condition = searchParams.get("condition");

  const updateParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === null) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    navigate(`?${params.toString()}`, { replace: true });
  };

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="text-sm text-gray-500">
          <span className="font-semibold text-gray-800">{total}</span>{" "}
          result{total !== 1 ? "s" : ""}
        </p>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-600 whitespace-nowrap">Sort by:</span>
          <Dropdown
            placeholder="Sort"
            value={sort}
            options={SORT_OPTIONS}
            onChange={(v) => updateParam("sort", (v as string) ?? "newest")}
            className="w-44"
            size="md"
            searchable={false}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-gray-200">
        <span className="text-xs font-semibold text-gray-600 whitespace-nowrap">Condition:</span>
        {CONDITION_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => updateParam("condition", condition === opt.value ? null : opt.value)}
            className={[
              "px-3 py-1 text-xs font-medium rounded-full border transition-colors",
              condition === opt.value
                ? "bg-red-600 border-red-600 text-white"
                : "bg-white border-gray-300 text-gray-600 hover:border-red-400 hover:text-red-600",
            ].join(" ")}
          >
            {opt.label}
          </button>
        ))}
        {condition && (
          <button
            type="button"
            onClick={() => updateParam("condition", null)}
            className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 ml-1"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
