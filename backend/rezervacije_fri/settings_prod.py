# backend/rezervacije_fri/settings_prod.py
from .settings import *

DEBUG = False

ALLOWED_HOSTS = ['*']  # Za produkcijo bi določili dejanske dovoljene gostitelje

# Statične datoteke za produkcijo
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# Whitenoise za serviranje statičnih datotek
MIDDLEWARE.insert(1, 'whitenoise.middleware.WhiteNoiseMiddleware')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Varnostne nastavitve
SECURE_BROWSER_XSS_FILTER = True
X_FRAME_OPTIONS = 'DENY'
SECURE_CONTENT_TYPE_NOSNIFF = True