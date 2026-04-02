import { useEffect } from "react";
import { useUploadStore } from "../../stores/uploadStore";
import { getMakes, getModels, getYears } from "../../api/vehicles";
import { getCategories } from "../../api/parts";
import Dropdown from "../ui/Dropdown";
import FormSection from "../ui/FormSection";
import FormField from "../ui/FormField";
import TextInput from "../ui/TextInput";

const inputCls =
  "border border-gray-200 bg-white px-3 py-2 text-sm w-full focus:outline-none focus:border-gray-400 transition-colors";

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

  const topCategories = store.categories.filter((c) => c.parent_id === null);
  const subCategories = store.categories.filter((c) => c.parent_id !== null);

  return (
    <div className="space-y-4">
      {/* Seller info */}
      {!store.sellerId && (
        <FormSection title="Your Info">
          <TextInput
            label="Name"
            required
            value={store.sellerName}
            onChange={(v) => store.set({ sellerName: v })}
          />
          <TextInput
            label="Phone"
            value={store.sellerPhone}
            onChange={(v) => store.set({ sellerPhone: v })}
          />
          <TextInput
            label="Business Name"
            optional
            value={store.sellerBusinessName}
            onChange={(v) => store.set({ sellerBusinessName: v })}
          />
          <TextInput
            label="City"
            value={store.sellerCity}
            onChange={(v) => store.set({ sellerCity: v })}
          />
        </FormSection>
      )}

      {store.sellerId && (
        <div className="flex items-center gap-2 text-sm text-gray-600 bg-white border border-gray-200 px-5 py-3">
          <span>
            Listing as <strong className="text-gray-900">{store.sellerName}</strong>
          </span>
          <button
            type="button"
            className="ml-auto text-xs font-semibold uppercase tracking-wide text-red-600 hover:text-red-500 transition-colors"
            onClick={() => store.set({ sellerId: null })}
          >
            Edit
          </button>
        </div>
      )}

      {/* Part details */}
      <FormSection title="Part Details">
        <TextInput
          label="Title"
          required
          value={store.title}
          onChange={(v) => store.set({ title: v })}
        />
        <FormField label="Description">
          <textarea
            className={inputCls}
            rows={3}
            value={store.description}
            onChange={(e) => store.set({ description: e.target.value })}
          />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <TextInput
            label="Price (ALL)"
            type="number"
            value={store.price}
            onChange={(v) => store.set({ price: v })}
          />
          <FormField label="Condition" required>
            <Dropdown
              size="md"
              className="border border-gray-200"
              placeholder="Condition"
              value={store.condition}
              options={[
                { value: "used", label: "Used" },
                { value: "refurbished", label: "Refurbished" },
                { value: "new_old_stock", label: "New Old Stock" },
              ]}
              onChange={(v) => store.set({ condition: v as string })}
            />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Category">
            <Dropdown
              size="md"
              className="border border-gray-200"
              placeholder="Select category"
              value={store.categoryId}
              options={topCategories.flatMap((c) =>
                subCategories
                  .filter((s) => s.parent_id === c.id)
                  .map((s) => ({ value: s.id, label: s.name, sub: c.name }))
              )}
              onChange={(v) => store.set({ categoryId: v !== null ? Number(v) : null })}
            />
          </FormField>
          <TextInput
            label="OEM Number"
            value={store.oemNumber}
            onChange={(v) => store.set({ oemNumber: v })}
          />
        </div>
      </FormSection>

      {/* Compatibility */}
      <section className="border border-gray-200 bg-white">
        <div className="px-5 py-3 border-b border-gray-100">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-700">
            Fits Which Car?
          </h2>
        </div>
        <div className="px-5 py-4">
          <div className="flex gap-2 items-end">
            <Dropdown
              size="md"
              className="border border-gray-200 flex-1"
              placeholder="Make"
              value={store.currentMakeId}
              options={store.makes.map((m) => ({ value: m.id, label: m.name }))}
              onChange={(v) =>
                store.set({
                  currentMakeId: v !== null ? Number(v) : null,
                  currentModelId: null,
                  currentYearId: null,
                  models: [],
                  years: [],
                })
              }
            />
            <Dropdown
              size="md"
              className="border border-gray-200 flex-1"
              placeholder="Model"
              value={store.currentModelId}
              options={store.models.map((m) => ({ value: m.id, label: m.name }))}
              onChange={(v) =>
                store.set({
                  currentModelId: v !== null ? Number(v) : null,
                  currentYearId: null,
                  years: [],
                })
              }
              disabled={!store.currentMakeId}
            />
            <Dropdown
              size="md"
              className="border border-gray-200 flex-1"
              placeholder="Year"
              value={store.currentYearId}
              options={store.years.map((y) => ({
                value: y.id,
                label: `${y.year_start}–${y.year_end}`,
                sub: y.generation ?? undefined,
              }))}
              onChange={(v) => store.set({ currentYearId: v !== null ? Number(v) : null })}
              disabled={!store.currentModelId}
            />
            <button
              type="button"
              onClick={handleAddCompat}
              disabled={!store.currentYearId}
              className="bg-zinc-900 text-white px-4 py-2 text-sm font-semibold hover:bg-zinc-700 transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              + Add
            </button>
          </div>
          {store.compatEntries.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {store.compatEntries.map((e) => (
                <div
                  key={e.modelYearId}
                  className="flex items-center gap-2 text-sm bg-gray-50 border border-gray-200 px-3 py-2"
                >
                  <svg
                    className="w-3.5 h-3.5 text-gray-400 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
                    />
                  </svg>
                  <span className="text-gray-700 flex-1">{e.label}</span>
                  <button
                    type="button"
                    onClick={() => store.removeCompat(e.modelYearId)}
                    className="text-xs text-red-600 hover:text-red-500 font-semibold transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Location */}
      <FormSection title="Location">
        <button
          type="button"
          className="flex items-center gap-1.5 text-sm font-semibold text-red-600 hover:text-red-500 transition-colors"
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
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 10.5c0 7.142-7.5 11.25-9.5 11.25S.5 17.642.5 10.5a9 9 0 1119 0z"
            />
          </svg>
          Use My Location
        </button>
        {store.latitude && store.longitude && (
          <p className="text-xs text-gray-500 font-mono bg-gray-50 border border-gray-200 px-3 py-2">
            {store.latitude.toFixed(4)}, {store.longitude.toFixed(4)}
          </p>
        )}
        <TextInput
          label="Address"
          value={store.locationText}
          onChange={(v) => store.set({ locationText: v })}
        />
      </FormSection>
    </div>
  );
}
