# Ryuk - Arquitectura Simulada Educativa

**ADVERTENCIA: Este documento y los archivos asociados son puramente educativos y simulados. No contienen código malicioso real. El estudio de malware debe realizarse en entornos controlados y legales para fines de investigación y defensa cibernética. No intentes ejecutar o replicar este código en sistemas reales.**

## Descripción Hipotética

Ryuk es un ransomware que emergió en agosto de 2018 y se convirtió en uno de los más destructivos, enfocado en empresas grandes. A menudo desplegado después de infecciones con TrickBot o Emotet, cifra archivos con algoritmos robustos y exige rescates de cientos de miles de dólares. Atacó a organizaciones como Universal Health Services y Hollywood Presbyterian Medical Center. Asociado con grupos norcoreanos o rusos, Ryuk ha causado pérdidas de miles de millones.

## Impacto Histórico

- Rescates de $10M+ en algunos casos.
- Afectó a hospitales y gobiernos.
- Asociado con campañas de APT.
- Evolución de ransomware empresarial.

## Detección y Prevención

- **Detección**: Archivos .ryuk, conexiones a C2.
- **Prevención**: EDR, backups, segmentación.

## Arquitectura de Carpetas y Archivos Simulada

```
Ryuk/
├── README.md                    # Este archivo: explicación, arquitectura, diagramas
├── infection/                   # Módulo de infección inicial
│   ├── loader_from_bot.py       # Loader desde botnet (TrickBot)
│   └── manual_deploy.py         # Despliegue manual post-acceso
├── propagation/                 # Módulo de propagación
│   ├── ps_exec_spread.py        # Uso de PsExec
│   └── admin_shares.py          # Abuso de shares
├── encryption/                  # Módulo de cifrado
│   ├── aes_rsa_hybrid.py        # Híbrido AES+RSA
│   └── key_handling.py          # Gestión de claves
├── c2/                          # Comunicación Command and Control
│   ├── https_beacon.py          # Beacons HTTPS
│   └── config.json              # IPs C2
├── persistence/                 # Persistencia en el sistema
│   ├── reg_run.py               # Registro Run
│   └── task_sched.py            # Programador de tareas
└── config/                      # Configuraciones globales
    └── main_config.json         # Config (ransom high, extensions)
```

### Descripciones Comentadas

- **infection/loader_from_bot.py**: Desde TrickBot.
- **infection/manual_deploy.py**: Acceso manual.
- **propagation/ps_exec_spread.py**: Propaga con PsExec.
- **propagation/admin_shares.py**: Shares admin.
- **encryption/aes_rsa_hybrid.py**: Cifra híbrido.
- **encryption/key_handling.py**: Claves.
- **c2/https_beacon.py**: Beacons a C2.
- **c2/config.json**: Config C2.
- **persistence/reg_run.py**: Registro.
- **persistence/task_sched.py**: Tareas.
- **config/main_config.json**: Monto alto.

## Aspectos Técnicos

- **Algoritmos de Cifrado**: AES-256 + RSA-4096.
- **Métodos de Propagación**: Post-botnet, lateral.
- **Estrategias de Evasión**: Anti-forensics, eliminación de backups.

## Flujo de Infección (Diagrama ASCII)

```
[Infección Inicial (Botnet)] --> [Despliegue Ryuk] --> [Propagación Lateral]
              |                              |                              |
              v                              v                              v
     [Cifrado Archivos] --> [Nota Rescate] --> [Espera Pago Alto]
              |                              |                              |
              v                              v                              v
     [Conexión C2] --> [Envío Clave] --> [Desencriptación]
```

## Pseudocódigo para Cifrado

```python
# aes_rsa_hybrid.py (simulado)
def encrypt_file(file_path, rsa_public):
    aes_key = os.urandom(32)
    iv = os.urandom(16)
    cipher = Cipher(algorithms.AES(aes_key), modes.CBC(iv))
    encryptor = cipher.encryptor()
    with open(file_path, 'rb') as f:
        data = f.read()
    encrypted_data = encryptor.update(data) + encryptor.finalize()
    encrypted_key = rsa_public.encrypt(aes_key, padding.OAEP(...))
    with open(file_path + '.ryuk', 'wb') as f:
        f.write(iv + encrypted_key + encrypted_data)

# key_handling.py (simulado)
def generate_keys():
    # RSA keys
    pass
```

## Cómo Funciona (Alto Nivel)

Ryuk llega vía botnets, propaga lateralmente, cifra con híbrido, exige rescates altos.

## Estrategias de Defensa para Empresas

- **EDR Empresarial**: Detección avanzada.
- **Backups Offline**: Inmutables.
- **Segmentación de Red**: Contener brechas.
- **Monitoreo Continuo**: Anomalías.
- **Educación**: Seguridad general.
- **Planes de Respuesta**: Negociación y recuperación.

Enfocándose en estas, se reduce riesgo de Ryuk.