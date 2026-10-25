"""
URL Configuration for WindGrid backend.
"""

from django.urls import path, include

urlpatterns = [
    path('api/', include('wind.urls')),
]
