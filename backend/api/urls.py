# backend/api/urls.py
from django.urls import path
from .views import ProxyView, ReservationsView, ReservablesView, ReservableSetsView, ReservableDetailsView, ClassroomResourcesView, BulkReservationsView

urlpatterns = [
    path('reservations/', ReservationsView.as_view(), name='reservations'),
    path('reservations/bulk/', BulkReservationsView.as_view(), name='bulk-reservations'),
    path('sets/<str:set_name>/types/<str:type_name>/reservables/', ReservablesView.as_view(), name='reservables'),
    path('sets/', ReservableSetsView.as_view(), name='sets'),
    path('proxy/<path:path>/', ProxyView.as_view(), name='proxy'),
    path('reservables/<int:reservable_id>/', ReservableDetailsView.as_view(), name='reservable-details'),
    path('classroom-resources/', ClassroomResourcesView.as_view(), name='classroom-resources'),
]