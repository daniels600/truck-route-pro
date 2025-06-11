import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Info } from "lucide-react";
import type { RouteData } from "@/App";


interface RouteInstructionsProps {
  routeData: RouteData;
}

export function RouteInstructions({ routeData }: RouteInstructionsProps) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm rounded-3xl overflow-hidden hover:shadow-2xl transition-all duration-300">
          <CardHeader className="bg-gradient-to-r from-yellow-50 to-red-50 border-b border-yellow-100">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-yellow-500 rounded-xl">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
              HOS Compliance Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 border-l-4 border-yellow-400 rounded-2xl shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <span className="font-semibold text-yellow-800">
                    30-Minute Break Required
                  </span>
                </div>
                <p className="text-sm text-yellow-700">
                  Must take 30-minute break after 8 hours of driving
                </p>
              </div>

              <div className="p-4 bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-400 rounded-2xl shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <span className="font-semibold text-red-800">
                    10-Hour Rest Required
                  </span>
                </div>
                <p className="text-sm text-red-700">
                  Must take 10 consecutive hours off duty after 11 hours driving
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm rounded-3xl overflow-hidden hover:shadow-2xl transition-all duration-300">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-blue-100">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-blue-500 rounded-xl">
                <Info className="h-5 w-5 text-white" />
              </div>
              Trip Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl">
                <span className="text-gray-700 font-medium">
                  Total Distance:
                </span>
                <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                  {routeData.distance} miles
                </Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-gradient-to-r from-gray-50 to-green-50 rounded-xl">
                <span className="text-gray-700 font-medium">
                  Estimated Driving Time:
                </span>
                <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                  {routeData.duration} hours
                </Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-gradient-to-r from-gray-50 to-purple-50 rounded-xl">
                <span className="text-gray-700 font-medium">Fuel Stops:</span>
                <Badge className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                  {routeData.fuelStops.length} stops
                </Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-gradient-to-r from-gray-50 to-orange-50 rounded-xl">
                <span className="text-gray-700 font-medium">
                  Required Rest Periods:
                </span>
                <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                  {routeData.restStops.length} stops
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
