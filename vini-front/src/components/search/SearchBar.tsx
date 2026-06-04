import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSearchStore } from "../../stores/searchStore";
import { getAvailableYears, getMakesByYear, getModels, getTrims } from "../../api/vehicles";
import Dropdown from "../ui/Dropdown";

export default function SearchBar() {
  const {
    availableYears, makes, models, trims,
    selectedYear, selectedMakeId, selectedModelId, selectedTrimId,
    setAvailableYears, setMakes, setModels, setTrims,
    setSelectedYear, setSelectedMakeId, setSelectedModelId, setSelectedTrimId,
    setError,
  } = useSearchStore();

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    getAvailableYears().then(setAvailableYears).catch(() => setError("Failed to load years"));
  }, [setAvailableYears, setError]);

  useEffect(() => {
    if (selectedYear !== null) {
      getMakesByYear(selectedYear).then(setMakes).catch(() => setError("Failed to load makes"));
    }
  }, [selectedYear, setMakes, setError]);

  useEffect(() => {
    if (selectedMakeId !== null && selectedYear !== null) {
      getModels(selectedMakeId, selectedYear).then(setModels).catch(() => setError("Failed to load models"));
    }
  }, [selectedMakeId, selectedYear, setModels, setError]);

  useEffect(() => {
    if (selectedModelId !== null && selectedYear !== null) {
      getTrims(selectedModelId, selectedYear).then(setTrims).catch(() => setError("Failed to load trims"));
    }
  }, [selectedModelId, selectedYear, setTrims, setError]);

  const handleSearch = () => {
    const params = new URLSearchParams();

    const categoryId = searchParams.get("category_id");
    const categoryName = searchParams.get("category_name");
    if (categoryId) params.set("category_id", categoryId);
    if (categoryName) params.set("category_name", categoryName);

    const make = makes.find((m) => m.id === selectedMakeId);
    const model = models.find((m) => m.id === selectedModelId);
    const trim = trims.find((t) => t.id === selectedTrimId);

    if (selectedYear !== null)   params.set("year",     String(selectedYear));
    if (selectedMakeId !== null) { params.set("make_id", String(selectedMakeId)); if (make)  params.set("make",  make.name); }
    if (selectedModelId !== null){ params.set("model_id",String(selectedModelId)); if (model) params.set("model", model.name); }
    if (selectedTrimId !== null) { params.set("trim_id", String(selectedTrimId));  if (trim)  params.set("trim",  trim.generation ?? ""); }

    navigate(`/search?${params.toString()}`);
  };

  const yearOptions = availableYears
    .slice()
    .sort((a, b) => b - a)
    .map((y) => ({ value: y, label: String(y) }));

  const makeOptions = makes.map((m) => ({
    value: m.id,
    label: m.name,
    icon: `/brand-logos/${m.name.toLowerCase().replace(/[\s/]+/g, "-")}.png`,
  }));

  const modelOptions = models.map((m) => ({ value: m.id, label: m.name }));

  const trimOptions = trims.map((t) => ({
    value: t.id,
    label: t.generation ?? `${t.year_start}–${t.year_end}`,
  }));

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col sm:flex-row shadow-2xl">
      <Dropdown
        placeholder="Viti"
        value={selectedYear}
        options={yearOptions}
        onChange={(v) => setSelectedYear(v !== null ? Number(v) : null)}
        className="flex-1 border-r border-gray-200 z-10"
      />
      <Dropdown
        placeholder="Marka"
        value={selectedMakeId}
        options={makeOptions}
        onChange={(v) => setSelectedMakeId(v !== null ? Number(v) : null)}
        disabled={selectedYear === null}
        className="flex-1 border-r border-gray-200"
      />
      <Dropdown
        placeholder="Modeli"
        value={selectedModelId}
        options={modelOptions}
        onChange={(v) => setSelectedModelId(v !== null ? Number(v) : null)}
        disabled={selectedMakeId === null}
        className="flex-1 border-r border-gray-200"
      />
      <Dropdown
        placeholder="Tipi"
        value={selectedTrimId}
        options={trimOptions}
        onChange={(v) => setSelectedTrimId(v !== null ? Number(v) : null)}
        disabled={selectedModelId === null}
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
