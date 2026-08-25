# Maze - Arquitectura Simulada Educativa

**ADVERTENCIA: Este documento y los archivos asociados son puramente educativos y simulados. No contienen código malicioso real. El estudio de malware debe realizarse en entornos controlados y legales para fines de investigación y defensa cibernética. No intentes ejecutar o replicar este código en sistemas reales.**

## Descripción Hipotética

Maze es un ransomware que emergió en mayo de 2019 y se destacó por su táctica de "double extortion": primero exfiltra datos sensibles, luego los cifra, y amenaza con publicar los datos si no se paga el rescate. Atacó a empresas como Allied Universal y Cognizant, causando pérdidas significativas. Maze evolucionó de ransomware a una operación más amplia, colaborando con otros grupos. Fue responsable de filtrar datos de víctimas no pagadoras, lo que aumentó la presión para pagar.

## Impacto Histórico

- Afectó a docenas de empresas en 2019-2020.
- Introdujo "double extortion".
- Colaboró con grupos como Egregor.
- Causó pérdidas de cientos de millones.

## Detección y Prevención

- **Detección**: Exfiltración de datos, cifrado masivo, notas de rescate.
- **Prevención**: Monitoreo de egress, backups, EDR.

## Arquitectura de Carpetas y Archivos Simulada

```
Maze/
├── README.md                    # Este archivo: explicación, arquitectura, diagramas
├── infection/                   # Módulo de infección inicial
│   ├── phishing_link.py        # Enlace phishing que descarga loader
│   └── loader.py                # Loader que instala el ransomware
├── propagation/                 # Módulo de propagación
│   ├── network_enum.py          # Enumeración de red
│   └── lateral_spread.py        # Propagación lateral
├── encryption/                  # Módulo de cifrado
│   ├── cha_cha_encrypt.py       # Cifrado ChaCha20
│   └── key_mgmt.py              # Gestión de claves
├── c2/                          # Comunicación Command and Control
│   ├── https_client.py          # Conexión HTTPS a C2
│   └── config.json              # IPs/URLs C2
├── persistence/                 # Persistencia en el sistema
│   ├── reg_persist.py           # Persistencia vía registro
│   └── service_persist.py       # Como servicio
└── config/                      # Configuraciones globales
    └── main_config.json         # Config (ransom, leak site)
```

### Descripciones Comentadas

- **infection/phishing_link.py**: Simula enlace que descarga malware.
- **infection/loader.py**: Ejecuta y configura el payload.
- **propagation/network_enum.py**: Escanea red para hosts.
- **propagation/lateral_spread.py**: Usa exploits para moverse.
- **encryption/cha_cha_encrypt.py**: Cifra con ChaCha20.
- **encryption/key_mgmt.py**: Genera y envía claves.
- **c2/https_client.py**: Comunica con C2.
- **c2/config.json**: Config C2.
- **persistence/reg_persist.py**: Modifica registro.
- **persistence/service_persist.py**: Instala servicio.
- **config/main_config.json**: Monto, sitio leak.

## Aspectos Técnicos

- **Algoritmos de Cifrado**: ChaCha20 para velocidad.
- **Métodos de Propagación**: Phishing, exploits RDP, movimiento lateral.
- **Estrategias de Evasión**: Exfiltración previa, anti-detección.

## Flujo de Infección (Diagrama ASCII)

```
[Phishing/Inicial] --> [Exfiltración Datos] --> [Cifrado Archivos]
         |                          |                          |
         v                          v                          v
[Persistencia] --> [Conexión C2] --> [Nota Rescate + Threat Leak]
         |                          |                          |
         v                          v                          v
[Espera Pago] --> [Desencriptación] --> [Eliminación Datos Filtrados]
```

## Pseudocódigo para Cifrado

```python
# cha_cha_encrypt.py (simulado)
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes

def encrypt_file(file_path, key):
    nonce = os.urandom(16)
    cipher = Cipher(algorithms.ChaCha20(key, nonce), mode=None)
    encryptor = cipher.encryptor()
    with open(file_path, 'rb') as f:
        data = f.read()
    encrypted = encryptor.update(data)
    with open(file_path + '.maze', 'wb') as f:
        f.write(nonce + encrypted)

# key_mgmt.py (simulado)
def generate_key():
    return os.urandom(32)
```

## Cómo Funciona (Alto Nivel)

Maze exfiltra datos primero, luego cifra, amenaza con publicar si no paga.

## Estrategias de Defensa para Empresas

- **Monitoreo de Datos**: Detectar exfiltración inusual.
- **Backups Seguros**: Offline e inmutables.
- **Segmentación**: Limitar movimiento lateral.
- **EDR y Antivirus**: Detección de ransomware.
- **Educación**: Anti-phishing.
- **Planes de Respuesta**: Para double extortion.

Enfocándose en estas, se mitiga Maze y similares.