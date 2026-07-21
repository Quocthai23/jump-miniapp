import { create } from "zustand";

interface UserState {
  isEnableTrading: boolean;

  setEnableTrading: (isEnabled: boolean) => void;
}

const useUserStore = create<UserState>()((set) => ({
  isEnableTrading: false,
  setEnableTrading: (isEnabled: boolean) => set({ isEnableTrading: isEnabled }),
}));

export default useUserStore;
