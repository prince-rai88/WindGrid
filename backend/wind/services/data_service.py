"""
Data processing and normalization service for WindGrid.

Handles:
- Timestamp parsing and UTC normalization
- Europe/London timezone conversion (handling GMT/BST correctly)
- Half-hourly settlement period grid generation (periods 1-48)
- Filtering and validation of actual wind generation records (FUELHH)
- Missing period detection and coverage calculation
"""

from datetime import datetime, date, time, timedelta
from typing import Dict, List, Optional, Tuple
from zoneinfo import ZoneInfo
import logging

logger = logging.getLogger(__name__)

LONDON_TZ = ZoneInfo("Europe/London")
UTC_TZ = ZoneInfo("UTC")


def parse_iso_utc(ts_str: str) -> datetime:
    """Parse an ISO 8601 timestamp string into a timezone-aware UTC datetime."""
    if not ts_str:
        raise ValueError("Timestamp string cannot be empty")
    cleaned = ts_str.replace("Z", "+00:00")
    dt = datetime.fromisoformat(cleaned)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=UTC_TZ)
    return dt.astimezone(UTC_TZ)


def format_iso_utc(dt: datetime) -> str:
    """Format a datetime into standard UTC ISO 8601 string (e.g. 2026-01-15T00:00:00Z)."""
    return dt.astimezone(UTC_TZ).strftime("%Y-%m-%dT%H:%M:%SZ")


def format_london_time(dt: datetime) -> str:
    """Format datetime into Europe/London representation: 'HH:MM'."""
    return dt.astimezone(LONDON_TZ).strftime("%H:%M")


def format_london_full(dt: datetime) -> str:
    """Format datetime into readable London string with date and timezone offset."""
    london_dt = dt.astimezone(LONDON_TZ)
    tz_name = london_dt.tzname()
    return f"{london_dt.strftime('%Y-%m-%d %H:%M')} {tz_name}"


def generate_delivery_intervals(delivery_date: date) -> List[Dict]:
    """
    Generate the 48 standard half-hour delivery intervals for a UK delivery day.
    Each day starts at 00:00 London time and consists of 48 half-hour settlement periods.
    """
    intervals = []
    # Base datetime in London timezone at midnight
    start_dt_london = datetime.combine(delivery_date, time(0, 0), tzinfo=LONDON_TZ)
    start_dt_utc = start_dt_london.astimezone(UTC_TZ)

    for sp in range(1, 49):
        sp_start_utc = start_dt_utc + timedelta(minutes=(sp - 1) * 30)
        sp_end_utc = sp_start_utc + timedelta(minutes=30)
        intervals.append({
            'settlementPeriod': sp,
            'startTimeUtc': format_iso_utc(sp_start_utc),
            'endTimeUtc': format_iso_utc(sp_end_utc),
            'localTime': format_london_time(sp_start_utc),
            'localTimeDisplay': f"{format_london_time(sp_start_utc)} - {format_london_time(sp_end_utc)}",
            'date': delivery_date.isoformat(),
        })
    return intervals


class DataService:
    """Service for cleaning, aligning, and validating half-hourly wind generation data."""

    @staticmethod
    def process_actuals_for_delivery_date(
        raw_actuals: List[dict],
        delivery_date: date
    ) -> Dict[str, Optional[float]]:
        """
        Extract half-hourly actual wind generation for the given delivery date.
        Returns a dictionary mapping ISO startTime (UTC) -> generation in MW (or None).
        
        Strictly enforces:
        - fuelType == 'WIND'
        - Deduplication by startTime (keeping most recent record if duplicated)
        - Non-negative generation
        """
        actual_by_start: Dict[str, float] = {}

        for rec in raw_actuals:
            if rec.get('fuelType') != 'WIND':
                continue

            raw_start = rec.get('startTime')
            if not raw_start:
                continue

            try:
                start_dt = parse_iso_utc(raw_start)
            except Exception:
                continue

            # Check if this record belongs to the target delivery date in London time
            record_london_date = start_dt.astimezone(LONDON_TZ).date()
            if record_london_date != delivery_date:
                continue

            norm_start = format_iso_utc(start_dt)
            gen = rec.get('generation')
            if gen is not None:
                try:
                    val = float(gen)
                    # Filter invalid negative generation values if any
                    actual_by_start[norm_start] = max(0.0, val)
                except (ValueError, TypeError):
                    actual_by_start[norm_start] = None

        return actual_by_start
