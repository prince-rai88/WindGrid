"""
Integration tests for Django REST Framework API endpoints.
"""

from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient


class TestApiEndpoints(TestCase):
    """Test suite for HTTP API endpoints."""

    def setUp(self):
        self.client = APIClient()

    def test_health_check_endpoint(self):
        """GET /api/health/ should return 200 with system metadata."""
        url = reverse('health')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'healthy')
        self.assertIn('WindGrid', response.data['product'])

    def test_overview_endpoint_valid_date(self):
        """GET /api/overview/?decision_date=2026-01-15 should return 200 and 48 intervals."""
        url = reverse('overview')
        response = self.client.get(url, {'decision_date': '2026-01-15'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['decisionDate'], '2026-01-15')
        self.assertEqual(response.data['deliveryDate'], '2026-01-16')
        self.assertEqual(len(response.data['series']), 48)

    def test_overview_endpoint_out_of_scope_date(self):
        """GET /api/overview/ with date outside January 2026 should return 400 Bad Request."""
        url = reverse('overview')
        response = self.client.get(url, {'decision_date': '2025-12-31'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('out of scope', response.data['error'])

    def test_accuracy_endpoint_valid_date(self):
        """GET /api/accuracy/?decision_date=2026-01-15 should return accuracy metrics."""
        url = reverse('accuracy')
        response = self.client.get(url, {'decision_date': '2026-01-15'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['isAvailable'])
        self.assertIsNotNone(response.data['mae'])
        self.assertIsNotNone(response.data['rmse'])
        self.assertIsNotNone(response.data['bias'])
        self.assertEqual(len(response.data['records']), 48)

    def test_history_endpoint(self):
        """GET /api/history/ should return daily breakdown and aggregate metrics."""
        url = reverse('history')
        response = self.client.get(url, {
            'start_date': '2026-01-01',
            'end_date': '2026-01-03',
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['daysEvaluated'], 3)
        self.assertIn('aggregateMetrics', response.data)
        self.assertIsNotNone(response.data['aggregateMetrics']['mae'])

    def test_forecast_versions_endpoint(self):
        """GET /api/forecast-versions/?decision_date=2026-01-15 should return publication runs."""
        url = reverse('forecast-versions')
        response = self.client.get(url, {'decision_date': '2026-01-15'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(response.data['publicationRunsCount'], 0)
