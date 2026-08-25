# c2_client.py - Simulación de cliente C2
# Envía info de infección y recibe comandos.

import requests

def connect_c2(url):
    response = requests.get(url)
    print(f"Conectado a C2: {response.status_code}")

def send_info(info):
    # Simular envío
    print(f"Enviando info: {info}")

def main():
    url = "http://c2.example.com"
    connect_c2(url)
    send_info("Infection successful")

if __name__ == "__main__":
    main()