from django.db import models
from datetime import datetime, timedelta

class Trip(models.Model):
    current_location = models.CharField(max_length=255)
    pickup_location = models.CharField(max_length=255)
    dropoff_location = models.CharField(max_length=255)
    current_cycle_hours_used = models.FloatField()
    
    # Store coordinates to avoid re-geocoding
    current_coordinates = models.JSONField(null=True, blank=True)
    pickup_coordinates = models.JSONField(null=True, blank=True)
    dropoff_coordinates = models.JSONField(null=True, blank=True)
    
    # Route data
    estimated_miles = models.FloatField(null=True, blank=True)
    estimated_drive_hours = models.FloatField(null=True, blank=True)
    total_duty_hours = models.FloatField(null=True, blank=True)
    route_geometry = models.JSONField(null=True, blank=True)
    
    # Compliance
    is_compliant = models.BooleanField(default=False)
    violations = models.JSONField(default=list)
    days_required = models.IntegerField(default=1)
    
    created_at = models.DateTimeField(auto_now_add=True)

class TripStop(models.Model):
    STOP_TYPES = [
        ('fuel', 'Fuel Stop'),
        ('rest', 'Mandatory Rest'),
        ('pickup', 'Pickup'),
        ('dropoff', 'Dropoff'),
    ]
    
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name='stops')
    stop_type = models.CharField(max_length=20, choices=STOP_TYPES)
    coordinates = models.JSONField()
    duration_minutes = models.IntegerField()
    sequence_order = models.IntegerField()

class DailyLog(models.Model):
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name='daily_logs')
    date = models.DateField()
    day_number = models.IntegerField()
    timeline_data = models.JSONField()
    
    # Daily totals
    total_driving_hours = models.FloatField(default=0)
    total_duty_hours = models.FloatField(default=0)
    total_off_duty_hours = models.FloatField(default=0)
    is_compliant = models.BooleanField(default=True)