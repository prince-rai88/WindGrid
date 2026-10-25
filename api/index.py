import os
import sys
from pathlib import Path

# Add backend directory to sys.path so Django can resolve config and wind apps
backend_path = Path(__file__).resolve().parent.parent / 'backend'
sys.path.insert(0, str(backend_path))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

from django.core.wsgi import get_wsgi_application

# Vercel looks for 'app' or 'handler'
app = get_wsgi_application()
