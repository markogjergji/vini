import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { usePartStore } from "../stores/partStore";
import { getPartById } from "../api/parts";
import PartImages from "../components/parts/PartImages";
import SellerInfo from "../components/parts/SellerInfo";
import LocationMap from "../components/map/LocationMap";
import { formatPrice, formatDate, formatCondition } from "../utils/formatters";

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

  if (loading) return <p className="text-sm text-gray-600">Loading...</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!part) return <p className="text-sm text-gray-600">Part not found.</p>;

  const lat = part.latitude ?? part.seller.latitude;
  const lng = part.longitude ?? part.seller.longitude;

  return (
    <div>
      <Link to="/" className="text-blue-600 hover:underline text-sm">&larr; Back to results</Link>

      <h1 className="text-lg font-medium mt-3 mb-4">{part.title}</h1>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/2">
          <PartImages images={part.images} />
        </div>
        <div className="md:w-1/2 text-sm space-y-2">
          <div><strong>Price:</strong> {formatPrice(part.price, part.currency)}</div>
          <div><strong>Condition:</strong> {formatCondition(part.condition)}</div>
          {part.oem_number && <div><strong>OEM#:</strong> {part.oem_number}</div>}
          {part.category && <div><strong>Category:</strong> {part.category.name}</div>}
          <div><strong>Listed:</strong> {formatDate(part.created_at)}</div>
        </div>
      </div>

      {part.description && (
        <div className="mt-6">
          <h2 className="text-base font-medium border-b border-gray-200 pb-1 mb-2">Description</h2>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{part.description}</p>
        </div>
      )}

      {part.compatible_vehicles.length > 0 && (
        <div className="mt-6">
          <h2 className="text-base font-medium border-b border-gray-200 pb-1 mb-2">Fits These Vehicles</h2>
          <ul className="text-sm text-gray-600 list-disc list-inside">
            {part.compatible_vehicles.map((v) => (
              <li key={v.model_year_id}>
                {v.make.name} {v.model.name} {v.model_year.year_start}–{v.model_year.year_end}
                {v.model_year.generation ? ` (${v.model_year.generation})` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6">
        <h2 className="text-base font-medium border-b border-gray-200 pb-1 mb-2">Seller</h2>
        <SellerInfo seller={part.seller} />
      </div>

      {lat && lng && (
        <div className="mt-6">
          <LocationMap latitude={lat} longitude={lng} label={part.location_text ?? undefined} />
        </div>
      )}
    </div>
  );
}
