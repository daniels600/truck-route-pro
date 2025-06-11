import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MapPin, Clock, Navigation } from "lucide-react";
import type { TripData } from "@/App";


const tripFormSchema = z.object({
  currentLocation: z
    .string()
    .min(1, "Current location is required")
    .min(2, "Location must be at least 2 characters"),
  pickupLocation: z
    .string()
    .min(1, "Pickup location is required")
    .min(2, "Location must be at least 2 characters"),
  dropoffLocation: z
    .string()
    .min(1, "Dropoff location is required")
    .min(2, "Location must be at least 2 characters"),
  currentCycleUsed: z
    .number()
    .min(0, "Hours cannot be negative")
    .max(70, "Cannot exceed 70 hours in the cycle")
    .refine((val) => val % 0.5 === 0, "Hours must be in 0.5 hour increments"),
});

type TripFormValues = z.infer<typeof tripFormSchema>;

interface MapboxSuggestion {
  place_name: string;
  center: [number, number];
}

interface MapboxLocationInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}

const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;

// Mapbox Location Autocomplete Component
function MapboxLocationInput({
  value,
  onChange,
  placeholder,
  className,
}: MapboxLocationInputProps) {
  const [suggestions, setSuggestions] = useState<MapboxSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const searchLocations = async (query: string) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          query
        )}.json?access_token=${mapboxToken}&types=place,address&limit=5`
      );

      const data = await response.json();
      setSuggestions(data.features || []);
      setShowSuggestions(true);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (inputValue: string) => {
    onChange(inputValue);
    searchLocations(inputValue);
  };

  const handleSuggestionSelect = (suggestion: MapboxSuggestion) => {
    onChange(suggestion.place_name);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <div className="relative">
      <Input
        value={value}
        onChange={(e) => handleInputChange(e.target.value)}
        placeholder={placeholder}
        className={className}
        onBlur={() => {
          setTimeout(() => setShowSuggestions(false), 200);
        }}
        onFocus={() => {
          if (suggestions.length > 0) {
            setShowSuggestions(true);
          }
        }}
      />

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
              onClick={() => handleSuggestionSelect(suggestion)}
            >
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm">{suggestion.place_name}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {isLoading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
}

interface TripInputFormProps {
  onSubmit: (data: TripData) => void;
  isLoading?: boolean;
}

export function TripInputForm({
  onSubmit,
  isLoading = false,
}: TripInputFormProps) {
  const form = useForm<TripFormValues>({
    resolver: zodResolver(tripFormSchema),
    defaultValues: {
      currentLocation: "",
      pickupLocation: "",
      dropoffLocation: "",
      currentCycleUsed: 0,
    },
  });

  const handleSubmit = (values: TripFormValues) => {
    onSubmit(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-blue-500 rounded-xl">
                  <Navigation className="h-6 w-6 text-white" />
                </div>
                Current Location
              </CardTitle>
              <CardDescription className="text-base">
                Where are you starting from?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="currentLocation"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <MapboxLocationInput
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="e.g., Cincinnati, OH"
                        className="text-lg h-12 border-2 border-blue-200 focus:border-blue-500 rounded-xl bg-white/80 backdrop-blur-sm"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-green-500 rounded-xl">
                  <MapPin className="h-6 w-6 text-white" />
                </div>
                Pickup Location
              </CardTitle>
              <CardDescription className="text-base">
                Where will you pick up the load?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="pickupLocation"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <MapboxLocationInput
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="e.g., Detroit, MI"
                        className="text-lg h-12 border-2 border-green-200 focus:border-green-500 rounded-xl bg-white/80 backdrop-blur-sm"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-red-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-red-500 rounded-xl">
                  <MapPin className="h-6 w-6 text-white" />
                </div>
                Dropoff Location
              </CardTitle>
              <CardDescription className="text-base">
                Where will you deliver the load?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="dropoffLocation"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <MapboxLocationInput
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="e.g., Chicago, IL"
                        className="text-lg h-12 border-2 border-red-200 focus:border-red-500 rounded-xl bg-white/80 backdrop-blur-sm"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-orange-500 rounded-xl">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                Current Cycle Used
              </CardTitle>
              <CardDescription className="text-base">
                Hours already used in current 70-hour cycle
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="currentCycleUsed"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.5"
                        min="0"
                        max="70"
                        placeholder="0"
                        value={field.value === 0 ? "" : field.value}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === "" || /^\d*\.?\d*$/.test(value)) {
                            const numValue =
                              value === "" ? 0 : parseFloat(value);
                            if (!isNaN(numValue) && numValue <= 70) {
                              field.onChange(numValue);
                            }
                          }
                        }}
                        className="text-lg h-12 border-2 border-orange-200 focus:border-orange-500 rounded-xl bg-white/80 backdrop-blur-sm"
                      />
                    </FormControl>{" "}
                    <FormDescription className="text-sm text-gray-600">
                      Maximum: 70 hours in 8 days (in 0.5 hour increments)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />{" "}
            </CardContent>{" "}
          </Card>
        </div>

        <div className="flex justify-center pt-6">
          <Button
            type="submit"
            size="lg"
            className="px-12 py-4 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Calculating Route...
              </div>
            ) : (
              "Calculate Route & Generate Logs"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
