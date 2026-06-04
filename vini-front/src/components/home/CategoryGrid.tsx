import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCategories } from "../../api/parts";
import type { PartCategory } from "../../types";

const API_BASE = "http://localhost:8000";

export default function CategoryGrid() {
  const [parents, setParents] = useState<PartCategory[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    getCategories().then((all) =>
      setParents(
        all
          .filter((c) => c.parent_id === null)
          .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name))
      )
    );
  }, []);

  if (parents.length === 0) return null;

  return (
    <section className="py-12 px-4 bg-white">
      <h2 className="text-center text-xl font-semibold text-gray-800 mb-8 tracking-tight">
        Shop Aftermarket Parts &amp; Accessories by Category
      </h2>
      <div className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {parents.map((cat) => (
          <button
            key={cat.id}
            onClick={() =>
              navigate(`/search?category_id=${cat.id}&category_name=${encodeURIComponent(cat.name)}`)
            }
            className="relative bg-gradient-to-br from-zinc-800 to-zinc-900 aspect-square flex flex-col items-center justify-end p-3 hover:scale-[1.03] hover:shadow-lg transition-all duration-200 cursor-pointer group overflow-hidden"
          >
            {cat.image_url && (
              <img
                src={`${API_BASE}${cat.image_url}`}
                alt={cat.name}
                className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-75 transition-opacity"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <span className="relative z-10 text-white text-xs font-bold uppercase leading-tight drop-shadow-md group-hover:text-red-600 transition-colors text-center">
              {cat.name}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
