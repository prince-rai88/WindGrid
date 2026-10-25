"""
Forecast accuracy calculation service for WindGrid.

Calculates:
- Signed half-hourly errors: error = forecast - actual (MW)
- Mean Absolute Error (MAE)
- Root Mean Squared Error (RMSE)
- Mean Signed Bias (Bias)
- Data coverage and matched pair counts
- Summary statistics (mean actual, mean forecast, min/max errors)
"""

import math
from typing import Dict, List, Optional
import logging

logger = logging.getLogger(__name__)


class AccuracyService:
    """Calculates forecast accuracy metrics on strictly matched forecast/actual pairs."""

    @staticmethod
    def calculate_accuracy(
        forecast_series: List[dict],
        actuals_by_start: Dict[str, Optional[float]]
    ) -> Dict:
        """
        Align forecast series with actuals and compute quantitative accuracy metrics.
        """
        aligned_records = []
        errors = []
        abs_errors = []
        sq_errors = []

        valid_actual_sum = 0.0
        valid_forecast_sum = 0.0
        overforecast_count = 0
        underforecast_count = 0
        exact_count = 0

        for item in forecast_series:
            st = item['startTime']
            fc_val = item.get('forecastGeneration')
            act_val = actuals_by_start.get(st)

            has_fc = fc_val is not None
            has_act = act_val is not None
            is_matched = has_fc and has_act

            error = None
            abs_error = None
            pct_error = None

            if is_matched:
                error = round(fc_val - act_val, 2)
                abs_error = round(abs(error), 2)
                errors.append(error)
                abs_errors.append(abs_error)
                sq_errors.append(error ** 2)

                valid_actual_sum += act_val
                valid_forecast_sum += fc_val

                if error > 0.01:
                    overforecast_count += 1
                elif error < -0.01:
                    underforecast_count += 1
                else:
                    exact_count += 1

                if act_val > 0:
                    pct_error = round((error / act_val) * 100, 2)

            aligned_records.append({
                'settlementPeriod': item['settlementPeriod'],
                'startTime': st,
                'endTime': item['endTime'],
                'localTime': item['localTime'],
                'localTimeDisplay': item['localTimeDisplay'],
                'forecastGeneration': round(fc_val, 2) if has_fc else None,
                'actualGeneration': round(act_val, 2) if has_act else None,
                'forecastPublishTime': item.get('publishTime'),
                'error': error,
                'absError': abs_error,
                'percentageError': pct_error,
                'status': 'MATCHED' if is_matched else ('MISSING_ACTUAL' if has_fc else 'MISSING_FORECAST'),
                'isOverforecast': error > 0 if is_matched else None,
                'isUnderforecast': error < 0 if is_matched else None,
            })

        matched_count = len(errors)
        total_count = len(aligned_records)
        coverage_pct = round((matched_count / total_count * 100), 1) if total_count > 0 else 0.0

        if matched_count > 0:
            mae = round(sum(abs_errors) / matched_count, 2)
            rmse = round(math.sqrt(sum(sq_errors) / matched_count), 2)
            bias = round(sum(errors) / matched_count, 2)
            mean_actual = round(valid_actual_sum / matched_count, 2)
            mean_forecast = round(valid_forecast_sum / matched_count, 2)
            max_overforecast = round(max(errors), 2)
            max_underforecast = round(min(errors), 2)
            is_available = True
        else:
            mae = None
            rmse = None
            bias = None
            mean_actual = None
            mean_forecast = None
            max_overforecast = None
            max_underforecast = None
            is_available = False

        return {
            'isAvailable': is_available,
            'totalPeriods': total_count,
            'matchedPeriods': matched_count,
            'coveragePercent': coverage_pct,
            'mae': mae,
            'rmse': rmse,
            'bias': bias,
            'meanActualGeneration': mean_actual,
            'meanForecastGeneration': mean_forecast,
            'maxOverforecast': max_overforecast,
            'maxUnderforecast': max_underforecast,
            'overforecastCount': overforecast_count,
            'underforecastCount': underforecast_count,
            'exactCount': exact_count,
            'metricUnits': {
                'mae': 'MW',
                'rmse': 'MW',
                'bias': 'MW',
                'generation': 'MW',
            },
            'convention': 'error = forecast_generation - actual_generation (positive = overforecast, negative = underforecast)',
            'records': aligned_records,
        }
