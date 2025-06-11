import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Layers, Satellite, Navigation, Zap } from "lucide-react";

interface MapControlsProps {
  onStyleChange: (style: string) => void;
  currentStyle: string;
}

export function MapControls({ onStyleChange, currentStyle }: MapControlsProps) {
  const mapStyles = [
    {
      id: "mapbox://styles/mapbox/navigation-day-v1",
      name: "Navigation",
      icon: Navigation,
      description: "Optimized for driving",
    },
    {
      id: "mapbox://styles/mapbox/satellite-streets-v12",
      name: "Satellite",
      icon: Satellite,
      description: "Aerial imagery",
    },
    {
      id: "mapbox://styles/mapbox/streets-v12",
      name: "Streets",
      icon: MapPin,
      description: "Standard street map",
    },
    {
      id: "mapbox://styles/mapbox/dark-v11",
      name: "Dark",
      icon: Layers,
      description: "Night mode",
    },
  ];

  return (
    <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-5 w-5 text-blue-600" />
          <span className="font-semibold text-gray-800">Map Styles</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {mapStyles.map((style) => {
            const Icon = style.icon;
            const isActive = currentStyle === style.id;
            return (
              <Button
                key={style.id}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => onStyleChange(style.id)}
                className={`flex flex-col items-center gap-1 h-auto py-3 ${
                  isActive
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                    : "hover:bg-gray-50"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-xs font-medium">{style.name}</span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
