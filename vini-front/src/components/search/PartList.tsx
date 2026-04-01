import { useSearchStore } from "../../stores/searchStore";
import PartCard from "../parts/PartCard";
import { searchParts } from "../../api/parts";

export default function PartList() {
  const { results, total, page, limit, loading, error, setResults, setPage, setLoading, setError, selectedMakeId, selectedModelId, selectedYearId } = useSearchStore();

  const totalPages = Math.ceil(total / limit);

  const goToPage = async (newPage: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await searchParts({
        make_id: selectedMakeId ?? undefined,
        model_id: selectedModelId ?? undefined,
        model_year_id: selectedYearId ?? undefined,
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

  if (loading) return <p className="text-sm text-gray-600 mt-4">Loading...</p>;
  if (error) return <p className="text-sm text-red-600 mt-4">{error}</p>;
  if (total === 0 && results.length === 0) return null;
  if (total === 0) return <p className="text-sm text-gray-600 mt-4">No parts found for this vehicle.</p>;

  return (
    <div className="mt-4">
      <p className="text-sm text-gray-600 mb-2">Showing {total} result{total !== 1 ? "s" : ""}</p>
      <div>
        {results.map((item) => (
          <PartCard key={item.id} part={item} />
        ))}
      </div>
      {totalPages > 1 && (
        <div className="flex items-center gap-4 mt-4 text-sm">
          <button
            onClick={() => goToPage(page - 1)}
            disabled={page <= 1}
            className="text-blue-600 hover:underline disabled:text-gray-400"
          >
            &larr; Prev
          </button>
          <span className="text-gray-600">Page {page} of {totalPages}</span>
          <button
            onClick={() => goToPage(page + 1)}
            disabled={page >= totalPages}
            className="text-blue-600 hover:underline disabled:text-gray-400"
          >
            Next &rarr;
          </button>
        </div>
      )}
    </div>
  );
}
