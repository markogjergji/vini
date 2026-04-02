import { Link } from "react-router-dom";

interface Props {
  make: string | null;
  model: string | null;
  year: string | null;
}

export default function VehicleSidebar({ make, model, year }: Props) {
  const hasVehicle = make || model || year;
  const vehicleLabel = [year, make, model].filter(Boolean).join(" ");

  return (
    <aside className="w-60 flex-shrink-0">
      <div className="border border-gray-200 bg-white">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <span className="text-xs font-bold uppercase tracking-widest text-gray-700">
            Shop for Your Vehicle
          </span>
        </div>

        <div className="p-4">
          {hasVehicle ? (
            <>
              {/* Vehicle row */}
              <div className="flex items-start gap-3 mb-4">
                {/* Car icon */}
                <svg
                  className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
                  />
                </svg>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 leading-snug">
                    {vehicleLabel}
                  </p>
                  {year && (
                    <p className="text-xs text-gray-400 mt-0.5">Year: {year}</p>
                  )}
                </div>
              </div>

              {/* Clear button */}
              <Link
                to="/"
                className="flex items-center justify-center gap-1.5 w-full border border-gray-300 py-1.5 text-xs text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-colors no-underline"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear Vehicle
              </Link>
            </>
          ) : (
            <p className="text-xs text-gray-400 text-center py-2">No vehicle selected.</p>
          )}
        </div>
      </div>
    </aside>
  );
}
