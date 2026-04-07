import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { BadgeCheck, BadgeX, Pencil, X } from "lucide-react";
import { getAdminSellers, verifySeller, unverifySeller, updateAdminSeller } from "../../api/admin";
import type { SellerAdmin } from "../../types";

type EditForm = {
  name: string;
  phone: string;
  email: string;
  business_name: string;
  address: string;
  city: string;
  is_business: boolean;
};

export default function AdminSellersPage() {
  const [sellers, setSellers] = useState<SellerAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);
  const [editSeller, setEditSeller] = useState<SellerAdmin | null>(null);
  const [form, setForm] = useState<EditForm>({ name: "", phone: "", email: "", business_name: "", address: "", city: "", is_business: false });
  const [saving, setSaving] = useState(false);
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get("id") ? Number(searchParams.get("id")) : null;
  const highlightRef = useRef<HTMLTableRowElement | null>(null);

  async function load() {
    setLoading(true);
    const data = await getAdminSellers();
    setSellers(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!loading && highlightId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [loading, highlightId]);

  async function toggleVerify(seller: SellerAdmin) {
    setActionId(seller.id);
    if (seller.is_verified) {
      await unverifySeller(seller.id);
    } else {
      await verifySeller(seller.id);
    }
    await load();
    setActionId(null);
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
    await load();
  }

  if (loading) return <div className="text-gray-500 text-sm">Loading sellers...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Sellers</h1>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Shop / Name</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Owner</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Contact</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">City / Address</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Type</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Verified</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sellers.map((s) => {
              const isHighlighted = highlightId === s.id;
              return (
                <tr
                  key={s.id}
                  ref={isHighlighted ? highlightRef : null}
                  className={`transition-colors ${isHighlighted ? "bg-blue-50 ring-1 ring-inset ring-blue-300" : "hover:bg-gray-50"}`}
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
                      {s.is_business ? "Business" : "Individual"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.is_verified ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                      {s.is_verified ? "Verified" : "Pending"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        title="Edit seller"
                        onClick={() => openEdit(s)}
                        className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        title={s.is_verified ? "Remove verification" : "Verify seller"}
                        onClick={() => toggleVerify(s)}
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
            })}
          </tbody>
        </table>
      </div>

      {/* Edit modal */}
      {editSeller && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-900">Edit Seller</h2>
              <button onClick={() => setEditSeller(null)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-500">
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Business Name</label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.business_name}
                    onChange={(e) => setForm({ ...form, business_name: e.target.value })}
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
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
                  <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.is_business ? "business" : "individual"}
                    onChange={(e) => setForm({ ...form, is_business: e.target.value === "business" })}
                  >
                    <option value="individual">Individual</option>
                    <option value="business">Business</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>

              {/* Read-only info */}
              <div className="pt-1 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs text-gray-400">
                <span>ID: {editSeller.id}</span>
                {editSeller.username && <span>Owner: @{editSeller.username}</span>}
                <span>Created: {new Date(editSeller.created_at).toLocaleDateString()}</span>
                <span>Updated: {new Date(editSeller.updated_at).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200">
              <button
                onClick={() => setEditSeller(null)}
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
