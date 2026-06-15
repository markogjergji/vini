import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUploadStore } from "../stores/uploadStore";
import PartForm from "../components/upload/PartForm";
import ImageUpload from "../components/upload/ImageUpload";
import { getMySeller } from "../api/sellers";
import { createPart, uploadPartImages } from "../api/parts";

export default function UploadPage() {
  const store = useUploadStore();
  const navigate = useNavigate();
  const [successName, setSuccessName] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);
  const addAnotherRef = useRef(false);

  useEffect(() => {
    getMySeller().then((seller) => {
      store.set({
        sellerId: seller.id,
        sellerName: seller.name,
        sellerLatitude: seller.latitude,
        sellerLongitude: seller.longitude,
        sellerCity: seller.city ?? "",
        sellerAddress: seller.address ?? "",
      });
    }).catch(() => {
      store.set({ error: "Nuk u ngarkua profili i dyqanit tënd." });
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async (addAnother: boolean) => {
    store.set({ submitting: true, error: null });
    setSuccessName(null);

    try {
      const sellerId = store.sellerId;
      if (!sellerId) {
        store.set({ error: "Profili i dyqanit nuk u ngarkua.", submitting: false });
        return;
      }

      if (!store.title.trim()) {
        store.set({ error: "Titulli është i detyrueshëm.", submitting: false });
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
        compatible_vehicles: store.compatEntries.map((e) => ({ model_year_id: e.modelYearId, specific_year: e.selectedYear })),
      });

      // Upload images
      if (store.imageFiles.length > 0) {
        await uploadPartImages(part.id, store.imageFiles);
      }

      const savedTitle = store.title;

      // Preserve shop + location so the seller can keep adding parts quickly.
      const keep = {
        sellerId,
        sellerName: store.sellerName,
        sellerLatitude: store.sellerLatitude,
        sellerLongitude: store.sellerLongitude,
        sellerCity: store.sellerCity,
        sellerAddress: store.sellerAddress,
        latitude: store.latitude,
        longitude: store.longitude,
        locationText: store.locationText,
      };
      store.reset();
      store.set(keep);

      if (addAnother) {
        setSuccessName(savedTitle);
        setFormKey((k) => k + 1); // remount form -> clears fields & re-focuses title
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        navigate(`/parts/${part.id}`);
      }
    } catch {
      store.set({ error: "Pjesa nuk u publikua. Provo përsëri." });
    } finally {
      store.set({ submitting: false });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit(addAnotherRef.current);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Page header */}
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-red-600 mb-1">Shitje</p>
        <h1 className="text-2xl font-bold text-gray-900">Shto një pjesë</h1>
        <p className="text-sm text-gray-500 mt-1">
          Plotëso të dhënat e pjesës. Fushat me <span className="text-red-600">*</span> janë të detyrueshme.
        </p>
      </div>

      {successName && (
        <div className="mb-6 flex items-center gap-2 bg-green-50 border border-green-200 text-green-800 px-4 py-3 text-sm">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          <span>
            “{successName}” u publikua. Mund të shtosh një pjesë tjetër më poshtë.
          </span>
        </div>
      )}

      <form key={formKey} onSubmit={handleSubmit} className="space-y-6">
        <PartForm />
        <ImageUpload />

        {store.error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
            {store.error}
          </div>
        )}

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="submit"
            disabled={store.submitting}
            onClick={() => (addAnotherRef.current = false)}
            className="flex-1 bg-red-600 text-white py-3 text-sm font-semibold uppercase tracking-wide hover:bg-red-500 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {store.submitting ? "Duke publikuar…" : "Publiko pjesën"}
          </button>
          <button
            type="submit"
            disabled={store.submitting}
            onClick={() => (addAnotherRef.current = true)}
            className="flex-1 border border-gray-300 bg-white text-gray-800 py-3 text-sm font-semibold uppercase tracking-wide hover:border-gray-400 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {store.submitting ? "Duke ruajtur…" : "Ruaj dhe shto tjetër"}
          </button>
        </div>
        <p className="text-xs text-gray-400">
          “Ruaj dhe shto tjetër” e ruan pjesën dhe e mban faqen gati për pjesën tjetër (dyqani dhe vendndodhja ruhen).
        </p>
      </form>

      <div className="pb-12" />
    </div>
  );
}
