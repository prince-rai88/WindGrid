"""
Forecast selection service for WindGrid.

Enforces:
- Day-ahead decision cutoff semantics without look-ahead bias
- Strict date mapping: Decision Date D-1 -> Delivery Date D
- Selection of the latest eligible forecast published on or before decision cutoff
- Multi-version historical forecast run inspection for retrospective evaluation
"""

from datetime import datetime, date, time, timedelta
from typing import Dict, List, Optional, Tuple
from zoneinfo import ZoneInfo
import logging

from .data_service import (
    parse_iso_utc,
    format_iso_utc,
    format_london_full,
    format_london_time,
    generate_delivery_intervals,
    LONDON_TZ,
    UTC_TZ,
)

logger = logging.getLogger(__name__)

DEFAULT_CUTOFF_TIME = time(11, 0)  # 11:00 London Time (UK EPEX / Nord Pool Day-Ahead Gate Closure)


class ForecastService:
    """Service to select eligible wind forecasts under strict day-ahead market timing."""

    @staticmethod
    def resolve_decision_cutoff(
        decision_date: date,
        cutoff_time_str: Optional[str] = None
    ) -> Tuple[datetime, str]:
        """
        Determine the cutoff datetime in UTC and human-readable London time.
        Default cutoff is 11:00 Europe/London on the decision date.
        """
        c_time = DEFAULT_CUTOFF_TIME
        if cutoff_time_str:
            try:
                parts = cutoff_time_str.strip().split(":")
                c_time = time(int(parts[0]), int(parts[1]))
            except Exception:
                logger.warning(f"Invalid cutoff_time '{cutoff_time_str}'. Using default 11:00.")
                c_time = DEFAULT_CUTOFF_TIME

        cutoff_london = datetime.combine(decision_date, c_time, tzinfo=LONDON_TZ)
        cutoff_utc = cutoff_london.astimezone(UTC_TZ)
        cutoff_display = format_london_full(cutoff_london)
        return cutoff_utc, cutoff_display

    @staticmethod
    def select_forecasts_for_delivery_day(
        raw_forecasts: List[dict],
        decision_date: date,
        cutoff_time_str: Optional[str] = None
    ) -> Dict:
        """
        Select latest eligible forecast for each settlement period of the delivery day.
        
        Rules:
        - Delivery date = decision_date + 1 day
        - Eligible forecasts must have publishTime <= decision_cutoff
        - Selected forecast is the one with max(publishTime) among eligible records for that startTime
        - Look-ahead bias prevention: any record with publishTime > decision_cutoff is excluded.
        """
        delivery_date = decision_date + timedelta(days=1)
        cutoff_utc, cutoff_display = ForecastService.resolve_decision_cutoff(decision_date, cutoff_time_str)

        intervals = generate_delivery_intervals(delivery_date)
        interval_starts = {inv['startTimeUtc'] for inv in intervals}

        # Group eligible forecasts by startTime: startTimeUtc -> list of records
        eligible_by_start: Dict[str, List[dict]] = {st: [] for st in interval_starts}
        all_eligible_publish_times = set()
        excluded_post_cutoff_count = 0

        for rec in raw_forecasts:
            raw_start = rec.get('startTime')
            raw_pub = rec.get('publishTime')
            if not raw_start or not raw_pub:
                continue

            try:
                start_dt = parse_iso_utc(raw_start)
                pub_dt = parse_iso_utc(raw_pub)
            except Exception:
                continue

            start_utc_str = format_iso_utc(start_dt)
            if start_utc_str not in interval_starts:
                continue

            if pub_dt <= cutoff_utc:
                eligible_by_start[start_utc_str].append({
                    'publishDt': pub_dt,
                    'publishTimeUtc': format_iso_utc(pub_dt),
                    'generation': rec.get('generation'),
                })
                all_eligible_publish_times.add(pub_dt)
            else:
                excluded_post_cutoff_count += 1

        # For each interval, select the latest eligible forecast
        selected_series = []
        valid_forecast_count = 0
        latest_publish_across_all: Optional[datetime] = None

        for inv in intervals:
            st = inv['startTimeUtc']
            candidates = eligible_by_start.get(st, [])

            if candidates:
                # Pick max by publishDt
                best = max(candidates, key=lambda c: c['publishDt'])
                gen_val = float(best['generation']) if best.get('generation') is not None else None
                pub_time_str = best['publishTimeUtc']
                valid_forecast_count += 1

                if latest_publish_across_all is None or best['publishDt'] > latest_publish_across_all:
                    latest_publish_across_all = best['publishDt']
            else:
                gen_val = None
                pub_time_str = None

            selected_series.append({
                'settlementPeriod': inv['settlementPeriod'],
                'startTime': st,
                'endTime': inv['endTimeUtc'],
                'localTime': inv['localTime'],
                'localTimeDisplay': inv['localTimeDisplay'],
                'forecastGeneration': gen_val,
                'publishTime': pub_time_str,
                'isAvailable': gen_val is not None,
            })

        latest_pub_display = (
            format_london_full(latest_publish_across_all)
            if latest_publish_across_all
            else "None Available"
        )

        return {
            'decisionDate': decision_date.isoformat(),
            'deliveryDate': delivery_date.isoformat(),
            'decisionCutoffUtc': format_iso_utc(cutoff_utc),
            'decisionCutoffDisplay': cutoff_display,
            'latestForecastPublicationUtc': format_iso_utc(latest_publish_across_all) if latest_publish_across_all else None,
            'latestForecastPublicationDisplay': latest_pub_display,
            'totalIntervals': len(intervals),
            'forecastCoverageCount': valid_forecast_count,
            'forecastCoveragePercent': round((valid_forecast_count / len(intervals)) * 100, 1),
            'excludedPostCutoffForecasts': excluded_post_cutoff_count,
            'series': selected_series,
        }

    @staticmethod
    def get_forecast_versions_for_delivery_day(
        raw_forecasts: List[dict],
        decision_date: date
    ) -> List[Dict]:
        """
        Extract all distinct forecast publication runs issued on decision_date
        that forecast the next day's delivery periods, enabling retrospective comparison.
        """
        delivery_date = decision_date + timedelta(days=1)
        intervals = generate_delivery_intervals(delivery_date)
        interval_starts = {inv['startTimeUtc'] for inv in intervals}

        runs: Dict[str, Dict[str, float]] = {}
        for rec in raw_forecasts:
            raw_start = rec.get('startTime')
            raw_pub = rec.get('publishTime')
            if not raw_start or not raw_pub:
                continue

            try:
                start_dt = parse_iso_utc(raw_start)
                pub_dt = parse_iso_utc(raw_pub)
            except Exception:
                continue

            # Check if publication occurred on decision date
            if pub_dt.astimezone(LONDON_TZ).date() != decision_date:
                continue

            start_utc_str = format_iso_utc(start_dt)
            if start_utc_str not in interval_starts:
                continue

            pub_utc_str = format_iso_utc(pub_dt)
            if pub_utc_str not in runs:
                runs[pub_utc_str] = {}

            gen = rec.get('generation')
            runs[pub_utc_str][start_utc_str] = float(gen) if gen is not None else None

        result_runs = []
        for pub_str in sorted(runs.keys()):
            pub_dt = parse_iso_utc(pub_str)
            coverage = len(runs[pub_str])
            result_runs.append({
                'publishTimeUtc': pub_str,
                'publishTimeDisplay': format_london_full(pub_dt),
                'forecastCount': coverage,
                'forecasts': runs[pub_str],
            })
        return result_runs
