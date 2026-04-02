import { MapPin, Phone, Mail } from "lucide-react";
import type { Seller } from "../../types";

interface Props {
  seller: Seller;
  lat?: number;
  lng?: number;
}

export default function SellerInfo({ seller, lat, lng }: Props) {
  const displayName = seller.business_name ?? seller.name;
  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="border border-gray-200 bg-white">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
          {initials}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-semibold text-gray-900 truncate">{displayName}</span>
            {seller.is_verified && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 uppercase tracking-wide">
                <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
                Verified
              </span>
            )}
            {seller.is_business && (
              <span className="text-[10px] font-bold text-gray-500 bg-gray-100 border border-gray-200 px-1.5 py-0.5 uppercase tracking-wide">
                Business
              </span>
            )}
          </div>
          {seller.city && (
            <p className="text-xs text-gray-400 mt-0.5">{seller.city}</p>
          )}
        </div>
      </div>

      {/* Contact details */}
      <div className="px-4 py-3 space-y-2">
        {seller.phone && (
          <a
            href={`tel:${seller.phone}`}
            className="flex items-center gap-2.5 text-sm text-gray-700 hover:text-blue-600 transition-colors no-underline"
          >
            <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
            {seller.phone}
          </a>
        )}

        {seller.email && (
          <a
            href={`mailto:${seller.email}`}
            className="flex items-center gap-2.5 text-sm text-gray-700 hover:text-blue-600 transition-colors no-underline"
          >
            <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
            {seller.email}
          </a>
        )}

        {seller.address && (
          <div className="flex items-start gap-2.5 text-sm text-gray-600">
            <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <span>{seller.address}{seller.city ? `, ${seller.city}` : ""}</span>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="px-4 pb-4 flex flex-col gap-2">
        {seller.phone && (
          <a
            href={`tel:${seller.phone}`}
            className="flex items-center justify-center gap-2 w-full bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold text-sm py-2.5 transition-colors no-underline"
          >
            <Phone className="w-4 h-4" />
            Call Seller
          </a>
        )}
        {lat && lng && (
          <a
            href="#location-map"
            className="flex items-center justify-center gap-2 w-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-semibold text-sm py-2.5 transition-colors no-underline"
          >
            <MapPin className="w-4 h-4 text-gray-500" />
            View on Map
          </a>
        )}
      </div>
    </div>
  );
}
