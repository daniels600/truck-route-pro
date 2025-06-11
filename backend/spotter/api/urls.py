from django.urls import path
from . import views

urlpatterns = [
    path('trips', views.post_trips, name='post_trips'),
    path('trips/<int:trip_id>/', views.trip_detail, name='trip_detail'),
    path('logs/generate', views.generate_logs, name='generate_logs'),
]
