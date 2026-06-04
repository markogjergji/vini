import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Trash2, Pencil, X, Store, Eye, Search,
  ArrowUpDown, ArrowUp, ArrowDown, SlidersHorizontal,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import Dropdown from "../../components/ui/Dropdown";
import { getAdminParts, getAdminCategories, deletePart, updateAdminPart } from "../../api/admin";
import { getPartById } from "../../api/parts";
import { getAvailableYears, getMakesByYear, getModels, getTrims } from "../../api/vehicles";
import type { PartAdmin, Make, VehicleModel, ModelYear } from "../../types";
import ConfirmModal from "../../components/ui/ConfirmModal";
import LocationPicker from "../../components/map/LocationPicker";

const API_BASE = "http://localhost:8000";
const imgUrl = (url: string) => url.startsWith("http") ? url : `${API_BASE}${url}`;
const PAGE_SIZE = 50;

type ConfirmState = {
  title: string;
  message: string;
  confirmLabel: string;
  variant: "danger" | "warning" | "default";
  onConfirm: () => void;
} | null;

const STATUS_BADGE: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  sold: "bg-gray-100 text-gray-500",
  reserved: "bg-yellow-100 text-yellow-700",
  expired: "bg-red-100 text-red-600",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Aktiv",
  reserved: "I rezervuar",
  sold: "Shitur",
  expired: "Skaduar",
};

const CONDITION_LABELS: Record<string, string> = {
  used: "I përdorur",
  refurbished: "I rinovuar",
  new_old_stock: "Stok i ri i vjetër",
};

const CONDITIONS = ["used", "refurbished", "new_old_stock"];
const STATUSES = ["active", "reserved", "sold", "expired"];

type SortField = "created_at" | "price" | "title" | "status" | "condition";
type SortDir = "asc" | "desc";

type EditForm = {
  title: string;
  description: string;
  price: string;
  currency: string;
  condition: string;
  status: string;
  oem_number: string;
  location_text: string;
  latitude: number | null;
  longitude: number | null;
  category_id: number | null;
};

type CompatEntry = { modelYearId: number; selectedYear: number | null; label: string };

type EditVehicleState = {
  year: number | null;
  makeId: number | null;
  modelId: number | null;
  trimId: number | null;
  availableYears: number[];
  makes: Make[];
  models: VehicleModel[];
  trims: ModelYear[];
};

const EMPTY_VEHICLE: EditVehicleState = {
  year: null, makeId: null, modelId: null, trimId: null,
  availableYears: [], makes: [], models: [], trims: [],
};

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ArrowUpDown size={13} className="text-gray-400" />;
  return dir === "asc" ? <ArrowUp size={13} className="text-blue-500" /> : <ArrowDown size={13} className="text-blue-500" />;
}

export default function AdminPartsPage() {
  const [parts, setParts] = useState<PartAdmin[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);

  const [actionId, setActionId] = useState<number | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<ConfirmState>(null);
  const [editPart, setEditPart] = useState<PartAdmin | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [form, setForm] = useState<EditForm>({
    title: "", description: "", price: "", currency: "ALL",
    condition: "used", status: "active", oem_number: "",
    location_text: "", latitude: null, longitude: null, category_id: null,
  });
  const [saving, setSaving] = useState(false);

  const [editCompatEntries, setEditCompatEntries] = useState<CompatEntry[]>([]);
  const [editVehicle, setEditVehicle] = useState<EditVehicleState>(EMPTY_VEHICLE);
  const [locAddr, setLocAddr] = useState({ city: "", address: "" });

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterCondition, setFilterCondition] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<number | null>(null);
  const [filterVehicle, setFilterVehicle] = useState("");
  const [debouncedFilterVehicle, setDebouncedFilterVehicle] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [debouncedFilterLocation, setDebouncedFilterLocation] = useState("");
  const [categories, setCategories] = useState<{ id: number; name: string; parent_id: number | null }[]>([]);
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    getAdminCategories().then(setCategories).catch(() => {});
    getAvailableYears()
      .then((years) => setEditVehicle((prev) => ({ ...prev, availableYears: years })))
      .catch(() => {});
  }, []);

  // Cascade: year → makes
  useEffect(() => {
    if (editVehicle.year !== null) {
      getMakesByYear(editVehicle.year).then((makes) =>
        setEditVehicle((prev) => ({ ...prev, makes }))
      );
    }
  }, [editVehicle.year]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cascade: make → models
  useEffect(() => {
    if (editVehicle.makeId && editVehicle.year !== null) {
      getModels(editVehicle.makeId, editVehicle.year).then((models) =>
        setEditVehicle((prev) => ({ ...prev, models }))
      );
    }
  }, [editVehicle.makeId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cascade: model → trims
  useEffect(() => {
    if (editVehicle.modelId && editVehicle.year !== null) {
      getTrims(editVehicle.modelId, editVehicle.year).then((trims) =>
        setEditVehicle((prev) => ({ ...prev, trims }))
      );
    }
  }, [editVehicle.modelId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedFilterVehicle(filterVehicle); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [filterVehicle]);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedFilterLocation(filterLocation); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [filterLocation]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getAdminParts({
      search: debouncedSearch || undefined,
      status: filterStatus ?? undefined,
      condition: filterCondition ?? undefined,
      category_id: filterCategory ?? undefined,
      vehicle_search: debouncedFilterVehicle || undefined,
      location_search: debouncedFilterLocation || undefined,
      sort_by: sortField,
      sort_dir: sortDir,
      page,
      limit: PAGE_SIZE,
    }).then((data) => {
      if (!cancelled) {
        setParts(data.items);
        setTotal(data.total);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [debouncedSearch, filterStatus, filterCondition, filterCategory, debouncedFilterVehicle, debouncedFilterLocation, sortField, sortDir, page, refreshKey]);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
      setPage(1);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilters = debouncedSearch || filterStatus || filterCondition || filterCategory !== null || debouncedFilterVehicle || debouncedFilterLocation;
  const activeFilterCount = (filterStatus ? 1 : 0) + (filterCondition ? 1 : 0) + (filterCategory !== null ? 1 : 0) + (filterVehicle ? 1 : 0) + (filterLocation ? 1 : 0);

  function clearFilters() {
    setSearch("");
    setFilterStatus(null);
    setFilterCondition(null);
    setFilterCategory(null);
    setFilterVehicle("");
    setFilterLocation("");
    setPage(1);
  }

  function handleDelete(part: PartAdmin) {
    setPendingConfirm({
      title: "Fshi pjesën",
      message: `A jeni i sigurt që doni të fshini "${part.title}"? Kjo veprim është i pakthyeshëm.`,
      confirmLabel: "Fshi",
      variant: "danger",
      onConfirm: async () => {
        setActionId(part.id);
        await deletePart(part.id);
        setActionId(null);
        setRefreshKey((k) => k + 1);
      },
    });
  }

  async function openEdit(part: PartAdmin) {
    setEditPart(part);
    setEditLoading(true);
    setEditCompatEntries([]);
    setEditVehicle((prev) => ({
      ...prev,
      year: null, makeId: null, modelId: null, trimId: null,
      makes: [], models: [], trims: [],
    }));
    setForm({
      title: part.title,
      description: part.description ?? "",
      price: part.price != null ? String(part.price) : "",
      currency: part.currency,
      condition: part.condition,
      status: part.status,
      oem_number: part.oem_number ?? "",
      location_text: part.location_text ?? "",
      latitude: null,
      longitude: null,
      category_id: null,
    });
    setLocAddr({ city: "", address: "" });

    try {
      const detail = await getPartById(part.id);
      const locParts = (detail.location_text ?? "").split(", ");
      setLocAddr({ city: locParts[0] ?? "", address: locParts.slice(1).join(", ") });
      setForm((prev) => ({
        ...prev,
        latitude: detail.latitude ?? null,
        longitude: detail.longitude ?? null,
        category_id: detail.category?.id ?? null,
      }));
      setEditCompatEntries(
        detail.compatible_vehicles.map((cv) => {
          const year = cv.specific_year ?? cv.model_year.year_start;
          const trimSuffix = cv.model_year.generation ? ` · ${cv.model_year.generation}` : "";
          return {
            modelYearId: cv.model_year_id,
            selectedYear: cv.specific_year,
            label: `${cv.make.name} ${cv.model.name} ${year}${trimSuffix}`,
          };
        })
      );
    } catch {
      // proceed with basic form data
    } finally {
      setEditLoading(false);
    }
  }

  function closeEdit() {
    setEditPart(null);
    setEditCompatEntries([]);
    setEditLoading(false);
    setLocAddr({ city: "", address: "" });
    setEditVehicle((prev) => ({
      ...prev,
      year: null, makeId: null, modelId: null, trimId: null,
      makes: [], models: [], trims: [],
    }));
  }

  function handleAddEditCompat() {
    const { makeId, modelId, trimId, makes, models, trims } = editVehicle;
    if (!makeId || !modelId || !trimId) return;
    const make = makes.find((m) => m.id === makeId);
    const model = models.find((m) => m.id === modelId);
    const trim = trims.find((t) => t.id === trimId);
    if (!make || !model || !trim) return;
    if (editCompatEntries.some((e) => e.modelYearId === trimId)) return;
    const year = editVehicle.year ?? trim.year_start;
    const trimSuffix = trim.generation ? ` · ${trim.generation}` : "";
    setEditCompatEntries((prev) => [
      ...prev,
      { modelYearId: trimId, selectedYear: editVehicle.year, label: `${make.name} ${model.name} ${year}${trimSuffix}` },
    ]);
  }

  async function handleSave() {
    if (!editPart) return;
    setSaving(true);
    try {
      await updateAdminPart(editPart.id, {
        title: form.title,
        description: form.description || null,
        price: form.price !== "" ? parseFloat(form.price) : null,
        currency: form.currency,
        condition: form.condition,
        status: form.status,
        oem_number: form.oem_number || null,
        location_text: form.location_text || null,
        latitude: form.latitude,
        longitude: form.longitude,
        category_id: form.category_id,
        compatible_vehicles: editCompatEntries.map((e) => ({ model_year_id: e.modelYearId, specific_year: e.selectedYear })),
      });
      closeEdit();
      setRefreshKey((k) => k + 1);
    } finally {
      setSaving(false);
    }
  }

  const topCategories = categories.filter((c) => c.parent_id === null);
  const subCategories = categories.filter((c) => c.parent_id !== null);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Pjesët</h1>

      {/* Toolbar */}
      <div className="flex flex-col gap-2 mb-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Kërko titull, OEM, shitës…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {search && (
              <button onClick={() => { setSearch(""); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={13} />
              </button>
            )}
          </div>

          <button
            onClick={() => setFiltersOpen((v) => !v)}
            className={`relative flex items-center gap-1.5 px-3 py-2 text-sm border rounded-none transition-colors shrink-0 ${
              filtersOpen || activeFilterCount > 0
                ? "border-blue-400 bg-blue-50 text-blue-700"
                : "border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <SlidersHorizontal size={14} />
            <span className="hidden sm:inline text-xs font-medium">Filtrat</span>
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
          <span className="text-xs text-gray-500 shrink-0">Rendit:</span>
          {(["created_at", "price", "title", "status", "condition"] as SortField[]).map((f) => {
            const labels: Record<SortField, string> = { created_at: "Data", price: "Çmimi", title: "Titulli", status: "Statusi", condition: "Gjendja" };
            return (
              <button
                key={f}
                onClick={() => toggleSort(f)}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-none text-xs font-medium border transition-colors shrink-0 ${sortField === f ? "border-blue-400 bg-blue-50 text-blue-700" : "border-gray-300 text-gray-600 hover:bg-gray-50"}`}
              >
                {labels[f]}
                <SortIcon active={sortField === f} dir={sortDir} />
              </button>
            );
          })}
        </div>

        {filtersOpen && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
            <Dropdown
              size="md"
              searchable={false}
              placeholder="Çdo status"
              value={filterStatus}
              options={STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] ?? s }))}
              onChange={(v) => { setFilterStatus(v as string | null); setPage(1); }}
              className="w-36 border border-gray-300 rounded-none"
            />

            <Dropdown
              size="md"
              searchable={false}
              placeholder="Çdo gjendje"
              value={filterCondition}
              options={CONDITIONS.map((c) => ({ value: c, label: CONDITION_LABELS[c] ?? c }))}
              onChange={(v) => { setFilterCondition(v as string | null); setPage(1); }}
              className="w-40 border border-gray-300 rounded-none"
            />

            {categories.length > 0 && (
              <Dropdown
                size="md"
                searchable={false}
                placeholder="Çdo kategori"
                value={filterCategory}
                options={categories.map((c) => ({ value: c.id, label: c.name }))}
                onChange={(v) => { setFilterCategory(v as number | null); setPage(1); }}
                className="w-44 border border-gray-300 rounded-none"
              />
            )}

            <div className="relative min-w-[160px]">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Vendndodhja…"
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                className="w-full pl-7 pr-7 py-2 text-sm border border-gray-300 rounded-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {filterLocation && (
                <button onClick={() => setFilterLocation("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={12} />
                </button>
              )}
            </div>

            <div className="relative min-w-[160px]">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Marka/modeli…"
                value={filterVehicle}
                onChange={(e) => setFilterVehicle(e.target.value)}
                className="w-full pl-7 pr-7 py-2 text-sm border border-gray-300 rounded-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {filterVehicle && (
                <button onClick={() => setFilterVehicle("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={12} />
                </button>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span>{loading ? "Duke ngarkuar…" : `${total} pjesë gjithsej`}</span>
          {hasFilters && (
            <button onClick={clearFilters} className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium">
              <X size={11} />
              Pastro filtrat
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">
                  <button onClick={() => toggleSort("title")} className="inline-flex items-center gap-1 hover:text-gray-900">
                    Titulli <SortIcon active={sortField === "title"} dir={sortDir} />
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Shitësi</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">
                  <button onClick={() => toggleSort("price")} className="inline-flex items-center gap-1 hover:text-gray-900">
                    Çmimi <SortIcon active={sortField === "price"} dir={sortDir} />
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">
                  <button onClick={() => toggleSort("condition")} className="inline-flex items-center gap-1 hover:text-gray-900">
                    Gjendja <SortIcon active={sortField === "condition"} dir={sortDir} />
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">
                  <button onClick={() => toggleSort("status")} className="inline-flex items-center gap-1 hover:text-gray-900">
                    Statusi <SortIcon active={sortField === "status"} dir={sortDir} />
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Kategoria</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Vendndodhja</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Përshtatshmëria</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">
                  <button onClick={() => toggleSort("created_at")} className="inline-flex items-center gap-1 hover:text-gray-900">
                    Listuar <SortIcon active={sortField === "created_at"} dir={sortDir} />
                  </button>
                </th>
                <th className="sticky right-0 bg-gray-50/80 backdrop-blur-sm border-l border-gray-200 px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-gray-400 text-sm">Duke ngarkuar…</td>
                </tr>
              ) : parts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-gray-400 text-sm">Asnjë pjesë nuk u gjet.</td>
                </tr>
              ) : (
                parts.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 group">
                    <td className="px-4 py-3 max-w-[260px]">
                      <div className="flex items-center gap-2.5">
                        {p.primary_image_url ? (
                          <img
                            src={imgUrl(p.primary_image_url!)}
                            alt=""
                            className="w-9 h-9 rounded-md object-cover flex-shrink-0 border border-gray-100"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-md bg-gray-100 flex-shrink-0 border border-gray-100" />
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">{p.title}</p>
                          {p.oem_number && <p className="text-gray-400 text-xs">OEM: {p.oem_number}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {p.seller_name ? (
                        <button
                          onClick={() => navigate(`/admin/sellers?id=${p.seller_id}`)}
                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          <Store size={12} />
                          {p.seller_name}
                        </button>
                      ) : (
                        <span className="text-gray-400 text-xs">#{p.seller_id}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {p.price != null ? `${p.price.toLocaleString()} ${p.currency}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600 capitalize">
                      {CONDITION_LABELS[p.condition] ?? p.condition.replace("_", " ")}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[p.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {STATUS_LABELS[p.status] ?? p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{p.category_name ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs max-w-[140px] truncate" title={p.location_text ?? undefined}>
                      {p.location_text ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs max-w-[160px] truncate" title={p.vehicle_label ?? undefined}>
                      {p.vehicle_label ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                    <td className="sticky right-0 bg-white/80 backdrop-blur-sm group-hover:bg-gray-50/80 border-l border-gray-100 px-4 py-3 transition-colors">
                      <div className="flex items-center gap-1 justify-end">
                        <button title="Shiko pjesën" onClick={() => navigate(`/parts/${p.id}`)} className="p-1.5 rounded-none text-gray-500 hover:bg-gray-100 transition-colors">
                          <Eye size={14} />
                        </button>
                        <button title="Ndrysho pjesën" onClick={() => openEdit(p)} className="p-1.5 rounded-none text-gray-500 hover:bg-gray-100 transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button
                          title="Fshi pjesën"
                          onClick={() => handleDelete(p)}
                          disabled={actionId === p.id}
                          className="p-1.5 rounded-none text-red-500 hover:bg-red-50 disabled:opacity-40 transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-gray-500">
            Faqja {page} nga {totalPages} • {total} gjithsej
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={page <= 1}
              className="p-1.5 rounded-none border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={15} />
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let p: number;
              if (totalPages <= 7) {
                p = i + 1;
              } else if (page <= 4) {
                p = i + 1;
              } else if (page >= totalPages - 3) {
                p = totalPages - 6 + i;
              } else {
                p = page - 3 + i;
              }
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`min-w-[30px] h-[30px] rounded-none text-xs font-medium border transition-colors ${p === page ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-300 text-gray-600 hover:bg-gray-50"}`}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages}
              className="p-1.5 rounded-none border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      {pendingConfirm && (
        <ConfirmModal
          title={pendingConfirm.title}
          message={pendingConfirm.message}
          confirmLabel={pendingConfirm.confirmLabel}
          variant={pendingConfirm.variant}
          onConfirm={() => {
            const action = pendingConfirm.onConfirm;
            setPendingConfirm(null);
            action();
          }}
          onCancel={() => setPendingConfirm(null)}
        />
      )}

      {/* Edit modal */}
      {editPart && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-900">Ndrysho Pjesën</h2>
              <button onClick={closeEdit} className="p-1 rounded-none hover:bg-gray-100 text-gray-500">
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-4 space-y-3 max-h-[75vh] overflow-y-auto">
              {editLoading && (
                <p className="text-center text-xs text-gray-400 py-2">Duke ngarkuar detajet…</p>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Titulli</label>
                <input
                  className="w-full border border-gray-300 rounded-none px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Përshkrimi</label>
                <textarea
                  rows={3}
                  className="w-full border border-gray-300 rounded-none px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              {/* Price / Currency */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Çmimi</label>
                  <input
                    type="number" min="0"
                    className="w-full border border-gray-300 rounded-none px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="—"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Valuta</label>
                  <input
                    className="w-full border border-gray-300 rounded-none px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.currency}
                    onChange={(e) => setForm({ ...form, currency: e.target.value })}
                    maxLength={3}
                  />
                </div>
              </div>

              {/* Condition / Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Gjendja</label>
                  <select
                    className="w-full border border-gray-300 rounded-none px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.condition}
                    onChange={(e) => setForm({ ...form, condition: e.target.value })}
                  >
                    {CONDITIONS.map((c) => <option key={c} value={c}>{CONDITION_LABELS[c] ?? c.replace("_", " ")}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Statusi</label>
                  <select
                    className="w-full border border-gray-300 rounded-none px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s] ?? s}</option>)}
                  </select>
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Kategoria</label>
                <Dropdown
                  size="md"
                  className="border border-gray-300 rounded-none"
                  placeholder="Zgjidh kategorinë"
                  value={form.category_id}
                  options={topCategories.flatMap((c) =>
                    subCategories
                      .filter((s) => s.parent_id === c.id)
                      .map((s) => ({ value: s.id, label: s.name, sub: c.name }))
                  )}
                  onChange={(v) => setForm({ ...form, category_id: v !== null ? Number(v) : null })}
                />
              </div>

              {/* OEM / Location text */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Numri OEM</label>
                  <input
                    className="w-full border border-gray-300 rounded-none px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.oem_number}
                    onChange={(e) => setForm({ ...form, oem_number: e.target.value })}
                    placeholder="Opsional"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Vendndodhja</label>
                  <input
                    className="w-full border border-gray-300 rounded-none px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.location_text}
                    onChange={(e) => setForm({ ...form, location_text: e.target.value })}
                    placeholder="Opsional"
                  />
                </div>
              </div>

              {/* Location picker */}
              <LocationPicker
                value={{ latitude: form.latitude, longitude: form.longitude, city: locAddr.city, address: locAddr.address }}
                onChange={(loc) => {
                  setLocAddr({ city: loc.city, address: loc.address });
                  setForm((prev) => ({
                    ...prev,
                    latitude: loc.latitude,
                    longitude: loc.longitude,
                    location_text: [loc.city, loc.address].filter(Boolean).join(", ") || prev.location_text,
                  }));
                }}
              />

              {/* Compatible vehicles */}
              <div className="pt-2 border-t border-gray-100">
                <label className="block text-xs font-medium text-gray-600 mb-2">Përshtatshmëria (Fits)</label>
                <div className="grid grid-cols-2 gap-2">
                  <Dropdown
                    size="md"
                    className="border border-gray-300"
                    placeholder="Viti"
                    value={editVehicle.year}
                    options={[...editVehicle.availableYears].sort((a, b) => b - a).map((y) => ({ value: y, label: String(y) }))}
                    onChange={(v) => setEditVehicle((prev) => ({
                      ...prev,
                      year: v !== null ? Number(v) : null,
                      makeId: null, modelId: null, trimId: null,
                      makes: [], models: [], trims: [],
                    }))}
                  />
                  <Dropdown
                    size="md"
                    className="border border-gray-300"
                    placeholder="Marka"
                    value={editVehicle.makeId}
                    options={editVehicle.makes.map((m) => ({
                      value: m.id,
                      label: m.name,
                      icon: `/brand-logos/${m.name.toLowerCase().replace(/[\s/]+/g, "-")}.png`,
                    }))}
                    onChange={(v) => setEditVehicle((prev) => ({
                      ...prev,
                      makeId: v !== null ? Number(v) : null,
                      modelId: null, trimId: null,
                      models: [], trims: [],
                    }))}
                    disabled={editVehicle.year === null}
                  />
                  <Dropdown
                    size="md"
                    className="border border-gray-300"
                    placeholder="Modeli"
                    value={editVehicle.modelId}
                    options={editVehicle.models.map((m) => ({ value: m.id, label: m.name }))}
                    onChange={(v) => setEditVehicle((prev) => ({
                      ...prev,
                      modelId: v !== null ? Number(v) : null,
                      trimId: null,
                      trims: [],
                    }))}
                    disabled={!editVehicle.makeId}
                  />
                  <Dropdown
                    size="md"
                    className="border border-gray-300"
                    placeholder="Versioni"
                    value={editVehicle.trimId}
                    options={editVehicle.trims.map((t) => ({
                      value: t.id,
                      label: t.generation ?? `${t.year_start}–${t.year_end ?? ""}`,
                      sub: t.generation ? `${t.year_start}–${t.year_end ?? ""}` : undefined,
                    }))}
                    onChange={(v) => setEditVehicle((prev) => ({
                      ...prev,
                      trimId: v !== null ? Number(v) : null,
                    }))}
                    disabled={!editVehicle.modelId}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddEditCompat}
                  disabled={!editVehicle.trimId}
                  className="mt-2 w-full bg-zinc-900 text-white px-4 py-1.5 text-xs font-semibold hover:bg-zinc-700 transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  + Shto
                </button>
                {editCompatEntries.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {editCompatEntries.map((e) => (
                      <div key={e.modelYearId} className="flex items-center gap-2 text-xs bg-gray-50 border border-gray-200 px-2.5 py-1.5">
                        <span className="text-gray-700 flex-1">{e.label}</span>
                        <button
                          type="button"
                          onClick={() => setEditCompatEntries((prev) => prev.filter((x) => x.modelYearId !== e.modelYearId))}
                          className="text-red-500 hover:text-red-700 font-semibold shrink-0"
                        >
                          Hiq
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Meta */}
              <div className="pt-1 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs text-gray-400">
                <span>ID: {editPart.id}</span>
                <span>
                  Shitësi:{" "}
                  <button
                    className="text-blue-500 hover:underline"
                    onClick={() => { closeEdit(); navigate(`/admin/sellers?id=${editPart.seller_id}`); }}
                  >
                    {editPart.seller_name ?? `#${editPart.seller_id}`}
                  </button>
                </span>
                <span>Listuar: {new Date(editPart.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200">
              <button onClick={closeEdit} className="px-4 py-2 text-sm rounded-none border border-gray-300 text-gray-700 hover:bg-gray-50">
                Anulo
              </button>
              <button
                onClick={handleSave}
                disabled={saving || editLoading}
                className="px-4 py-2 text-sm rounded-none bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Duke ruajtur…" : "Ruaj"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
