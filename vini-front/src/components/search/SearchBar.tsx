import { useEffect } from "react";
import { useSearchStore } from "../../stores/searchStore";
import { getMakes, getModels, getYears } from "../../api/vehicles";
import { searchParts } from "../../api/parts";

export default function SearchBar() {
  const {
    makes, models, years,
    selectedMakeId, selectedModelId, selectedYearId,
    page, limit,
    setMakes, setModels, setYears,
    setSelectedMakeId, setSelectedModelId, setSelectedYearId,
    setResults, setLoading, setError,
  } = useSearchStore();

  useEffect(() => {
    getMakes().then(setMakes).catch(() => setError("Failed to load makes"));
  }, [setMakes, setError]);

  useEffect(() => {
    if (selectedMakeId) {
      getModels(selectedMakeId).then(setModels).catch(() => setError("Failed to load models"));
    }
  }, [selectedMakeId, setModels, setError]);

  useEffect(() => {
    if (selectedModelId) {
      getYears(selectedModelId).then(setYears).catch(() => setError("Failed to load years"));
    }
  }, [selectedModelId, setYears, setError]);

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await searchParts({
        make_id: selectedMakeId ?? undefined,
        model_id: selectedModelId ?? undefined,
        model_year_id: selectedYearId ?? undefined,
        page,
        limit,
      });
      setResults(res.items, res.total);
    } catch {
      setError("Search failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 items-end">
      <select
        className="border border-gray-300 px-3 py-2 text-sm"
        value={selectedMakeId ?? ""}
        onChange={(e) => setSelectedMakeId(e.target.value ? Number(e.target.value) : null)}
      >
        <option value="">Make</option>
        {makes.map((m) => (
          <option key={m.id} value={m.id}>{m.name}</option>
        ))}
      </select>

      <select
        className="border border-gray-300 px-3 py-2 text-sm"
        value={selectedModelId ?? ""}
        onChange={(e) => setSelectedModelId(e.target.value ? Number(e.target.value) : null)}
        disabled={!selectedMakeId}
      >
        <option value="">Model</option>
        {models.map((m) => (
          <option key={m.id} value={m.id}>{m.name}</option>
        ))}
      </select>

      <select
        className="border border-gray-300 px-3 py-2 text-sm"
        value={selectedYearId ?? ""}
        onChange={(e) => setSelectedYearId(e.target.value ? Number(e.target.value) : null)}
        disabled={!selectedModelId}
      >
        <option value="">Year</option>
        {years.map((y) => (
          <option key={y.id} value={y.id}>
            {y.year_start}–{y.year_end}{y.generation ? ` (${y.generation})` : ""}
          </option>
        ))}
      </select>

      <button
        onClick={handleSearch}
        className="bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-700"
      >
        Search
      </button>
    </div>
  );
}
