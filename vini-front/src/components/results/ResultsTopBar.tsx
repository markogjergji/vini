import { useState } from "react";
import Toggle from "../ui/Toggle";
import Dropdown from "../ui/Dropdown";

const SORT_OPTIONS = [
  { value: "recommended", label: "Recommended" },
  { value: "price_asc",   label: "Price: Low to High" },
  { value: "price_desc",  label: "Price: High to Low" },
  { value: "newest",      label: "Newest First" },
];

interface Props {
  total: number;
}

export default function ResultsTopBar({ total }: Props) {
  const [inStock,   setInStock]   = useState(false);
  const [universal, setUniversal] = useState(false);
  const [sort,      setSort]      = useState<string | number | null>("recommended");

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-200">
      {/* Result count */}
      <p className="text-sm text-gray-500">
        <span className="font-semibold text-gray-800">{total}</span>{" "}
        result{total !== 1 ? "s" : ""}
      </p>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4">
        <Toggle label="Show In-Stock Parts"   checked={inStock}   onChange={setInStock} />
        <Toggle label="Show Universal Parts"  checked={universal} onChange={setUniversal} />

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-600 whitespace-nowrap">Sort by:</span>
          <Dropdown
            placeholder="Sort"
            value={sort}
            options={SORT_OPTIONS}
            onChange={setSort}
            className="w-44"
          />
        </div>
      </div>
    </div>
  );
}
