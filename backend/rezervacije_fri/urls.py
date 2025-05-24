# backend/rezervacije_fri/urls.py
from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView
from api.views import serve_react

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    # Vse ostale poti servirajo React aplikacijo
    re_path(r'^(?!api/)(?!admin/).*$', serve_react, name='serve_react'),
]