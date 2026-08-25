# Petya - Arquitectura Simulada Educativa

**ADVERTENCIA: Este documento y los archivos asociados son puramente educativos y simulados. No contienen código malicioso real. El estudio de malware debe realizarse en entornos controlados y legales para fines de investigación y defensa cibernética. No intentes ejecutar o replicar este código en sistemas reales.**

## Descripción Hipotética

Petya es un ransomware que apareció en marzo de 2016 y se presentó como el "hermano" de WannaCry, aunque menos agresivo. Encripta el Master Boot Record (MBR) del disco duro, lo que hace que el sistema no pueda arrancar, y luego cifra archivos. Exige rescate en Bitcoin para proporcionar la clave de desencriptación. Afectó a empresas en Europa del Este y fue usado en ataques dirigidos. Inspiró variantes como NotPetya, que lo convirtieron en un wiper.

## Impacto Histórico

- Afectó a empresas en 2016.
- Demostró encriptación de MBR.
- Llevó a variantes destructivas.
- Causó pérdidas moderadas comparado con WannaCry.

## Detección y Prevención

- **Detección**: Pantalla de rescate al boot, archivos .petya.
- **Prevención**: Backups, parches, no ejecutar adjuntos.

## Arquitectura de Carpetas y Archivos Simulada

```
Petya/
├── README.md                    # Este archivo: explicación, arquitectura, diagramas
├── infection/                   # Módulo de infección inicial
│   ├── email_attach.py          # Adjunto email infectado
│   └── drive_by.py              # Infección drive-by
├── propagation/                 # Módulo de propagación
│   ├── local_spread.py          # Propagación local
│   └── network_share.py         # Uso de shares de red
├── encryption/                  # Módulo de cifrado
│   ├── mbr_encrypt.py           # Encripta MBR
│   └── file_encrypt.py          # Cifra archivos con AES
├── c2/                          # Comunicación Command and Control
│   ├── http_post.py             # Envía info a C2
│   └── config.json              # URLs C2
├── persistence/                 # Persistencia en el sistema
│   ├── boot_sector.py           # Modifica sector de boot
│   └── reg_key.py               # Entrada registro
└── config/                      # Configuraciones globales
    └── main_config.json         # Config (ransom, key)
```

### Descripciones Comentadas

- **infection/email_attach.py**: Ejecutable en email.
- **infection/drive_by.py**: Sitio web malicioso.
- **propagation/local_spread.py**: Copia a otros drives.
- **propagation/network_share.py**: Infecta shares.
- **encryption/mbr_encrypt.py**: Encripta MBR.
- **encryption/file_encrypt.py**: Cifra archivos.
- **c2/http_post.py**: Reporta a C2.
- **c2/config.json**: Config C2.
- **persistence/boot_sector.py**: Persiste en boot.
- **persistence/reg_key.py**: Registro.
- **config/main_config.json**: Monto rescate.

## Aspectos Técnicos

- **Algoritmos de Cifrado**: AES para archivos, salsa20 para MBR.
- **Métodos de Propagación**: Email, drive-by, shares.
- **Estrategias de Evasión**: Encriptación de boot, apariencia de ransomware.

## Flujo de Infección (Diagrama ASCII)

```
[Infección Inicial] --> [Encriptación MBR] --> [Reinicio Sistema]
         |                          |                          |
         v                          v                          v
[Pantalla Rescate] --> [Cifrado Archivos] --> [Espera Pago]
         |                          |                          |
         v                          v                          v
[Conexión C2] --> [Envío Clave] --> [Desencriptación]
```

## Pseudocódigo para Cifrado

```python
# mbr_encrypt.py (simulado)
def encrypt_mbr():
    # Leer MBR, encriptar con salsa20
    # Escribir de vuelta - PELIGROSO
    pass

# file_encrypt.py (simulado)
def encrypt_file(file_path, key):
    cipher = Cipher(algorithms.AES(key), modes.CBC(iv))
    # Encriptar archivo
    pass
```

## Cómo Funciona (Alto Nivel)

Petya encripta MBR para forzar rescate, luego archivos.

## Estrategias de Defensa para Empresas

- **Backups Regulares**: Offline.
- **Actualizaciones**: Parches OS.
- **Antivirus**: Detección de malware.
- **Educación**: Anti-phishing.
- **Monitoreo**: Detección de anomalías.

Enfocándose en estas, se previene Petya.