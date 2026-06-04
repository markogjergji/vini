import { create } from "zustand";
import type { Make, VehicleModel, ModelYear, PartCategory } from "../types";

interface CompatEntry {
  makeId: number;
  modelId: number;
  modelYearId: number;
  selectedYear: number | null;
  label: string;
}

interface UploadState {
  // Seller
  sellerName: string;
  sellerPhone: string;
  sellerBusinessName: string;
  sellerCity: string;
  sellerAddress: string;
  sellerLatitude: number | null;
  sellerLongitude: number | null;
  sellerId: number | null;

  // Part
  title: string;
  description: string;
  price: string;
  condition: string;
  categoryId: number | null;
  oemNumber: string;
  locationText: string;
  latitude: number | null;
  longitude: number | null;

  // Compatibility
  compatEntries: CompatEntry[];
  currentYear: number | null;
  currentMakeId: number | null;
  currentModelId: number | null;
  currentYearId: number | null;
  availableYears: number[];
  makes: Make[];
  models: VehicleModel[];
  years: ModelYear[];

  // Categories
  categories: PartCategory[];

  // Images
  imageFiles: File[];

  // State
  submitting: boolean;
  error: string | null;

  // Actions
  set: (partial: Partial<UploadState>) => void;
  addCompat: (entry: CompatEntry) => void;
  removeCompat: (modelYearId: number) => void;
  addImage: (file: File) => void;
  removeImage: (index: number) => void;
  reset: () => void;
}

const initialState = {
  sellerName: "",
  sellerPhone: "",
  sellerBusinessName: "",
  sellerCity: "",
  sellerAddress: "",
  sellerLatitude: null as number | null,
  sellerLongitude: null as number | null,
  sellerId: null as number | null,
  title: "",
  description: "",
  price: "",
  condition: "used",
  categoryId: null as number | null,
  oemNumber: "",
  locationText: "",
  latitude: null as number | null,
  longitude: null as number | null,
  compatEntries: [] as CompatEntry[],
  currentYear: null as number | null,
  currentMakeId: null as number | null,
  currentModelId: null as number | null,
  currentYearId: null as number | null,
  availableYears: [] as number[],
  makes: [] as Make[],
  models: [] as VehicleModel[],
  years: [] as ModelYear[],
  categories: [] as PartCategory[],
  imageFiles: [] as File[],
  submitting: false,
  error: null as string | null,
};

export const useUploadStore = create<UploadState>((set) => ({
  ...initialState,
  set: (partial) => set(partial),
  addCompat: (entry) =>
    set((s) => ({
      compatEntries: s.compatEntries.some((e) => e.modelYearId === entry.modelYearId)
        ? s.compatEntries
        : [...s.compatEntries, entry],
      currentYear: null,
      currentMakeId: null,
      currentModelId: null,
      currentYearId: null,
      makes: [],
      models: [],
      years: [],
    })),
  removeCompat: (modelYearId) =>
    set((s) => ({
      compatEntries: s.compatEntries.filter((e) => e.modelYearId !== modelYearId),
    })),
  addImage: (file) =>
    set((s) => ({
      imageFiles: s.imageFiles.length < 5 ? [...s.imageFiles, file] : s.imageFiles,
    })),
  removeImage: (index) =>
    set((s) => ({
      imageFiles: s.imageFiles.filter((_, i) => i !== index),
    })),
  reset: () => set(initialState),
}));
