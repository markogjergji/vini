import { create } from "zustand";
import type { Make, VehicleModel, ModelYear, PartListItem } from "../types";

interface SearchState {
  makes: Make[];
  models: VehicleModel[];
  years: ModelYear[];
  selectedMakeId: number | null;
  selectedModelId: number | null;
  selectedYearId: number | null;
  results: PartListItem[];
  total: number;
  page: number;
  limit: number;
  loading: boolean;
  error: string | null;
  setMakes: (makes: Make[]) => void;
  setModels: (models: VehicleModel[]) => void;
  setYears: (years: ModelYear[]) => void;
  setSelectedMakeId: (id: number | null) => void;
  setSelectedModelId: (id: number | null) => void;
  setSelectedYearId: (id: number | null) => void;
  setResults: (items: PartListItem[], total: number) => void;
  setPage: (page: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  makes: [],
  models: [],
  years: [],
  selectedMakeId: null,
  selectedModelId: null,
  selectedYearId: null,
  results: [],
  total: 0,
  page: 1,
  limit: 20,
  loading: false,
  error: null,
  setMakes: (makes) => set({ makes }),
  setModels: (models) => set({ models }),
  setYears: (years) => set({ years }),
  setSelectedMakeId: (id) => set({ selectedMakeId: id, selectedModelId: null, selectedYearId: null, models: [], years: [] }),
  setSelectedModelId: (id) => set({ selectedModelId: id, selectedYearId: null, years: [] }),
  setSelectedYearId: (id) => set({ selectedYearId: id }),
  setResults: (items, total) => set({ results: items, total }),
  setPage: (page) => set({ page }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
