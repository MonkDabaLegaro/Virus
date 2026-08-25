# NotPetya - Arquitectura Simulada Educativa

**ADVERTENCIA: Este documento y los archivos asociados son puramente educativos y simulados. No contienen código malicioso real. El estudio de malware debe realizarse en entornos controlados y legales para fines de investigación y defensa cibernética. No intentes ejecutar o replicar este código en sistemas reales.**

## Descripción Hipotética

NotPetya, también conocido como Petya.A o GoldenEye, es un malware destructivo que se presentó como ransomware en junio de 2017, pero en realidad actuaba como un wiper diseñado para causar daño permanente. Atacó principalmente a empresas ucranianas, pero se extendió globalmente, afectando a compañías como Maersk, Merck y FedEx. Se estima que causó pérdidas de más de 10 mil millones de dólares. A diferencia de ransomware tradicionales, NotPetya no tenía una función de descifrado viable; su objetivo principal era la disrupción. Fue atribuido a hackers rusos, posiblemente con motivaciones geopolíticas, y destacó cómo el malware puede usarse como arma cibernética.

## Impacto Histórico

- Pérdidas de $10B+ en 2017.
- Afectó a 65 países.
- Atribuido a GRU ruso.
- Demostró malware como arma geopolítica.

## Detección y Prevención

- **Detección**: Sobrescritura MBR, pantalla falsa de rescate.
- **Prevención**: Parches EternalBlue, backups offline.

## Arquitectura de Carpetas y Archivos Simulada

```
NotPetya/
├── README.md                    # Este archivo: explicación, arquitectura, diagramas
├── infection/                   # Módulo de infección inicial
│   ├── medoc_update.py          # Compromete actualización MeDoc
│   └── eternalblue.py           # Exploit EternalBlue
├── propagation/                 # Módulo de propagación
│   ├── ps_exec.py               # Uso de PsExec para lateral
│   └── admin_share.py           # Abuso de shares administrativos
├── encryption/                  # Módulo de cifrado (destructivo)
│   ├── mbr_overwrite.py         # Sobrescribe MBR
│   └── fake_encrypt.py          # Simula cifrado (no reversible)
├── c2/                          # Comunicación Command and Control
│   ├── kill_switch.py           # Verifica kill switch
│   └── config.json              # IPs C2 (si aplica)
├── persistence/                 # Persistencia (mínima, destructivo)
│   └── self_delete.py           # Auto-eliminación tras daño
└── config/                      # Configuraciones globales
    └── main_config.json         # Config (kill switch domain)
```

### Descripciones Comentadas

- **infection/medoc_update.py**: Infecta vía actualización software.
- **infection/eternalblue.py**: Explota SMB para acceso.
- **propagation/ps_exec.py**: Propaga usando PsExec.
- **propagation/admin_share.py**: Abusa de ADMIN$ shares.
- **encryption/mbr_overwrite.py**: Destruye MBR.
- **encryption/fake_encrypt.py**: Pantalla falsa.
- **c2/kill_switch.py**: Verifica dominio para detener.
- **c2/config.json**: Config C2.
- **persistence/self_delete.py**: Borra trazas.
- **config/main_config.json**: Dominio kill switch.

## Aspectos Técnicos

- **Algoritmos de Cifrado**: Ninguno real; destructivo.
- **Métodos de Propagación**: EternalBlue, PsExec.
- **Estrategias de Evasión**: Kill switch, apariencia de ransomware.

## Flujo de Infección (Diagrama ASCII)

```
[Infección Inicial (MeDoc)] --> [Exploit EternalBlue] --> [Propagación Lateral]
              |                              |                              |
              v                              v                              v
     [Sobrescritura MBR] --> [Pantalla Falsa] --> [Daño Permanente]
              |                              |                              |
              v                              v                              v
     [Kill Switch Check] --> [Auto-Delete] --> [Sin Recuperación]
```

## Pseudocódigo para "Cifrado"

```python
# mbr_overwrite.py (simulado, peligroso - no ejecutar)
def overwrite_mbr():
    # Código para escribir en sector 0 del disco
    # Esto destruiría el sistema - SIMULADO
    pass

# fake_encrypt.py (simulado)
def show_fake_ransom():
    print("Your files are encrypted. Pay to recover.")
    # En realidad, no hay desencriptación
```

## Cómo Funciona (Alto Nivel)

NotPetya infecta vía software comprometido, propaga con EternalBlue, destruye MBR, muestra pantalla falsa.

## Estrategias de Defensa para Empresas

Para defenderse contra amenazas como NotPetya, las empresas deben enfocarse en capas de seguridad:

- **Actualizaciones y Parches**: Aplicar parches de seguridad inmediatamente para vulnerabilidades conocidas, especialmente en sistemas Windows.

- **Backups Offline**: Mantener backups desconectados de la red para evitar que el malware los afecte. Verificar la integridad de los backups regularmente.

- **Segmentación y Control de Acceso**: Usar redes segmentadas y principios de menor privilegio para limitar la propagación.

- **Monitoreo de Amenazas**: Implementar herramientas de detección de intrusiones y análisis de comportamiento para identificar actividades sospechosas.

- **Educación del Personal**: Entrenar a empleados para reconocer phishing y evitar descargas de software no confiable.

- **Planes de Respuesta**: Desarrollar y probar planes de contingencia para restaurar sistemas rápidamente.

- **Colaboración con Expertos**: En caso de infección, consultar con especialistas en ciberseguridad y reportar a autoridades relevantes.

Priorizando estas medidas, las organizaciones pueden reducir el impacto de ataques destructivos y mejorar su postura de seguridad general.