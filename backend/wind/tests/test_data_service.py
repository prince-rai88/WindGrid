"""
Unit tests for data normalization, interval generation, and fuel type filtering.
"""

from datetime import date
from django.test import SimpleTestCase
from wind.services.data_service import (
    DataService,
    generate_delivery_intervals,
    parse_iso_utc,
    format_london_time,
    format_london_full,
)


class TestDataService(SimpleTestCase):
    """Test suite verifying data processing and fuelType filtering."""

    def test_strict_wind_fuel_type_filtering(self):
        """Must filter exclusively to fuelType == 'WIND', ignoring CCGT, NUCLEAR, etc."""
        raw_actuals = [
            {
                'dataset': 'FUELHH',
                'startTime': '2026-01-15T12:00:00Z',
                'fuelType': 'WIND',
                'generation': 15200,
            },
            {
                'dataset': 'FUELHH',
                'startTime': '2026-01-15T12:00:00Z',
                'fuelType': 'CCGT',
                'generation': 24000,
            },
            {
                'dataset': 'FUELHH',
                'startTime': '2026-01-15T12:00:00Z',
                'fuelType': 'NUCLEAR',
                'generation': 5500,
            },
            {
                'dataset': 'FUELHH',
                'startTime': '2026-01-15T12:00:00Z',
                'fuelType': 'BIOMASS',
                'generation': 1800,
            },
        ]

        delivery_date = date(2026, 1, 15)
        result = DataService.process_actuals_for_delivery_date(raw_actuals, delivery_date)

        # Should only contain 1 record with WIND generation
        self.assertIn('2026-01-15T12:00:00Z', result)
        self.assertEqual(result['2026-01-15T12:00:00Z'], 15200.0)

    def test_generate_delivery_intervals_count(self):
        """A complete standard day must yield exactly 48 half-hour settlement periods."""
        delivery_date = date(2026, 1, 20)
        intervals = generate_delivery_intervals(delivery_date)

        self.assertEqual(len(intervals), 48)
        self.assertEqual(intervals[0]['settlementPeriod'], 1)
        self.assertEqual(intervals[0]['startTimeUtc'], '2026-01-20T00:00:00Z')
        self.assertEqual(intervals[0]['localTime'], '00:00')

        self.assertEqual(intervals[-1]['settlementPeriod'], 48)
        self.assertEqual(intervals[-1]['startTimeUtc'], '2026-01-20T23:30:00Z')
        self.assertEqual(intervals[-1]['localTime'], '23:30')

    def test_month_boundary_jan_to_feb(self):
        """
        Purchasing decision on 2026-01-31 delivers on 2026-02-01.
        Intervals must be generated for February 1, 2026.
        """
        delivery_date = date(2026, 2, 1)
        intervals = generate_delivery_intervals(delivery_date)

        self.assertEqual(len(intervals), 48)
        self.assertEqual(intervals[0]['date'], '2026-02-01')
        self.assertEqual(intervals[0]['startTimeUtc'], '2026-02-01T00:00:00Z')

    def test_timezone_formatting(self):
        """Test UTC to Europe/London representation."""
        dt = parse_iso_utc('2026-01-15T14:30:00Z')
        self.assertEqual(format_london_time(dt), '14:30')
        london_str = format_london_full(dt)
        self.assertIn('2026-01-15 14:30', london_str)
        self.assertIn('GMT', london_str)
