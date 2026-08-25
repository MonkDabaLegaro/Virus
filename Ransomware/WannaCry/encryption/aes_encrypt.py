# ADVERTENCIA: Este es un archivo simulado educativo. No ejecutar en sistemas reales.
# Simula el cifrado AES-128 para archivos.

import os
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes

def encrypt_file(file_path, key):
    with open(file_path, 'rb') as f:
        data = f.read()
    iv = os.urandom(16)
    cipher = Cipher(algorithms.AES(key), modes.CBC(iv))
    encryptor = cipher.encryptor()
    encrypted = encryptor.update(data) + encryptor.finalize()
    with open(file_path + '.wannacry', 'wb') as f:
        f.write(iv + encrypted)
    # os.remove(file_path)  # Simulado, no borrar

def decrypt_file(file_path, key):
    with open(file_path, 'rb') as f:
        iv = f.read(16)
        encrypted = f.read()
    cipher = Cipher(algorithms.AES(key), modes.CBC(iv))
    decryptor = cipher.decryptor()
    decrypted = decryptor.update(encrypted) + decryptor.finalize()
    with open(file_path[:-9], 'wb') as f:  # Remover .wannacry
        f.write(decrypted)

# Ejemplo
# key = os.urandom(16)
# encrypt_file("test.txt", key)