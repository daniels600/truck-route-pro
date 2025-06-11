import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TripData, RouteData, BackendTripResponse } from '@/App';

interface TripStore {
  tripData: TripData | null;
  routeData: RouteData | null;
  hosData: BackendTripResponse | null;
  isLoading: boolean;
  activeTab: string;
  setTripData: (data: TripData | null) => void;
  setRouteData: (data: RouteData | null) => void;
  setHosData: (data: BackendTripResponse | null) => void;
  setIsLoading: (loading: boolean) => void;
  setActiveTab: (tab: string) => void;
  resetStore: () => void;
}

export const useTripStore = create<TripStore>()(
  persist(
    (set) => ({
      tripData: null,
      routeData: null,
      hosData: null,
      isLoading: false,
      activeTab: 'input',
      setTripData: (data) => set({ tripData: data }),
      setRouteData: (data) => set({ routeData: data }),
      setHosData: (data) => set({ hosData: data }),
      setIsLoading: (loading) => set({ isLoading: loading }),
      setActiveTab: (tab) => set({ activeTab: tab }),
      resetStore: () => set({
        tripData: null,
        routeData: null,
        hosData: null,
        isLoading: false,
        activeTab: 'input'
      })
    }),
    {
      name: 'trip-storage',
      partialize: (state) => ({
        tripData: state.tripData,
        routeData: state.routeData,
        hosData: state.hosData,
        activeTab: state.activeTab
      })
    }
  )
); 