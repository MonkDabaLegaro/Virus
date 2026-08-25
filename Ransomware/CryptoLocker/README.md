# CryptoLocker - Arquitectura Simulada Educativa

**ADVERTENCIA: Este documento y los archivos asociados son puramente educativos y simulados. No contienen código malicioso real. El estudio de malware debe realizarse en entornos controlados y legales para fines de investigación y defensa cibernética. No intentes ejecutar o replicar este código en sistemas reales.**

## Descripción Hipotética

CryptoLocker fue uno de los primeros ransomware de alto perfil, emergiendo en septiembre de 2013. Se distribuyó a través de correos electrónicos de phishing con adjuntos infectados, como archivos ZIP o ejecutables. Una vez infectado, cifraba archivos importantes del usuario y exigía un rescate en Bitcoin para proporcionar la clave de descifrado. Afectó a cientos de miles de víctimas en todo el mundo, generando millones de dólares en pagos. Fue desmantelado en 2014 por una operación conjunta de agencias internacionales, pero inspiró a numerosos imitadores. CryptoLocker marcó el inicio de la era moderna del ransomware, combinando cifrado fuerte con distribución masiva.

## Impacto Histórico

- Afectó a cientos de miles de víctimas globalmente.
- Generó millones en pagos de rescate.
- Llevó al desmantelamiento de su infraestructura C2.
- Inspiró la evolución del ransomware.

## Detección y Prevención

- **Detección**: Monitoreo de conexiones a C2, cambios en archivos, notas de rescate.
- **Prevención**: Filtros de email, backups offline, antivirus, educación anti-phishing.

## Arquitectura de Carpetas y Archivos Simulada

```
CryptoLocker/
├── README.md                    # Este archivo: explicación, arquitectura, diagramas
├── infection/                   # Módulo de infección inicial
│   ├── entry_point.py          # Punto de entrada simulado (phishing email)
│   └── dropper.py              # Desempaquetado y ejecución del payload
├── propagation/                 # Módulo de propagación (limitado, no lateral)
│   └── self_replication.py      # Auto-replicación vía USB o shares (opcional)
├── encryption/                  # Módulo de cifrado
│   ├── rsa_encrypt.py           # Cifrado RSA para archivos
│   └── key_management.py        # Gestión de claves públicas/privadas
├── c2/                          # Comunicación Command and Control
│   ├── c2_client.py             # Cliente para conectar a servidores C2
│   └── config.json              # Configuración C2 (lista de IPs)
├── persistence/                 # Persistencia en el sistema
│   ├── registry_mod.py          # Modificaciones al registro para startup
│   └── task_scheduler.py        # Tareas programadas para reinicio
└── config/                      # Configuraciones globales
    └── main_config.json         # Config principal (ransom amount, deadline)
```

### Descripciones Comentadas

- **infection/entry_point.py**: Simula descarga desde email phishing, verifica entorno.
- **infection/dropper.py**: Extrae y ejecuta el malware principal.
- **propagation/self_replication.py**: Copia a USB o shares de red (no agresivo como WannaCry).
- **encryption/rsa_encrypt.py**: Cifra archivos con RSA-2048.
- **encryption/key_management.py**: Genera y almacena claves.
- **c2/c2_client.py**: Envía info de infección y recibe comandos.
- **c2/config.json**: IPs de C2 hardcoded.
- **persistence/registry_mod.py**: Agrega entrada al registro para persistencia.
- **persistence/task_scheduler.py**: Crea tarea para ejecutar en login.
- **config/main_config.json**: Monto de rescate, tiempo límite.

## Aspectos Técnicos

- **Algoritmos de Cifrado**: RSA-2048 para cifrado asimétrico.
- **Métodos de Propagación**: Principalmente phishing; opcional auto-copia.
- **Estrategias de Evasión**: Ofuscación, anti-debugging, eliminación de logs.

## Flujo de Infección (Diagrama ASCII)

```
[Email Phishing] --> [Descarga Adjunto] --> [Ejecución Dropper]
       |                        |                        |
       v                        v                        v
[Verificación Entorno] --> [Conexión C2] --> [Generación Claves]
       |                        |                        |
       v                        v                        v
[Persistencia] --> [Cifrado Archivos] --> [Nota Rescate]
       |                        |                        |
       v                        v                        v
[Espera Pago] --> [Envío Clave Privada] --> [Desencriptación]
```

## Pseudocódigo para Cifrado

```python
# rsa_encrypt.py (simulado)
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import hashes

def encrypt_file(file_path, public_key):
    with open(file_path, 'rb') as f:
        data = f.read()
    encrypted = public_key.encrypt(data, padding.OAEP(mgf=padding.MGF1(algorithm=hashes.SHA256()), algorithm=hashes.SHA256(), label=None))
    with open(file_path + '.encrypted', 'wb') as f:
        f.write(encrypted)

# key_management.py (simulado)
def generate_keys():
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    public_key = private_key.public_key()
    return private_key, public_key
```

## Cómo Funciona (Alto Nivel)

CryptoLocker opera cifrando archivos con RSA, exigiendo rescate para la clave privada. Se propaga vía phishing, conecta a C2 para reportar, y persiste en el sistema. Si no paga, elimina la clave.

## Estrategias de Defensa para Empresas

Para contrarrestar amenazas como CryptoLocker, las empresas deben adoptar un enfoque proactivo:

- **Filtrado de Email y Concienciación**: Implementar filtros avanzados de email para bloquear adjuntos maliciosos y educar a empleados sobre phishing.

- **Backups Seguros**: Realizar backups regulares en ubicaciones offline o en la nube con encriptación, y verificar su restauración.

- **Actualizaciones y Antivirus**: Mantener software actualizado y usar antivirus con detección de ransomware.

- **Segmentación de Red**: Limitar el acceso a recursos críticos para contener infecciones.

- **Monitoreo Continuo**: Usar herramientas de EDR para detectar cifrado masivo o conexiones a C&C.

- **Políticas de Seguridad**: Prohibir la ejecución de software no autorizado y usar MFA.

- **Respuesta a Incidentes**: Tener un plan para aislar sistemas infectados y reportar incidentes.

- **Educación Continua**: Realizar simulacros de ataques para mejorar la preparación.

Al integrar estas estrategias, las organizaciones pueden minimizar el riesgo de ransomware y asegurar la continuidad del negocio.