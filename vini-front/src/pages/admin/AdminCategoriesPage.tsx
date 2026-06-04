import { useEffect, useRef, useState } from "react";
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, Tag, Upload, X } from "lucide-react";
import {
  getAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
  uploadCategoryImage,
  deleteCategoryImage,
} from "../../api/admin";
import type { AdminCategory } from "../../api/admin";
import ConfirmModal from "../../components/ui/ConfirmModal";

const API_BASE = "http://localhost:8000";

type ConfirmState = {
  title: string;
  message: string;
  confirmLabel: string;
  variant: "danger" | "warning" | "default";
  onConfirm: () => void;
} | null;

type FormState = {
  name: string;
  slug: string;
  parent_id: number | null;
  sort_order: number;
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

const EMPTY_FORM: FormState = { name: "", slug: "", parent_id: null, sort_order: 0 };

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminCategory | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Image state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [pendingConfirm, setPendingConfirm] = useState<ConfirmState>(null);
  const [actionId, setActionId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    try {
      setCategories(await getAdminCategories());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const parents = categories
    .filter((c) => c.parent_id === null)
    .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
  const childrenOf = (id: number) =>
    categories
      .filter((c) => c.parent_id === id)
      .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));

  function openAdd(parentId: number | null = null) {
    setEditing(null);
    setForm({ ...EMPTY_FORM, parent_id: parentId });
    setSlugTouched(false);
    setError(null);
    setImageFile(null);
    setImagePreview(null);
    setRemoveImage(false);
    setModalOpen(true);
  }

  function openEdit(cat: AdminCategory) {
    setEditing(cat);
    setForm({ name: cat.name, slug: cat.slug, parent_id: cat.parent_id, sort_order: cat.sort_order });
    setSlugTouched(true);
    setError(null);
    setImageFile(null);
    setImagePreview(cat.image_url ? `${API_BASE}${cat.image_url}` : null);
    setRemoveImage(false);
    setModalOpen(true);
  }

  function handleNameChange(val: string) {
    setForm((f) => ({ ...f, name: val, slug: slugTouched ? f.slug : slugify(val) }));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setRemoveImage(false);
  }

  function handleRemoveImage() {
    setImageFile(null);
    setImagePreview(null);
    setRemoveImage(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSave() {
    if (!form.name.trim() || !form.slug.trim()) { setError("Name and slug are required"); return; }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        parent_id: form.parent_id,
        sort_order: form.sort_order,
      };

      let saved: AdminCategory;
      if (editing) {
        saved = await updateAdminCategory(editing.id, payload);
      } else {
        saved = await createAdminCategory(payload);
      }

      // Handle image changes
      if (imageFile) {
        await uploadCategoryImage(saved.id, imageFile);
      } else if (removeImage && editing?.image_url) {
        await deleteCategoryImage(saved.id);
      }

      setModalOpen(false);
      await load();
      if (form.parent_id !== null) {
        setExpanded((e) => new Set([...e, form.parent_id as number]));
      }
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg ?? "An error occurred");
    } finally {
      setSaving(false);
    }
  }

  function askDelete(cat: AdminCategory) {
    setActionId(cat.id);
    setPendingConfirm({
      title: `Delete "${cat.name}"?`,
      message: cat.parent_id === null
        ? "This will permanently delete this category. It cannot have any subcategories or parts assigned."
        : "This will permanently delete this subcategory. It cannot have any parts assigned.",
      confirmLabel: "Delete",
      variant: "danger",
      onConfirm: async () => {
        try {
          await deleteAdminCategory(cat.id);
          await load();
        } catch (e: unknown) {
          const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
          alert(msg ?? "Cannot delete category");
        } finally {
          setActionId(null);
          setPendingConfirm(null);
        }
      },
    });
  }

  function toggleExpand(id: number) {
    setExpanded((e) => {
      const next = new Set(e);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function CategoryImage({ url }: { url: string | null }) {
    if (!url) return <div className="w-9 h-9 rounded bg-zinc-100 flex items-center justify-center text-zinc-300"><Tag size={14} /></div>;
    return <img src={`${API_BASE}${url}`} alt="" className="w-9 h-9 rounded object-cover border border-zinc-200" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Kategoritë</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{categories.length} total</p>
        </div>
        <button
          onClick={() => openAdd(null)}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
        >
          <Plus size={16} />
          Shto kategori
        </button>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-zinc-400 text-sm">Duke ngarkuar...</div>
        ) : parents.length === 0 ? (
          <div className="py-16 text-center text-zinc-400 text-sm">
            <Tag size={32} className="mx-auto mb-3 opacity-30" />
            Nuk ka kategori. Shto kategorinë e parë.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50">
                <th className="text-left px-4 py-3 font-medium text-zinc-500 w-8"></th>
                <th className="text-left px-4 py-3 font-medium text-zinc-500 w-12">Foto</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-500">Emri</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-500 hidden sm:table-cell">Slug</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-500 hidden md:table-cell">Radhitja</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-500 hidden lg:table-cell">Nënkategori</th>
                <th className="px-4 py-3 w-24"></th>
              </tr>
            </thead>
            <tbody>
              {parents.map((parent) => {
                const children = childrenOf(parent.id);
                const isExpanded = expanded.has(parent.id);
                return (
                  <>
                    <tr key={parent.id} className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors">
                      <td className="px-4 py-3">
                        {children.length > 0 ? (
                          <button onClick={() => toggleExpand(parent.id)} className="text-zinc-400 hover:text-zinc-700 transition-colors">
                            {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                          </button>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <CategoryImage url={parent.image_url} />
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-zinc-800">{parent.name}</span>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <code className="text-xs text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded">{parent.slug}</code>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-zinc-500">{parent.sort_order}</td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-500">{children.length}</span>
                          <button onClick={() => openAdd(parent.id)} className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                            + Shto
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(parent)} className="p-1.5 rounded text-zinc-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => askDelete(parent)}
                            disabled={actionId === parent.id}
                            className="p-1.5 rounded text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && children.map((child) => (
                      <tr key={child.id} className="border-b border-zinc-100 bg-zinc-50/50 hover:bg-zinc-50 transition-colors">
                        <td className="px-4 py-2.5"></td>
                        <td className="px-4 py-2.5">
                          <CategoryImage url={child.image_url} />
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2 pl-4">
                            <span className="w-px h-4 bg-zinc-300 -ml-2 mr-1"></span>
                            <span className="text-zinc-700">{child.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 hidden sm:table-cell">
                          <code className="text-xs text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded">{child.slug}</code>
                        </td>
                        <td className="px-4 py-2.5 hidden md:table-cell text-zinc-500">{child.sort_order}</td>
                        <td className="px-4 py-2.5 hidden lg:table-cell"></td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => openEdit(child)} className="p-1.5 rounded text-zinc-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => askDelete(child)}
                              disabled={actionId === child.id}
                              className="p-1.5 rounded text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-base font-semibold text-zinc-800">
                {editing ? "Ndrysho kategorinë" : "Shto kategori"}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-zinc-400 hover:text-zinc-700 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

              {/* Image Upload */}
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-2">Fotoja e kategorisë</label>
                <div className="flex items-start gap-3">
                  {/* Preview box */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="relative w-24 h-24 rounded-lg border-2 border-dashed border-zinc-300 hover:border-red-400 bg-zinc-50 flex items-center justify-center cursor-pointer overflow-hidden flex-shrink-0 transition-colors group"
                  >
                    {imagePreview ? (
                      <>
                        <img src={imagePreview} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                          <Upload size={18} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </>
                    ) : (
                      <div className="text-center text-zinc-400 pointer-events-none">
                        <Upload size={20} className="mx-auto mb-1" />
                        <span className="text-xs">Ngarko</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors text-zinc-700"
                    >
                      {imagePreview ? "Ndrysho foton" : "Zgjidh foton"}
                    </button>
                    {imagePreview && (
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="w-full px-3 py-2 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        Hiq foton
                      </button>
                    )}
                    <p className="text-xs text-zinc-400">PNG, JPG, WebP — rekomandohet 400×400px</p>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Emri *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="p.sh. Motorit"
                  className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Slug *</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => { setSlugTouched(true); setForm((f) => ({ ...f, slug: e.target.value })); }}
                  placeholder="p.sh. motorit"
                  className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <p className="text-xs text-zinc-400 mt-1">Identifikues unik i URL-it, vetëm shkronja të vogla dhe vizë.</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Kategoria prind</label>
                <select
                  value={form.parent_id ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, parent_id: e.target.value === "" ? null : Number(e.target.value) }))}
                  className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                >
                  <option value="">— Kategori kryesore —</option>
                  {parents.filter((p) => p.id !== editing?.id).map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Radhitja</label>
                <input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))}
                  min={0}
                  className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <p className="text-xs text-zinc-400 mt-1">Numri më i vogël shfaqet i pari.</p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-zinc-200 flex justify-end gap-2 sticky bottom-0 bg-white">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-sm text-zinc-600 hover:text-zinc-900 transition-colors"
              >
                Anulo
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {saving ? "Duke ruajtur..." : editing ? "Ruaj ndryshimet" : "Shto"}
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingConfirm && (
        <ConfirmModal
          title={pendingConfirm.title}
          message={pendingConfirm.message}
          confirmLabel={pendingConfirm.confirmLabel}
          variant={pendingConfirm.variant}
          onConfirm={pendingConfirm.onConfirm}
          onCancel={() => { setPendingConfirm(null); setActionId(null); }}
        />
      )}
    </div>
  );
}
