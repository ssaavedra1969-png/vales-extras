# FALPAT SRL - Sistema de Gestión de Vales

Sistema web para la gestión de vales de pago a empleados. Desarrollado con Next.js 14, Firebase y Tailwind CSS.

## Stack Tecnológico

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **UI Components**: shadcn/ui
- **Base de Datos**: Firebase Firestore (plan Spark)
- **Almacenamiento**: Firebase Storage
- **PDF**: @react-pdf/renderer
- **Excel**: SheetJS (xlsx)
- **Hosting**: Vercel (Hobby Plan)

## Requisitos Previos

1. Node.js 18+ instalado
2. Cuenta de Google (para Firebase)
3. Cuenta de GitHub
4. Cuenta de Vercel (gratuita)

## Configuración Paso a Paso

### 1. Clonar el repositorio

```bash
git clone https://github.com/TU_USUARIO/vales-falpat.git
cd vales-falpat
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Crear proyecto en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Haz clic en "Crear un proyecto"
3. Ingresa un nombre (ej: "vales-falpat")
4. Desactiva Google Analytics (opcional)
5. Espera a que se cree el proyecto

### 4. Habilitar servicios en Firebase

#### Authentication (opcional - no requerido para esta versión)
- En el menú izquierdo, ve a "Authentication"
- Haz clic en "Comenzar"
- En la pestaña "Sign-in method", habilita "Correo electrónico/contraseña"
- En la pestaña "Users", agrega usuarios de prueba

#### Firestore Database
- En el menú izquierdo, ve a "Firestore Database"
- Haz clic en "Crear base de datos"
- Selecciona "Iniciar en modo de prueba" (o "Modo producción" si prefieres)
- Elige una ubicación cercana (ej: "us-central1")
- Haz clic en "Listo"

#### Storage
- En el menú izquierdo, ve a "Storage"
- Haz clic en "Comenzar"
- Selecciona "Iniciar en modo de prueba"
- Haz clic en "Listo"

### 5. Obtener credenciales de Firebase

1. En Firebase Console, ve a "Configuración del proyecto" (ícono de engranaje)
2. Ve a la sección "Tus aplicaciones"
3. Haz clic en "Agregar app" y selecciona "Web"
4. Registra la app con un nombre (ej: "vales-falpat-web")
5. Copia los valores de `firebaseConfig` que aparecen

### 6. Configurar variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu-proyecto
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

### 7. Configurar Firebase Admin SDK (para API Routes)

Las API Routes del servidor usan Firebase Admin SDK para operaciones atómicas (contador de vales).

1. En Firebase Console, ve a "Configuración del proyecto" -> "Cuentas de servicio"
2. Haz clic en "Generar nueva clave privada"
3. Descarga el archivo JSON
4. Agrega estos valores a tu `.env.local`:
   - `FIREBASE_CLIENT_EMAIL`: el valor de `client_email` del JSON
   - `FIREBASE_PRIVATE_KEY`: el valor de `private_key` del JSON (entre comillas dobles)

### 8. Configurar reglas de seguridad

Copia y pega las siguientes reglas en la consola de Firebase:

#### Firestore Rules (firestore.rules)
Ve a Firestore -> Reglas y pega el contenido de `firestore.rules`.

#### Storage Rules (storage.rules)
Ve a Storage -> Reglas y pega el contenido de `storage.rules`.

### 9. Ejecutar en desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

### 10. Desplegar en Vercel

1. Sube el código a GitHub:
```bash
git init
git add .
git commit -m "Primer commit"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/vales-falpat.git
git push -u origin main
```

2. Ve a [Vercel](https://vercel.com/) e inicia sesión con GitHub

3. Haz clic en "Add New..." -> "Project"

4. Importa el repositorio `vales-falpat`

5. En "Environment Variables", agrega las mismas variables de `.env.local`

6. Haz clic en "Deploy"

7. ¡Listo! La app estará disponible en `https://vales-falpat.vercel.app`

## Estructura del Proyecto

```
/
├── app/
│   ├── api/
│   │   ├── config/route.ts        # API de configuración de empresa
│   │   ├── upload/route.ts        # API de carga de vales
│   │   └── vales/route.ts         # API de CRUD de vales
│   ├── dashboard/
│   │   ├── cargar/page.tsx        # Página de carga de Excel
│   │   ├── historial/page.tsx     # Página de historial
│   │   ├── descuentos/page.tsx    # Página de gestión de descuentos
│   │   └── configuracion/page.tsx # Página de configuración
│   ├── layout.tsx                 # Layout principal
│   ├── page.tsx                   # Página de inicio (redirige al dashboard)
│   └── globals.css                # Estilos globales
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx            # Barra lateral
│   │   └── Header.tsx             # Encabezado
│   ├── ui/                        # Componentes shadcn/ui
│   └── vale/
│       └── ValeTemplate.tsx       # Plantilla PDF del vale
├── lib/
│   ├── firebase/
│   │   ├── config.ts              # Configuración de Firebase
│   │   ├── firestore.ts           # Operaciones Firestore
│   │   ├── storage.ts             # Operaciones Storage
│   │   └── admin.ts               # Admin SDK (server)
│   ├── excel/
│   │   └── parser.ts              # Parseo de Excel
│   └── pdf/
│       ├── generator.tsx          # Generación de PDF
│       └── numero-letras.ts       # Conversión de números a letras
├── types/
│   └── index.ts                   # Interfaces de TypeScript
└── contexts/
    └── AuthContext.tsx             # Contexto de autenticación
```

## Uso del Sistema

### Cargar Excel
1. Ve a "Cargar Excel" en el menú lateral
2. Arrastra un archivo .xlsx o .xls con 3 columnas: Nombre, Monto, Fecha de pago
3. Revisa la previsualización de datos
4. Haz clic en "Confirmar carga"
5. Los PDFs se generan automáticamente y se descargan en un ZIP

### Historial
1. Ve a "Historial" para ver todos los vales generados
2. Usa los filtros para buscar por empleado o estado
3. Haz clic en "Cambiar estado" para marcar un vale como firmado o descontado
4. Haz clic en el ícono de ojo para ver el PDF

### Gestión de Descuentos
1. Ve a "Gestión de Descuentos"
2. Selecciona el mes deseado
3. Marca los vales que se descontarán
4. Haz clic en "Descontar seleccionados"
5. Exporta el reporte en Excel con "Exportar Excel"

### Configuración
1. Ve a "Configuración"
2. Completa los datos de la empresa
3. Haz clic en "Guardar configuración"
4. Estos datos aparecerán en los PDFs de los vales

## Formato del Archivo Excel

El archivo debe tener las siguientes columnas:

| Columna A | Columna B | Columna C |
|-----------|-----------|-----------|
| Nombre    | Monto     | Fecha     |
| Ej: Juan Pérez | Ej: 1500.50 | Ej: 15/06/2026 |

- Columna A: Nombre del empleado (texto)
- Columna B: Monto solicitado (número con dos decimales)
- Columna C: Fecha de pago (formato dd/mm/yyyy)

## Límites del Plan Gratuito

### Firebase (Spark Plan)
- **Firestore**: 50k lecturas/día, 20k escrituras/día, 1 GiB almacenamiento
- **Storage**: 5 GB almacenamiento, 1 GB descargas/día
- **Authentication**: 10k usuarios/mes

### Vercel (Hobby Plan)
- **Ancho de banda**: 100 GB/mes
- **Tiempo de ejecución**: 10 segundos por función serverless
- **Builds**: 6,000 minutos/mes

## Licencia

Uso interno para FALPAT SRL.
