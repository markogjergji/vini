import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSearchStore } from "../../stores/searchStore";
import { getMakes, getModels, getYears } from "../../api/vehicles";
import Dropdown from "../ui/Dropdown";

export default function SearchBar() {
  const {
    makes, models, years,
    selectedMakeId, selectedModelId, selectedYearId,
    setMakes, setModels, setYears,
    setSelectedMakeId, setSelectedModelId, setSelectedYearId,
    setError,
  } = useSearchStore();

  const navigate = useNavigate();

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

  const handleSearch = () => {
    const params = new URLSearchParams();

    const make = makes.find((m) => m.id === selectedMakeId);
    const model = models.find((m) => m.id === selectedModelId);
    const year = years.find((y) => y.id === selectedYearId);

    if (selectedMakeId) {
      params.set("make_id", String(selectedMakeId));
      if (make) params.set("make", make.name);
    }
    if (selectedModelId) {
      params.set("model_id", String(selectedModelId));
      if (model) params.set("model", model.name);
    }
    if (selectedYearId) {
      params.set("year_id", String(selectedYearId));
      if (year) params.set("year", `${year.year_start}–${year.year_end}`);
    }

    navigate(`/search?${params.toString()}`);
  };

  const makeOptions = makes.map((m) => ({ value: m.id, label: m.name }));
  const modelOptions = models.map((m) => ({ value: m.id, label: m.name }));
  const yearOptions = years.map((y) => ({
    value: y.id,
    label: `${y.year_start}–${y.year_end}`,
    sub: y.generation ?? undefined,
  }));

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col sm:flex-row shadow-2xl">
      <Dropdown
        placeholder="Make"
        value={selectedMakeId}
        options={makeOptions}
        onChange={(v) => setSelectedMakeId(v !== null ? Number(v) : null)}
        className="flex-1 border-r border-gray-200 z-10"
      />
      <Dropdown
        placeholder="Model"
        value={selectedModelId}
        options={modelOptions}
        onChange={(v) => setSelectedModelId(v !== null ? Number(v) : null)}
        disabled={!selectedMakeId}
        className="flex-1 border-r border-gray-200"
      />
      <Dropdown
        placeholder="Year"
        value={selectedYearId}
        options={yearOptions}
        onChange={(v) => setSelectedYearId(v !== null ? Number(v) : null)}
        disabled={!selectedModelId}
        className="flex-1"
      />
      <button
        onClick={handleSearch}
        className="h-12 px-7 bg-red-600 text-white text-sm font-bold uppercase tracking-wide hover:bg-red-500 active:bg-red-700 transition-colors whitespace-nowrap border-t border-gray-200 sm:border-t-0"
      >
        Search
      </button>
    </div>
  );
}
