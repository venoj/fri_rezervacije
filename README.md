# FRI Rezervacije

Aplikacija za prikaz rezervacij na Fakulteti za računalništvo in informatiko Univerze v Ljubljani.

## Opis projekta

Aplikacija omogoča pregled rezervacij učilnic, vozil in drugih rezervabilnih objektov na FRI. Sestavljena je iz Django backend-a, ki deluje kot proxy za FRI rezervacijski sistem, in React frontend-a za prikaz podatkov.

## Tehnične zahteve

- Python 3.8 ali novejši
- Node.js in npm
- Dostop do interneta (za komunikacijo z FRI rezervacijskim sistemom)

## Namestitev in zagon

### Avtomatična namestitev

1. Prenesi projekt in navigiraj v korensko mapo projekta
2. Daj pravice za izvajanje skripti za namestitev:
   ```
   chmod +x setup.sh
   ```
3. Zaženi skripto za namestitev:
   ```
   ./setup.sh
   ```

### Ročna namestitev

1. Ustvari virtualno okolje za Python in ga aktiviraj:
   ```
   python -m venv venv
   source venv/bin/activate  # Za Windows: venv\Scripts\activate
   ```

2. Namesti potrebne Python pakete:
   ```
   pip install django djangorestframework django-cors-headers requests
   ```

3. Inicializiraj bazo podatkov:
   ```
   cd backend
   python manage.py migrate
   ```

4. Namesti React odvisnosti in zgradi frontend:
   ```
   cd ../frontend
   npm install
   npm run build
   ```

5. Zaženi razvojni strežnik:
   ```
   cd ../backend
   python manage.py runserver
   ```

6. Aplikacija bo dostopna na naslovu http://localhost:8000

## Struktura projekta

- `backend/` - Django aplikacija, ki deluje kot proxy za FRI rezervacijski sistem
  - `api/` - Django aplikacija z API endpointi
  - `rezervacije_fri/` - Django projektna mapa
- `frontend/` - React aplikacija za prikaz rezervacij
  - `src/` - Izvorna koda React aplikacije
  - `build/` - Zgrajena React aplikacija (generirana po `npm run build`)

## API Endpointi

Aplikacija izpostavlja naslednje API endpointe:

- `GET /api/reservations/` - Vrne rezervacije glede na podane parametre
  - Parametri: `start`, `end`, `reservables`
- `GET /api/sets/{set_name}/types/{type_name}/reservables/` - Vrne rezervabilne objekte glede na nabor in tip
- `GET /api/sets/` - Vrne vse nabore rezervabilnih objektov
- `GET /api/proxy/{path}/` - Splošen proxy za dostop