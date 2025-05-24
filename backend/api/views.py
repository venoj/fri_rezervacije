# backend/api/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
import requests
from django.conf import settings
import json

class ProxyView(APIView):
    def get(self, request, *args, **kwargs):
        # Pridobi pot iz URL-ja
        path = kwargs.get('path', '')
        
        # Pridobi vse query parametre iz zahteve
        query_params = request.GET.dict()
        
        # Sestavi URL za zunanji API
        url = f"{settings.FRI_REZERVACIJE_URL}/{path}/"
        if query_params:
            url += '?' + '&'.join([f"{key}={value}" for key, value in query_params.items()])
        
        try:
            # Pošlji zahtevo na zunanji API
            response = requests.get(url)
            # Poskusite parsirati odgovor kot JSON
            data = response.json()
            return Response(data, status=response.status_code)
        except requests.RequestException as e:
            return Response({"error": str(e)}, status=500)
        except json.JSONDecodeError:
            # Če odgovor ni veljaven JSON, vrnite surovi odgovor
            return Response({"error": "Invalid JSON response"}, status=500)

class ReservationsView(APIView):
    def get(self, request):
        # Pridobitev parametrov iz zahteve
        start = request.GET.get('start')
        end = request.GET.get('end')
        reservables = request.GET.get('reservables')
        
        # Sestavljanje URL-ja za zahtevo
        url = f"{settings.FRI_REZERVACIJE_URL}/reservations/"
        params = {
            'format': 'json'
        }
        
        if start:
            params['start'] = start
        if end:
            params['end'] = end
        if reservables:
            params['reservables'] = reservables
            
        try:
            # Pošiljanje zahteve na zunanji API
            response = requests.get(url, params=params)
            data = response.json()
            return Response(data, status=response.status_code)
        except requests.RequestException as e:
            return Response({"error": str(e)}, status=500)
        except json.JSONDecodeError:
            return Response({"error": "Invalid JSON response"}, status=500)

class ReservablesView(APIView):
    def get(self, request, set_name, type_name):
        # Sestavi URL za zunanji API
        url = f"{settings.FRI_REZERVACIJE_URL}/sets/{set_name}/types/{type_name}/reservables/"
        params = {'format': 'json'}
        
        try:
            # Pošlji zahtevo na zunanji API
            response = requests.get(url, params=params)
            data = response.json()
            return Response(data, status=response.status_code)
        except requests.RequestException as e:
            return Response({"error": str(e)}, status=500)
        except json.JSONDecodeError:
            return Response({"error": "Invalid JSON response"}, status=500)

class ReservableSetsView(APIView):
    def get(self, request):
        # Sestavi URL za zunanji API
        url = f"{settings.FRI_REZERVACIJE_URL}/sets/"
        params = {'format': 'json'}
        
        try:
            # Pošlji zahtevo na zunanji API
            response = requests.get(url, params=params)
            data = response.json()
            return Response(data, status=response.status_code)
        except requests.RequestException as e:
            return Response({"error": str(e)}, status=500)
        except json.JSONDecodeError:
            return Response({"error": "Invalid JSON response"}, status=500)

# Dodamo funkcijo za serviranje React frontend-a
from django.shortcuts import render
from django.views.generic import TemplateView
from django.views.decorators.cache import never_cache

index = never_cache(TemplateView.as_view(template_name='index.html'))

def serve_react(request, path=''):
    return render(request, 'index.html')