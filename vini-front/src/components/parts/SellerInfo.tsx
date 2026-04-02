import type { Seller } from "../../types";

interface Props {
  seller: Seller;
}

export default function SellerInfo({ seller }: Props) {
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
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
            </svg>
            {seller.phone}
          </a>
        )}

        {seller.email && (
          <a
            href={`mailto:${seller.email}`}
            className="flex items-center gap-2.5 text-sm text-gray-700 hover:text-blue-600 transition-colors no-underline"
          >
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
            {seller.email}
          </a>
        )}

        {seller.address && (
          <div className="flex items-start gap-2.5 text-sm text-gray-600">
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-9.5 11.25S.5 17.642.5 10.5a9 9 0 1119 0z" />
            </svg>
            <span>{seller.address}{seller.city ? `, ${seller.city}` : ""}</span>
          </div>
        )}
      </div>

      {/* CTA */}
      {seller.phone && (
        <div className="px-4 pb-4">
          <a
            href={`tel:${seller.phone}`}
            className="flex items-center justify-center gap-2 w-full bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold text-sm py-2.5 transition-colors no-underline"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
            </svg>
            Call Seller
          </a>
        </div>
      )}
    </div>
  );
}
