"""
Elexon BMRS API Client for WindGrid.

Handles interactions with:
- /datasets/FUELHH/stream (Actual half-hourly generation by fuel type)
- /datasets/WINDFOR/stream (Forecast wind generation by half-hour)

Features:
- Streaming JSON parsing
- Disk and memory caching for predictable performance and offline resilience
- Robust error handling and timeouts
"""

import json
import logging
import os
from pathlib import Path
from typing import Dict, List, Optional
import requests

logger = logging.getLogger(__name__)

ELEXON_BASE_URL = os.environ.get('ELEXON_BASE_URL', 'https://data.elexon.co.uk/bmrs/api/v1')
CACHE_DIR = Path(__file__).resolve().parent.parent / 'data' / 'cache'


class ElexonClient:
    """Client for Elexon BMRS streaming datasets."""

    def __init__(self, base_url: str = ELEXON_BASE_URL, timeout: int = 30):
        self.base_url = base_url.rstrip('/')
        self.timeout = timeout
        self.cache_dir = CACHE_DIR
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self._memory_cache: Dict[str, List[dict]] = {}

    def get_actual_generation(
        self,
        publish_from: str = '2026-01-01T00:00:00Z',
        publish_to: str = '2026-02-02T00:00:00Z',
        fuel_type: str = 'WIND',
        force_refresh: bool = False
    ) -> List[dict]:
        """
        Fetch FUELHH actual generation records.
        Strictly filters to fuelType == fuel_type (default: 'WIND').
        """
        cache_key = f"fuelhh_{fuel_type}_{publish_from[:10]}_{publish_to[:10]}"
        cache_file = self.cache_dir / f"fuelhh_{fuel_type.lower()}_jan2026.json"

        # 1. Memory Cache
        if not force_refresh and cache_key in self._memory_cache:
            return self._memory_cache[cache_key]

        # 2. File Cache
        if not force_refresh and cache_file.exists():
            try:
                with open(cache_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    filtered = [d for d in data if d.get('fuelType') == fuel_type]
                    self._memory_cache[cache_key] = filtered
                    return filtered
            except Exception as e:
                logger.warning(f"Error reading local FUELHH cache: {e}. Falling back to live API.")

        # 3. Live API Fetch
        url = f"{self.base_url}/datasets/FUELHH/stream"
        params = {
            'publishDateTimeFrom': publish_from,
            'publishDateTimeTo': publish_to,
        }
        headers = {
            'User-Agent': 'WindGrid-UK-EnergyAnalytics/1.0',
            'Accept': 'application/json',
        }

        try:
            resp = requests.get(url, params=params, headers=headers, timeout=self.timeout)
            resp.raise_for_status()
            raw_records = resp.json()
            if not isinstance(raw_records, list):
                raw_records = raw_records.get('data', [])

            wind_records = [r for r in raw_records if r.get('fuelType') == fuel_type]

            # Save to disk cache for future rapid re-loads
            try:
                with open(cache_file, 'w', encoding='utf-8') as f:
                    json.dump(wind_records, f)
            except Exception as e:
                logger.warning(f"Could not write FUELHH to cache file: {e}")

            self._memory_cache[cache_key] = wind_records
            return wind_records
        except Exception as e:
            logger.error(f"Failed to fetch FUELHH stream: {e}")
            # If live fetch fails, try reading cached file anyway
            if cache_file.exists():
                logger.info("Falling back to disk cache after network error.")
                with open(cache_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            raise RuntimeError(f"Unable to load actual wind generation data: {e}")

    def get_forecast_generation(
        self,
        publish_from: str = '2026-01-01T00:00:00Z',
        publish_to: str = '2026-02-01T23:59:59Z',
        force_refresh: bool = False
    ) -> List[dict]:
        """
        Fetch WINDFOR wind generation forecast records.
        """
        cache_key = f"windfor_{publish_from[:10]}_{publish_to[:10]}"
        cache_file = self.cache_dir / "windfor_jan2026.json"

        # 1. Memory Cache
        if not force_refresh and cache_key in self._memory_cache:
            return self._memory_cache[cache_key]

        # 2. File Cache
        if not force_refresh and cache_file.exists():
            try:
                with open(cache_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    self._memory_cache[cache_key] = data
                    return data
            except Exception as e:
                logger.warning(f"Error reading local WINDFOR cache: {e}. Falling back to live API.")

        # 3. Live API Fetch
        url = f"{self.base_url}/datasets/WINDFOR/stream"
        params = {
            'publishDateTimeFrom': publish_from,
            'publishDateTimeTo': publish_to,
        }
        headers = {
            'User-Agent': 'WindGrid-UK-EnergyAnalytics/1.0',
            'Accept': 'application/json',
        }

        try:
            resp = requests.get(url, params=params, headers=headers, timeout=self.timeout)
            resp.raise_for_status()
            data = resp.json()
            if not isinstance(data, list):
                data = data.get('data', [])

            # Save to disk cache
            try:
                with open(cache_file, 'w', encoding='utf-8') as f:
                    json.dump(data, f)
            except Exception as e:
                logger.warning(f"Could not write WINDFOR to cache file: {e}")

            self._memory_cache[cache_key] = data
            return data
        except Exception as e:
            logger.error(f"Failed to fetch WINDFOR stream: {e}")
            if cache_file.exists():
                logger.info("Falling back to disk cache after network error.")
                with open(cache_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            raise RuntimeError(f"Unable to load wind forecast data: {e}")
