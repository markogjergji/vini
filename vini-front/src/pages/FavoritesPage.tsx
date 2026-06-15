import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { getFavorites } from "../api/favorites";
import PartCard from "../components/parts/PartCard";
import type { PartListItem } from "../types";

export default function FavoritesPage() {
  const [parts, setParts] = useState<PartListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getFavorites()
      .then(setParts)
      .catch(() => setError("Failed to load your favorites."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-widest text-red-600 mb-1">Të preferuarat</p>
        <h1 className="text-2xl font-bold text-gray-900">Favorites</h1>
        {!loading && !error && (
          <p className="text-sm text-gray-400 mt-0.5">{parts.length} {parts.length === 1 ? "part" : "parts"} saved</p>
        )}
      </div>

      {loading && <p className="text-sm text-gray-400">Loading…</p>}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3">{error}</p>
      )}

      {!loading && !error && parts.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <Heart size={32} className="mx-auto mb-3 text-gray-300" />
          <p className="text-sm">You haven't saved any parts yet.</p>
          <Link to="/" className="mt-3 inline-block text-sm font-semibold text-red-600 hover:text-red-500">
            Browse parts →
          </Link>
        </div>
      )}

      {parts.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {parts.map((part) => (
            <PartCard key={part.id} part={part} />
          ))}
        </div>
      )}
    </div>
  );
}
