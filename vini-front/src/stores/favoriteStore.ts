import { create } from "zustand";
import { getFavoriteIds, addFavorite, removeFavorite } from "../api/favorites";

interface FavoriteState {
  ids: Set<number>;
  loaded: boolean;
  loadIds: () => Promise<void>;
  toggle: (partId: number) => Promise<void>;
  isFavorite: (partId: number) => boolean;
  clear: () => void;
}

export const useFavoriteStore = create<FavoriteState>((set, get) => ({
  ids: new Set<number>(),
  loaded: false,

  loadIds: async () => {
    try {
      const ids = await getFavoriteIds();
      set({ ids: new Set(ids), loaded: true });
    } catch {
      // Not logged in or request failed — leave favorites empty.
      set({ ids: new Set<number>(), loaded: true });
    }
  },

  toggle: async (partId) => {
    const { ids } = get();
    const isFav = ids.has(partId);

    // Optimistic update; roll back if the request fails.
    const next = new Set(ids);
    if (isFav) next.delete(partId);
    else next.add(partId);
    set({ ids: next });

    try {
      if (isFav) await removeFavorite(partId);
      else await addFavorite(partId);
    } catch {
      const rollback = new Set(get().ids);
      if (isFav) rollback.add(partId);
      else rollback.delete(partId);
      set({ ids: rollback });
    }
  },

  isFavorite: (partId) => get().ids.has(partId),

  clear: () => set({ ids: new Set<number>(), loaded: false }),
}));
