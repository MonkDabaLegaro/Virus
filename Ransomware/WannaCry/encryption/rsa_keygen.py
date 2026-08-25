# ADVERTENCIA: Este es un archivo simulado educativo. No ejecutar en sistemas reales.
# Simula la generación de claves RSA para encriptación híbrida.

from cryptography.hazmat.primitives.asymmetric import rsa

def generate_keys():
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    public_key = private_key.public_key()
    return private_key, public_key

def encrypt_aes_key(public_key, aes_key):
    # Encriptar clave AES con RSA
    encrypted_key = public_key.encrypt(
        aes_key,
        padding.OAEP(mgf=padding.MGF1(algorithm=hashes.SHA256()), algorithm=hashes.SHA256(), label=None)
    )
    return encrypted_key

# Ejemplo
# priv, pub = generate_keys()
# enc_key = encrypt_aes_key(pub, b'16bytekey1234567')