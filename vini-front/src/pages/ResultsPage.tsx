import { useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useSearchStore } from "../stores/searchStore";
import { searchParts } from "../api/parts";
import PartList from "../components/search/PartList";
import VehicleSidebar from "../components/results/VehicleSidebar";
import ResultsTopBar from "../components/results/ResultsTopBar";

export default function ResultsPage() {
  const [searchParams] = useSearchParams();

  const makeId  = searchParams.get("make_id")  ? Number(searchParams.get("make_id"))  : null;
  const modelId = searchParams.get("model_id") ? Number(searchParams.get("model_id")) : null;
  const yearId  = searchParams.get("year_id")  ? Number(searchParams.get("year_id"))  : null;

  const makeName  = searchParams.get("make")  ?? null;
  const modelName = searchParams.get("model") ?? null;
  const yearLabel = searchParams.get("year")  ?? null;

  const {
    total,
    setSelectedMakeId, setSelectedModelId, setSelectedYearId,
    setResults, setLoading, setError,
    limit,
  } = useSearchStore();

  useEffect(() => {
    setSelectedMakeId(makeId);
    setSelectedModelId(modelId);
    setSelectedYearId(yearId);

    const doSearch = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await searchParts({
          make_id:       makeId  ?? undefined,
          model_id:      modelId ?? undefined,
          model_year_id: yearId  ?? undefined,
          page: 1,
          limit,
        });
        setResults(res.items, res.total);
      } catch {
        setError("Search failed. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    doSearch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  const vehicleCrumbs = [makeName, modelName, yearLabel].filter(Boolean);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-6">
        <Link to="/" className="hover:text-gray-700 transition-colors no-underline">Home</Link>
        <span>/</span>
        <span>Search</span>
        {vehicleCrumbs.length > 0 && (
          <>
            <span>/</span>
            <span className="text-gray-700 font-medium">{vehicleCrumbs.join(" · ")}</span>
          </>
        )}
      </nav>

      {/* Body */}
      <div className="flex gap-6 items-start">
        {/* Sidebar — desktop only */}
        <div className="hidden lg:block">
          <VehicleSidebar make={makeName} model={modelName} year={yearLabel} />
        </div>

        {/* Main */}
        <div className="flex-1 min-w-0">
          <ResultsTopBar total={total} />
          <PartList />
        </div>
      </div>
    </div>
  );
}
