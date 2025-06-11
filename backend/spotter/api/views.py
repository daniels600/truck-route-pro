from datetime import datetime
from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import Trip, TripStop, DailyLog
from .serializers import TripSerializer, TripStopSerializer, DailyLogSerializer
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .services import TripPlanningService
import logging

logger = logging.getLogger(__name__)

@api_view(['POST'])
def post_trips(request):
    serializer = TripSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    trip = serializer.save()
    
    try:
        service = TripPlanningService()
        plan_result = service.plan_complete_trip({
            'current_location': trip.current_location,
            'pickup_location': trip.pickup_location,
            'dropoff_location': trip.dropoff_location,
            'current_cycle_hours_used': trip.current_cycle_hours_used
        })
        
        # Update trip with calculated data
        trip.current_coordinates = plan_result['coordinates']['current']
        trip.pickup_coordinates = plan_result['coordinates']['pickup']
        trip.dropoff_coordinates = plan_result['coordinates']['dropoff']
        trip.estimated_miles = plan_result['route']['distance_miles']
        trip.estimated_drive_hours = plan_result['requirements']['drive_hours']
        trip.total_duty_hours = plan_result['requirements']['total_duty_hours']
        trip.is_compliant = plan_result['requirements']['is_compliant']
        trip.violations = plan_result['requirements']['violations']
        trip.days_required = plan_result['requirements']['days_needed']
        trip.route_geometry = plan_result['route']['geometry']
        trip.save()
        
        # Create stops
        for i, stop_data in enumerate(plan_result['stops']):
            TripStop.objects.create(
                trip=trip,
                stop_type=stop_data['type'],
                coordinates={},  # Could add specific coordinates
                duration_minutes=stop_data['duration_minutes'],
                sequence_order=stop_data['sequence']
            )
        
        return Response({
            'trip_id': trip.id,
            'route': {
                'total_distance_miles': round(plan_result['route']['distance_miles'], 1),
                'total_drive_time_hours': round(plan_result['requirements']['drive_hours'], 2),
                'total_duty_time_hours': round(plan_result['requirements']['total_duty_hours'], 2),
                'coordinates': plan_result['route']['coordinates']
            },
            'hos_analysis': {
                'driving_available': 11 - plan_result['requirements']['drive_hours'],
                'duty_available': 14 - plan_result['requirements']['total_duty_hours'],
                'cycle_remaining': plan_result['requirements']['cycle_remaining'],
                'needs_reset': plan_result['requirements']['cycle_remaining'] < 8
            },
            'stops': plan_result['stops'],
            'compliance_status': 'compliant' if plan_result['requirements']['is_compliant'] else 'violation',
            'violations': plan_result['requirements']['violations'],
            'timeline': plan_result['timeline']
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        # Log the actual error for debugging
        logger.error(f"Error in post_trips: {str(e)}")
        
        # Check if it's a Mapbox API error
        if "mapbox.com" in str(e):
            return Response({
                'error': 'Unable to calculate route at this time. Please try again later.'
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        
        # Generic error for other cases
        return Response({
            'error': 'An unexpected error occurred. Please try again later.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



@api_view(['POST'])
def generate_logs(request):
    trip_id = request.data.get('trip_id')
    
    try:
        trip = Trip.objects.get(id=trip_id)
    except Trip.DoesNotExist:
        return Response({'error': 'Trip not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Get timeline from trip planning
    service = TripPlanningService()
    timeline = service.hos_calc.generate_timeline(
        trip.estimated_miles,
        trip.estimated_drive_hours
    )
    
    # Generate daily logs
    daily_logs = []
    current_day = 1
    current_timeline = []
    
    for entry in timeline:
        if entry['day'] != current_day:
            # Save previous day
            if current_timeline:
                log = create_daily_log(trip, current_day, current_timeline)
                daily_logs.append(DailyLogSerializer(log).data)
            
            current_day = entry['day']
            current_timeline = []
        
        current_timeline.append(entry)
    
    # Save last day
    if current_timeline:
        log = create_daily_log(trip, current_day, current_timeline)
        daily_logs.append(DailyLogSerializer(log).data)
    
    return Response(daily_logs, status=status.HTTP_201_CREATED)

def create_daily_log(trip, day_number, timeline):
    """Create daily log with hourly breakdown"""
    
    # Create 24-hour timeline
    hourly_data = {}
    driving_hours = 0
    duty_hours = 0
    off_duty_hours = 0
    
    # Initialize all hours as off duty
    for hour in range(24):
        hourly_data[str(hour)] = 'off'
    
    # Fill in actual activities
    for entry in timeline:
        start_hour = int(entry['start_time'])
        duration = entry['duration_hours']
        end_hour = min(23, int(start_hour + duration))
        
        for hour in range(start_hour, end_hour + 1):
            hourly_data[str(hour)] = entry['duty_status']
        
        # Calculate totals
        if entry['duty_status'] == 'driving':
            driving_hours += duration
            duty_hours += duration
        elif entry['duty_status'] == 'on':
            duty_hours += duration
        else:
            off_duty_hours += duration
    
    # Count remaining off duty hours
    off_duty_hours = 24 - duty_hours
    
    log = DailyLog.objects.create(
        trip=trip,
        date=datetime.now().date(),
        day_number=day_number,
        timeline_data={
            'hourly_status': hourly_data,
            'detailed_timeline': timeline
        },
        total_driving_hours=driving_hours,
        total_duty_hours=duty_hours,
        total_off_duty_hours=off_duty_hours,
        is_compliant=driving_hours <= 11 and duty_hours <= 14
    )
    
    return log

@api_view(['GET'])
def trip_detail(request, trip_id):
    try:
        trip = Trip.objects.get(id=trip_id)
        stops = TripStop.objects.filter(trip=trip).order_by('sequence_order')
        daily_logs = DailyLog.objects.filter(trip=trip).order_by('day_number')
        
        return Response({
            'trip': TripSerializer(trip).data,
            'stops': TripStopSerializer(stops, many=True).data,
            'daily_logs': DailyLogSerializer(daily_logs, many=True).data
        })
    except Trip.DoesNotExist:
        return Response({'error': 'Trip not found'}, status=status.HTTP_404_NOT_FOUND)


