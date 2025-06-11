import { useEffect } from "react";
import { toast } from "sonner";
import { useTripStore } from "@/store/tripStore";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Truck, MapPin, FileText, Route, Sparkles, CheckCircle, Lock } from "lucide-react";
import { TripInputForm } from "./components/sections/trip-input-form";
import { RouteMap } from "./components/sections/route-map";
import { RouteInstructions } from "./components/sections/route-instructions";
import { ELDLogSheets } from "./components/sections/eld-log-sheets";

export interface TripData {
  currentLocation: string;
  pickupLocation: string;
  dropoffLocation: string;
  currentCycleUsed: number;
}

export interface RouteData {
  distance: number;
  duration: number;
  instructions: string[];
  coordinates: [number, number][];
  fuelStops: Array<{
    location: string;
    coordinates: [number, number];
    distance: number;
  }>;
  restStops: Array<{
    location: string;
    coordinates: [number, number];
    time: string;
    duration: number;
    reason: string;
  }>;
}

export interface BackendRoute {
  total_distance_miles: number;
  total_drive_time_hours: number;
  total_duty_time_hours: number;
  coordinates: [number, number][];
}

export interface Stop {
  type: "fuel" | "rest";
  sequence: number;
  duration_minutes: number;
  description: string;
}

export interface HOSAnalysis {
  driving_available: number;
  duty_available: number;
  cycle_remaining: number;
  needs_reset: boolean;
}

export interface TimelineEntry {
  day: number;
  start_time: number;
  duration_hours: number;
  duty_status: string;
  activity: string;
  location: string;
}

export interface BackendTripResponse {
  trip_id: number;
  route: BackendRoute;
  hos_analysis: HOSAnalysis;
  stops: Stop[];
  compliance_status: string;
  violations: string[];
  timeline: TimelineEntry[];
}

export default function App() {
  const {
    tripData,
    routeData,
    hosData,
    isLoading,
    activeTab,
    setTripData,
    setRouteData,
    setHosData,
    setIsLoading,
    setActiveTab,
  } = useTripStore();

 
  useEffect(() => {
    if (!tripData) {
      toast.info("Enter trip details to access route planning and ELD logs", {
        duration: 5000,
      });
    }
  }, [tripData]);

 
  const getTabStatus = (tabValue: string) => {
    switch (tabValue) {
      case "input":
        return { available: true, completed: !!tripData };
      case "route":
        return { available: !!tripData, completed: !!routeData };
      case "instructions":
        return { available: !!routeData, completed: !!routeData };
      case "logs":
        return { available: !!routeData && !!hosData, completed: !!hosData };
      default:
        return { available: false, completed: false };
    }
  };

  const handleTabChange = (value: string) => {
    const tabStatus = getTabStatus(value);
    
    if (!tabStatus.available) {
      if (!tripData) {
        toast.error("Trip details required", {
          description: "Please fill out the trip form first to access this section.",
          duration: 4000,
        });
      } else if (!routeData) {
        toast.error("Route data required", {
          description: "Please generate a route first by submitting trip details.",
          duration: 4000,
        });
      } else if (!hosData) {
        toast.error("ELD data required", {
          description: "Please wait for the route calculation to complete.",
          duration: 4000,
        });
      }
      return;
    }
    setActiveTab(value);
  };

  const handleTripSubmit = async (data: TripData) => {
    setIsLoading(true);
    setTripData(data);

    try {
      const response = await fetch("https://spotter-production.up.railway.app/api/trips", {
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        method: "POST",
        body: JSON.stringify({
          current_location: data.currentLocation,
          pickup_location: data.pickupLocation,
          dropoff_location: data.dropoffLocation,
          current_cycle_hours_used: data.currentCycleUsed,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch route data: ${response.status} ${errorText}`);
      }

      const backendData: BackendTripResponse = await response.json();
      setHosData(backendData);

      setRouteData({
        distance: backendData.route.total_distance_miles,
        duration: backendData.route.total_drive_time_hours,
        instructions: [],
        coordinates: backendData.route.coordinates,
        fuelStops: backendData.stops
          .filter((s) => s.type === "fuel")
          .map((s) => ({
            location: s.description,
            coordinates: [0, 0],
            distance: 0,
          })),
        restStops: backendData.stops
          .filter((s) => s.type === "rest")
          .map((s) => ({
            location: s.description,
            coordinates: [0, 0],
            time: "",
            duration: s.duration_minutes,
            reason: s.description,
          })),
      });

      toast.success("Route calculated successfully!", {
        description: `${backendData.route.total_distance_miles.toFixed(1)} miles, ${backendData.route.total_drive_time_hours.toFixed(1)} hours`,
        duration: 5000,
      });

      setActiveTab("route");
    } catch (error) {
      console.error("Error fetching route data:", error);
      toast.error("Failed to calculate route", {
        description: error instanceof Error ? error.message : "Please try again",
        duration: 6000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const TabTriggerWithStatus = ({ 
    value, 
    icon: Icon, 
    label, 
    className = "" 
  }: { 
    value: string; 
    icon: React.ElementType; 
    label: string; 
    className?: string; 
  }) => {
    const { available, completed } = getTabStatus(value);
    
    return (
      <TabsTrigger
        value={value}
        disabled={!available}
        className={`
          flex items-center justify-center gap-2 rounded-xl py-3 px-4 min-h-[50px]
          transition-all duration-300 relative group
          data-[state=active]:bg-gradient-to-r data-[state=active]:text-white
          data-[state=active]:shadow-lg data-[state=active]:scale-105
          disabled:opacity-50 disabled:cursor-not-allowed
          hover:bg-gray-50 hover:scale-102
          ${className}
        `}
      >
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 flex-shrink-0" />
          <span className="font-medium truncate">{label}</span>
          {completed && available && (
            <CheckCircle className="h-3 w-3 text-green-500 data-[state=active]:text-green-200 flex-shrink-0" />
          )}
          {!available && (
            <Lock className="h-3 w-3 text-gray-400 flex-shrink-0" />
          )}
        </div>
        
        {/* Progress indicator */}
        {available && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${
                completed 
                  ? 'w-full bg-green-500' 
                  : value === "input" && tripData 
                    ? 'w-3/4 bg-blue-500' 
                    : 'w-0'
              }`} 
            />
          </div>
        )}
      </TabsTrigger>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-green-400/20 to-blue-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10 max-w-7xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="relative">
              <Truck className="h-12 w-12 text-blue-600 drop-shadow-lg" />
              <Sparkles className="h-4 w-4 text-yellow-500 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
              TruckRoute Pro
            </h1>
          </div>
          <p className="text-xl text-gray-600 font-medium">
            Professional Trip Planning & ELD Compliance
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto mt-4 rounded-full"></div>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <div className="w-full mb-8">
            <TabsList className="
              w-full h-auto bg-white/80 backdrop-blur-sm shadow-lg border-0 
              p-2 rounded-2xl grid grid-cols-2 md:grid-cols-4 gap-2
              max-w-4xl mx-auto
            ">
              <TabTriggerWithStatus
                value="input"
                icon={MapPin}
                label="Trip Details"
                className="data-[state=active]:from-blue-500 data-[state=active]:to-purple-600"
              />
              <TabTriggerWithStatus
                value="route"
                icon={Route}
                label="Route & Map"
                className="data-[state=active]:from-green-500 data-[state=active]:to-blue-600"
              />
              <TabTriggerWithStatus
                value="instructions"
                icon={FileText}
                label="Instructions"
                className="data-[state=active]:from-orange-500 data-[state=active]:to-red-600"
              />
              <TabTriggerWithStatus
                value="logs"
                icon={FileText}
                label="ELD Logs"
                className="data-[state=active]:from-purple-500 data-[state=active]:to-pink-600"
              />
            </TabsList>
          </div>

          <div className="w-full">
            <TabsContent
              value="input"
              className="animate-in fade-in-50 duration-500 mt-0"
            >
              <Card className="bg-white/80 backdrop-blur-sm shadow-2xl border-0 rounded-3xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b border-gray-100 h-full rounded-t-3xl">
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <MapPin className="h-6 w-6" />
                    Enter Trip Details
                  </CardTitle>
                  <CardDescription className="text-lg">
                    Provide your current location, pickup/dropoff points, and
                    current cycle hours
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-8">
                  <TripInputForm
                    onSubmit={handleTripSubmit}
                    isLoading={isLoading}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent
              value="route"
              className="animate-in fade-in-50 duration-500 mt-0"
            >
              {routeData && (
                <div className="space-y-6">
                  <RouteMap routeData={routeData} />
                </div>
              )}
            </TabsContent>

            <TabsContent
              value="instructions"
              className="animate-in fade-in-50 duration-500 mt-0"
            >
              {routeData && <RouteInstructions routeData={routeData} />}
            </TabsContent>

            <TabsContent
              value="logs"
              className="animate-in fade-in-50 duration-500 mt-0"
            >
              {tripData && routeData && hosData && (
                <ELDLogSheets tripData={tripData} routeData={routeData} hosData={hosData} />
              )}
            </TabsContent>
          </div>
        </Tabs>

        {/* Loading overlay */}
        {isLoading && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
            <Card className="bg-white p-8 rounded-2xl shadow-2xl">
              <div className="flex items-center gap-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <div>
                  <h3 className="font-semibold text-lg">Calculating Route</h3>
                  <p className="text-gray-600">Please wait while we optimize your trip...</p>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}