export interface EnvironmentComponent {
  name: string
  version?: string
  quantity: number
  details?: string
}

export interface Milestone {
  id: string
  number: number
  title: string
  description: string
  components: EnvironmentComponent[]
}

export interface Phase {
  id: string
  number: number
  title: string
  description: string
  milestones: Milestone[]
}

export const phases: Phase[] = [
  {
    id: "fase-1",
    number: 1,
    title: "Fase 1 - Fundamentos",
    description: "Configuracion inicial del entorno vSphere, networking y almacenamiento",
    milestones: [
      {
        id: "f1-m1",
        number: 1,
        title: "Introduccion al Labo",
        description: "Familiarizacion con el entorno de laboratorio vSphere. Conocer la interfaz de vCenter y las operaciones basicas de administracion.",
        components: [
          { name: "ESXi Host", version: "7.0.3", quantity: 2 },
          { name: "vCenter Server", version: "7.0.3", quantity: 1 },
          { name: "TrueNAS", quantity: 1 }
        ]
      },
      {
        id: "f1-m2",
        number: 2,
        title: "Configuracion NFS y iSCSI",
        description: "Configurar datastores NFS e iSCSI para almacenamiento compartido entre los hosts ESXi.",
        components: [
          { name: "ESXi Host", version: "7.0.3", quantity: 2 },
          { name: "vCenter Server", version: "7.0.3", quantity: 1 },
          { name: "TrueNAS", quantity: 1 }
        ]
      },
      {
        id: "f1-m3",
        number: 3,
        title: "Configuracion del VDS",
        description: "Implementar y configurar un Virtual Distributed Switch para la gestion centralizada de redes.",
        components: [
          { name: "ESXi Host", version: "7.0.3", quantity: 2 },
          { name: "vCenter Server", version: "7.0.3", quantity: 1 },
          { name: "TrueNAS", quantity: 1 }
        ]
      },
      {
        id: "f1-m4",
        number: 4,
        title: "Servicios del Cluster",
        description: "Configurar servicios de cluster como HA (High Availability) y DRS (Distributed Resource Scheduler).",
        components: [
          { name: "ESXi Host", version: "7.0.3", quantity: 2 },
          { name: "vCenter Server", version: "7.0.3", quantity: 1 },
          { name: "TrueNAS", quantity: 1 },
          { name: "Windows Server", version: "2019", quantity: 1 }
        ]
      },
      {
        id: "f1-m5",
        number: 5,
        title: "NTP Server",
        description: "Configurar sincronizacion de tiempo mediante servidor NTP publico para todos los componentes del entorno.",
        components: [
          { name: "ESXi Host", version: "7.0.3", quantity: 2 },
          { name: "vCenter Server", version: "7.0.3", quantity: 1 },
          { name: "TrueNAS", quantity: 1 }
        ]
      },
      {
        id: "f1-m6",
        number: 6,
        title: "Upgrade a vCenter y ESXi 8.0.2",
        description: "Realizar el proceso de upgrade de vCenter Server y hosts ESXi desde la version 7.0.3 a 8.0.2.",
        components: [
          { name: "ESXi Host", version: "7.0.3", quantity: 2 },
          { name: "vCenter Server", version: "7.0.3", quantity: 1 },
          { name: "TrueNAS", quantity: 1 }
        ]
      },
      {
        id: "f1-m7",
        number: 7,
        title: "Configuracion de Alarmas",
        description: "Crear y configurar alarmas personalizadas para monitorear el estado del entorno vSphere.",
        components: [
          { name: "ESXi Host", version: "7.0.3", quantity: 2 },
          { name: "vCenter Server", version: "7.0.3", quantity: 1 },
          { name: "TrueNAS", quantity: 1 }
        ]
      },
      {
        id: "f1-m8",
        number: 8,
        title: "Update a vCenter y ESXi 8.0.3",
        description: "Aplicar actualizaciones de vCenter Server y hosts ESXi a la version 8.0.3.",
        components: [
          { name: "ESXi Host", version: "7.0.3", quantity: 2 },
          { name: "vCenter Server", version: "7.0.3", quantity: 1 },
          { name: "TrueNAS", quantity: 1 }
        ]
      },
      {
        id: "f1-m9",
        number: 9,
        title: "Configuracion de vSAN",
        description: "Implementar y configurar un cluster vSAN con almacenamiento definido por software.",
        components: [
          { name: "ESXi Host", version: "8.0.3", quantity: 4 },
          { name: "vCenter Server", version: "8.0.3", quantity: 1 },
          { name: "Discos adicionales", quantity: 3, details: "3 hosts con: 4x8GB, 2x25GB, 2x40GB" }
        ]
      }
    ]
  },
  {
    id: "fase-2",
    number: 2,
    title: "Fase 2 - Administracion",
    description: "Backup, snapshots, gestion de usuarios y almacenamiento avanzado",
    milestones: [
      {
        id: "f2-m1",
        number: 1,
        title: "Backup y Restore",
        description: "Realizar backup del vCenter Server, aplicar cambios en el entorno y restaurar para verificar el proceso de recuperacion.",
        components: [
          { name: "ESXi Host", version: "8.0.3", quantity: 2 },
          { name: "vCenter Server", version: "8.0.3", quantity: 1 },
          { name: "TrueNAS", quantity: 1 }
        ]
      },
      {
        id: "f2-m2",
        number: 2,
        title: "Snapshots de VMs",
        description: "Crear snapshots de maquinas virtuales, realizar modificaciones y revertir para comprender el funcionamiento de los snapshots.",
        components: [
          { name: "ESXi Host", version: "8.0.3", quantity: 2 },
          { name: "vCenter Server", version: "8.0.3", quantity: 1 },
          { name: "TrueNAS", quantity: 1 },
          { name: "Windows Server", quantity: 1 }
        ]
      },
      {
        id: "f2-m3",
        number: 3,
        title: "Gestion de Usuarios",
        description: "Crear usuarios locales, configurar permisos y habilitar el inicio de sesion sin dominio.",
        components: [
          { name: "ESXi Host", version: "8.0.3", quantity: 2 },
          { name: "vCenter Server", version: "8.0.3", quantity: 1 }
        ]
      },
      {
        id: "f2-m4",
        number: 4,
        title: "Almacenamiento Adicional",
        description: "Agregar y configurar almacenamiento adicional en los hosts ESXi.",
        components: [
          { name: "ESXi Host", version: "8.0.3", quantity: 2, details: "Disco adicional de 10GB por host" },
          { name: "vCenter Server", version: "8.0.3", quantity: 1 }
        ]
      },
      {
        id: "f2-m5",
        number: 5,
        title: "Expansion vSAN",
        description: "Expandir el cluster vSAN existente agregando capacidad de almacenamiento adicional.",
        components: [
          { name: "ESXi Host", version: "8.0.3", quantity: 4, details: "Disco adicional de 10GB por host" },
          { name: "vCenter Server", version: "8.0.3", quantity: 1 },
          { name: "vSAN Cluster", quantity: 1, details: "Preconfigurado" }
        ]
      },
      {
        id: "f2-m6",
        number: 6,
        title: "Administracion Avanzada",
        description: "Tareas avanzadas de administracion del entorno vSphere.",
        components: [
          { name: "ESXi Host", version: "8.0.3", quantity: 2 },
          { name: "vCenter Server", version: "8.0.3", quantity: 1 }
        ]
      }
    ]
  },
  {
    id: "fase-3",
    number: 3,
    title: "Fase 3 - Performance y Avanzado",
    description: "Gestion de recursos, rendimiento y configuraciones multi-vCenter",
    milestones: [
      {
        id: "f3-m1",
        number: 1,
        title: "Resource Management y Shares",
        description: "Configurar shares de recursos, ejecutar scripts de saturacion y analizar el comportamiento de la contencion de recursos.",
        components: [
          { name: "ESXi Host", version: "8.0.3", quantity: 2 },
          { name: "vCenter Server", version: "8.0.3", quantity: 1 },
          { name: "Ubuntu Desktop", quantity: 2, details: "Para scripts de saturacion" }
        ]
      },
      {
        id: "f3-m2",
        number: 2,
        title: "Evaluacion de Rendimiento I",
        description: "Evaluar y analizar el rendimiento del entorno vSphere mediante herramientas de monitoreo.",
        components: [
          { name: "ESXi Host", version: "8.0.3", quantity: 2 },
          { name: "vCenter Server", version: "8.0.3", quantity: 1 }
        ]
      },
      {
        id: "f3-m3",
        number: 3,
        title: "Evaluacion de Rendimiento II",
        description: "Continuacion del analisis de rendimiento con escenarios mas complejos.",
        components: [
          { name: "ESXi Host", version: "8.0.3", quantity: 2 },
          { name: "vCenter Server", version: "8.0.3", quantity: 1 }
        ]
      },
      {
        id: "f3-m4",
        number: 4,
        title: "Evaluacion de Rendimiento III",
        description: "Escenarios avanzados de evaluacion de rendimiento. El appliance debe levantarse en el playground.",
        components: [
          { name: "ESXi Host", version: "8.0.3", quantity: 2 },
          { name: "vCenter Server", version: "8.0.3", quantity: 1 }
        ]
      },
      {
        id: "f3-m5",
        number: 5,
        title: "Linked Mode - Multi vCenter",
        description: "Configurar Enhanced Linked Mode conectando dos vCenter Server para administracion centralizada.",
        components: [
          { name: "ESXi Host", version: "8.0.3", quantity: 3 },
          { name: "vCenter Server", version: "8.0.3", quantity: 2, details: "Para configurar Linked Mode" }
        ]
      }
    ]
  }
]
