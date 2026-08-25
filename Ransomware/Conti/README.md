# Conti - Arquitectura Simulada Educativa

**ADVERTENCIA: Este documento y los archivos asociados son puramente educativos y simulados. No contienen código malicioso real. El estudio de malware debe realizarse en entornos controlados y legales para fines de investigación y defensa cibernética. No intentes ejecutar o replicar este código en sistemas reales.**

## Descripción Hipotética

Conti es un ransomware-as-a-service (RaaS) que emergió en 2020, operado por un grupo criminal ruso conocido como Wizard Spider. Este malware se destaca por su enfoque en la doble extorsión: no solo cifra los archivos de las víctimas, sino que también roba datos sensibles y amenaza con publicarlos si no se paga el rescate. Conti ha atacado a numerosas organizaciones, incluyendo hospitales, gobiernos y empresas multinacionales, causando pérdidas significativas. Utiliza técnicas avanzadas como phishing dirigido, explotación de vulnerabilidades RDP y propagación lateral, convirtiéndose en uno de los ransomware más prolíficos de los últimos años. Se estima que ha generado cientos de millones de dólares en rescates, destacando los riesgos de la cibercriminalidad organizada.

## Impacto Histórico

- Afectó a miles de organizaciones en múltiples sectores.
- Causó interrupciones en servicios críticos, incluyendo atención médica.
- Introdujo la táctica de doble extorsión a gran escala.
- Llevó a mejoras en regulaciones de ciberseguridad y cooperación internacional.

## Detección y Prevención

- **Detección**: Monitoreo de tráfico RDP inusual, cambios en archivos, comunicaciones C2.
- **Prevención**: Parches de seguridad, MFA, backups offline, segmentación de red, EDR.

## Arquitectura de Carpetas y Archivos Simulada

```
Conti/
├── README.md                    # Este archivo: explicación, arquitectura, diagramas
├── infection/                   # Módulo de infección inicial
│   ├── main.py                  # Punto de entrada simulado (phishing o exploit RDP)
│   └── config.json              # Configuración de infección (URLs, credenciales)
├── propagation/                 # Módulo de propagación
│   ├── main.py                  # Propagación lateral y escaneo de red
│   └── config.json              # Configuración de propagación (dominios, puertos)
├── encryption/                  # Módulo de cifrado
│   ├── main.py                  # Cifrado híbrido RSA+AES
│   └── config.json              # Configuración de cifrado (algoritmos, extensiones)
├── c2/                          # Comunicación Command and Control
│   ├── main.py                  # Servidor C2 simulado (Tor o hardcoded)
│   └── config.json              # Configuración C2 (IPs, claves)
├── persistence/                 # Persistencia en el sistema
│   ├── main.py                  # Modificaciones para persistencia
│   └── config.json              # Configuración de persistencia (registros, tareas)
```

### Descripciones Comentadas

- **infection/main.py**: Simula la infección inicial vía phishing o explotación RDP. Incluye verificación de entorno.
- **infection/config.json**: Parámetros para URLs de descarga y credenciales iniciales.
- **propagation/main.py**: Escanea red y propaga a hosts vulnerables usando credenciales robadas.
- **propagation/config.json**: Lista de dominios y puertos para escaneo.
- **encryption/main.py**: Implementa cifrado híbrido para archivos y datos robados.
- **encryption/config.json**: Extensiones de archivos a cifrar, algoritmos usados.
- **c2/main.py**: Maneja comunicaciones con servidores C2 para comandos y exfiltración.
- **c2/config.json**: IPs y claves para C2, con encriptación.
- **persistence/main.py**: Modifica registro y crea tareas para reinicio automático.
- **persistence/config.json**: Claves de registro y nombres de tareas.

## Aspectos Técnicos

- **Algoritmos de Cifrado**: Híbrido RSA+AES, con ChaCha20 para datos exfiltrados.
- **Métodos de Propagación**: Phishing, RDP exploits, PsExec, WMI.
- **Estrategias de Evasión**: Ofuscación, anti-VM, doble extorsión.

## Flujo de Infección (Diagrama ASCII)

```
[Infección Inicial] --> [Explotación RDP/Phishing] --> [Inyección Payload]
       |                        |                        |
       v                        v                        v
[Exfiltración Datos] --> [Escaneo de Red] --> [Propagación Lateral]
       |                        |                        |
       v                        v                        v
[Persistencia] --> [Cifrado de Archivos] --> [Nota de Rescate]
       |                        |                        |
       v                        v                        v
[Comunicación C2] --> [Amenaza de Publicación] --> [Pago/Desencriptación]
```

## Pseudocódigo para Cifrado

```python
# encryption/main.py (simulado)
import os
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives.asymmetric import rsa

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
    # Simular encriptación de clave AES con RSA
    encrypted_key = rsa_public_key.encrypt(aes_key, padding.OAEP(...))
    with open(file_path + '.conti', 'wb') as f:
        f.write(iv + encrypted + encrypted_key)
    # Nota: En realidad, borra original, pero simulado
```

## Cómo Funciona (Alto Nivel)

Conti opera como un RaaS que infecta sistemas a través de vectores iniciales como correos phishing o accesos RDP no seguros. Una vez dentro, exfiltra datos sensibles antes de cifrar archivos, amenazando con publicar la información robada. Se propaga lateralmente en redes, persiste mediante modificaciones al sistema y comunica con C2 para recibir actualizaciones o enviar datos. El rescate se exige en criptomonedas, con un temporizador que aumenta el precio.

## Estrategias de Defensa para Empresas

- **Actualizaciones y Parches**: Mantener sistemas actualizados, especialmente RDP.
- **Backups Seguros**: Estrategia 3-2-1 con backups offline.
- **Segmentación de Red**: Limitar propagación lateral.
- **Software de Seguridad**: Antivirus, EDR, firewalls.
- **Educación**: Entrenamiento anti-phishing.
- **Monitoreo**: Detección de anomalías y respuesta rápida.

Enfocándose en estas estrategias, las empresas pueden mitigar riesgos de ransomware como Conti.