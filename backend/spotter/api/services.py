import requests
import math
from datetime import datetime, timedelta
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

class HOSCalculator:
    # ASSUMPTIONS: Property-carrying driver, 70hrs/8days
    MAX_DRIVING_HOURS = 11
    MAX_DUTY_HOURS = 14
    REQUIRED_OFF_DUTY = 10
    CYCLE_LIMIT = 70
    
    # ASSUMPTIONS: 1 hour for pickup and drop-off
    PICKUP_TIME_HOURS = 1.0
    DROPOFF_TIME_HOURS = 1.0
    
    # ASSUMPTIONS: Fueling every 1,000 miles
    FUEL_INTERVAL_MILES = 1000
    FUEL_STOP_MINUTES = 30

    def calculate_requirements(self, distance_miles, drive_hours, current_cycle_used):
        """Calculate trip requirements with all assumptions"""
        
        # Apply pickup/dropoff time assumption
        total_duty_hours = drive_hours + self.PICKUP_TIME_HOURS + self.DROPOFF_TIME_HOURS
        
        # Calculate fuel stops needed
        fuel_stops_needed = max(0, math.floor(distance_miles / self.FUEL_INTERVAL_MILES))
        fuel_time_hours = fuel_stops_needed * (self.FUEL_STOP_MINUTES / 60)
        total_duty_hours += fuel_time_hours
        
        # Check cycle remaining
        cycle_remaining = max(0, self.CYCLE_LIMIT - current_cycle_used)
        
        # Identify violations
        violations = []
        if drive_hours > self.MAX_DRIVING_HOURS:
            violations.append(f"Driving time ({drive_hours:.1f}h) exceeds 11-hour limit")
        if total_duty_hours > self.MAX_DUTY_HOURS:
            violations.append(f"Duty time ({total_duty_hours:.1f}h) exceeds 14-hour limit")
        if total_duty_hours > cycle_remaining:
            violations.append(f"Trip requires {total_duty_hours:.1f}h but only {cycle_remaining:.1f}h in cycle")
        
        # Calculate days needed
        days_needed = max(1, math.ceil(drive_hours / self.MAX_DRIVING_HOURS))
        
        return {
            'drive_hours': drive_hours,
            'total_duty_hours': total_duty_hours,
            'fuel_stops_needed': fuel_stops_needed,
            'fuel_time_hours': fuel_time_hours,
            'cycle_remaining': cycle_remaining,
            'violations': violations,
            'is_compliant': len(violations) == 0,
            'days_needed': days_needed
        }

    def generate_timeline(self, distance_miles, drive_hours):
        """Generate compliant daily timeline"""
        if drive_hours <= self.MAX_DRIVING_HOURS:
            return self._single_day_timeline(distance_miles, drive_hours)
        else:
            return self._multi_day_timeline(distance_miles, drive_hours)

    def _single_day_timeline(self, distance_miles, drive_hours):
        """Single day compliant schedule"""
        timeline = []
        current_time = 6.0  # Start at 6 AM
        
        # Pre-trip inspection
        timeline.append({
            'day': 1,
            'start_time': current_time,
            'duration_hours': 0.25,
            'duty_status': 'on',
            'activity': 'Pre-trip inspection',
            'location': 'Current location'
        })
        current_time += 0.25
        
        # Pickup
        timeline.append({
            'day': 1,
            'start_time': current_time,
            'duration_hours': self.PICKUP_TIME_HOURS,
            'duty_status': 'on',
            'activity': 'Pickup/Loading',
            'location': 'Pickup location'
        })
        current_time += self.PICKUP_TIME_HOURS
        
        # Check if fuel stop needed during drive
        fuel_stops = math.floor(distance_miles / self.FUEL_INTERVAL_MILES)
        if fuel_stops > 0:
            # Drive to fuel stop
            drive_to_fuel = drive_hours * 0.6  # Approximate
            timeline.append({
                'day': 1,
                'start_time': current_time,
                'duration_hours': drive_to_fuel,
                'duty_status': 'driving',
                'activity': 'Driving to fuel stop',
                'location': 'En route'
            })
            current_time += drive_to_fuel
            
            # Fuel stop
            timeline.append({
                'day': 1,
                'start_time': current_time,
                'duration_hours': self.FUEL_STOP_MINUTES / 60,
                'duty_status': 'on',
                'activity': 'Fuel stop',
                'location': 'Fuel station'
            })
            current_time += self.FUEL_STOP_MINUTES / 60
            
            # Continue driving
            remaining_drive = drive_hours - drive_to_fuel
            timeline.append({
                'day': 1,
                'start_time': current_time,
                'duration_hours': remaining_drive,
                'duty_status': 'driving',
                'activity': 'Driving to delivery',
                'location': 'En route'
            })
            current_time += remaining_drive
        else:
            # Straight drive
            timeline.append({
                'day': 1,
                'start_time': current_time,
                'duration_hours': drive_hours,
                'duty_status': 'driving',
                'activity': 'Driving',
                'location': 'En route'
            })
            current_time += drive_hours
        
        # Dropoff
        timeline.append({
            'day': 1,
            'start_time': current_time,
            'duration_hours': self.DROPOFF_TIME_HOURS,
            'duty_status': 'on',
            'activity': 'Delivery/Unloading',
            'location': 'Dropoff location'
        })
        
        return timeline

    def _multi_day_timeline(self, distance_miles, total_drive_hours):
        """Multi-day schedule with mandatory breaks"""
        timeline = []
        remaining_drive = total_drive_hours
        remaining_distance = distance_miles
        day = 1
        
        while remaining_drive > 0:
            daily_drive = min(self.MAX_DRIVING_HOURS, remaining_drive)
            daily_distance = (daily_drive / total_drive_hours) * distance_miles
            current_time = 6.0  # Start each day at 6 AM
            
            # Pre-trip
            timeline.append({
                'day': day,
                'start_time': current_time,
                'duration_hours': 0.25,
                'duty_status': 'on',
                'activity': 'Pre-trip inspection',
                'location': f'Day {day} starting location'
            })
            current_time += 0.25
            
            # Pickup on first day only
            if day == 1:
                timeline.append({
                    'day': day,
                    'start_time': current_time,
                    'duration_hours': self.PICKUP_TIME_HOURS,
                    'duty_status': 'on',
                    'activity': 'Pickup/Loading',
                    'location': 'Pickup location'
                })
                current_time += self.PICKUP_TIME_HOURS
            
            # Driving with fuel stops if needed
            if daily_distance >= self.FUEL_INTERVAL_MILES:
                # Drive to fuel stop
                drive_to_fuel = daily_drive * 0.6
                timeline.append({
                    'day': day,
                    'start_time': current_time,
                    'duration_hours': drive_to_fuel,
                    'duty_status': 'driving',
                    'activity': f'Driving Day {day} - Part 1',
                    'location': 'En route'
                })
                current_time += drive_to_fuel
                
                # Fuel stop
                timeline.append({
                    'day': day,
                    'start_time': current_time,
                    'duration_hours': self.FUEL_STOP_MINUTES / 60,
                    'duty_status': 'on',
                    'activity': 'Fuel stop',
                    'location': 'Fuel station'
                })
                current_time += self.FUEL_STOP_MINUTES / 60
                
                # Continue driving
                remaining_daily_drive = daily_drive - drive_to_fuel
                timeline.append({
                    'day': day,
                    'start_time': current_time,
                    'duration_hours': remaining_daily_drive,
                    'duty_status': 'driving',
                    'activity': f'Driving Day {day} - Part 2',
                    'location': 'En route'
                })
                current_time += remaining_daily_drive
            else:
                # Regular driving
                timeline.append({
                    'day': day,
                    'start_time': current_time,
                    'duration_hours': daily_drive,
                    'duty_status': 'driving',
                    'activity': f'Driving Day {day}',
                    'location': 'En route'
                })
                current_time += daily_drive
            
            # Dropoff on last day, rest on others
            if remaining_drive <= self.MAX_DRIVING_HOURS:
                timeline.append({
                    'day': day,
                    'start_time': current_time,
                    'duration_hours': self.DROPOFF_TIME_HOURS,
                    'duty_status': 'on',
                    'activity': 'Delivery/Unloading',
                    'location': 'Dropoff location'
                })
            else:
                # Mandatory 10-hour break
                timeline.append({
                    'day': day,
                    'start_time': current_time,
                    'duration_hours': self.REQUIRED_OFF_DUTY,
                    'duty_status': 'off',
                    'activity': '10-hour mandatory break',
                    'location': 'Rest area'
                })
            
            remaining_drive -= daily_drive
            remaining_distance -= daily_distance
            day += 1
        
        return timeline

class MapboxService:
    def __init__(self):
        self.token = settings.MAPBOX_TOKEN
        self.base_url = "https://api.mapbox.com"
        logger.info(f"MapboxService initialized with token: {self.token[:10]}...")  # Only log first 10 chars for security
    
    def geocode(self, address):
        """Geocode address to coordinates"""
        url = f"{self.base_url}/geocoding/v5/mapbox.places/{address}.json"
        params = {"access_token": self.token, "limit": 1}
        
        logger.info(f"Making geocoding request for address: {address}")
        response = requests.get(url, params=params)
        
        if response.status_code != 200:
            logger.error(f"Geocoding request failed with status {response.status_code}: {response.text}")
            response.raise_for_status()
        
        data = response.json()
        if not data['features']:
            logger.error(f"No features found for address: {address}")
            raise ValueError(f"Address not found: {address}")
        
        coords = data['features'][0]['geometry']['coordinates']
        logger.info(f"Successfully geocoded address: {address} to coordinates: {coords}")
        return {"lng": coords[0], "lat": coords[1]}
    
    def get_route(self, coordinates_list):
        """Get route between multiple coordinates"""
        coords_str = ";".join([f"{c['lng']},{c['lat']}" for c in coordinates_list])
        
        url = f"{self.base_url}/directions/v5/mapbox/driving/{coords_str}"
        params = {
            "access_token": self.token,
            "geometries": "geojson",
            "overview": "full",
            "steps": "true"
        }
        
        logger.info(f"Making routing request for coordinates: {coords_str}")
        response = requests.get(url, params=params)
        
        if response.status_code != 200:
            logger.error(f"Routing request failed with status {response.status_code}: {response.text}")
            response.raise_for_status()
        
        data = response.json()
        route = data['routes'][0]
        logger.info(f"Successfully got route with distance: {route['distance']} meters and duration: {route['duration']} seconds")
        
        return {
            'distance_meters': route['distance'],
            'duration_seconds': route['duration'],
            'distance_miles': route['distance'] / 1609.34,
            'duration_hours': route['duration'] / 3600,
            'geometry': route['geometry'],
            'coordinates': route['geometry']['coordinates']
        }

class TripPlanningService:
    def __init__(self):
        self.mapbox = MapboxService()
        self.hos_calc = HOSCalculator()
    
    def plan_complete_trip(self, trip_data):
        """Complete trip planning with all business logic"""
        
        # Geocode all locations
        coordinates = {
            'current': self.mapbox.geocode(trip_data['current_location']),
            'pickup': self.mapbox.geocode(trip_data['pickup_location']),
            'dropoff': self.mapbox.geocode(trip_data['dropoff_location'])
        }
        
        # Get route
        route = self.mapbox.get_route([
            coordinates['current'],
            coordinates['pickup'], 
            coordinates['dropoff']
        ])
        
        # Calculate requirements with assumptions
        requirements = self.hos_calc.calculate_requirements(
            route['distance_miles'],
            route['duration_hours'],
            trip_data['current_cycle_hours_used']
        )
        
        # Generate timeline
        timeline = self.hos_calc.generate_timeline(
            route['distance_miles'],
            route['duration_hours']
        )
        
        # Plan stops
        stops = self._plan_stops(route, requirements)
        
        return {
            'coordinates': coordinates,
            'route': route,
            'requirements': requirements,
            'timeline': timeline,
            'stops': stops
        }
    
    def _plan_stops(self, route, requirements):
        """Plan fuel and rest stops"""
        stops = []
        
        # Fuel stops
        for i in range(requirements['fuel_stops_needed']):
            stops.append({
                'type': 'fuel',
                'sequence': i + 1,
                'duration_minutes': self.hos_calc.FUEL_STOP_MINUTES,
                'description': f'Fuel stop {i + 1}'
            })
        
        # Rest stops for multi-day trips
        if requirements['days_needed'] > 1:
            for day in range(requirements['days_needed'] - 1):
                stops.append({
                    'type': 'rest',
                    'sequence': day + 10,
                    'duration_minutes': self.hos_calc.REQUIRED_OFF_DUTY * 60,
                    'description': f'10-hour mandatory rest - Day {day + 1}'
                })
        
        return stops
