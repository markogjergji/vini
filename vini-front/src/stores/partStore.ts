import { create } from "zustand";
import type { PartDetail } from "../types";

interface PartState {
  part: PartDetail | null;
  loading: boolean;
  error: string | null;
  setPart: (part: PartDetail | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const usePartStore = create<PartState>((set) => ({
  part: null,
  loading: false,
  error: null,
  setPart: (part) => set({ part }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
