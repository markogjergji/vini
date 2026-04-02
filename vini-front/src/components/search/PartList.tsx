import { useSearchStore } from "../../stores/searchStore";
import PartCard from "../parts/PartCard";
import { searchParts } from "../../api/parts";

export default function PartList() {
  const {
    results, total, page, limit, loading, error,
    setResults, setPage, setLoading, setError,
    selectedMakeId, selectedModelId, selectedYearId,
  } = useSearchStore();

  const totalPages = Math.ceil(total / limit);

  const goToPage = async (newPage: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await searchParts({
        make_id:       selectedMakeId  ?? undefined,
        model_id:      selectedModelId ?? undefined,
        model_year_id: selectedYearId  ?? undefined,
        page: newPage,
        limit,
      });
      setResults(res.items, res.total);
      setPage(newPage);
    } catch {
      setError("Failed to load results");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 overflow-hidden animate-pulse">
            <div className="aspect-[4/3] bg-gray-100" />
            <div className="p-3 space-y-2">
              <div className="h-3 bg-gray-100 rounded w-3/4" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-6 px-4 bg-red-50 border border-red-200 text-red-700 text-sm">
        {error}
      </div>
    );
  }

  if (total === 0 && results.length === 0) return null;

  if (total === 0) {
    return (
      <div className="py-16 text-center">
        <svg className="w-10 h-10 text-gray-200 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm text-gray-500">No parts found for this vehicle.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {results.map((item) => (
          <PartCard key={item.id} part={item} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-8 text-sm">
          <button
            onClick={() => goToPage(page - 1)}
            disabled={page <= 1}
            className="flex items-center gap-1.5 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Prev
          </button>
          <span className="text-gray-400 text-xs">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => goToPage(page + 1)}
            disabled={page >= totalPages}
            className="flex items-center gap-1.5 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Next
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
