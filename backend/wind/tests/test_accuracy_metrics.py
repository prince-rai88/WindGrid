"""
Unit tests for accuracy calculations: MAE, RMSE, signed Bias, and coverage.
"""

from django.test import SimpleTestCase
from wind.services.accuracy_service import AccuracyService


class TestAccuracyMetrics(SimpleTestCase):
    """Test suite verifying mathematical correctness of accuracy metrics."""

    def test_signed_error_convention(self):
        """
        Convention: error = forecast - actual
        Positive = overforecast (forecast > actual)
        Negative = underforecast (forecast < actual)
        """
        forecast_series = [
            {
                'settlementPeriod': 1,
                'startTime': '2026-01-16T00:00:00Z',
                'endTime': '2026-01-16T00:30:00Z',
                'localTime': '00:00',
                'localTimeDisplay': '00:00 - 00:30',
                'forecastGeneration': 1200.0,
                'publishTime': '2026-01-15T09:30:00Z',
            },
            {
                'settlementPeriod': 2,
                'startTime': '2026-01-16T00:30:00Z',
                'endTime': '2026-01-16T01:00:00Z',
                'localTime': '00:30',
                'localTimeDisplay': '00:30 - 01:00',
                'forecastGeneration': 800.0,
                'publishTime': '2026-01-15T09:30:00Z',
            },
        ]
        actuals = {
            '2026-01-16T00:00:00Z': 1000.0,  # Forecast 1200 - Actual 1000 = +200 (overforecast)
            '2026-01-16T00:30:00Z': 1000.0,  # Forecast 800 - Actual 1000 = -200 (underforecast)
        }

        res = AccuracyService.calculate_accuracy(forecast_series, actuals)

        self.assertTrue(res['isAvailable'])
        self.assertEqual(res['matchedPeriods'], 2)

        # Period 1: +200
        rec1 = res['records'][0]
        self.assertEqual(rec1['error'], 200.0)
        self.assertTrue(rec1['isOverforecast'])
        self.assertFalse(rec1['isUnderforecast'])

        # Period 2: -200
        rec2 = res['records'][1]
        self.assertEqual(rec2['error'], -200.0)
        self.assertFalse(rec2['isOverforecast'])
        self.assertTrue(rec2['isUnderforecast'])

        # Metrics:
        # MAE = (|200| + |-200|) / 2 = 200.0
        # RMSE = sqrt((200^2 + (-200)^2) / 2) = sqrt(40000) = 200.0
        # Bias = (200 + (-200)) / 2 = 0.0
        self.assertEqual(res['mae'], 200.0)
        self.assertEqual(res['rmse'], 200.0)
        self.assertEqual(res['bias'], 0.0)
        self.assertEqual(res['overforecastCount'], 1)
        self.assertEqual(res['underforecastCount'], 1)

    def test_known_numerical_values(self):
        """Verify MAE, RMSE, and Bias on non-symmetrical known values."""
        # Errors: +100, +200, -50, -150
        forecast_series = [
            {'settlementPeriod': 1, 'startTime': 'T1', 'endTime': 'T1e', 'localTime': '00:00', 'localTimeDisplay': '0', 'forecastGeneration': 600.0},
            {'settlementPeriod': 2, 'startTime': 'T2', 'endTime': 'T2e', 'localTime': '00:30', 'localTimeDisplay': '1', 'forecastGeneration': 700.0},
            {'settlementPeriod': 3, 'startTime': 'T3', 'endTime': 'T3e', 'localTime': '01:00', 'localTimeDisplay': '2', 'forecastGeneration': 450.0},
            {'settlementPeriod': 4, 'startTime': 'T4', 'endTime': 'T4e', 'localTime': '01:30', 'localTimeDisplay': '3', 'forecastGeneration': 350.0},
        ]
        actuals = {
            'T1': 500.0,  # e = +100, |e| = 100, e^2 = 10000
            'T2': 500.0,  # e = +200, |e| = 200, e^2 = 40000
            'T3': 500.0,  # e = -50,  |e| = 50,  e^2 = 2500
            'T4': 500.0,  # e = -150, |e| = 150, e^2 = 22500
        }
        # Sum errors = 100 + 200 - 50 - 150 = 100 -> Bias = 100 / 4 = 25.0
        # Sum abs errors = 100 + 200 + 50 + 150 = 500 -> MAE = 500 / 4 = 125.0
        # Sum sq errors = 10000 + 40000 + 2500 + 22500 = 75000 -> MSE = 18750 -> RMSE = sqrt(18750) = 136.93

        res = AccuracyService.calculate_accuracy(forecast_series, actuals)
        self.assertEqual(res['bias'], 25.0)
        self.assertEqual(res['mae'], 125.0)
        self.assertEqual(res['rmse'], 136.93)
        self.assertEqual(res['matchedPeriods'], 4)

    def test_missing_data_exclusion(self):
        """Periods with missing forecast or missing actual are excluded from metric calculations."""
        forecast_series = [
            {'settlementPeriod': 1, 'startTime': 'T1', 'endTime': 'T1e', 'localTime': '00:00', 'localTimeDisplay': '0', 'forecastGeneration': 1000.0},
            {'settlementPeriod': 2, 'startTime': 'T2', 'endTime': 'T2e', 'localTime': '00:30', 'localTimeDisplay': '1', 'forecastGeneration': None},  # Missing forecast
            {'settlementPeriod': 3, 'startTime': 'T3', 'endTime': 'T3e', 'localTime': '01:00', 'localTimeDisplay': '2', 'forecastGeneration': 800.0},
        ]
        actuals = {
            'T1': 900.0,  # e = +100
            'T2': 500.0,  # No forecast
            'T3': None,   # Missing actual
        }

        res = AccuracyService.calculate_accuracy(forecast_series, actuals)
        self.assertEqual(res['matchedPeriods'], 1)
        self.assertEqual(res['totalPeriods'], 3)
        self.assertEqual(res['mae'], 100.0)
        self.assertEqual(res['rmse'], 100.0)
        self.assertEqual(res['bias'], 100.0)

    def test_empty_dataset_returns_unavailable(self):
        """When no matched pairs exist, metrics must return None / isAvailable = False, NOT zero."""
        forecast_series = [
            {'settlementPeriod': 1, 'startTime': 'T1', 'endTime': 'T1e', 'localTime': '00:00', 'localTimeDisplay': '0', 'forecastGeneration': None},
        ]
        actuals = {'T1': None}

        res = AccuracyService.calculate_accuracy(forecast_series, actuals)
        self.assertFalse(res['isAvailable'])
        self.assertEqual(res['matchedPeriods'], 0)
        self.assertIsNone(res['mae'])
        self.assertIsNone(res['rmse'])
        self.assertIsNone(res['bias'])
