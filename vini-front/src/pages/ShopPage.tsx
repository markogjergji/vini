import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getSellerById } from "../api/sellers";
import { searchParts } from "../api/parts";
import PartCard from "../components/parts/PartCard";
import type { Seller, PartListItem } from "../types";

export default function ShopPage() {
  const { id } = useParams<{ id: string }>();
  const sellerId = Number(id);

  const [seller, setSeller] = useState<Seller | null>(null);
  const [parts, setParts] = useState<PartListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sellerId) return;
    setLoading(true);
    Promise.all([
      getSellerById(sellerId),
      searchParts({ seller_id: sellerId, limit: 50 }),
    ])
      .then(([s, res]) => {
        setSeller(s);
        setParts(res.items);
        setTotal(res.total);
      })
      .catch(() => setError("Shop not found."))
      .finally(() => setLoading(false));
  }, [sellerId]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <p className="text-sm text-gray-400">Loading…</p>
      </div>
    );
  }

  if (error || !seller) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3">
          {error ?? "Shop not found."}
        </p>
        <Link to="/" className="mt-4 inline-block text-sm font-semibold text-red-600 hover:text-red-500 no-underline">
          ← Back to search
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">

      {/* ── Seller info card ───────────────────────────────────────────────── */}
      <div className="border border-gray-100 bg-white p-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-full bg-zinc-200 flex items-center justify-center text-lg font-bold text-zinc-600 uppercase select-none shrink-0">
            {seller.name.charAt(0)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900">{seller.name}</h1>
              {seller.is_verified && (
                <span className="text-xs font-semibold uppercase tracking-wide px-2 py-0.5 bg-green-100 text-green-700">
                  Verified
                </span>
              )}
              {seller.is_business && (
                <span className="text-xs font-semibold uppercase tracking-wide px-2 py-0.5 bg-blue-100 text-blue-700">
                  Business
                </span>
              )}
            </div>

            {seller.business_name && (
              <p className="text-sm text-gray-500 mt-0.5">{seller.business_name}</p>
            )}

            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-gray-500">
              {seller.city && (
                <span>{seller.city}</span>
              )}
              {seller.address && (
                <span>{seller.address}</span>
              )}
              {seller.phone && (
                <a href={`tel:${seller.phone}`} className="hover:text-gray-800 no-underline">
                  {seller.phone}
                </a>
              )}
              {seller.email && (
                <a href={`mailto:${seller.email}`} className="hover:text-gray-800 no-underline">
                  {seller.email}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Listings ──────────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-red-600 mb-0.5">Listings</p>
            <h2 className="text-lg font-bold text-gray-900">
              {total} {total === 1 ? "part" : "parts"} available
            </h2>
          </div>
        </div>

        {parts.length === 0 ? (
          <p className="text-sm text-gray-400 py-10 text-center">This seller has no active listings.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {parts.map((part) => (
              <PartCard key={part.id} part={part} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
