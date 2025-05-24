#!/bin/bash
# setup.sh - Skripta za namestitev in zagon FRI Rezervacij

# Preveri, če je Python nameščen
if ! command -v python >/dev/null 2>&1; then
    echo "Python ni nameščen. Prosim namesti Python 3.8 ali novejši."
    exit 1
fi

# Preveri, če je Node.js nameščen
if ! command -v node >/dev/null 2>&1; then
    echo "Node.js ni nameščen. Prosim namesti Node.js."
    exit 1
fi

# Preveri, če je npm nameščen
if ! command -v npm >/dev/null 2>&1; then
    echo "npm ni nameščen. Prosim namesti npm."
    exit 1
fi

# Ustvari virtualno okolje
echo "Ustvarjam virtualno okolje..."
python -m venv venv
source venv/bin/activate || (echo "Napaka pri aktivaciji virtualnega okolja." && exit 1)

# Namesti Python odvisnosti
echo "Nameščam Python odvisnosti..."
pip install django djangorestframework django-cors-headers requests

# Inicializiraj bazo podatkov
echo "Inicializiram bazo podatkov..."
cd backend
python manage.py migrate

# Namesti React odvisnosti in build
echo "Nameščam React odvisnosti in gradim frontend..."
cd ../frontend
npm install
npm run build

# Zaženi razvojni strežnik
echo "Zaganjam razvojni strežnik..."
cd ../backend
python manage.py runserver