import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, Pencil, X, Store } from "lucide-react";
import { getAdminParts, deletePart, updateAdminPart } from "../../api/admin";
import type { PartAdmin } from "../../types";

const STATUS_BADGE: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  sold: "bg-gray-100 text-gray-500",
  reserved: "bg-yellow-100 text-yellow-700",
  expired: "bg-red-100 text-red-600",
};

const CONDITIONS = ["used", "refurbished", "new_old_stock"];
const STATUSES = ["active", "reserved", "sold", "expired"];

type EditForm = {
  title: string;
  description: string;
  price: string;
  currency: string;
  condition: string;
  status: string;
  oem_number: string;
  location_text: string;
};

export default function AdminPartsPage() {
  const [parts, setParts] = useState<PartAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);
  const [editPart, setEditPart] = useState<PartAdmin | null>(null);
  const [form, setForm] = useState<EditForm>({ title: "", description: "", price: "", currency: "ALL", condition: "used", status: "active", oem_number: "", location_text: "" });
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  async function load() {
    setLoading(true);
    const data = await getAdminParts();
    setParts(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(part: PartAdmin) {
    if (!confirm(`Delete part "${part.title}"?`)) return;
    setActionId(part.id);
    await deletePart(part.id);
    await load();
    setActionId(null);
  }

  function openEdit(part: PartAdmin) {
    setEditPart(part);
    setForm({
      title: part.title,
      description: part.description ?? "",
      price: part.price != null ? String(part.price) : "",
      currency: part.currency,
      condition: part.condition,
      status: part.status,
      oem_number: part.oem_number ?? "",
      location_text: part.location_text ?? "",
    });
  }

  async function handleSave() {
    if (!editPart) return;
    setSaving(true);
    const payload: Record<string, string | number> = {};
    if (form.title !== editPart.title) payload.title = form.title;
    if (form.description !== (editPart.description ?? "")) payload.description = form.description;
    const priceNum = form.price !== "" ? parseFloat(form.price) : null;
    if (priceNum !== editPart.price) payload.price = priceNum ?? "";
    if (form.currency !== editPart.currency) payload.currency = form.currency;
    if (form.condition !== editPart.condition) payload.condition = form.condition;
    if (form.status !== editPart.status) payload.status = form.status;
    if (form.oem_number !== (editPart.oem_number ?? "")) payload.oem_number = form.oem_number;
    if (form.location_text !== (editPart.location_text ?? "")) payload.location_text = form.location_text;
    await updateAdminPart(editPart.id, payload);
    setEditPart(null);
    setSaving(false);
    await load();
  }

  if (loading) return <div className="text-gray-500 text-sm">Loading parts...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Parts</h1>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Title</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Seller</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Price</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Condition</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Status</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Category</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Listed</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {parts.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 max-w-[220px]">
                  <p className="font-medium text-gray-900 truncate">{p.title}</p>
                  {p.oem_number && <p className="text-gray-400 text-xs">OEM: {p.oem_number}</p>}
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
                <td className="px-4 py-3 text-gray-600 capitalize">{p.condition.replace("_", " ")}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[p.status] ?? "bg-gray-100 text-gray-600"}`}>
                    {p.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{p.category_name ?? "—"}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {new Date(p.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-end">
                    <button
                      title="Edit part"
                      onClick={() => openEdit(p)}
                      className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      title="Delete part"
                      onClick={() => handleDelete(p)}
                      disabled={actionId === p.id}
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 disabled:opacity-40 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit modal */}
      {editPart && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-900">Edit Part</h2>
              <button onClick={() => setEditPart(null)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-500">
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-4 space-y-3 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <textarea
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Price</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="—"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Currency</label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.currency}
                    onChange={(e) => setForm({ ...form, currency: e.target.value })}
                    maxLength={3}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Condition</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.condition}
                    onChange={(e) => setForm({ ...form, condition: e.target.value })}
                  >
                    {CONDITIONS.map((c) => (
                      <option key={c} value={c}>{c.replace("_", " ")}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">OEM Number</label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.oem_number}
                    onChange={(e) => setForm({ ...form, oem_number: e.target.value })}
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Location</label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.location_text}
                    onChange={(e) => setForm({ ...form, location_text: e.target.value })}
                    placeholder="Optional"
                  />
                </div>
              </div>

              {/* Read-only info */}
              <div className="pt-1 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs text-gray-400">
                <span>ID: {editPart.id}</span>
                <span>
                  Seller:{" "}
                  <button
                    className="text-blue-500 hover:underline"
                    onClick={() => { setEditPart(null); navigate(`/admin/sellers?id=${editPart.seller_id}`); }}
                  >
                    {editPart.seller_name ?? `#${editPart.seller_id}`}
                  </button>
                </span>
                <span>Listed: {new Date(editPart.created_at).toLocaleDateString()}</span>
                {editPart.category_name && <span>Category: {editPart.category_name}</span>}
              </div>
            </div>

            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200">
              <button
                onClick={() => setEditPart(null)}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
