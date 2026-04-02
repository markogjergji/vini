import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { usePartStore } from "../stores/partStore";
import { getPartById } from "../api/parts";
import PartImages from "../components/parts/PartImages";
import SellerInfo from "../components/parts/SellerInfo";
import LocationMap from "../components/map/LocationMap";
import { formatPrice, formatDate, formatCondition } from "../utils/formatters";

const CONDITION_STYLES: Record<string, string> = {
  used:          "bg-orange-50 text-orange-600 border-orange-200",
  refurbished:   "bg-blue-50 text-blue-600 border-blue-200",
  new_old_stock: "bg-green-50 text-green-600 border-green-200",
};

export default function PartDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { part, loading, error, setPart, setLoading, setError } = usePartStore();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    getPartById(Number(id))
      .then(setPart)
      .catch(() => setError("Failed to load part"))
      .finally(() => setLoading(false));
  }, [id, setPart, setLoading, setError]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10 animate-pulse space-y-4">
        <div className="h-4 bg-gray-100 w-32 rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
          <div className="aspect-[4/3] bg-gray-100" />
          <div className="space-y-3">
            <div className="h-3 bg-gray-100 w-1/3 rounded" />
            <div className="h-6 bg-gray-100 w-2/3 rounded" />
            <div className="h-10 bg-gray-100 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">{error}</div>
      </div>
    );
  }

  if (!part) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10 text-sm text-gray-500">Part not found.</div>
    );
  }

  const lat = part.latitude ?? part.seller.latitude;
  const lng = part.longitude ?? part.seller.longitude;
  const conditionStyle = CONDITION_STYLES[part.condition] ?? "bg-gray-100 text-gray-600 border-gray-200";

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-6">
        <Link to="/" className="hover:text-gray-700 transition-colors no-underline">Home</Link>
        <span>/</span>
        {part.category && (
          <>
            <span>{part.category.name}</span>
            <span>/</span>
          </>
        )}
        <span className="text-gray-700 font-medium truncate max-w-xs">{part.title}</span>
      </nav>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">

        {/* LEFT — Images */}
        <PartImages images={part.images} />

        {/* RIGHT — Info */}
        <div className="flex flex-col gap-4">

          {/* Category + Title */}
          <div>
            {part.category && (
              <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-1">
                {part.category.name}
              </p>
            )}
            <h1 className="text-xl font-bold text-gray-900 leading-snug">{part.title}</h1>
            {part.oem_number && (
              <p className="text-xs text-gray-400 mt-1">OEM # <span className="font-mono text-gray-600">{part.oem_number}</span></p>
            )}
          </div>

          {/* Price card */}
          <div className="border border-gray-200 bg-white p-4">
            <p className="text-3xl font-bold text-gray-900 mb-3">
              {formatPrice(part.price, part.currency)}
            </p>
            <div className="flex items-center gap-2 flex-wrap mb-4">
              <span className={`text-xs font-semibold px-2.5 py-1 border uppercase tracking-wide ${conditionStyle}`}>
                {formatCondition(part.condition)}
              </span>
              {part.location_text && (
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-9.5 11.25S.5 17.642.5 10.5a9 9 0 1119 0z" />
                  </svg>
                  {part.location_text}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400">Listed {formatDate(part.created_at)}</p>
          </div>

          {/* Seller */}
          <SellerInfo seller={part.seller} />

        </div>
      </div>

      {/* Description */}
      {part.description && (
        <section className="mt-10 border border-gray-200 bg-white">
          <div className="px-5 py-3 border-b border-gray-100">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-700">Description</h2>
          </div>
          <p className="px-5 py-4 text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
            {part.description}
          </p>
        </section>
      )}

      {/* Compatible vehicles */}
      {part.compatible_vehicles.length > 0 && (
        <section className="mt-6 border border-gray-200 bg-white">
          <div className="px-5 py-3 border-b border-gray-100">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-700">
              Fits These Vehicles
            </h2>
          </div>
          <div className="px-5 py-4 flex flex-wrap gap-2">
            {part.compatible_vehicles.map((v) => (
              <span
                key={v.model_year_id}
                className="inline-flex items-center gap-1.5 text-xs bg-gray-50 border border-gray-200 text-gray-700 px-3 py-1.5"
              >
                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                </svg>
                <span className="font-medium">{v.make.name} {v.model.name}</span>
                <span className="text-gray-400">{v.model_year.year_start}–{v.model_year.year_end}{v.model_year.generation ? ` · ${v.model_year.generation}` : ""}</span>
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Map */}
      {lat && lng && (
        <section className="mt-6 border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-white">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-700">Location</h2>
          </div>
          <LocationMap latitude={lat} longitude={lng} label={part.location_text ?? undefined} />
        </section>
      )}

      {/* Bottom spacing */}
      <div className="pb-12" />
    </div>
  );
}
