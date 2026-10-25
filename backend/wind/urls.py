"""
URL routing for WindGrid wind app.
"""

from django.urls import path
from .views import (
    HealthCheckView,
    OverviewView,
    AccuracyView,
    HistoryView,
    ForecastVersionsView,
)

urlpatterns = [
    path('health/', HealthCheckView.as_view(), name='health'),
    path('overview/', OverviewView.as_view(), name='overview'),
    path('accuracy/', AccuracyView.as_view(), name='accuracy'),
    path('history/', HistoryView.as_view(), name='history'),
    path('forecast-versions/', ForecastVersionsView.as_view(), name='forecast-versions'),
]
