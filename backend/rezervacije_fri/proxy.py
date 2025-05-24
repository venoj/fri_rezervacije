# backend/rezervacije_fri/proxy.py
"""
WSGI Proxy konfiguracija za produkcijski strežnik
"""

import os
from django.core.wsgi import get_wsgi_application
from whitenoise import WhiteNoise

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rezervacije_fri.settings')

application = get_wsgi_application()
application = WhiteNoise(application)
application.add_files(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 
                                   '..', 'frontend', 'build'), prefix='')