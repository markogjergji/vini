import { useNavigate } from "react-router-dom";
import { useUploadStore } from "../stores/uploadStore";
import PartForm from "../components/upload/PartForm";
import ImageUpload from "../components/upload/ImageUpload";
import { createSeller } from "../api/sellers";
import { createPart, uploadPartImages } from "../api/parts";

export default function UploadPage() {
  const store = useUploadStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    store.set({ submitting: true, error: null });

    try {
      // Create seller if needed
      let sellerId = store.sellerId;
      if (!sellerId) {
        if (!store.sellerName.trim()) {
          store.set({ error: "Name is required", submitting: false });
          return;
        }
        const seller = await createSeller({
          name: store.sellerName,
          phone: store.sellerPhone || undefined,
          business_name: store.sellerBusinessName || undefined,
          city: store.sellerCity || undefined,
          is_business: !!store.sellerBusinessName,
        });
        sellerId = seller.id;
        store.set({ sellerId: seller.id, sellerName: seller.name });
        localStorage.setItem("seller_id", String(seller.id));
        localStorage.setItem("seller_name", seller.name);
      }

      if (!store.title.trim()) {
        store.set({ error: "Title is required", submitting: false });
        return;
      }

      // Create part
      const part = await createPart({
        seller_id: sellerId,
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
        compatible_model_year_ids: store.compatEntries.map((e) => e.modelYearId),
      });

      // Upload images
      if (store.imageFiles.length > 0) {
        await uploadPartImages(part.id, store.imageFiles);
      }

      store.reset();
      // Restore seller info for next upload
      store.set({ sellerId: sellerId, sellerName: localStorage.getItem("seller_name") ?? "" });
      navigate(`/parts/${part.id}`);
    } catch {
      store.set({ error: "Failed to submit listing" });
    } finally {
      store.set({ submitting: false });
    }
  };

  // Load seller from localStorage on first render
  if (!store.sellerId) {
    const savedId = localStorage.getItem("seller_id");
    const savedName = localStorage.getItem("seller_name");
    if (savedId && savedName) {
      store.set({ sellerId: Number(savedId), sellerName: savedName });
    }
  }

  return (
    <div>
      <h1 className="text-lg font-medium mb-4">List a Part</h1>
      <form onSubmit={handleSubmit}>
        <PartForm />
        <div className="mt-4">
          <ImageUpload />
        </div>
        {store.error && <p className="text-sm text-red-600 mt-2">{store.error}</p>}
        <button
          type="submit"
          disabled={store.submitting}
          className="mt-4 bg-blue-600 text-white px-6 py-2 text-sm hover:bg-blue-700 disabled:bg-gray-400"
        >
          {store.submitting ? "Submitting..." : "Submit Listing"}
        </button>
      </form>
    </div>
  );
}
