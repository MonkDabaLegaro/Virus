# DarkSide - Arquitectura Simulada Educativa

**ADVERTENCIA: Este documento y los archivos asociados son puramente educativos y simulados. No contienen código malicioso real. El estudio de malware debe realizarse en entornos controlados y legales para fines de investigación y defensa cibernética. No intentes ejecutar o replicar este código en sistemas reales.**

## Descripción Hipotética

DarkSide es un ransomware-as-a-service (RaaS) que emergió en 2020 y ganó notoriedad por el ataque a Colonial Pipeline en mayo de 2021, causando interrupciones en el suministro de combustible en EE.UU. Se distribuye a través de vulnerabilidades en RDP, phishing y exploits. Utiliza cifrado híbrido para bloquear datos y exige rescates en Bitcoin. DarkSide se enfoca en empresas grandes, filtrando datos si no pagan. Fue desmantelado temporalmente en 2021, pero variantes persisten.

## Impacto Histórico

- Ataque a Colonial Pipeline: Interrupción de combustible, rescate de $4.4M.
- Afectó a múltiples sectores críticos.
- Demostró riesgos de RaaS.
- Llevó a mejoras en ciberseguridad energética.

## Detección y Prevención

- **Detección**: Monitoreo de RDP, cifrado masivo, exfiltración de datos.
- **Prevención**: Parches RDP, MFA, backups, EDR.

## Arquitectura de Carpetas y Archivos Simulada

```
DarkSide/
├── README.md                    # Este archivo: explicación, arquitectura, diagramas
├── infection/                   # Módulo de infección inicial
│   ├── rdp_exploit.py          # Exploit para RDP vulnerable
│   └── initial_payload.py       # Payload inicial post-explotación
├── propagation/                 # Módulo de propagación
│   ├── network_scan.py         # Escaneo de red para hosts vulnerables
│   └── lateral_movement.py     # Movimiento lateral usando credenciales
├── encryption/                  # Módulo de cifrado
│   ├── hybrid_encrypt.py        # Cifrado híbrido AES+RSA
│   └── key_exchange.py          # Intercambio de claves con C2
├── c2/                          # Comunicación Command and Control
│   ├── tor_client.py            # Conexión a C2 vía Tor
│   └── config.json              # Config C2 (onion addresses)
├── persistence/                 # Persistencia en el sistema
│   ├── service_install.py       # Instalación como servicio
│   └── scheduled_task.py        # Tareas programadas
└── config/                      # Configuraciones globales
    └── main_config.json         # Config (ransom, data leak site)
```

### Descripciones Comentadas

- **infection/rdp_exploit.py**: Explota RDP expuesto para acceso inicial.
- **infection/initial_payload.py**: Descarga y ejecuta el ransomware.
- **propagation/network_scan.py**: Escanea red para vulnerabilidades.
- **propagation/lateral_movement.py**: Usa PsExec o similares para propagarse.
- **encryption/hybrid_encrypt.py**: Cifra con AES, encripta clave con RSA.
- **encryption/key_exchange.py**: Envía clave pública a C2.
- **c2/tor_client.py**: Comunica vía Tor para anonimato.
- **c2/config.json**: Direcciones onion para C2.
- **persistence/service_install.py**: Instala como servicio Windows.
- **persistence/scheduled_task.py**: Crea tarea para reinicio.
- **config/main_config.json**: Monto rescate, sitio de leak.

## Aspectos Técnicos

- **Algoritmos de Cifrado**: Híbrido AES-256 + RSA-4096.
- **Métodos de Propagación**: RDP brute-force, phishing, exploits conocidos.
- **Estrategias de Evasión**: Tor para C2, anti-forensics, data exfiltration.

## Flujo de Infección (Diagrama ASCII)

```
[Acceso Inicial (RDP/Phishing)] --> [Explotación] --> [Descarga Payload]
              |                              |                              |
              v                              v                              v
     [Escaneo Red] --> [Movimiento Lateral] --> [Exfiltración Datos]
              |                              |                              |
              v                              v                              v
     [Persistencia] --> [Cifrado Archivos] --> [Nota Rescate + Leak Threat]
              |                              |                              |
              v                              v                              v
     [Espera Pago] --> [Desencriptación] --> [Eliminación de Datos Filtrados]
```

## Pseudocódigo para Cifrado

```python
# hybrid_encrypt.py (simulado)
import os
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives.asymmetric import rsa, padding

def encrypt_file(file_path, public_key):
    aes_key = os.urandom(32)
    iv = os.urandom(16)
    cipher = Cipher(algorithms.AES(aes_key), modes.CBC(iv))
    encryptor = cipher.encryptor()
    with open(file_path, 'rb') as f:
        data = f.read()
    encrypted_data = encryptor.update(data) + encryptor.finalize()
    encrypted_key = public_key.encrypt(aes_key, padding.OAEP(mgf=padding.MGF1(algorithm=hashes.SHA256()), algorithm=hashes.SHA256(), label=None))
    with open(file_path + '.darkside', 'wb') as f:
        f.write(iv + encrypted_key + encrypted_data)

# key_exchange.py (simulado)
def send_public_key(public_key, c2_url):
    # Simula envío a C2
    pass
```

## Cómo Funciona (Alto Nivel)

DarkSide infecta vía RDP o phishing, exfiltra datos, cifra archivos, amenaza con leak si no paga. Usa Tor para C2.

## Estrategias de Defensa para Empresas

- **Parches y Actualizaciones**: Mantener RDP y software actualizados.
- **MFA y Acceso Restringido**: Usar MFA para RDP, limitar exposiciones.
- **Backups Offline**: Backups inmutables offline.
- **Monitoreo y Detección**: EDR para anomalías.
- **Segmentación**: Redes segmentadas para contener brechas.
- **Planes de Respuesta**: Preparación para incidentes, incluyendo negociación.

Enfocándose en estas, se reduce el riesgo de RaaS como DarkSide.