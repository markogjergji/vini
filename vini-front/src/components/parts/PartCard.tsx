import { Link } from "react-router-dom";
import type { PartListItem } from "../../types";
import { formatPrice, formatDate, formatCondition } from "../../utils/formatters";

interface Props {
  part: PartListItem;
}

const API_BASE = "http://localhost:8000";

const CONDITION_STYLES: Record<string, string> = {
  used:          "bg-orange-50 text-orange-600 border-orange-200",
  refurbished:   "bg-blue-50 text-blue-600 border-blue-200",
  new_old_stock: "bg-green-50 text-green-600 border-green-200",
};

export default function PartCard({ part }: Props) {
  const conditionStyle = CONDITION_STYLES[part.condition] ?? "bg-gray-100 text-gray-600 border-gray-200";

  return (
    <Link
      to={`/parts/${part.id}`}
      className="flex flex-col bg-white border border-gray-200 hover:border-blue-400 hover:shadow-lg transition-all duration-200 no-underline text-gray-900 group overflow-hidden"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
        {part.primary_image_url ? (
          <img
            src={`${API_BASE}${part.primary_image_url}`}
            alt={part.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-gray-300">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs">No image</span>
          </div>
        )}

        {/* Category badge */}
        {part.category && (
          <span className="absolute top-2 left-2 bg-white/90 text-gray-700 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 border border-gray-200">
            {part.category.name}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-3 gap-2">
        {/* Title */}
        <p className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
          {part.title}
        </p>

        {/* Meta row */}
        <div className="flex items-center justify-between mt-auto pt-1 border-t border-gray-100">
          <span className={`text-[10px] font-semibold px-2 py-0.5 border uppercase tracking-wide ${conditionStyle}`}>
            {formatCondition(part.condition)}
          </span>
          <span className="text-sm font-bold text-gray-900">
            {formatPrice(part.price, part.currency)}
          </span>
        </div>

        {/* Location + date */}
        <p className="text-[11px] text-gray-400 leading-none">
          {part.location_text ?? "Location not specified"} &middot; {formatDate(part.created_at)}
        </p>
      </div>
    </Link>
  );
}
