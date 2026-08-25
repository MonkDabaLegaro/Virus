# key_management.py (simulado)
from cryptography.hazmat.primitives.asymmetric import rsa

def generate_keys():
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    public_key = private_key.public_key()
    return private_key, public_key