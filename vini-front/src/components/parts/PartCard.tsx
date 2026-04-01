import { Link } from "react-router-dom";
import type { PartListItem } from "../../types";
import { formatPrice, formatDate, formatCondition } from "../../utils/formatters";

interface Props {
  part: PartListItem;
}

const API_BASE = "http://localhost:8000";

export default function PartCard({ part }: Props) {
  return (
    <Link
      to={`/parts/${part.id}`}
      className="flex gap-4 py-3 border-b border-gray-200 no-underline text-gray-900 hover:bg-gray-50"
    >
      <div className="w-20 h-20 flex-shrink-0 bg-gray-100 border border-gray-200">
        {part.primary_image_url ? (
          <img
            src={`${API_BASE}${part.primary_image_url}`}
            alt={part.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
            No img
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{part.title}</div>
        <div className="text-sm text-gray-600">
          Condition: {formatCondition(part.condition)} | {formatPrice(part.price, part.currency)}
        </div>
        <div className="text-sm text-gray-400">
          {part.location_text ?? "Location not specified"} &middot; Listed {formatDate(part.created_at)}
        </div>
      </div>
    </Link>
  );
}
