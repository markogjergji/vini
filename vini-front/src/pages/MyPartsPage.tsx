import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMySeller } from "../api/sellers";
import { searchParts, deletePart } from "../api/parts";
import PartCard from "../components/parts/PartCard";
import ConfirmModal from "../components/ui/ConfirmModal";
import type { PartListItem } from "../types";

export default function MyPartsPage() {
  const [parts, setParts] = useState<PartListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PartListItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    getMySeller()
      .then((seller) => searchParts({ seller_id: seller.id, limit: 50 }))
      .then((res) => {
        setParts(res.items);
        setTotal(res.total);
      })
      .catch(() => setError("Failed to load your listings."))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deletePart(deleteTarget.id);
      setParts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setTotal((t) => t - 1);
    } catch {
      setError("Failed to delete listing.");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-red-600 mb-1">Seller</p>
          <h1 className="text-2xl font-bold text-gray-900">Pjesët e mia</h1>
          {!loading && !error && (
            <p className="text-sm text-gray-400 mt-0.5">{total} {total === 1 ? "part" : "parts"} listed</p>
          )}
        </div>
        <Link
          to="/upload"
          className="bg-red-600 text-white px-5 py-2 text-sm font-semibold hover:bg-red-500 transition-colors no-underline"
        >
          + New Listing
        </Link>
      </div>

      {loading && (
        <p className="text-sm text-gray-400">Loading…</p>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3">{error}</p>
      )}

      {!loading && !error && parts.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <p className="text-sm">You haven't listed any parts yet.</p>
          <Link to="/upload" className="mt-3 inline-block text-sm font-semibold text-red-600 hover:text-red-500">
            List your first part →
          </Link>
        </div>
      )}

      {parts.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {parts.map((part) => (
            <div key={part.id} className="flex flex-col">
              <PartCard part={part} />
              <div className="flex border border-t-0 border-gray-200">
                <Link
                  to={`/parts/${part.id}/edit`}
                  className="flex-1 text-center text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-50 py-2 transition-colors no-underline border-r border-gray-200"
                >
                  Edit
                </Link>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(part)}
                  className="flex-1 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 py-2 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Delete Listing"
          message={`Are you sure you want to delete "${deleteTarget.title}"? This cannot be undone.`}
          confirmLabel={deleting ? "Deleting…" : "Delete"}
          cancelLabel="Cancel"
          variant="danger"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
