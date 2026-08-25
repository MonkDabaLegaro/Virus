# Locky - Arquitectura Simulada Educativa

**ADVERTENCIA: Este documento y los archivos asociados son puramente educativos y simulados. No contienen código malicioso real. El estudio de malware debe realizarse en entornos controlados y legales para fines de investigación y defensa cibernética. No intentes ejecutar o replicar este código en sistemas reales.**

## Descripción Hipotética

Locky es un ransomware que apareció en febrero de 2016 y se convirtió en uno de los más prolíficos de su tiempo. Se distribuye principalmente a través de correos electrónicos de phishing con adjuntos maliciosos, como documentos de Word con macros habilitadas. Una vez ejecutado, cifra los archivos del usuario y exige un rescate en Bitcoin para restaurar el acceso. Locky ha evolucionado a través de varias variantes, incluyendo variantes como Zepto y Osiris. Ha afectado a individuos y empresas en todo el mundo, causando pérdidas significativas. Su éxito radica en la combinación de ingeniería social y técnicas de cifrado robustas, lo que lo hace un ejemplo clásico de ransomware distribuido por email.

## Impacto Histórico

- Afectó a millones de víctimas en 2016-2017.
- Generó cientos de millones en rescates.
- Evolucionó en variantes como Osiris.
- Destacó el riesgo de macros en documentos.

## Detección y Prevención

- **Detección**: Archivos .locky, notas de rescate, conexiones a C2.
- **Prevención**: Deshabilitar macros, filtros email, backups.

## Arquitectura de Carpetas y Archivos Simulada

```
Locky/
├── README.md                    # Este archivo: explicación, arquitectura, diagramas
├── infection/                   # Módulo de infección inicial
│   ├── macro_dropper.py        # Macro en documento que descarga payload
│   └── downloader.py            # Descarga el ejecutable principal
├── propagation/                 # Módulo de propagación (limitado)
│   └── email_spread.py          # Envío de emails infectados (opcional)
├── encryption/                  # Módulo de cifrado
│   ├── aes_encrypt.py           # Cifrado AES para archivos
│   └── rsa_keygen.py            # Generación de claves RSA
├── c2/                          # Comunicación Command and Control
│   ├── http_client.py           # Conexión HTTP a C2
│   └── config.json              # URLs de C2
├── persistence/                 # Persistencia en el sistema
│   ├── autorun_reg.py           # Entrada en registro para startup
│   └── startup_folder.py        # Archivo en carpeta startup
└── config/                      # Configuraciones globales
    └── main_config.json         # Config (ransom, extensions)
```

### Descripciones Comentadas

- **infection/macro_dropper.py**: Macro VBA que descarga el malware.
- **infection/downloader.py**: Ejecuta y persiste el ransomware.
- **propagation/email_spread.py**: Robo de contactos y envío de emails.
- **encryption/aes_encrypt.py**: Cifra archivos con AES.
- **encryption/rsa_keygen.py**: Genera claves para encriptar AES key.
- **c2/http_client.py**: Reporta infección y recibe updates.
- **c2/config.json**: Lista de URLs C2.
- **persistence/autorun_reg.py**: Modifica registro para auto-ejecución.
- **persistence/startup_folder.py**: Copia a carpeta startup.
- **config/main_config.json**: Extensiones a cifrar, monto rescate.

## Aspectos Técnicos

- **Algoritmos de Cifrado**: Híbrido AES + RSA.
- **Métodos de Propagación**: Phishing con macros; opcional spam.
- **Estrategias de Evasión**: Ofuscación de macros, anti-VM.

## Flujo de Infección (Diagrama ASCII)

```
[Email con Adjunto] --> [Habilitar Macro] --> [Descarga Payload]
         |                          |                          |
         v                          v                          v
[Ejecución] --> [Persistencia] --> [Conexión C2]
         |                          |                          |
         v                          v                          v
[Cifrado Archivos] --> [Nota Rescate] --> [Espera Pago]
         |                          |                          |
         v                          v                          v
[Temporizador] --> [Aumento Precio] --> [Desencriptación si paga]
```

## Pseudocódigo para Cifrado

```python
# aes_encrypt.py (simulado)
import os
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes

def encrypt_file(file_path, key):
    iv = os.urandom(16)
    cipher = Cipher(algorithms.AES(key), modes.CBC(iv))
    encryptor = cipher.encryptor()
    with open(file_path, 'rb') as f:
        data = f.read()
    encrypted = encryptor.update(data) + encryptor.finalize()
    with open(file_path + '.locky', 'wb') as f:
        f.write(iv + encrypted)

# rsa_keygen.py (simulado)
from cryptography.hazmat.primitives.asymmetric import rsa

def generate_keys():
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    public_key = private_key.public_key()
    return private_key, public_key
```

## Cómo Funciona (Alto Nivel)

Locky infecta vía macros en emails, cifra archivos con AES/RSA, muestra nota de rescate con temporizador.

## Estrategias de Defensa para Empresas

Para protegerse contra ransomware como Locky, las empresas deben implementar múltiples capas de defensa:

- **Filtrado de Correos Electrónicos**: Usar gateways de email con filtrado avanzado para detectar y bloquear adjuntos maliciosos y enlaces sospechosos.

- **Educación y Concienciación**: Entrenar a empleados para reconocer correos de phishing, evitar abrir adjuntos desconocidos y no habilitar macros en documentos no confiables.

- **Backups Regulares**: Mantener backups offline o en la nube con versiones inmutables, y probar la restauración periódicamente.

- **Software de Seguridad**: Implementar antivirus con capacidades de detección de ransomware, endpoint protection y firewalls.

- **Actualizaciones de Software**: Mantener sistemas y aplicaciones actualizados para cerrar vulnerabilidades que podrían ser explotadas.

- **Segmentación de Red**: Aislar segmentos de red para prevenir la propagación lateral si ocurre una infección.

- **Monitoreo y Respuesta**: Usar herramientas de SIEM para detectar comportamientos anómalos y tener un plan de respuesta a incidentes preparado.

- **Políticas de Acceso**: Aplicar el principio de menor privilegio y usar MFA para reducir el riesgo de infección inicial.

Al enfocarse en la prevención a través de la educación y la tecnología, las empresas pueden significativamente reducir el riesgo de ataques de ransomware por email.