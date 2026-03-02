import { create } from 'zustand';

const useStore = create((set) => ({
  farmProfile: null,
  setFarmProfile: (profile) => set({ farmProfile: profile }),
  isFirstLaunch: true,
  setIsFirstLaunch: (val) => set({ isFirstLaunch: val }),
}));

export default useStore;
