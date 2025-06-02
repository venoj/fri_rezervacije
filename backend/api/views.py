# backend/api/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
import requests
from django.conf import settings
import json
from rest_framework import status
import logging
import concurrent.futures

logger = logging.getLogger(__name__)

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

class BulkReservationsView(APIView):
    def get(self, request):
        # Get parameters from request
        start = request.GET.get('start')
        end = request.GET.get('end')
        reservable_ids = request.GET.getlist('reservable_ids[]')  # Get list of reservable IDs
        
        logger.info(f"Bulk reservations request - start: {start}, end: {end}, reservable_ids: {reservable_ids}")
        
        if not start or not end:
            error_msg = "Missing required parameters: start or end"
            logger.error(error_msg)
            return Response(
                {"error": error_msg},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not reservable_ids:
            error_msg = "Missing required parameter: reservable_ids"
            logger.error(error_msg)
            return Response(
                {"error": error_msg},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Make parallel requests for all reservables
            results = {}
            
            def fetch_reservations(reservable_id):
                try:
                    url = f"{settings.FRI_REZERVACIJE_URL}/reservations/"
                    params = {
                        'format': 'json',
                        'start': start,
                        'end': end,
                        'reservables': reservable_id
                    }
                    logger.debug(f"Fetching reservations for reservable {reservable_id} with params: {params}")
                    response = requests.get(url, params=params, timeout=5)
                    if response.status_code == 200:
                        data = response.json()
                        return reservable_id, data.get('results', [])
                    logger.warning(f"Failed to fetch reservations for reservable {reservable_id}: {response.status_code}")
                    return reservable_id, []
                except Exception as e:
                    logger.error(f"Error fetching reservations for reservable {reservable_id}: {str(e)}")
                    return reservable_id, []
            
            # Use ThreadPoolExecutor to make parallel requests
            with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
                future_to_id = {executor.submit(fetch_reservations, rid): rid for rid in reservable_ids}
                for future in concurrent.futures.as_completed(future_to_id):
                    reservable_id, reservations = future.result()
                    results[reservable_id] = reservations
            
            logger.info(f"Successfully fetched bulk reservations for {len(results)} reservables")
            return Response(results)
            
        except Exception as e:
            error_msg = f"Unexpected error in bulk reservations view: {str(e)}"
            logger.error(error_msg)
            return Response(
                {"error": error_msg},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

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

class ReservableDetailsView(APIView):
    def get(self, request, reservable_id):
        try:
            # Add format=json parameter to get JSON response
            url = f'https://rezervacije.fri.uni-lj.si/reservables/{reservable_id}/?format=json'
            response = requests.get(url)
            
            # Check if the response is successful
            if response.status_code == 404:
                return Response(
                    {'error': 'Reservable not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            response.raise_for_status()
            
            # Try to parse the response as JSON
            try:
                data = response.json()
                return Response(data)
            except json.JSONDecodeError:
                return Response(
                    {'error': 'Invalid JSON response from FRI API'},
                    status=status.HTTP_502_BAD_GATEWAY
                )
                
        except requests.RequestException as e:
            return Response(
                {'error': f'Error fetching reservable details: {str(e)}'},
                status=status.HTTP_502_BAD_GATEWAY
            )
        except Exception as e:
            return Response(
                {'error': f'Unexpected error: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ClassroomResourcesView(APIView):
    def get(self, request):
        try:
            url = f"{settings.FRI_REZERVACIJE_URL}/sets/rezervacije_fri/types/classroom/reservable_resources"
            params = {'format': 'json'}
            
            logger.info(f"Fetching classroom resources from: {url}")
            response = requests.get(url, params=params)
            
            if response.status_code == 404:
                logger.warning("Classroom resources not found")
                return Response(
                    {"error": "Classroom resources not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            response.raise_for_status()
            data = response.json()
            logger.info("Successfully fetched classroom resources")
            return Response(data)
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching classroom resources: {str(e)}")
            return Response(
                {"error": f"Error fetching classroom resources: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        except Exception as e:
            logger.error(f"Unexpected error: {str(e)}")
            return Response(
                {"error": f"Unexpected error: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# Dodamo funkcijo za serviranje React frontend-a
from django.shortcuts import render
from django.views.generic import TemplateView
from django.views.decorators.cache import never_cache

index = never_cache(TemplateView.as_view(template_name='index.html'))

def serve_react(request, path=''):
    return render(request, 'index.html')