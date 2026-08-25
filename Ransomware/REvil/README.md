# REvil (Sodinokibi) - Arquitectura Simulada Educativa

**ADVERTENCIA: Este documento y los archivos asociados son puramente educativos y simulados. No contienen código malicioso real. El estudio de malware debe realizarse en entornos controlados y legales para fines de investigación y defensa cibernética. No intentes ejecutar o replicar este código en sistemas reales.**

## Descripción Hipotética

REvil, también conocido como Sodinokibi, es un ransomware-as-a-service (RaaS) que emergió en abril de 2019. Se destacó por ataques a empresas como Acer, JBS Foods y Kaseya, causando interrupciones masivas. Utiliza cifrado híbrido y filtra datos para "double extortion". Operado por un grupo ruso, fue desmantelado por operaciones internacionales en enero de 2021. REvil era altamente rentable, con rescates de millones.

## Impacto Histórico

- Ataques a JBS (carne), Kaseya (software).
- Pérdidas de $100M+ en rescates.
- Desmantelado en 2021.
- Ejemplo de RaaS sofisticado.

## Detección y Prevención

- **Detección**: Exfiltración, cifrado, notas .revil.
- **Prevención**: EDR, backups, MFA.

## Arquitectura de Carpetas y Archivos Simulada

```
REvil/
├── README.md                    # Este archivo: explicación, arquitectura, diagramas
├── infection/                   # Módulo de infección inicial
│   ├── exploit_chain.py         # Cadena de exploits (RDP, etc.)
│   └── downloader.py            # Descarga payload
├── propagation/                 # Módulo de propagación
│   ├── lateral_move.py          # Movimiento lateral
│   └── worm_like.py             # Propagación automática
├── encryption/                  # Módulo de cifrado
│   ├── salsa20_encrypt.py       # Cifrado Salsa20
│   └── key_gen.py               # Generación de claves
├── c2/                          # Comunicación Command and Control
│   ├── tor_hidden.py            # Servicios ocultos Tor
│   └── config.json              # Config C2
├── persistence/                 # Persistencia en el sistema
│   ├── schtasks.py              # Tareas programadas
│   └── service_reg.py           # Registro como servicio
└── config/                      # Configuraciones globales
    └── main_config.json         # Config (ransom, affiliates)
```

### Descripciones Comentadas

- **infection/exploit_chain.py**: Exploits para acceso inicial.
- **infection/downloader.py**: Descarga ransomware.
- **propagation/lateral_move.py**: Propaga en red.
- **propagation/worm_like.py**: Auto-propagación.
- **encryption/salsa20_encrypt.py**: Cifra con Salsa20.
- **encryption/key_gen.py**: Claves únicas.
- **c2/tor_hidden.py**: C2 vía Tor.
- **c2/config.json**: Onion addresses.
- **persistence/schtasks.py**: Tareas schtasks.
- **persistence/service_reg.py**: Servicio.
- **config/main_config.json**: Monto, sitio leak.

## Aspectos Técnicos

- **Algoritmos de Cifrado**: Salsa20 para velocidad.
- **Métodos de Propagación**: Exploits, phishing, lateral.
- **Estrategias de Evasión**: Tor, ofuscación, anti-VM.

## Flujo de Infección (Diagrama ASCII)

```
[Acceso Inicial] --> [Exfiltración] --> [Cifrado Archivos]
         |                          |                          |
         v                          v                          v
[Persistencia] --> [Conexión C2] --> [Nota Rescate]
         |                          |                          |
         v                          v                          v
[Espera Pago] --> [Desencriptación] --> [Leak si no paga]
```

## Pseudocódigo para Cifrado

```python
# salsa20_encrypt.py (simulado)
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms

def encrypt_file(file_path, key):
    nonce = os.urandom(8)
    cipher = Cipher(algorithms.Salsa20(key, nonce), mode=None)
    encryptor = cipher.encryptor()
    with open(file_path, 'rb') as f:
        data = f.read()
    encrypted = encryptor.update(data)
    with open(file_path + '.revil', 'wb') as f:
        f.write(nonce + encrypted)

# key_gen.py (simulado)
def generate_key():
    return os.urandom(32)
```

## Cómo Funciona (Alto Nivel)

REvil infecta, exfiltra, cifra, exige rescate con amenaza de leak.

## Estrategias de Defensa para Empresas

- **EDR Avanzado**: Detección de ransomware.
- **Backups Inmutables**: Offline.
- **Segmentación**: Limitar propagación.
- **Monitoreo**: Anomalías de red.
- **Educación**: Phishing awareness.
- **Planes de Respuesta**: Para double extortion.

Enfocándose en estas, se mitiga REvil.