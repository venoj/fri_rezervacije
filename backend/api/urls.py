# backend/api/urls.py
from django.urls import path
from .views import ProxyView, ReservationsView, ReservablesView, ReservableSetsView

urlpatterns = [
    path('reservations/', ReservationsView.as_view(), name='reservations'),
    path('sets/<str:set_name>/types/<str:type_name>/reservables/', ReservablesView.as_view(), name='reservables'),
    path('sets/', ReservableSetsView.as_view(), name='sets'),
    path('proxy/<path:path>/', ProxyView.as_view(), name='proxy'),
]