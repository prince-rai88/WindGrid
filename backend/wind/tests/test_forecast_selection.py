"""
Unit tests for day-ahead forecast selection and cutoff enforcement.
"""

from datetime import date
from django.test import SimpleTestCase
from wind.services.forecast_service import ForecastService


class TestForecastSelection(SimpleTestCase):
    """Test suite ensuring zero look-ahead bias and correct forecast selection."""

    def setUp(self):
        self.decision_date = date(2026, 1, 15)
        # Decision cutoff: 2026-01-15T11:00:00Z
        # Target delivery day: 2026-01-16 (starts 2026-01-16T00:00:00Z)
        self.target_sp1_start = "2026-01-16T00:00:00Z"
        self.target_sp2_start = "2026-01-16T00:30:00Z"

    def test_select_latest_eligible_forecast(self):
        """When multiple forecasts are published before cutoff, select the most recent one."""
        raw_forecasts = [
            # Earlier run at 04:30
            {
                'startTime': self.target_sp1_start,
                'publishTime': '2026-01-15T04:30:00Z',
                'generation': 12000.0,
            },
            # Latest eligible run at 09:30 (before 11:00 cutoff)
            {
                'startTime': self.target_sp1_start,
                'publishTime': '2026-01-15T09:30:00Z',
                'generation': 14500.0,
            },
        ]

        result = ForecastService.select_forecasts_for_delivery_day(
            raw_forecasts=raw_forecasts,
            decision_date=self.decision_date,
            cutoff_time_str="11:00"
        )

        sp1 = next(item for item in result['series'] if item['startTime'] == self.target_sp1_start)
        self.assertEqual(sp1['forecastGeneration'], 14500.0)
        self.assertEqual(sp1['publishTime'], '2026-01-15T09:30:00Z')
        self.assertTrue(sp1['isAvailable'])

    def test_strict_exclusion_of_post_cutoff_forecasts(self):
        """Forecasts published after cutoff MUST be excluded to prevent look-ahead bias."""
        raw_forecasts = [
            # Run at 09:30 (eligible)
            {
                'startTime': self.target_sp1_start,
                'publishTime': '2026-01-15T09:30:00Z',
                'generation': 14000.0,
            },
            # Run at 15:30 (POST-CUTOFF - must NOT be used!)
            {
                'startTime': self.target_sp1_start,
                'publishTime': '2026-01-15T15:30:00Z',
                'generation': 18000.0,
            },
            # Run at 22:30 (POST-CUTOFF - must NOT be used!)
            {
                'startTime': self.target_sp1_start,
                'publishTime': '2026-01-15T22:30:00Z',
                'generation': 19000.0,
            },
        ]

        result = ForecastService.select_forecasts_for_delivery_day(
            raw_forecasts=raw_forecasts,
            decision_date=self.decision_date,
            cutoff_time_str="11:00"
        )

        sp1 = next(item for item in result['series'] if item['startTime'] == self.target_sp1_start)
        # MUST pick 14000.0 (09:30), NOT the later ones
        self.assertEqual(sp1['forecastGeneration'], 14000.0)
        self.assertEqual(sp1['publishTime'], '2026-01-15T09:30:00Z')
        self.assertEqual(result['excludedPostCutoffForecasts'], 2)

    def test_missing_forecast_for_period(self):
        """If no eligible forecast exists for a delivery period, it is marked unavailable."""
        raw_forecasts = [
            # Forecast only for SP1, none for SP2
            {
                'startTime': self.target_sp1_start,
                'publishTime': '2026-01-15T09:30:00Z',
                'generation': 10000.0,
            },
        ]

        result = ForecastService.select_forecasts_for_delivery_day(
            raw_forecasts=raw_forecasts,
            decision_date=self.decision_date,
            cutoff_time_str="11:00"
        )

        sp2 = next(item for item in result['series'] if item['startTime'] == self.target_sp2_start)
        self.assertIsNone(sp2['forecastGeneration'])
        self.assertIsNone(sp2['publishTime'])
        self.assertFalse(sp2['isAvailable'])

    def test_configurable_cutoff_time(self):
        """Testing configurable cutoff time (e.g. 13:00 permits 12:25 run)."""
        raw_forecasts = [
            {
                'startTime': self.target_sp1_start,
                'publishTime': '2026-01-15T09:30:00Z',
                'generation': 10000.0,
            },
            {
                'startTime': self.target_sp1_start,
                'publishTime': '2026-01-15T12:25:00Z',
                'generation': 11500.0,
            },
        ]

        # With 11:00 cutoff -> 09:30 selected
        res_11 = ForecastService.select_forecasts_for_delivery_day(
            raw_forecasts=raw_forecasts,
            decision_date=self.decision_date,
            cutoff_time_str="11:00"
        )
        sp1_11 = next(item for item in res_11['series'] if item['startTime'] == self.target_sp1_start)
        self.assertEqual(sp1_11['forecastGeneration'], 10000.0)

        # With 13:00 cutoff -> 12:25 selected
        res_13 = ForecastService.select_forecasts_for_delivery_day(
            raw_forecasts=raw_forecasts,
            decision_date=self.decision_date,
            cutoff_time_str="13:00"
        )
        sp1_13 = next(item for item in res_13['series'] if item['startTime'] == self.target_sp1_start)
        self.assertEqual(sp1_13['forecastGeneration'], 11500.0)
