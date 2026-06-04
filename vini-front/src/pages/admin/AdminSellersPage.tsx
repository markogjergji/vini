import { useEffect, useState, useRef } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import {
  BadgeCheck, BadgeX, Eye, Pencil, X, Search,
  ArrowUpDown, ArrowUp, ArrowDown, SlidersHorizontal,
  ChevronLeft, ChevronRight, LogIn,
} from "lucide-react";
import { getAdminSellers, verifySeller, unverifySeller, updateAdminSeller, impersonateUser } from "../../api/admin";
import Dropdown from "../../components/ui/Dropdown";
import type { SellerAdmin } from "../../types";
import ConfirmModal from "../../components/ui/ConfirmModal";
import { useAuthStore } from "../../stores/authStore";

type ConfirmState = {
  title: string;
  message: string;
  confirmLabel: string;
  variant: "danger" | "warning" | "default";
  onConfirm: () => void;
} | null;

type EditForm = {
  name: string;
  phone: string;
  email: string;
  business_name: string;
  address: string;
  city: string;
  is_business: boolean;
};

type SortField = "created_at" | "name" | "city";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 50;

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ArrowUpDown size={13} className="text-gray-400" />;
  return dir === "asc" ? <ArrowUp size={13} className="text-blue-500" /> : <ArrowDown size={13} className="text-blue-500" />;
}

export default function AdminSellersPage() {
  const [sellers, setSellers] = useState<SellerAdmin[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);

  const [actionId, setActionId] = useState<number | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<ConfirmState>(null);
  const [editSeller, setEditSeller] = useState<SellerAdmin | null>(null);
  const [form, setForm] = useState<EditForm>({ name: "", phone: "", email: "", business_name: "", address: "", city: "", is_business: false });
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterVerified, setFilterVerified] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get("id") ? Number(searchParams.get("id")) : null;
  const highlightRef = useRef<HTMLTableRowElement | null>(null);

  const navigate = useNavigate();
  const { startImpersonation } = useAuthStore();

  async function handleImpersonate(seller: SellerAdmin) {
    if (!seller.user_id) return;
    const data = await impersonateUser(seller.user_id);
    startImpersonation(data.access_token, data.user);
    navigate("/");
  }

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getAdminSellers({
      search: debouncedSearch || undefined,
      is_verified: filterVerified !== null ? filterVerified === "true" : undefined,
      is_business: filterType !== null ? filterType === "true" : undefined,
      sort_by: sortField,
      sort_dir: sortDir,
      page,
      limit: PAGE_SIZE,
    }).then((data) => {
      if (!cancelled) {
        setSellers(data.items);
        setTotal(data.total);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [debouncedSearch, filterVerified, filterType, sortField, sortDir, page, refreshKey]);

  useEffect(() => {
    if (!loading && highlightId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [loading, highlightId]);

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
  const hasFilters = debouncedSearch || filterVerified !== null || filterType !== null;
  const activeFilterCount = (filterVerified !== null ? 1 : 0) + (filterType !== null ? 1 : 0);

  function clearFilters() {
    setSearch("");
    setFilterVerified(null);
    setFilterType(null);
    setPage(1);
  }

  function confirmToggleVerify(seller: SellerAdmin) {
    const revoking = seller.is_verified;
    setPendingConfirm({
      title: revoking ? "Hiq verifikimin" : "Verifiko shitësin",
      message: revoking
        ? `A jeni i sigurt që doni të hiqni verifikimin nga "${seller.business_name ?? seller.name}"?`
        : `Verifiko dyqanin "${seller.business_name ?? seller.name}"? Kjo do t'i japë distintivn e verifikimit.`,
      confirmLabel: revoking ? "Hiq verifikimin" : "Verifiko",
      variant: revoking ? "warning" : "default",
      onConfirm: async () => {
        setActionId(seller.id);
        if (seller.is_verified) {
          await unverifySeller(seller.id);
        } else {
          await verifySeller(seller.id);
        }
        setActionId(null);
        setRefreshKey((k) => k + 1);
      },
    });
  }

  function openEdit(seller: SellerAdmin) {
    setEditSeller(seller);
    setForm({
      name: seller.name,
      phone: seller.phone ?? "",
      email: seller.email ?? "",
      business_name: seller.business_name ?? "",
      address: seller.address ?? "",
      city: seller.city ?? "",
      is_business: seller.is_business,
    });
  }

  async function handleSave() {
    if (!editSeller) return;
    setSaving(true);
    const payload: Record<string, string | boolean> = {};
    if (form.name !== editSeller.name) payload.name = form.name;
    if (form.phone !== (editSeller.phone ?? "")) payload.phone = form.phone;
    if (form.email !== (editSeller.email ?? "")) payload.email = form.email;
    if (form.business_name !== (editSeller.business_name ?? "")) payload.business_name = form.business_name;
    if (form.address !== (editSeller.address ?? "")) payload.address = form.address;
    if (form.city !== (editSeller.city ?? "")) payload.city = form.city;
    if (form.is_business !== editSeller.is_business) payload.is_business = form.is_business;
    await updateAdminSeller(editSeller.id, payload);
    setEditSeller(null);
    setSaving(false);
    setRefreshKey((k) => k + 1);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Shitësit</h1>

      {/* Toolbar */}
      <div className="flex flex-col gap-2 mb-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Kërko emër, qytet, email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
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
          {(["created_at", "name", "city"] as SortField[]).map((f) => {
            const labels: Record<SortField, string> = { created_at: "Data", name: "Emri", city: "Qyteti" };
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
              value={filterVerified}
              options={[
                { value: "true", label: "Verifikuar" },
                { value: "false", label: "Në pritje" },
              ]}
              onChange={(v) => { setFilterVerified(v as string | null); setPage(1); }}
              className="w-36 border border-gray-300 rounded-none"
            />

            <Dropdown
              size="md"
              searchable={false}
              placeholder="Çdo lloj"
              value={filterType}
              options={[
                { value: "true", label: "Biznes" },
                { value: "false", label: "Individual" },
              ]}
              onChange={(v) => { setFilterType(v as string | null); setPage(1); }}
              className="w-36 border border-gray-300 rounded-none"
            />
          </div>
        )}

        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span>{loading ? "Duke ngarkuar…" : `${total} shitës gjithsej`}</span>
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
          <table className="w-full text-sm min-w-[760px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">
                  <button onClick={() => toggleSort("name")} className="inline-flex items-center gap-1 hover:text-gray-900">
                    Dyqani / Emri <SortIcon active={sortField === "name"} dir={sortDir} />
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Pronari</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Kontakti</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">
                  <button onClick={() => toggleSort("city")} className="inline-flex items-center gap-1 hover:text-gray-900">
                    Qyteti / Adresa <SortIcon active={sortField === "city"} dir={sortDir} />
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Lloji</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Verifikuar</th>
                <th className="sticky right-0 bg-gray-50/80 backdrop-blur-sm border-l border-gray-200 px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-400 text-sm">Duke ngarkuar…</td>
                </tr>
              ) : sellers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-400 text-sm">Asnjë shitës nuk u gjet.</td>
                </tr>
              ) : (
                sellers.map((s) => {
                  const isHighlighted = highlightId === s.id;
                  return (
                    <tr
                      key={s.id}
                      ref={isHighlighted ? highlightRef : null}
                      className={`transition-colors group ${isHighlighted ? "bg-blue-50 ring-1 ring-inset ring-blue-300" : "hover:bg-gray-50"}`}
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{s.business_name ?? s.name}</p>
                        {s.business_name && <p className="text-gray-500 text-xs">{s.name}</p>}
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        {s.username ? (
                          <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">{s.username}</span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        <p>{s.phone ?? "—"}</p>
                        <p className="text-xs text-gray-400">{s.email ?? ""}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        <p>{s.city ?? "—"}</p>
                        {s.address && <p className="text-xs text-gray-400 truncate max-w-[180px]">{s.address}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.is_business ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
                          {s.is_business ? "Biznes" : "Individual"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.is_verified ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                          {s.is_verified ? "Verifikuar" : "Në pritje"}
                        </span>
                      </td>
                      <td className={`sticky right-0 backdrop-blur-sm border-l border-gray-100 px-4 py-3 transition-colors ${isHighlighted ? "bg-blue-50/80" : "bg-white/80 group-hover:bg-gray-50/80"}`}>
                        <div className="flex items-center gap-1 justify-end">
                          <Link
                            to={`/shop/${s.id}`}
                            target="_blank"
                            title="Shiko dyqanin"
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                          >
                            <Eye size={14} />
                          </Link>
                          <button
                            title="Ndrysho shitësin"
                            onClick={() => openEdit(s)}
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                          >
                            <Pencil size={14} />
                          </button>
                          {s.user_id && (
                            <button
                              title="Hyr si ky shitës"
                              onClick={() => handleImpersonate(s)}
                              disabled={actionId === s.id}
                              className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 disabled:opacity-40 transition-colors"
                            >
                              <LogIn size={14} />
                            </button>
                          )}
                          <button
                            title={s.is_verified ? "Hiq verifikimin" : "Verifiko shitësin"}
                            onClick={() => confirmToggleVerify(s)}
                            disabled={actionId === s.id}
                            className={`p-1.5 rounded-lg disabled:opacity-40 transition-colors ${
                              s.is_verified
                                ? "text-red-500 hover:bg-red-50"
                                : "text-emerald-600 hover:bg-emerald-50"
                            }`}
                          >
                            {s.is_verified ? <BadgeX size={16} /> : <BadgeCheck size={16} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
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

      {editSeller && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-900">Ndrysho Shitësin</h2>
              <button onClick={() => setEditSeller(null)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-500">
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Emri</label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Emri i Biznesit</label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.business_name}
                    onChange={(e) => setForm({ ...form, business_name: e.target.value })}
                    placeholder="Opsional"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Telefoni</label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Qyteti</label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Lloji</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.is_business ? "business" : "individual"}
                    onChange={(e) => setForm({ ...form, is_business: e.target.value === "business" })}
                  >
                    <option value="individual">Individual</option>
                    <option value="business">Biznes</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Adresa</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>

              <div className="pt-1 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs text-gray-400">
                <span>ID: {editSeller.id}</span>
                {editSeller.username && <span>Pronari: @{editSeller.username}</span>}
                <span>Krijuar: {new Date(editSeller.created_at).toLocaleDateString()}</span>
                <span>Përditësuar: {new Date(editSeller.updated_at).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200">
              <button
                onClick={() => setEditSeller(null)}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Anulo
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
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
