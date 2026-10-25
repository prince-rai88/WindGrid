"""
API Views for WindGrid.

Endpoints:
- GET /api/health/
- GET /api/overview/?decision_date=YYYY-MM-DD[&cutoff_time=HH:MM]
- GET /api/accuracy/?decision_date=YYYY-MM-DD[&cutoff_time=HH:MM]
- GET /api/history/?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD[&cutoff_time=HH:MM]
- GET /api/forecast-versions/?decision_date=YYYY-MM-DD
"""

from datetime import datetime, date, timedelta
import math
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import logging

from .services.elexon_client import ElexonClient
from .services.data_service import DataService
from .services.forecast_service import ForecastService
from .services.accuracy_service import AccuracyService

logger = logging.getLogger(__name__)

# Permitted decision dates: decisions made in January 2026
MIN_DECISION_DATE = date(2026, 1, 1)
MAX_DECISION_DATE = date(2026, 1, 31)

client = ElexonClient()


def parse_and_validate_date(date_str: str, param_name: str = "decision_date") -> date:
    """Validate that date_str is a valid YYYY-MM-DD within January 2026."""
    if not date_str:
        raise ValueError(f"Missing required parameter '{param_name}'.")
    try:
        d = datetime.strptime(date_str.strip(), "%Y-%m-%d").date()
    except ValueError:
        raise ValueError(f"Invalid format for '{param_name}'. Expected YYYY-MM-DD (e.g. 2026-01-15).")

    if d < MIN_DECISION_DATE or d > MAX_DECISION_DATE:
        raise ValueError(
            f"Decision date '{d.isoformat()}' is out of scope. "
            f"This analysis is restricted to purchasing decisions made in January 2026 "
            f"({MIN_DECISION_DATE.isoformat()} to {MAX_DECISION_DATE.isoformat()})."
        )
    return d


class HealthCheckView(APIView):
    """Health check and data availability endpoint."""

    def get(self, request):
        return Response({
            'status': 'healthy',
            'product': 'WindGrid — Wind Forecasting & Day-Ahead Procurement Intelligence',
            'scope': 'National-level UK wind power generation (Elexon BMRS FUELHH & WINDFOR)',
            'decisionDateScope': {
                'start': MIN_DECISION_DATE.isoformat(),
                'end': MAX_DECISION_DATE.isoformat(),
                'note': 'Decisions made in January 2026 for next-day delivery (extending to 2026-02-01).',
            },
            'defaultDecisionCutoff': '11:00 Europe/London (GB Day-Ahead Auction Gate Closure)',
            'cachedDataAvailable': (
                (client.cache_dir / 'fuelhh_wind_jan2026.json').exists() or
                (client.cache_dir / 'windfor_jan2026.json').exists()
            ),
        })


class OverviewView(APIView):
    """
    Overview endpoint showing day-ahead forecast generation for a delivery day.
    Query params:
    - decision_date: YYYY-MM-DD (default: 2026-01-15)
    - cutoff_time: HH:MM (default: 11:00)
    """

    def get(self, request):
        date_param = request.query_params.get('decision_date', '2026-01-15')
        cutoff_time_param = request.query_params.get('cutoff_time', '11:00')

        try:
            decision_date = parse_and_validate_date(date_param, 'decision_date')
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        try:
            raw_forecasts = client.get_forecast_generation()
            overview_data = ForecastService.select_forecasts_for_delivery_day(
                raw_forecasts=raw_forecasts,
                decision_date=decision_date,
                cutoff_time_str=cutoff_time_param
            )
            return Response(overview_data)
        except Exception as e:
            logger.exception("Failed to generate overview")
            return Response(
                {'error': f"Failed to retrieve forecast overview: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AccuracyView(APIView):
    """
    Accuracy evaluation endpoint comparing day-ahead forecast against actual wind generation.
    Query params:
    - decision_date: YYYY-MM-DD (default: 2026-01-15)
    - cutoff_time: HH:MM (default: 11:00)
    """

    def get(self, request):
        date_param = request.query_params.get('decision_date', '2026-01-15')
        cutoff_time_param = request.query_params.get('cutoff_time', '11:00')

        try:
            decision_date = parse_and_validate_date(date_param, 'decision_date')
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        try:
            delivery_date = decision_date + timedelta(days=1)
            raw_forecasts = client.get_forecast_generation()
            raw_actuals = client.get_actual_generation()

            # Select forecasts available at decision cutoff
            fc_result = ForecastService.select_forecasts_for_delivery_day(
                raw_forecasts=raw_forecasts,
                decision_date=decision_date,
                cutoff_time_str=cutoff_time_param
            )

            # Process actuals for delivery date
            actuals_by_start = DataService.process_actuals_for_delivery_date(
                raw_actuals=raw_actuals,
                delivery_date=delivery_date
            )

            # Compute quantitative accuracy metrics
            acc_result = AccuracyService.calculate_accuracy(
                forecast_series=fc_result['series'],
                actuals_by_start=actuals_by_start
            )

            response_data = {
                'decisionDate': fc_result['decisionDate'],
                'deliveryDate': fc_result['deliveryDate'],
                'decisionCutoffUtc': fc_result['decisionCutoffUtc'],
                'decisionCutoffDisplay': fc_result['decisionCutoffDisplay'],
                'latestForecastPublicationUtc': fc_result['latestForecastPublicationUtc'],
                'latestForecastPublicationDisplay': fc_result['latestForecastPublicationDisplay'],
                **acc_result
            }
            return Response(response_data)
        except Exception as e:
            logger.exception("Failed to calculate accuracy")
            return Response(
                {'error': f"Failed to compute accuracy metrics: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class HistoryView(APIView):
    """
    Historical analysis endpoint for decision dates across January 2026.
    Query params:
    - start_date: YYYY-MM-DD (default: 2026-01-01)
    - end_date: YYYY-MM-DD (default: 2026-01-31)
    - cutoff_time: HH:MM (default: 11:00)
    """

    def get(self, request):
        start_str = request.query_params.get('start_date', '2026-01-01')
        end_str = request.query_params.get('end_date', '2026-01-31')
        cutoff_time_param = request.query_params.get('cutoff_time', '11:00')

        try:
            start_date = parse_and_validate_date(start_str, 'start_date')
            end_date = parse_and_validate_date(end_str, 'end_date')
            if start_date > end_date:
                return Response(
                    {'error': f"start_date ({start_date}) cannot be after end_date ({end_date})."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        try:
            raw_forecasts = client.get_forecast_generation()
            raw_actuals = client.get_actual_generation()

            daily_results = []
            all_errors = []
            all_abs_errors = []
            all_sq_errors = []

            curr_date = start_date
            while curr_date <= end_date:
                del_date = curr_date + timedelta(days=1)
                fc_res = ForecastService.select_forecasts_for_delivery_day(
                    raw_forecasts=raw_forecasts,
                    decision_date=curr_date,
                    cutoff_time_str=cutoff_time_param
                )
                actuals = DataService.process_actuals_for_delivery_date(
                    raw_actuals=raw_actuals,
                    delivery_date=del_date
                )
                acc = AccuracyService.calculate_accuracy(
                    forecast_series=fc_res['series'],
                    actuals_by_start=actuals
                )

                daily_results.append({
                    'decisionDate': curr_date.isoformat(),
                    'deliveryDate': del_date.isoformat(),
                    'mae': acc['mae'],
                    'rmse': acc['rmse'],
                    'bias': acc['bias'],
                    'meanActual': acc['meanActualGeneration'],
                    'meanForecast': acc['meanForecastGeneration'],
                    'matchedPeriods': acc['matchedPeriods'],
                    'coveragePercent': acc['coveragePercent'],
                    'overforecastCount': acc['overforecastCount'],
                    'underforecastCount': acc['underforecastCount'],
                })

                # Collect matched errors for aggregate month statistics
                for r in acc['records']:
                    if r['error'] is not None:
                        all_errors.append(r['error'])
                        all_abs_errors.append(r['absError'])
                        all_sq_errors.append(r['error'] ** 2)

                curr_date += timedelta(days=1)

            # Aggregate statistics across evaluated date range
            total_matched = len(all_errors)
            if total_matched > 0:
                aggregate_mae = round(sum(all_abs_errors) / total_matched, 2)
                aggregate_rmse = round(math.sqrt(sum(all_sq_errors) / total_matched), 2)
                aggregate_bias = round(sum(all_errors) / total_matched, 2)
                overall_over = sum(1 for e in all_errors if e > 0.01)
                overall_under = sum(1 for e in all_errors if e < -0.01)
            else:
                aggregate_mae = None
                aggregate_rmse = None
                aggregate_bias = None
                overall_over = 0
                overall_under = 0

            return Response({
                'startDate': start_date.isoformat(),
                'endDate': end_date.isoformat(),
                'decisionCutoff': f"{cutoff_time_param} Europe/London",
                'daysEvaluated': len(daily_results),
                'aggregateMetrics': {
                    'totalMatchedHalfHours': total_matched,
                    'mae': aggregate_mae,
                    'rmse': aggregate_rmse,
                    'bias': aggregate_bias,
                    'overallOverforecastPeriods': overall_over,
                    'overallUnderforecastPeriods': overall_under,
                    'biasInterpretation': (
                        'Net positive bias (systemic overforecasting)'
                        if aggregate_bias and aggregate_bias > 0
                        else 'Net negative bias (systemic underforecasting)'
                    ) if aggregate_bias is not None else 'Insufficient data',
                    'unit': 'MW',
                },
                'dailyResults': daily_results,
            })
        except Exception as e:
            logger.exception("Failed to build historical analysis")
            return Response(
                {'error': f"Failed to retrieve history: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ForecastVersionsView(APIView):
    """
    Inspect all distinct forecast publication runs issued on decision_date
    for the next day's delivery periods, enabling retrospective comparison.
    """

    def get(self, request):
        date_param = request.query_params.get('decision_date', '2026-01-15')
        try:
            decision_date = parse_and_validate_date(date_param, 'decision_date')
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        try:
            raw_forecasts = client.get_forecast_generation()
            runs = ForecastService.get_forecast_versions_for_delivery_day(
                raw_forecasts=raw_forecasts,
                decision_date=decision_date
            )
            return Response({
                'decisionDate': decision_date.isoformat(),
                'deliveryDate': (decision_date + timedelta(days=1)).isoformat(),
                'publicationRunsCount': len(runs),
                'runs': runs,
            })
        except Exception as e:
            logger.exception("Failed to get forecast versions")
            return Response(
                {'error': f"Failed to get forecast versions: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
