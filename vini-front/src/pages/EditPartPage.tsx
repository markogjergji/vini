import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useUploadStore } from "../stores/uploadStore";
import PartForm from "../components/upload/PartForm";
import ImageUpload from "../components/upload/ImageUpload";
import { getPartById, updatePart, uploadPartImages, deletePartImage, reorderPartImages } from "../api/parts";
import type { PartImage } from "../types";

const API_BASE = "http://localhost:8000";

export default function EditPartPage() {
  const { id } = useParams<{ id: string }>();
  const partId = Number(id);
  const store = useUploadStore();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [existingImages, setExistingImages] = useState<PartImage[]>([]);
  const dragIndex = useRef<number | null>(null);

  useEffect(() => {
    if (!partId) return;
    getPartById(partId)
      .then((part) => {
        store.set({
          imageFiles: [],
          error: null,
          sellerId: part.seller.id,
          sellerName: part.seller.name,
          sellerLatitude: part.seller.latitude,
          sellerLongitude: part.seller.longitude,
          sellerCity: part.seller.city ?? "",
          sellerAddress: part.seller.address ?? "",
          title: part.title,
          description: part.description ?? "",
          price: part.price != null ? String(part.price) : "",
          condition: part.condition,
          categoryId: part.category?.id ?? null,
          oemNumber: part.oem_number ?? "",
          locationText: part.location_text ?? "",
          latitude: part.latitude ?? null,
          longitude: part.longitude ?? null,
          compatEntries: part.compatible_vehicles.map((v) => {
            const year = v.specific_year ?? v.model_year.year_start;
            const trimSuffix = v.model_year.generation ? ` · ${v.model_year.generation}` : "";
            return {
              makeId: v.make.id,
              modelId: v.model.id,
              modelYearId: v.model_year.id,
              selectedYear: v.specific_year,
              label: `${v.make.name} ${v.model.name} ${year}${trimSuffix}`,
            };
          }),
        });
        setExistingImages(part.images);
      })
      .catch(() => setLoadError("Failed to load listing."))
      .finally(() => setLoading(false));
  }, [partId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDeleteImage = async (img: PartImage) => {
    await deletePartImage(partId, img.id);
    setExistingImages((prev) => prev.filter((i) => i.id !== img.id));
  };

  const handleDragStart = (index: number) => {
    dragIndex.current = index;
  };

  const handleDrop = (dropIndex: number) => {
    const from = dragIndex.current;
    if (from === null || from === dropIndex) return;
    dragIndex.current = null;

    setExistingImages((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(dropIndex, 0, moved);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    store.set({ submitting: true, error: null });

    try {
      if (!store.title.trim()) {
        store.set({ error: "Title is required", submitting: false });
        return;
      }

      await updatePart(partId, {
        category_id: store.categoryId ?? undefined,
        title: store.title,
        description: store.description || undefined,
        price: store.price ? Number(store.price) : undefined,
        currency: "ALL",
        condition: store.condition,
        oem_number: store.oemNumber || undefined,
        location_text: store.locationText || undefined,
        latitude: store.latitude ?? undefined,
        longitude: store.longitude ?? undefined,
        compatible_vehicles: store.compatEntries.map((e) => ({ model_year_id: e.modelYearId, specific_year: e.selectedYear })),
      });

      if (existingImages.length > 0) {
        await reorderPartImages(partId, existingImages.map((i) => i.id));
      }

      if (store.imageFiles.length > 0) {
        await uploadPartImages(partId, store.imageFiles);
      }

      store.reset();
      navigate(`/parts/${partId}`);
    } catch {
      store.set({ error: "Failed to save changes." });
    } finally {
      store.set({ submitting: false });
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <p className="text-sm text-gray-400">Loading…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3">{loadError}</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-red-600 mb-1">Seller</p>
        <h1 className="text-2xl font-bold text-gray-900">Edit Listing</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <PartForm />

        {/* Existing images — drag to reorder */}
        {existingImages.length > 0 && (
          <section className="border border-gray-200 bg-white">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-widest text-gray-700">Current Photos</h2>
              <span className="text-xs text-gray-400">Drag to reorder · first is primary</span>
            </div>
            <div className="px-5 py-4">
              <div className="flex gap-2 flex-wrap">
                {existingImages.map((img, i) => (
                  <div
                    key={img.id}
                    draggable
                    onDragStart={() => handleDragStart(i)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDrop(i)}
                    className="relative w-24 h-24 border border-gray-200 bg-gray-50 group cursor-grab active:cursor-grabbing select-none"
                  >
                    <img
                      src={`${API_BASE}${img.url}`}
                      alt=""
                      className="w-full h-full object-cover pointer-events-none"
                    />
                    {i === 0 && (
                      <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] font-bold uppercase tracking-wide text-center py-0.5">
                        Primary
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteImage(img)}
                      className="absolute top-1 right-1 bg-zinc-900 text-white text-xs w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* New images */}
        <ImageUpload />

        {store.error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
            {store.error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate(`/parts/${partId}`)}
            className="flex-1 border border-gray-300 text-gray-700 py-3 text-sm font-semibold hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={store.submitting}
            className="flex-1 bg-red-600 text-white py-3 text-sm font-semibold uppercase tracking-wide hover:bg-red-500 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {store.submitting ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </form>

      <div className="pb-12" />
    </div>
  );
}
