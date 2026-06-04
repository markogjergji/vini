import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Car, Search } from "lucide-react";
import { getAvailableYears, getMakes, getMakesByYear, getModels, getTrims } from "../../api/vehicles";
import type { Make, VehicleModel, ModelYear } from "../../types";
import Dropdown from "../../components/ui/Dropdown";

function logoUrl(name: string) {
  return `/brand-logos/${name.toLowerCase().replace(/[\s/]+/g, "-")}.png`;
}

function BrandLogo({ name }: { name: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span className="w-12 h-12 flex items-center justify-center rounded bg-gray-100 text-gray-400">
        <Car size={14} />
      </span>
    );
  }
  return (
    <img
      src={logoUrl(name)}
      alt={name}
      className="w-12 h-12 object-contain"
      onError={() => setFailed(true)}
    />
  );
}

function Spinner() {
  return (
    <svg className="w-3.5 h-3.5 text-gray-400 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

function trimLabel(trim: ModelYear) {
  const range = trim.year_end ? `${trim.year_start}–${trim.year_end}` : `${trim.year_start}+`;
  return trim.generation ? `${range} · ${trim.generation}` : range;
}

export default function AdminBrandsPage() {
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  const [makes, setMakes] = useState<Make[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [expandedMakes, setExpandedMakes] = useState<Set<number>>(new Set());
  const [expandedModels, setExpandedModels] = useState<Set<number>>(new Set());

  const [models, setModels] = useState<Record<number, VehicleModel[]>>({});
  const [trims, setTrims] = useState<Record<number, ModelYear[]>>({});

  const [loadingMake, setLoadingMake] = useState<Set<number>>(new Set());
  const [loadingModel, setLoadingModel] = useState<Set<number>>(new Set());

  useEffect(() => {
    getAvailableYears().then((y) => setAvailableYears([...y].sort((a, b) => b - a)));
  }, []);

  useEffect(() => {
    setLoading(true);
    setExpandedMakes(new Set());
    setExpandedModels(new Set());
    setModels({});
    setTrims({});
    const fetch = selectedYear !== null ? getMakesByYear(selectedYear) : getMakes();
    fetch.then(setMakes).finally(() => setLoading(false));
  }, [selectedYear]);

  async function toggleMake(makeId: number) {
    setExpandedMakes((prev) => {
      const next = new Set(prev);
      if (next.has(makeId)) { next.delete(makeId); return next; }
      next.add(makeId);
      return next;
    });
    if (!models[makeId]) {
      setLoadingMake((prev) => new Set(prev).add(makeId));
      const data = await getModels(makeId, selectedYear ?? undefined);
      setModels((prev) => ({ ...prev, [makeId]: data }));
      setLoadingMake((prev) => { const s = new Set(prev); s.delete(makeId); return s; });
    }
  }

  async function toggleModel(modelId: number) {
    setExpandedModels((prev) => {
      const next = new Set(prev);
      if (next.has(modelId)) { next.delete(modelId); return next; }
      next.add(modelId);
      return next;
    });
    if (!trims[modelId]) {
      setLoadingModel((prev) => new Set(prev).add(modelId));
      const data = await getTrims(modelId, selectedYear ?? undefined);
      setTrims((prev) => ({ ...prev, [modelId]: data }));
      setLoadingModel((prev) => { const s = new Set(prev); s.delete(modelId); return s; });
    }
  }

  const filtered = search.trim()
    ? makes.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()))
    : makes;

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900">Markat &amp; Modelet</h1>
        <p className="text-sm text-gray-500 mt-1">
          {makes.length} {makes.length !== 1 ? "marka" : "markë"} në bazën e të dhënave
        </p>
      </div>

      {/* Year selector */}
      <div className="mb-4">
        <Dropdown
          size="md"
          searchable={false}
          placeholder="Të gjitha vitet"
          value={selectedYear}
          options={availableYears.map((y) => ({ value: y, label: String(y) }))}
          onChange={(v) => setSelectedYear(v as number | null)}
          className="w-40 border border-gray-200"
        />
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Kërko markë…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {loading ? (
        <div className="text-sm text-gray-400">Duke ngarkuar…</div>
      ) : filtered.length === 0 ? (
        <div className="text-sm text-gray-400 italic">Nuk u gjet asnjë markë</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {filtered.map((make, i) => {
            const isMakeOpen = expandedMakes.has(make.id);
            const makeModels = models[make.id] ?? [];
            const isMakeLoading = loadingMake.has(make.id);

            return (
              <div key={make.id} className={i > 0 ? "border-t border-gray-100" : ""}>
                {/* Make row */}
                <button
                  type="button"
                  onClick={() => toggleMake(make.id)}
                  className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <BrandLogo name={make.name} />
                  <span className="flex-1 font-medium text-gray-800 text-sm">{make.name}</span>
                  {isMakeOpen && makeModels.length > 0 && (
                    <span className="text-xs text-gray-400 mr-1">
                      {makeModels.length} {makeModels.length !== 1 ? "modele" : "model"}
                    </span>
                  )}
                  {isMakeLoading ? (
                    <Spinner />
                  ) : isMakeOpen ? (
                    <ChevronDown size={15} className="text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronRight size={15} className="text-gray-400 flex-shrink-0" />
                  )}
                </button>

                {/* Models sub-tree */}
                {isMakeOpen && !isMakeLoading && (
                  <div className="border-t border-gray-100">
                    {makeModels.length === 0 ? (
                      <p className="text-xs text-gray-400 italic px-14 py-2.5">Nuk u gjetën modele</p>
                    ) : (
                      makeModels.map((model, mi) => {
                        const isModelOpen = expandedModels.has(model.id);
                        const modelTrims = trims[model.id] ?? [];
                        const isModelLoading = loadingModel.has(model.id);

                        return (
                          <div key={model.id} className={mi > 0 ? "border-t border-gray-50" : ""}>
                            {/* Model row */}
                            <button
                              type="button"
                              onClick={() => toggleModel(model.id)}
                              className="w-full flex items-center gap-2 pl-14 pr-5 py-2.5 hover:bg-gray-50 transition-colors text-left"
                            >
                              <span className="flex-1 text-sm text-gray-700">{model.name}</span>
                              {isModelOpen && modelTrims.length > 0 && (
                                <span className="text-xs text-gray-400 mr-1">
                                  {modelTrims.length} {modelTrims.length !== 1 ? "versione" : "version"}
                                </span>
                              )}
                              {isModelLoading ? (
                                <Spinner />
                              ) : isModelOpen ? (
                                <ChevronDown size={13} className="text-gray-300 flex-shrink-0" />
                              ) : (
                                <ChevronRight size={13} className="text-gray-300 flex-shrink-0" />
                              )}
                            </button>

                            {/* Trims */}
                            {isModelOpen && !isModelLoading && (
                              <div className="border-t border-gray-50 bg-gray-50/60">
                                {modelTrims.length === 0 ? (
                                  <p className="text-xs text-gray-400 italic pl-20 pr-5 py-2">Nuk u gjetën versione</p>
                                ) : (
                                  modelTrims.map((trim) => (
                                    <div
                                      key={trim.id}
                                      className="flex items-center pl-20 pr-5 py-1.5 text-xs text-gray-500 border-t border-gray-50 first:border-t-0"
                                    >
                                      <span className="w-1.5 h-1.5 rounded-full bg-gray-300 mr-3 flex-shrink-0" />
                                      {trimLabel(trim)}
                                    </div>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
