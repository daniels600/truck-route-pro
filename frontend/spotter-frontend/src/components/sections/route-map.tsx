import React, { useState, useMemo } from "react";
import Map, { Source, Layer, Marker, NavigationControl, FullscreenControl } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Fuel, Coffee, Clock, RouteIcon } from "lucide-react";
import { MapControls } from "./map-controls";
import type { RouteData } from "@/App";
import type { LngLatBoundsLike } from "react-map-gl/mapbox";

interface RouteMapProps {
  routeData: RouteData;
}

const polylineLayer = {
  id: "route-line",
  type: "line" as const,
  paint: {
    "line-color": "#3b82f6",
    "line-width": 4,
  },
};

const stopMarkerLayer = {
  id: "stop-markers",
  type: "circle" as const,
  paint: {
    "circle-radius": 6,
    "circle-color": "#ef4444",
    "circle-stroke-width": 2,
    "circle-stroke-color": "#ffffff",
  },
};

const markerStyles = {
  start: { background: "#22c55e", borderRadius: "50%", width: 16, height: 16, border: "2px solid #fff" },
  waypoint: { background: "#fbbf24", borderRadius: "50%", width: 16, height: 16, border: "2px solid #fff" },
  destination: { background: "#ef4444", borderRadius: "50%", width: 16, height: 16, border: "2px solid #fff" },
  fuel: { fontSize: 20, color: "#f59e42" },
  rest: { fontSize: 20, color: "#10b981" },
};

export const RouteMap: React.FC<RouteMapProps> = ({ routeData }) => {
  const [mapStyle, setMapStyle] = useState("mapbox://styles/mapbox/streets-v11");

  const MAX_POINTS = 500;
  const coords =
    routeData.coordinates.length > MAX_POINTS
      ? routeData.coordinates.filter((_, i) => i % Math.ceil(routeData.coordinates.length / MAX_POINTS) === 0)
      : routeData.coordinates;

  const geojson = useMemo(() => ({
    type: "Feature" as const,
    properties: {},
    geometry: {
      type: "LineString" as const,
      coordinates: coords,
    },
  }), [coords]);

  // Create GeoJSON for stop markers
  const stopMarkersGeoJSON = useMemo(() => ({
    type: "FeatureCollection" as const,
    features: [
      ...routeData.fuelStops.map(stop => ({
        type: "Feature" as const,
        properties: {
          type: "fuel",
          location: stop.location
        },
        geometry: {
          type: "Point" as const,
          coordinates: stop.coordinates
        }
      })),
      ...routeData.restStops.map(stop => ({
        type: "Feature" as const,
        properties: {
          type: "rest",
          location: stop.location
        },
        geometry: {
          type: "Point" as const,
          coordinates: stop.coordinates
        }
      }))
    ]
  }), [routeData.fuelStops, routeData.restStops]);

  // Calculate bounds to fit all coordinates
  const bounds = useMemo<LngLatBoundsLike>(() => {
    const lngs = coords.map(coord => coord[0]);
    const lats = coords.map(coord => coord[1]);
    return [
      Math.min(...lngs),
      Math.min(...lats),
      Math.max(...lngs),
      Math.max(...lats)
    ] as [number, number, number, number];
  }, [coords]);

  if (!routeData.coordinates.length) return null;

  const start = coords[0];
  const destination = coords[coords.length - 1];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
          <CardContent className="pt-8">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                <RouteIcon className="h-8 w-8" />
              </div>
              <div>
                <p className="text-3xl font-bold">{routeData.distance} mi</p>
                <p className="text-blue-100">Total Distance</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-gradient-to-br from-green-500 to-green-600 text-white hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
          <CardContent className="pt-8">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                <Clock className="h-8 w-8" />
              </div>
              <div>
                <p className="text-3xl font-bold">{routeData.duration}h</p>
                <p className="text-green-100">Driving Time</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
          <CardContent className="pt-8">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                <Coffee className="h-8 w-8" />
              </div>
              <div>
                <p className="text-3xl font-bold">
                  {routeData.restStops.length}
                </p>
                <p className="text-orange-100">Required Stops</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm rounded-3xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-gray-100">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <div className="p-2 bg-blue-500 rounded-xl">
              <MapPin className="h-6 w-6 text-white" />
            </div>
            Interactive Route Map
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="space-y-4">
            <MapControls onStyleChange={setMapStyle} currentStyle={mapStyle} />
            <div style={{ position: "relative" }}>
              <div style={{ height: 500, borderRadius: 16, overflow: "hidden" }}>
                <Map
                  mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
                  initialViewState={{
                    bounds,
                    fitBoundsOptions: {
                      padding: 50,
                      maxZoom: 12
                    }
                  }}
                  mapStyle={mapStyle}
                  style={{ width: "100%", height: "100%" }}
                >
                  {/* Route polyline */}
                  <Source id="route" type="geojson" data={geojson}>
                    <Layer {...polylineLayer} />
                  </Source>

                  {/* Stop markers along the route */}
                  <Source id="stop-markers" type="geojson" data={stopMarkersGeoJSON}>
                    <Layer {...stopMarkerLayer} />
                  </Source>

                  {/* Start marker */}
                  <Marker longitude={start[0]} latitude={start[1]}>
                    <div style={markerStyles.start} title="Start" />
                  </Marker>

                  {/* Destination marker */}
                  <Marker longitude={destination[0]} latitude={destination[1]}>
                    <div style={markerStyles.destination} title="Destination" />
                  </Marker>

                  {/* Fuel stops */}
                  {routeData.fuelStops.map((stop, idx) => (
                    <Marker key={`fuel-${idx}`} longitude={stop.coordinates[0]} latitude={stop.coordinates[1]}>
                      <div title={stop.location} style={markerStyles.fuel}>⛽</div>
                    </Marker>
                  ))}

                  {/* Rest stops */}
                  {routeData.restStops.map((stop, idx) => (
                    <Marker key={`rest-${idx}`} longitude={stop.coordinates[0]} latitude={stop.coordinates[1]}>
                      <div title={stop.location} style={markerStyles.rest}>🛏️</div>
                    </Marker>
                  ))}

                  {/* Controls */}
                  <NavigationControl position="top-left" />
                  <FullscreenControl position="top-left" />
                </Map>
              </div>

              {/* Legend */}
              <div style={{
                position: "absolute", top: 16, right: 16, background: "#fff", borderRadius: 12, boxShadow: "0 2px 8px #0001", padding: 16, zIndex: 10
              }}>
                <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ ...markerStyles.start, marginRight: 8 }} /> Start
                </div>
                {/* Waypoint legend removed */}
                <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ ...markerStyles.destination, marginRight: 8 }} /> Destination
                </div>
                <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ ...markerStyles.fuel, marginRight: 8 }}>⛽</span> Fuel Stop
                </div>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span style={{ ...markerStyles.rest, marginRight: 8 }}>🛏️</span> Rest/Break
                </div>
                <div style={{ height: 2, background: "#3b82f6", margin: "12px 0" }} />
                <div style={{ color: "#3b82f6", fontWeight: 600 }}>Route</div>
              </div>

              {/* Route Info Box */}
              <div style={{
                position: "absolute", bottom: 16, left: 16, background: "#fff", borderRadius: 12, boxShadow: "0 2px 8px #0001", padding: 16, zIndex: 10
              }}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>Route Information</div>
                <div>🛣️ {routeData.distance} miles</div>
                {/* Waypoints info removed */}
                <div>⛽ {routeData.fuelStops.length} fuel stops</div>
                <div>🛏️ {routeData.restStops.length} rest stops</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm rounded-3xl overflow-hidden hover:shadow-2xl transition-all duration-300">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-100">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-blue-500 rounded-xl">
                <Fuel className="h-5 w-5 text-white" />
              </div>
              Fuel Stops
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {routeData.fuelStops.map((stop, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl border border-blue-200 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500 rounded-xl">
                      <Fuel className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">
                        {stop.location}
                      </p>
                      <p className="text-sm text-gray-600">
                        Mile {stop.distance}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-blue-500 hover:bg-blue-600 text-white">
                    Required
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm rounded-3xl overflow-hidden hover:shadow-2xl transition-all duration-300">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 border-b border-orange-100">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-orange-500 rounded-xl">
                <Coffee className="h-5 w-5 text-white" />
              </div>
              Rest Stops
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {routeData.restStops.map((stop, index) => (
                <div
                  key={index}
                  className="p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-2xl border border-orange-200 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-500 rounded-xl">
                        <Coffee className="h-4 w-4 text-white" />
                      </div>
                      <p className="font-semibold text-gray-800">
                        {stop.location}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="border-orange-300 text-orange-700"
                    >
                      {stop.reason}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 ml-11">
                    {stop.time} - {stop.duration} hours
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
