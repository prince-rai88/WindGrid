"""
DRF Serializers for WindGrid API endpoints.
"""

from rest_framework import serializers


class SettlementPeriodSerializer(serializers.Serializer):
    settlementPeriod = serializers.IntegerField()
    startTime = serializers.CharField()
    endTime = serializers.CharField()
    localTime = serializers.CharField()
    localTimeDisplay = serializers.CharField()
    forecastGeneration = serializers.FloatField(allow_null=True)
    actualGeneration = serializers.FloatField(allow_null=True, required=False)
    publishTime = serializers.CharField(allow_null=True, required=False)
    error = serializers.FloatField(allow_null=True, required=False)
    absError = serializers.FloatField(allow_null=True, required=False)
    percentageError = serializers.FloatField(allow_null=True, required=False)
    status = serializers.CharField(required=False)
    isOverforecast = serializers.BooleanField(allow_null=True, required=False)
    isUnderforecast = serializers.BooleanField(allow_null=True, required=False)


class OverviewResponseSerializer(serializers.Serializer):
    decisionDate = serializers.CharField()
    deliveryDate = serializers.CharField()
    decisionCutoffUtc = serializers.CharField()
    decisionCutoffDisplay = serializers.CharField()
    latestForecastPublicationUtc = serializers.CharField(allow_null=True)
    latestForecastPublicationDisplay = serializers.CharField()
    totalIntervals = serializers.IntegerField()
    forecastCoverageCount = serializers.IntegerField()
    forecastCoveragePercent = serializers.FloatField()
    excludedPostCutoffForecasts = serializers.IntegerField()
    series = SettlementPeriodSerializer(many=True)


class AccuracyResponseSerializer(serializers.Serializer):
    decisionDate = serializers.CharField()
    deliveryDate = serializers.CharField()
    decisionCutoffDisplay = serializers.CharField()
    latestForecastPublicationDisplay = serializers.CharField()
    isAvailable = serializers.BooleanField()
    totalPeriods = serializers.IntegerField()
    matchedPeriods = serializers.IntegerField()
    coveragePercent = serializers.FloatField()
    mae = serializers.FloatField(allow_null=True)
    rmse = serializers.FloatField(allow_null=True)
    bias = serializers.FloatField(allow_null=True)
    meanActualGeneration = serializers.FloatField(allow_null=True)
    meanForecastGeneration = serializers.FloatField(allow_null=True)
    maxOverforecast = serializers.FloatField(allow_null=True)
    maxUnderforecast = serializers.FloatField(allow_null=True)
    overforecastCount = serializers.IntegerField()
    underforecastCount = serializers.IntegerField()
    exactCount = serializers.IntegerField()
    metricUnits = serializers.DictField()
    convention = serializers.CharField()
    records = SettlementPeriodSerializer(many=True)
