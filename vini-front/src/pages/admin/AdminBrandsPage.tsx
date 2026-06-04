import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Car, Search, Eye, EyeOff } from "lucide-react";
import { getAvailableYears, getModels, getTrims } from "../../api/vehicles";
import { getAdminMakes, activateMake, deactivateMake } from "../../api/admin";
import type { VehicleModel, ModelYear } from "../../types";
import type { AdminMake } from "../../api/admin";
import Dropdown from "../../components/ui/Dropdown";

function logoUrl(name: string) {
  return `/brand-logos/${name.toLowerCase().replace(/[\s/]+/g, "-")}.png`;
}

function BrandLogo({ name, dim }: { name: string; dim: boolean }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span className={`w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 flex-shrink-0 ${dim ? "opacity-40" : "text-gray-400"}`}>
        <Car size={14} />
      </span>
    );
  }
  return (
    <img
      src={logoUrl(name)}
      alt={name}
      className={`w-10 h-10 object-contain flex-shrink-0 transition-opacity ${dim ? "opacity-30" : ""}`}
      onError={() => setFailed(true)}
    />
  );
}

function Spinner({ size = 14 }: { size?: number }) {
  return (
    <svg
      style={{ width: size, height: size }}
      className="text-gray-400 animate-spin flex-shrink-0"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

function trimLabel(trim: ModelYear) {
  const range = trim.year_end ? `${trim.year_start}–${trim.year_end}` : `${trim.year_start}+`;
  return trim.generation ? `${range} · ${trim.generation}` : range;
}

type ActiveFilter = "all" | "active" | "inactive";

export default function AdminBrandsPage() {
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  const [makes, setMakes] = useState<AdminMake[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");

  const [expandedMakes, setExpandedMakes] = useState<Set<number>>(new Set());
  const [expandedModels, setExpandedModels] = useState<Set<number>>(new Set());

  const [models, setModels] = useState<Record<number, VehicleModel[]>>({});
  const [trims, setTrims] = useState<Record<number, ModelYear[]>>({});

  const [loadingMake, setLoadingMake] = useState<Set<number>>(new Set());
  const [loadingModel, setLoadingModel] = useState<Set<number>>(new Set());
  const [togglingMake, setTogglingMake] = useState<Set<number>>(new Set());

  useEffect(() => {
    getAvailableYears().then((y) => setAvailableYears([...y].sort((a, b) => b - a)));
  }, []);

  useEffect(() => {
    setLoading(true);
    setExpandedMakes(new Set());
    setExpandedModels(new Set());
    setModels({});
    setTrims({});

    const isActiveParam = activeFilter === "active" ? true : activeFilter === "inactive" ? false : undefined;
    const params: { is_active?: boolean; year?: number } = {};
    if (isActiveParam !== undefined) params.is_active = isActiveParam;
    if (selectedYear !== null) params.year = selectedYear;

    getAdminMakes(Object.keys(params).length ? params : undefined)
      .then(setMakes)
      .finally(() => setLoading(false));
  }, [activeFilter, selectedYear]);

  async function toggleMakeExpand(makeId: number) {
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

  async function toggleModelExpand(modelId: number) {
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

  async function handleToggleVisible(make: AdminMake, e: React.MouseEvent) {
    e.stopPropagation();
    setTogglingMake((prev) => new Set(prev).add(make.id));
    try {
      if (make.is_active) {
        await deactivateMake(make.id);
      } else {
        await activateMake(make.id);
      }
      setMakes((prev) =>
        prev.map((m) => (m.id === make.id ? { ...m, is_active: !m.is_active } : m))
      );
    } finally {
      setTogglingMake((prev) => { const s = new Set(prev); s.delete(make.id); return s; });
    }
  }

  const filtered = search.trim()
    ? makes.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()))
    : makes;

  const activeCount = makes.filter((m) => m.is_active).length;
  const inactiveCount = makes.filter((m) => !m.is_active).length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Markat &amp; Modelet</h1>
        <p className="text-sm text-gray-500 mt-1">
          {makes.length} {makes.length !== 1 ? "marka" : "markë"}
          {" · "}
          <span className="text-green-600 font-medium">{activeCount} aktive</span>
          {inactiveCount > 0 && (
            <span className="text-gray-400"> · {inactiveCount} të fshehura</span>
          )}
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Dropdown
          size="md"
          searchable={false}
          placeholder="Të gjitha vitet"
          value={selectedYear}
          options={availableYears.map((y) => ({ value: y, label: String(y) }))}
          onChange={(v) => setSelectedYear(v as number | null)}
          className="w-40 border border-gray-200"
        />

        <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm divide-x divide-gray-200">
          {(["all", "active", "inactive"] as ActiveFilter[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setActiveFilter(f)}
              className={`px-3.5 py-1.5 transition-colors font-medium ${
                activeFilter === f
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              }`}
            >
              {f === "all" ? "Të gjitha" : f === "active" ? "Aktive" : "Të fshehura"}
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Kërko markë…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-400 py-8 justify-center">
          <Spinner size={16} /> Duke ngarkuar…
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-sm text-gray-400 italic py-8 text-center">Nuk u gjet asnjë markë</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
          {filtered.map((make) => {
            const isMakeOpen = expandedMakes.has(make.id);
            const makeModels = models[make.id] ?? [];
            const isMakeLoading = loadingMake.has(make.id);
            const isToggling = togglingMake.has(make.id);
            const dim = !make.is_active;

            return (
              <div key={make.id}>
                {/* Make row */}
                <div className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50/70 ${dim ? "bg-gray-50/40" : ""}`}>
                  {/* Expand trigger */}
                  <button
                    type="button"
                    onClick={() => toggleMakeExpand(make.id)}
                    className="flex items-center gap-3 flex-1 min-w-0 text-left"
                  >
                    <BrandLogo name={make.name} dim={dim} />

                    <div className="flex-1 min-w-0">
                      <span className={`font-medium text-sm leading-tight block truncate ${dim ? "text-gray-400" : "text-gray-800"}`}>
                        {make.name}
                      </span>
                      <span className="text-xs text-gray-400 tabular-nums">
                        {make.model_count} {make.model_count !== 1 ? "modele" : "model"} · {make.generation_count} tipe
                      </span>
                    </div>

                    <span className="flex-shrink-0">
                      {isMakeLoading ? (
                        <Spinner />
                      ) : isMakeOpen ? (
                        <ChevronDown size={15} className="text-gray-300" />
                      ) : (
                        <ChevronRight size={15} className="text-gray-300" />
                      )}
                    </span>
                  </button>

                  {/* Visibility toggle */}
                  <button
                    type="button"
                    disabled={isToggling}
                    onClick={(e) => handleToggleVisible(make, e)}
                    title={make.is_active ? "Fshih nga lista" : "Shfaq në listë"}
                    className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg border transition-all disabled:opacity-40 ${
                      make.is_active
                        ? "border-gray-200 text-gray-400 hover:border-red-200 hover:text-red-500 hover:bg-red-50"
                        : "border-gray-200 text-gray-300 hover:border-green-200 hover:text-green-600 hover:bg-green-50"
                    }`}
                  >
                    {isToggling ? (
                      <Spinner size={13} />
                    ) : make.is_active ? (
                      <Eye size={15} />
                    ) : (
                      <EyeOff size={15} />
                    )}
                  </button>
                </div>

                {/* Models sub-tree */}
                {isMakeOpen && !isMakeLoading && (
                  <div className="border-t border-gray-100 bg-gray-50/30">
                    {makeModels.length === 0 ? (
                      <p className="text-xs text-gray-400 italic px-14 py-3">Nuk u gjetën modele</p>
                    ) : (
                      <div className="divide-y divide-gray-50">
                        {makeModels.map((model) => {
                          const isModelOpen = expandedModels.has(model.id);
                          const modelTrims = trims[model.id] ?? [];
                          const isModelLoading = loadingModel.has(model.id);

                          return (
                            <div key={model.id}>
                              <button
                                type="button"
                                onClick={() => toggleModelExpand(model.id)}
                                className="w-full flex items-center gap-2 pl-16 pr-5 py-2.5 hover:bg-gray-50 transition-colors text-left"
                              >
                                <span className="flex-1 text-sm text-gray-600">{model.name}</span>
                                {isModelOpen && modelTrims.length > 0 && (
                                  <span className="text-xs text-gray-400 mr-1 tabular-nums">
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

                              {isModelOpen && !isModelLoading && (
                                <div className="bg-gray-50/60 divide-y divide-gray-50">
                                  {modelTrims.length === 0 ? (
                                    <p className="text-xs text-gray-400 italic pl-24 pr-5 py-2">Nuk u gjetën versione</p>
                                  ) : (
                                    modelTrims.map((trim) => (
                                      <div
                                        key={trim.id}
                                        className="flex items-center pl-24 pr-5 py-1.5 text-xs text-gray-400"
                                      >
                                        <span className="w-1 h-1 rounded-full bg-gray-300 mr-3 flex-shrink-0" />
                                        {trimLabel(trim)}
                                      </div>
                                    ))
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
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
