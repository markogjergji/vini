import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useSearchStore } from "../stores/searchStore";
import { searchParts, getCategories } from "../api/parts";
import type { PartCategory } from "../types";
import PartList from "../components/search/PartList";
import ResultsTopBar from "../components/results/ResultsTopBar";
import SearchBar from "../components/search/SearchBar";
import SubcategoryStrip from "../components/search/SubcategoryStrip";

export default function ResultsPage() {
  const [searchParams] = useSearchParams();
  const [allCategories, setAllCategories] = useState<PartCategory[]>([]);

  const makeId      = searchParams.get("make_id")      ? Number(searchParams.get("make_id"))      : null;
  const modelId     = searchParams.get("model_id")     ? Number(searchParams.get("model_id"))     : null;
  const trimId      = searchParams.get("trim_id")      ? Number(searchParams.get("trim_id"))      : null;
  const year        = searchParams.get("year")         ? Number(searchParams.get("year"))         : null;
  const categoryId  = searchParams.get("category_id") ? Number(searchParams.get("category_id")) : null;
  const condition   = searchParams.get("condition")    ?? undefined;
  const sort        = searchParams.get("sort")         ?? "newest";

  const makeName     = searchParams.get("make")          ?? null;
  const modelName    = searchParams.get("model")         ?? null;
  const trimName     = searchParams.get("trim")          ?? null;
  const categoryName = searchParams.get("category_name") ?? null;
  const yearLabel    = year ? String(year) : null;

  const {
    total,
    syncSelection,
    setResults, setLoading, setError,
    limit,
  } = useSearchStore();

  useEffect(() => {
    getCategories().then(setAllCategories);
  }, []);

  useEffect(() => {
    syncSelection(year, makeId, modelId, trimId);

    const doSearch = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await searchParts({
          make_id:       makeId      ?? undefined,
          model_id:      modelId     ?? undefined,
          model_year_id: trimId      ?? undefined,
          category_id:   categoryId  ?? undefined,
          year:          year        ?? undefined,
          condition,
          sort,
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

  // Determine subcategory context
  const currentCategory = categoryId ? allCategories.find((c) => c.id === categoryId) ?? null : null;

  // If current category is a parent → show its children
  // If current category is a child → show its siblings (children of the same parent)
  let parentCategory: PartCategory | null = null;
  let subcategories: PartCategory[] = [];

  if (currentCategory) {
    if (currentCategory.parent_id === null) {
      // It's a parent — show its children
      parentCategory = currentCategory;
      subcategories = allCategories
        .filter((c) => c.parent_id === currentCategory.id)
        .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
    } else {
      // It's a subcategory — find parent and show siblings
      parentCategory = allCategories.find((c) => c.id === currentCategory.parent_id) ?? null;
      if (parentCategory) {
        subcategories = allCategories
          .filter((c) => c.parent_id === parentCategory!.id)
          .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
      }
    }
  }

  // Vehicle params to preserve when navigating subcategories
  const vehicleParams = [
    makeId   ? `&make_id=${makeId}`   : "",
    modelId  ? `&model_id=${modelId}` : "",
    trimId   ? `&trim_id=${trimId}`   : "",
    year     ? `&year=${year}`        : "",
    makeName  ? `&make=${encodeURIComponent(makeName)}`   : "",
    modelName ? `&model=${encodeURIComponent(modelName)}` : "",
    trimName  ? `&trim=${encodeURIComponent(trimName)}`   : "",
  ].join("");

  const vehicleCrumbs = [yearLabel, makeName, modelName, trimName].filter(Boolean);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-5">
        <Link to="/" className="hover:text-gray-700 transition-colors no-underline">Home</Link>
        <span>/</span>
        <Link to="/search" className="hover:text-gray-700 transition-colors no-underline">Search</Link>
        {parentCategory && parentCategory.id !== currentCategory?.id && (
          <>
            <span>/</span>
            <Link
              to={`/search?category_id=${parentCategory.id}&category_name=${encodeURIComponent(parentCategory.name)}${vehicleParams}`}
              className="hover:text-gray-700 transition-colors no-underline"
            >
              {parentCategory.name}
            </Link>
          </>
        )}
        {categoryName && (
          <>
            <span>/</span>
            <span className="text-gray-700 font-medium">{categoryName}</span>
          </>
        )}
        {vehicleCrumbs.length > 0 && (
          <>
            <span>/</span>
            <span className="text-gray-700 font-medium">{vehicleCrumbs.join(" · ")}</span>
          </>
        )}
      </nav>

      <div className="mb-8">
        <SearchBar />
      </div>

      {/* Subcategory strip */}
      {parentCategory && subcategories.length > 0 && (
        <SubcategoryStrip
          subcategories={subcategories}
          activeCategoryId={categoryId}
          parentCategory={parentCategory}
          vehicleParams={vehicleParams}
        />
      )}

      <ResultsTopBar total={total} />
      <PartList />
    </div>
  );
}
