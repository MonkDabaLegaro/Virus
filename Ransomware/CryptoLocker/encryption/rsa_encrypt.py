# rsa_encrypt.py (simulado)
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import hashes

def encrypt_file(file_path, public_key):
    with open(file_path, 'rb') as f:
        data = f.read()
    encrypted = public_key.encrypt(data, padding.OAEP(mgf=padding.MGF1(algorithm=hashes.SHA256()), algorithm=hashes.SHA256(), label=None))
    with open(file_path + '.encrypted', 'wb') as f:
        f.write(encrypted)
    # Nota: En simulación, no borra original