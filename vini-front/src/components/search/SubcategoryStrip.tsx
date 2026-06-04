import { useNavigate } from "react-router-dom";
import type { PartCategory } from "../../types";

const API_BASE = "http://localhost:8000";

interface Props {
  subcategories: PartCategory[];
  activeCategoryId: number | null;
  parentCategory: PartCategory;
  vehicleParams: string; // serialised vehicle query params to preserve, e.g. "&make_id=1&make=BMW"
}

export default function SubcategoryStrip({ subcategories, activeCategoryId, parentCategory, vehicleParams }: Props) {
  const navigate = useNavigate();

  if (subcategories.length === 0) return null;

  function goTo(cat: PartCategory) {
    navigate(`/search?category_id=${cat.id}&category_name=${encodeURIComponent(cat.name)}${vehicleParams}`);
  }

  function goToParent() {
    navigate(`/search?category_id=${parentCategory.id}&category_name=${encodeURIComponent(parentCategory.name)}${vehicleParams}`);
  }

  const tiles = [
    { cat: parentCategory, label: "Të gjitha", isAll: true },
    ...subcategories.map((sub) => ({ cat: sub, label: sub.name, isAll: false })),
  ];

  return (
    <div className="mb-8">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
        {parentCategory.name}
      </h3>
      <div className="flex flex-wrap justify-center gap-2">
        {tiles.map(({ cat, label, isAll }) => {
          const isActive = activeCategoryId === cat.id;
          return (
            <button
              key={cat.id + (isAll ? "-all" : "")}
              onClick={() => isAll ? goToParent() : goTo(cat)}
              style={{ width: "112px" }}
              className={`relative flex-shrink-0 aspect-square flex flex-col items-center justify-end p-2 overflow-hidden transition-all duration-200 hover:scale-[1.04] hover:shadow-md group ${
                isActive ? "ring-2 ring-red-500 scale-[1.04]" : ""
              }`}
            >
              {cat.image_url ? (
                <img
                  src={`${API_BASE}${cat.image_url}`}
                  alt={cat.name}
                  className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-75 transition-opacity"
                />
              ) : null}
              <div className={`absolute inset-0 ${cat.image_url ? "bg-gradient-to-t from-black/70 via-black/20 to-transparent" : "bg-gradient-to-br from-zinc-800 to-zinc-900"}`} />
              <span className="relative z-10 text-white text-[10px] font-bold uppercase leading-tight text-center drop-shadow">
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
