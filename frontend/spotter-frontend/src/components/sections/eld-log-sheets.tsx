import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Calendar, Clock, CheckCircle } from "lucide-react";
import type { RouteData, TripData } from "@/App";


interface LogEntry {
  time: string;
  status: "driving" | "on-duty" | "sleeper" | "off-duty";
  location: string;
  odometer: number;
  remarks: string;
}

interface HOSAnalysis {
  driving_available: number;
  duty_available: number;
  cycle_remaining: number;
  needs_reset: boolean;
}

interface Stop {
  type: "fuel" | "rest";
  sequence: number;
  duration_minutes: number;
  description: string;
}

interface HOSData {
  hos_analysis: HOSAnalysis;
  stops: Stop[];
  compliance_status: string;
  violations: string[];
}

interface ELDLogSheetsProps {
  tripData: TripData;
  routeData: RouteData;
  hosData: HOSData;
}

export function ELDLogSheets({ tripData, hosData }: ELDLogSheetsProps) {
  // Generate log entries based on HOS data
  const generateLogEntries = (): LogEntry[] => {
    const entries: LogEntry[] = [];
    const currentTime = new Date();
    currentTime.setHours(6, 0, 0, 0); 
    const odometer = 125000;

    // Add entries based on stops
    hosData.stops.forEach((stop) => {
      const startTime = new Date(currentTime);
      const endTime = new Date(currentTime);
      endTime.setMinutes(endTime.getMinutes() + stop.duration_minutes);

      // Add start of stop
      entries.push({
        time: startTime.toTimeString().slice(0, 5),
        status: stop.type === "rest" ? "sleeper" : "off-duty",
        location: stop.type === "fuel" ? "Fuel Station" : "Rest Area",
        odometer: odometer,
        remarks: stop.description,
      });

      // Add end of stop
      entries.push({
        time: endTime.toTimeString().slice(0, 5),
        status: "on-duty",
        location: tripData.currentLocation,
        odometer: odometer,
        remarks: `End of ${stop.type} stop`,
      });

      currentTime.setMinutes(currentTime.getMinutes() + stop.duration_minutes);
    });

    return entries;
  };

  const logEntries = generateLogEntries();
  const currentDate = new Date().toLocaleDateString();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "driving":
        return "bg-gradient-to-r from-green-500 to-green-600";
      case "on-duty":
        return "bg-gradient-to-r from-yellow-500 to-yellow-600";
      case "sleeper":
        return "bg-gradient-to-r from-blue-500 to-blue-600";
      case "off-duty":
        return "bg-gradient-to-r from-gray-500 to-gray-600";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "driving":
        return "Driving";
      case "on-duty":
        return "On Duty";
      case "sleeper":
        return "Sleeper Berth";
      case "off-duty":
        return "Off Duty";
      default:
        return status;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl border border-blue-200">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Electronic Logging Device (ELD) Records
          </h2>
          <p className="text-lg text-gray-600 mt-1">
            Daily log sheets for {currentDate}
          </p>
        </div>
        <Button className="flex items-center gap-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
          <Download className="h-5 w-5" />
          Export Logs
        </Button>
      </div>

      <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm rounded-3xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-gray-100">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <div className="p-2 bg-blue-500 rounded-xl">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            Driver Daily Log - {currentDate}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="space-y-8">
            {/* Driver Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl border border-gray-200">
              <div className="text-center">
                <label className="text-sm font-medium text-gray-600 block mb-1">
                  Driver Name
                </label>
                <p className="font-bold text-lg text-gray-800">John Doe</p>
              </div>
              <div className="text-center">
                <label className="text-sm font-medium text-gray-600 block mb-1">
                  Employee ID
                </label>
                <p className="font-bold text-lg text-gray-800">D12345</p>
              </div>
              <div className="text-center">
                <label className="text-sm font-medium text-gray-600 block mb-1">
                  Cycle Used
                </label>
                <p className="font-bold text-lg text-blue-600">
                  {tripData.currentCycleUsed} hrs
                </p>
              </div>
              <div className="text-center">
                <label className="text-sm font-medium text-gray-600 block mb-1">
                  Vehicle ID
                </label>
                <p className="font-bold text-lg text-gray-800">TRK-001</p>
              </div>
            </div>

            {/* Visual Log Grid */}
            <div className="border-0 rounded-2xl overflow-hidden shadow-xl bg-white">
              <div className="bg-gradient-to-r from-gray-100 to-blue-100 p-4 border-b">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  24-Hour Activity Grid
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-24 gap-1 mb-6">
                  {Array.from({ length: 24 }, (_, i) => (
                    <div
                      key={i}
                      className="text-xs text-center text-gray-500 font-medium"
                    >
                      {i.toString().padStart(2, "0")}
                    </div>
                  ))}
                </div>

                {/* Status rows */}
                {["off-duty", "sleeper", "driving", "on-duty"].map((status) => (
                  <div key={status} className="flex items-center gap-4 mb-3">
                    <div className="w-24 text-sm font-semibold text-gray-700">
                      {getStatusLabel(status)}
                    </div>
                    <div className="flex-1 grid grid-cols-24 gap-1">
                      {Array.from({ length: 24 }, (_, hour) => {
                        const isActive = logEntries.some((entry) => {
                          const entryHour = Number.parseInt(
                            entry.time.split(":")[0]
                          );
                          return entryHour === hour && entry.status === status;
                        });
                        return (
                          <div
                            key={hour}
                            className={`h-8 border-2 border-white rounded-md shadow-sm transition-all duration-200 ${
                              isActive ? getStatusColor(status) : "bg-gray-100"
                            }`}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Detailed Log Entries */}
            <div className="space-y-4">
              <h3 className="font-bold text-xl text-gray-800">
                Detailed Log Entries
              </h3>
              <div className="border-0 rounded-2xl overflow-hidden shadow-xl bg-white">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">
                        Time
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">
                        Location
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">
                        Odometer
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">
                        Remarks
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {logEntries.map((entry, index) => (
                      <tr
                        key={index}
                        className="border-t border-gray-100 hover:bg-gray-50 transition-colors duration-200"
                      >
                        <td className="px-6 py-4 font-mono text-lg font-semibold">
                          {entry.time}
                        </td>
                        <td className="px-6 py-4">
                          <Badge
                            className={`${getStatusColor(
                              entry.status
                            )} text-white border-0 px-3 py-1`}
                          >
                            {getStatusLabel(entry.status)}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 font-medium">
                          {entry.location}
                        </td>
                        <td className="px-6 py-4 font-mono font-semibold">
                          {entry.odometer.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {entry.remarks}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-200">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                  <p className="text-2xl font-bold text-white">
                    {Math.abs(hosData.hos_analysis.driving_available).toFixed(1)}
                  </p>
                </div>
                <p className="text-sm text-gray-600 font-medium">
                  Hours Driving
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                  <p className="text-2xl font-bold text-white">
                    {Math.abs(hosData.hos_analysis.duty_available).toFixed(1)}
                  </p>
                </div>
                <p className="text-sm text-gray-600 font-medium">
                  Hours On Duty
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-gray-500 to-gray-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                  <p className="text-2xl font-bold text-white">
                    {hosData.hos_analysis.cycle_remaining.toFixed(1)}
                  </p>
                </div>
                <p className="text-sm text-gray-600 font-medium">
                  Hours Remaining
                </p>
              </div>
              <div className="text-center">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg ${
                  hosData.compliance_status === "compliant" 
                    ? "bg-gradient-to-r from-green-500 to-green-600"
                    : "bg-gradient-to-r from-red-500 to-red-600"
                }`}>
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
                <p className="text-sm text-gray-600 font-medium">
                  {hosData.compliance_status === "compliant" ? "HOS Compliant" : "HOS Violation"}
                </p>
              </div>
            </div>

            {/* Violations Section */}
            {hosData.violations.length > 0 && (
              <div className="p-6 bg-gradient-to-r from-red-50 to-red-100 rounded-2xl border border-red-200">
                <h3 className="text-lg font-bold text-red-700 mb-3">HOS Violations</h3>
                <ul className="space-y-2">
                  {hosData.violations.map((violation, index) => (
                    <li key={index} className="flex items-center gap-2 text-red-600">
                      <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                      {violation}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
