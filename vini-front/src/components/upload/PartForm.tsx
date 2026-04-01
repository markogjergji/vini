import { useEffect } from "react";
import { useUploadStore } from "../../stores/uploadStore";
import { getMakes, getModels, getYears } from "../../api/vehicles";
import { getCategories } from "../../api/parts";

export default function PartForm() {
  const store = useUploadStore();

  useEffect(() => {
    getMakes().then((m) => store.set({ makes: m }));
    getCategories().then((c) => store.set({ categories: c }));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (store.currentMakeId) {
      getModels(store.currentMakeId).then((m) => store.set({ models: m }));
    }
  }, [store.currentMakeId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (store.currentModelId) {
      getYears(store.currentModelId).then((y) => store.set({ years: y }));
    }
  }, [store.currentModelId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddCompat = () => {
    if (!store.currentMakeId || !store.currentModelId || !store.currentYearId) return;
    const make = store.makes.find((m) => m.id === store.currentMakeId);
    const model = store.models.find((m) => m.id === store.currentModelId);
    const year = store.years.find((y) => y.id === store.currentYearId);
    if (!make || !model || !year) return;
    store.addCompat({
      makeId: make.id,
      modelId: model.id,
      modelYearId: year.id,
      label: `${make.name} ${model.name} ${year.year_start}–${year.year_end}`,
    });
  };

  // Only show top-level categories (parent_id is null)
  const topCategories = store.categories.filter((c) => c.parent_id === null);
  const subCategories = store.categories.filter((c) => c.parent_id !== null);

  return (
    <div className="space-y-4">
      {/* Seller info */}
      {!store.sellerId && (
        <fieldset className="border border-gray-300 p-4">
          <legend className="text-sm font-medium px-1">Your Info</legend>
          <div className="space-y-2">
            <div>
              <label className="block text-sm mb-1">Name *</label>
              <input
                type="text"
                className="border border-gray-300 px-3 py-2 text-sm w-full"
                value={store.sellerName}
                onChange={(e) => store.set({ sellerName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Phone</label>
              <input
                type="text"
                className="border border-gray-300 px-3 py-2 text-sm w-full"
                value={store.sellerPhone}
                onChange={(e) => store.set({ sellerPhone: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Business name (optional)</label>
              <input
                type="text"
                className="border border-gray-300 px-3 py-2 text-sm w-full"
                value={store.sellerBusinessName}
                onChange={(e) => store.set({ sellerBusinessName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">City</label>
              <input
                type="text"
                className="border border-gray-300 px-3 py-2 text-sm w-full"
                value={store.sellerCity}
                onChange={(e) => store.set({ sellerCity: e.target.value })}
              />
            </div>
          </div>
        </fieldset>
      )}

      {store.sellerId && (
        <p className="text-sm text-gray-600">
          Listing as: <strong>{store.sellerName}</strong>{" "}
          <button
            type="button"
            className="text-blue-600 hover:underline text-sm"
            onClick={() => store.set({ sellerId: null })}
          >
            edit
          </button>
        </p>
      )}

      {/* Part details */}
      <fieldset className="border border-gray-300 p-4">
        <legend className="text-sm font-medium px-1">Part Details</legend>
        <div className="space-y-2">
          <div>
            <label className="block text-sm mb-1">Title *</label>
            <input
              type="text"
              className="border border-gray-300 px-3 py-2 text-sm w-full"
              value={store.title}
              onChange={(e) => store.set({ title: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Description</label>
            <textarea
              className="border border-gray-300 px-3 py-2 text-sm w-full"
              rows={3}
              value={store.description}
              onChange={(e) => store.set({ description: e.target.value })}
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm mb-1">Price (ALL)</label>
              <input
                type="number"
                className="border border-gray-300 px-3 py-2 text-sm w-full"
                value={store.price}
                onChange={(e) => store.set({ price: e.target.value })}
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm mb-1">Condition *</label>
              <select
                className="border border-gray-300 px-3 py-2 text-sm w-full"
                value={store.condition}
                onChange={(e) => store.set({ condition: e.target.value })}
              >
                <option value="used">Used</option>
                <option value="refurbished">Refurbished</option>
                <option value="new_old_stock">New Old Stock</option>
              </select>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm mb-1">Category</label>
              <select
                className="border border-gray-300 px-3 py-2 text-sm w-full"
                value={store.categoryId ?? ""}
                onChange={(e) => store.set({ categoryId: e.target.value ? Number(e.target.value) : null })}
              >
                <option value="">Select category</option>
                {topCategories.map((c) => (
                  <optgroup key={c.id} label={c.name}>
                    {subCategories
                      .filter((s) => s.parent_id === c.id)
                      .map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm mb-1">OEM Number</label>
              <input
                type="text"
                className="border border-gray-300 px-3 py-2 text-sm w-full"
                value={store.oemNumber}
                onChange={(e) => store.set({ oemNumber: e.target.value })}
              />
            </div>
          </div>
        </div>
      </fieldset>

      {/* Compatibility */}
      <fieldset className="border border-gray-300 p-4">
        <legend className="text-sm font-medium px-1">Fits Which Car?</legend>
        <div className="flex gap-2 items-end flex-wrap">
          <select
            className="border border-gray-300 px-3 py-2 text-sm"
            value={store.currentMakeId ?? ""}
            onChange={(e) =>
              store.set({
                currentMakeId: e.target.value ? Number(e.target.value) : null,
                currentModelId: null,
                currentYearId: null,
                models: [],
                years: [],
              })
            }
          >
            <option value="">Make</option>
            {store.makes.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          <select
            className="border border-gray-300 px-3 py-2 text-sm"
            value={store.currentModelId ?? ""}
            onChange={(e) =>
              store.set({
                currentModelId: e.target.value ? Number(e.target.value) : null,
                currentYearId: null,
                years: [],
              })
            }
            disabled={!store.currentMakeId}
          >
            <option value="">Model</option>
            {store.models.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          <select
            className="border border-gray-300 px-3 py-2 text-sm"
            value={store.currentYearId ?? ""}
            onChange={(e) => store.set({ currentYearId: e.target.value ? Number(e.target.value) : null })}
            disabled={!store.currentModelId}
          >
            <option value="">Year</option>
            {store.years.map((y) => (
              <option key={y.id} value={y.id}>
                {y.year_start}–{y.year_end}{y.generation ? ` (${y.generation})` : ""}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleAddCompat}
            disabled={!store.currentYearId}
            className="bg-blue-600 text-white px-3 py-2 text-sm hover:bg-blue-700 disabled:bg-gray-300"
          >
            + Add
          </button>
        </div>
        {store.compatEntries.length > 0 && (
          <div className="mt-2 space-y-1">
            {store.compatEntries.map((e) => (
              <div key={e.modelYearId} className="flex items-center gap-2 text-sm">
                <button
                  type="button"
                  onClick={() => store.removeCompat(e.modelYearId)}
                  className="text-red-600 hover:underline"
                >
                  x
                </button>
                {e.label}
              </div>
            ))}
          </div>
        )}
      </fieldset>

      {/* Location */}
      <fieldset className="border border-gray-300 p-4">
        <legend className="text-sm font-medium px-1">Location</legend>
        <div className="space-y-2">
          <button
            type="button"
            className="text-blue-600 hover:underline text-sm"
            onClick={() => {
              navigator.geolocation.getCurrentPosition(
                (pos) =>
                  store.set({
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                  }),
                () => store.set({ error: "Could not get location" }),
              );
            }}
          >
            Use My Location
          </button>
          {store.latitude && store.longitude && (
            <p className="text-sm text-gray-600">
              Location set: {store.latitude.toFixed(4)}, {store.longitude.toFixed(4)}
            </p>
          )}
          <div>
            <label className="block text-sm mb-1">Address</label>
            <input
              type="text"
              className="border border-gray-300 px-3 py-2 text-sm w-full"
              value={store.locationText}
              onChange={(e) => store.set({ locationText: e.target.value })}
            />
          </div>
        </div>
      </fieldset>
    </div>
  );
}
