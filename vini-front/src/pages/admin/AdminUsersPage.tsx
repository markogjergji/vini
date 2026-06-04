import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  UserX, Store, Trash2, ExternalLink, Search, X,
  ArrowUpDown, ArrowUp, ArrowDown, SlidersHorizontal,
  ChevronLeft, ChevronRight, LogIn,
} from "lucide-react";
import {
  getAdminUsers,
  updateUser,
  deleteUser,
  makeUserSeller,
  revokeUserSeller,
  impersonateUser,
} from "../../api/admin";
import type { User } from "../../types";
import ConfirmModal from "../../components/ui/ConfirmModal";
import Dropdown from "../../components/ui/Dropdown";
import { useAuthStore } from "../../stores/authStore";

const PAGE_SIZE = 50;

const ROLE_BADGE: Record<string, string> = {
  admin: "bg-purple-100 text-purple-700",
  seller: "bg-emerald-100 text-emerald-700",
  user: "bg-gray-100 text-gray-600",
};

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  seller: "Shitës",
  user: "Përdorues",
};

const ROLES = ["admin", "seller", "user"];

type SortField = "created_at" | "username" | "full_name" | "email" | "role";
type SortDir = "asc" | "desc";

type ConfirmState = {
  title: string;
  message: string;
  confirmLabel: string;
  variant: "danger" | "warning" | "default";
  onConfirm: () => void;
} | null;

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ArrowUpDown size={13} className="text-gray-400" />;
  return dir === "asc" ? <ArrowUp size={13} className="text-blue-500" /> : <ArrowDown size={13} className="text-blue-500" />;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);

  const [actionId, setActionId] = useState<number | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<ConfirmState>(null);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterRole, setFilterRole] = useState<string | null>(null);
  const [filterActive, setFilterActive] = useState<boolean | null>(null);
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const navigate = useNavigate();
  const { startImpersonation } = useAuthStore();

  async function handleImpersonate(user: User) {
    const data = await impersonateUser(user.id);
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
    getAdminUsers({
      search: debouncedSearch || undefined,
      role: filterRole ?? undefined,
      is_active: filterActive ?? undefined,
      sort_by: sortField,
      sort_dir: sortDir,
      page,
      limit: PAGE_SIZE,
    }).then((data) => {
      if (!cancelled) {
        setUsers(data.items);
        setTotal(data.total);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [debouncedSearch, filterRole, filterActive, sortField, sortDir, page, refreshKey]);

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
  const hasFilters = debouncedSearch || filterRole || filterActive !== null;
  const activeFilterCount = (filterRole ? 1 : 0) + (filterActive !== null ? 1 : 0);

  function clearFilters() {
    setSearch("");
    setFilterRole(null);
    setFilterActive(null);
    setPage(1);
  }

  function confirmToggleActive(user: User) {
    const disabling = user.is_active;
    setPendingConfirm({
      title: disabling ? "Çaktivizo përdoruesin" : "Aktivizo përdoruesin",
      message: disabling
        ? `A jeni i sigurt që doni të çaktivizoni "${user.username}"? Ky përdorues nuk do të mund të hyjë në llogarinë e tij.`
        : `Aktivizo përsëri llogarinë e "${user.username}"?`,
      confirmLabel: disabling ? "Çaktivizo" : "Aktivizo",
      variant: disabling ? "warning" : "default",
      onConfirm: async () => {
        setActionId(user.id);
        await updateUser(user.id, { is_active: !user.is_active });
        setActionId(null);
        setRefreshKey((k) => k + 1);
      },
    });
  }

  function confirmDelete(user: User) {
    setPendingConfirm({
      title: "Fshi përdoruesin",
      message: `A jeni i sigurt që doni të fshini "${user.username}"? Kjo veprim është i pakthyeshëm.`,
      confirmLabel: "Fshi",
      variant: "danger",
      onConfirm: async () => {
        setActionId(user.id);
        await deleteUser(user.id);
        setActionId(null);
        setRefreshKey((k) => k + 1);
      },
    });
  }

  function confirmMakeSeller(user: User) {
    setPendingConfirm({
      title: "Bëj shitës",
      message: `Doni ta bëni "${user.username}" shitës? Do t'i krijohet një dyqan i ri.`,
      confirmLabel: "Bëj shitës",
      variant: "default",
      onConfirm: async () => {
        setActionId(user.id);
        await makeUserSeller(user.id, { name: user.full_name });
        setActionId(null);
        setRefreshKey((k) => k + 1);
      },
    });
  }

  function confirmRevokeSeller(user: User) {
    setPendingConfirm({
      title: "Hiq rolin e shitësit",
      message: `A jeni i sigurt që doni t'i hiqni rolin e shitësit "${user.username}"?`,
      confirmLabel: "Hiq rolin",
      variant: "warning",
      onConfirm: async () => {
        setActionId(user.id);
        await revokeUserSeller(user.id);
        setActionId(null);
        setRefreshKey((k) => k + 1);
      },
    });
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Përdoruesit</h1>

      {/* Toolbar */}
      <div className="flex flex-col gap-2 mb-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Kërko emër, email, username…"
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
          {(["created_at", "username", "full_name", "email", "role"] as SortField[]).map((f) => {
            const labels: Record<SortField, string> = {
              created_at: "Data",
              username: "Username",
              full_name: "Emri",
              email: "Email",
              role: "Roli",
            };
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
              placeholder="Çdo rol"
              value={filterRole}
              options={ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] ?? r }))}
              onChange={(v) => { setFilterRole(v as string | null); setPage(1); }}
              className="w-36 border border-gray-300 rounded-none"
            />

            <Dropdown
              size="md"
              searchable={false}
              placeholder="Çdo status"
              value={filterActive === null ? null : filterActive ? "active" : "inactive"}
              options={[
                { value: "active", label: "Aktiv" },
                { value: "inactive", label: "Çaktivizuar" },
              ]}
              onChange={(v) => {
                setFilterActive(v === null ? null : v === "active");
                setPage(1);
              }}
              className="w-36 border border-gray-300 rounded-none"
            />
          </div>
        )}

        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span>{loading ? "Duke ngarkuar…" : `${total} përdorues gjithsej`}</span>
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
                  <button onClick={() => toggleSort("username")} className="inline-flex items-center gap-1 hover:text-gray-900">
                    Username <SortIcon active={sortField === "username"} dir={sortDir} />
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">
                  <button onClick={() => toggleSort("email")} className="inline-flex items-center gap-1 hover:text-gray-900">
                    Email <SortIcon active={sortField === "email"} dir={sortDir} />
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">
                  <button onClick={() => toggleSort("role")} className="inline-flex items-center gap-1 hover:text-gray-900">
                    Roli <SortIcon active={sortField === "role"} dir={sortDir} />
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Dyqani</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Statusi</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">
                  <button onClick={() => toggleSort("created_at")} className="inline-flex items-center gap-1 hover:text-gray-900">
                    U regjistrua <SortIcon active={sortField === "created_at"} dir={sortDir} />
                  </button>
                </th>
                <th className="sticky right-0 bg-gray-50/80 backdrop-blur-sm border-l border-gray-200 px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-400 text-sm">Duke ngarkuar…</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-400 text-sm">Asnjë përdorues nuk u gjet.</td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 group">
                    <td className="px-4 py-3 text-gray-700 text-sm font-mono">
                      {u.username}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {u.email}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_BADGE[u.role] ?? "bg-gray-100 text-gray-600"}`}>
                        {ROLE_LABELS[u.role] ?? u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {u.seller_id ? (
                        <button
                          onClick={() => navigate(`/admin/sellers?id=${u.seller_id}`)}
                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          <Store size={13} />
                          Shiko dyqanin
                          <ExternalLink size={11} />
                        </button>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                        {u.is_active ? "Aktiv" : "Çaktivizuar"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="sticky right-0 bg-white/80 backdrop-blur-sm group-hover:bg-gray-50/80 border-l border-gray-100 px-4 py-3 transition-colors">
                      <div className="flex items-center gap-2 justify-end">
                        {u.role !== "admin" && (
                          <>
                            <button
                              title="Hyr si ky përdorues"
                              onClick={() => handleImpersonate(u)}
                              disabled={actionId === u.id}
                              className="p-1.5 rounded-none text-blue-500 hover:bg-blue-50 disabled:opacity-40 transition-colors"
                            >
                              <LogIn size={15} />
                            </button>
                            {u.role === "seller" ? (
                              <button
                                title="Hiq shitësin"
                                onClick={() => confirmRevokeSeller(u)}
                                disabled={actionId === u.id}
                                className="p-1.5 rounded-none text-orange-500 hover:bg-orange-50 disabled:opacity-40 transition-colors"
                              >
                                <Store size={15} />
                              </button>
                            ) : (
                              <button
                                title="Bëj shitës"
                                onClick={() => confirmMakeSeller(u)}
                                disabled={actionId === u.id}
                                className="p-1.5 rounded-none text-emerald-600 hover:bg-emerald-50 disabled:opacity-40 transition-colors"
                              >
                                <Store size={15} />
                              </button>
                            )}
                            <button
                              title={u.is_active ? "Çaktivizo përdoruesin" : "Aktivizo përdoruesin"}
                              onClick={() => confirmToggleActive(u)}
                              disabled={actionId === u.id}
                              className="p-1.5 rounded-none text-gray-500 hover:bg-gray-100 disabled:opacity-40 transition-colors"
                            >
                              <UserX size={15} />
                            </button>
                            <button
                              title="Fshi përdoruesin"
                              onClick={() => confirmDelete(u)}
                              disabled={actionId === u.id}
                              className="p-1.5 rounded-none text-red-500 hover:bg-red-50 disabled:opacity-40 transition-colors"
                            >
                              <Trash2 size={15} />
                            </button>
                          </>
                        )}
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
    </div>
  );
}
