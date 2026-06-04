import { create } from "zustand";
import type { Make, VehicleModel, ModelYear, PartListItem } from "../types";

interface SearchState {
  availableYears: number[];
  makes: Make[];
  models: VehicleModel[];
  trims: ModelYear[];
  selectedYear: number | null;
  selectedMakeId: number | null;
  selectedModelId: number | null;
  selectedTrimId: number | null;
  results: PartListItem[];
  total: number;
  page: number;
  limit: number;
  loading: boolean;
  error: string | null;
  setAvailableYears: (years: number[]) => void;
  setMakes: (makes: Make[]) => void;
  setModels: (models: VehicleModel[]) => void;
  setTrims: (trims: ModelYear[]) => void;
  setSelectedYear: (year: number | null) => void;
  setSelectedMakeId: (id: number | null) => void;
  setSelectedModelId: (id: number | null) => void;
  setSelectedTrimId: (id: number | null) => void;
  syncSelection: (year: number | null, makeId: number | null, modelId: number | null, trimId: number | null) => void;
  setResults: (items: PartListItem[], total: number) => void;
  setPage: (page: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  availableYears: [],
  makes: [],
  models: [],
  trims: [],
  selectedYear: null,
  selectedMakeId: null,
  selectedModelId: null,
  selectedTrimId: null,
  results: [],
  total: 0,
  page: 1,
  limit: 20,
  loading: false,
  error: null,
  setAvailableYears: (availableYears) => set({ availableYears }),
  setMakes: (makes) => set({ makes }),
  setModels: (models) => set({ models }),
  setTrims: (trims) => set({ trims }),
  setSelectedYear: (year) => set({ selectedYear: year, selectedMakeId: null, selectedModelId: null, selectedTrimId: null, makes: [], models: [], trims: [] }),
  setSelectedMakeId: (id) => set({ selectedMakeId: id, selectedModelId: null, selectedTrimId: null, models: [], trims: [] }),
  setSelectedModelId: (id) => set({ selectedModelId: id, selectedTrimId: null, trims: [] }),
  setSelectedTrimId: (id) => set({ selectedTrimId: id }),
  syncSelection: (year, makeId, modelId, trimId) => set({ selectedYear: year, selectedMakeId: makeId, selectedModelId: modelId, selectedTrimId: trimId }),
  setResults: (items, total) => set({ results: items, total }),
  setPage: (page) => set({ page }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
