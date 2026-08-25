# WannaCry - Arquitectura Simulada Educativa

**ADVERTENCIA: Este documento y los archivos asociados son puramente educativos y simulados. No contienen código malicioso real. El estudio de malware debe realizarse en entornos controlados y legales para fines de investigación y defensa cibernética. No intentes ejecutar o replicar este código en sistemas reales.**

## Descripción Hipotética

WannaCry es un ransomware notorio que surgió en mayo de 2017 y causó un brote global masivo. Atacó a organizaciones en más de 150 países, incluyendo hospitales, empresas y gobiernos, afectando a aproximadamente 200.000 computadoras. Este malware se basa en la explotación de una vulnerabilidad en el protocolo Server Message Block (SMB) de Microsoft Windows, conocida como EternalBlue, que fue originalmente desarrollada por la NSA y filtrada por el grupo Shadow Brokers. WannaCry no solo cifraba archivos, sino que también se propagaba rápidamente a través de redes, convirtiéndose en uno de los ciberataques más destructivos de la historia. Se estima que causó daños por miles de millones de dólares, destacando la importancia de la ciberseguridad en un mundo interconectado.

## Impacto Histórico

- Afectó a 200.000 sistemas en 150 países.
- Causó interrupciones en servicios críticos como hospitales (ej. NHS en Reino Unido).
- Demostró la vulnerabilidad de sistemas legacy sin parches.
- Llevó a mejoras globales en ciberseguridad y parches de Microsoft.

## Detección y Prevención

- **Detección**: Monitoreo de tráfico SMB inusual, cambios en registro, procesos de cifrado masivo.
- **Prevención**: Aplicar parches MS17-010, backups offline, segmentación de red, EDR.

## Arquitectura de Carpetas y Archivos Simulada

```
WannaCry/
├── README.md                    # Este archivo: explicación, arquitectura, diagramas
├── infection/                   # Módulo de infección inicial
│   ├── entry_point.py          # Punto de entrada simulado (phishing o exploit)
│   └── exploit_eternalblue.py  # Exploit para EternalBlue (SMBv1 vulnerabilidad)
├── propagation/                 # Módulo de propagación
│   ├── network_scan.py         # Escaneo de red para hosts vulnerables
│   └── lateral_movement.py     # Movimiento lateral dentro de la red
├── encryption/                  # Módulo de cifrado
│   ├── aes_encrypt.py          # Cifrado AES-128 para archivos
│   └── rsa_keygen.py           # Generación de claves RSA para encriptación híbrida
├── c2/                          # Comunicación Command and Control
│   ├── command_server.py      # Servidor C2 simulado (Tor o hardcoded IPs)
│   └── config.json             # Configuración C2 (IPs, puertos)
├── persistence/                 # Persistencia en el sistema
│   ├── registry_mod.py         # Modificaciones al registro de Windows
│   └── startup_script.py       # Scripts para reinicio automático
└── config/                      # Configuraciones globales
    └── main_config.json        # Config principal (kill switch, ransom amount)
```

### Descripciones Comentadas

- **infection/entry_point.py**: Simula la infección inicial vía phishing o descarga. Incluye verificación de kill switch.
- **infection/exploit_eternalblue.py**: Pseudocódigo para explotar MS17-010, inyectando payload en memoria.
- **propagation/network_scan.py**: Escanea red local/externa para IPs vulnerables usando SMB.
- **propagation/lateral_movement.py**: Usa credenciales robadas para propagarse a otros hosts.
- **encryption/aes_encrypt.py**: Implementa cifrado simétrico AES con claves derivadas de RSA.
- **encryption/rsa_keygen.py**: Genera par de claves pública/privada para encriptar la clave AES.
- **c2/command_server.py**: Conecta a servidores C2 para recibir comandos o enviar datos.
- **c2/config.json**: Lista de dominios/IPs para C2, con fallback.
- **persistence/registry_mod.py**: Modifica HKLM para ejecutar en startup.
- **persistence/startup_script.py**: Crea tareas programadas o servicios.
- **config/main_config.json**: Parámetros como monto de rescate, temporizador, kill switch domain.

## Aspectos Técnicos

- **Algoritmos de Cifrado**: Híbrido RSA+AES. RSA para encriptar clave AES, AES para archivos.
- **Métodos de Propagación**: EternalBlue (exploit remoto), DoublePulsar (backdoor), escaneo de shares SMB.
- **Estrategias de Evasión**: Kill switch (dominio registrado para detener), ofuscación de código, anti-VM.

## Flujo de Infección (Diagrama ASCII)

```
[Infección Inicial] --> [Exploit EternalBlue] --> [Inyección Payload]
       |                        |                        |
       v                        v                        v
[Verificar Kill Switch] --> [Escaneo de Red] --> [Propagación Lateral]
       |                        |                        |
       v                        v                        v
[Persistencia] --> [Cifrado de Archivos] --> [Nota de Rescate]
       |                        |                        |
       v                        v                        v
[Comunicación C2] --> [Espera Pago] --> [Desencriptación (si paga)]
```

## Pseudocódigo para Cifrado

```python
# aes_encrypt.py (simulado)
import os
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes

def encrypt_file(file_path, key):
    with open(file_path, 'rb') as f:
        data = f.read()
    iv = os.urandom(16)
    cipher = Cipher(algorithms.AES(key), modes.CBC(iv))
    encryptor = cipher.encryptor()
    encrypted = encryptor.update(data) + encryptor.finalize()
    with open(file_path + '.encrypted', 'wb') as f:
        f.write(iv + encrypted)
    # Nota: En realidad, borra original, pero simulado

# rsa_keygen.py (simulado)
from cryptography.hazmat.primitives.asymmetric import rsa

def generate_keys():
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    public_key = private_key.public_key()
    return private_key, public_key
```

## Cómo Funciona (Alto Nivel)

A alto nivel, WannaCry opera como un ransomware típico que infecta sistemas vulnerables, cifra los archivos del usuario y exige un rescate para restaurar el acceso. Utiliza exploits para propagarse lateralmente dentro de redes, aprovechando conexiones no seguras. Una vez activado, modifica el registro del sistema para persistir y comienza el proceso de cifrado, dejando una nota de rescate en la pantalla. Incluye un temporizador que aumenta el precio del rescate si no se paga a tiempo, y amenaza con borrar los archivos permanentemente. Aunque fue detenido temporalmente por un investigador que encontró un "kill switch" en el código, variantes posteriores han aparecido sin esta función.

## Estrategias de Defensa para Empresas

Para mitigar el riesgo de ataques similares a WannaCry, las empresas deben priorizar la prevención y la preparación:

- **Actualizaciones y Parches de Seguridad**: Mantener todos los sistemas operativos y software actualizados es crucial. Aplicar parches para vulnerabilidades conocidas, como la que explotó WannaCry, reduce significativamente el riesgo de infección.

- **Backups Regulares y Seguros**: Implementar una estrategia de respaldo 3-2-1 (tres copias en dos tipos de medios diferentes, con una copia off-site). Probar regularmente la restauración de backups para asegurar que sean efectivos en caso de ataque.

- **Segmentación de Red**: Dividir la red en segmentos aislados limita la propagación lateral del malware. Usar firewalls y controles de acceso para restringir el movimiento no autorizado dentro de la red.

- **Software de Seguridad**: Emplear soluciones antivirus avanzadas, endpoint detection and response (EDR) y firewalls de próxima generación que puedan detectar comportamientos maliciosos.

- **Educación y Concienciación**: Capacitar a los empleados sobre phishing, correos sospechosos y mejores prácticas de seguridad. Simulacros de ataques pueden ayudar a identificar vulnerabilidades humanas.

- **Monitoreo y Respuesta**: Implementar sistemas de monitoreo continuo para detectar anomalías. Tener un plan de respuesta a incidentes (IRP) que incluya aislamiento de sistemas infectados y notificación a autoridades si es necesario.

- **Actualizaciones de Políticas**: Revisar y actualizar políticas de seguridad, incluyendo el uso de VPN para accesos remotos y la restricción de software no autorizado.

Enfocándose en estas estrategias, las empresas pueden no solo prevenir ataques como WannaCry, sino también mejorar su resiliencia general ante amenazas cibernéticas emergentes.