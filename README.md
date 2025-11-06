# Sistema de Facturación Fiscal (Next.js)

Sistema de Facturación Fiscal construido con **Next.js 14**, **React**, **TypeScript** y **Firebase**.

## Características

✅ **Vista de Impresión de Recibo Fiscal** - Muestra la información fiscal requerida legalmente
✅ **Gestión de Servicios** - CRUD completo de servicios con Firebase
✅ **Sidebar de Navegación** - Menú lateral para navegar entre secciones
✅ **Integración con Firebase** - Base de datos en tiempo real

## Tecnologías

- **Next.js 14** - Framework de React con App Router
- **React 18** - Biblioteca de UI
- **TypeScript** - Tipado estático
- **Firebase** - Base de datos y servicios backend
- **CSS Modules** - Estilos modulares

## Instalación

1. Instala las dependencias:
```bash
npm install
```

2. Configura Firebase:
   - Crea un archivo `.env.local` en la raíz del proyecto
   - Copia el contenido de `.env.local.example` (si existe) o crea uno nuevo
   - Agrega tus credenciales de Firebase:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=tu-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=tu-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=tu-measurement-id
```

   - Puedes encontrar estas credenciales en tu Firebase Console > Project Settings > General > Your apps

3. Configura Firestore:
   - En Firebase Console, ve a Firestore Database
   - Crea una base de datos en modo de prueba o producción
   - Crea una colección llamada `servicios` (opcional, se creará automáticamente al agregar el primer servicio)

4. Ejecuta el servidor de desarrollo:
```bash
npm run dev
```

5. Abre [http://localhost:3000](http://localhost:3000) en tu navegador

## Estructura del Proyecto

```
├── app/
│   ├── components/
│   │   ├── MainLayout.tsx              # Layout principal con sidebar
│   │   ├── MainLayout.module.css
│   │   ├── Sidebar.tsx                 # Componente del menú lateral
│   │   ├── Sidebar.module.css
│   │   ├── ReciboFiscal.tsx            # Componente del recibo fiscal
│   │   └── ReciboFiscal.module.css
│   ├── servicios/
│   │   ├── page.tsx                    # Página de gestión de servicios
│   │   └── page.module.css
│   ├── recibo-fiscal/
│   │   └── page.tsx                    # Página de vista de impresión
│   ├── layout.tsx                      # Layout raíz
│   ├── page.tsx                        # Página principal (dashboard)
│   ├── page.module.css
│   └── globals.css                     # Estilos globales
├── lib/
│   └── firebase/
│       └── config.ts                   # Configuración de Firebase
├── public/
│   └── data.json                       # Datos de ejemplo del recibo
├── package.json
├── next.config.js
├── tsconfig.json
└── .env.local                          # Variables de entorno (crear manualmente)
```

## Funcionalidades

### Página Principal
- Dashboard con información general
- Acceso rápido a las diferentes secciones

### Servicios
- **Listar servicios**: Ver todos los servicios registrados
- **Crear servicio**: Agregar nuevos servicios con nombre, descripción y precio
- **Editar servicio**: Modificar servicios existentes
- **Eliminar servicio**: Remover servicios del sistema
- **Estado activo/inactivo**: Controlar la disponibilidad de servicios

### Vista de Impresión
- **Número de Comprobante Fiscal (NCF)** asignado
- **RNC/Cédula del cliente**
- **Monto Bruto**
- **Desglose del Impuesto (ITBIS)**
- **Monto Total**
- Impresión directa y generación de PDF

## Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm start` - Inicia el servidor de producción
- `npm run lint` - Ejecuta el linter

## Configuración de Firebase

### Obtener las credenciales

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto (o crea uno nuevo)
3. Ve a Project Settings (⚙️) > General
4. En la sección "Your apps", selecciona la app web o crea una nueva
5. Copia las credenciales y pégalas en tu archivo `.env.local`

### Configurar Firestore

1. En Firebase Console, ve a Firestore Database
2. Crea una base de datos (modo de prueba para desarrollo)
3. Configura las reglas de seguridad según tus necesidades
4. La colección `servicios` se creará automáticamente al agregar el primer servicio

### Reglas de Firestore (Ejemplo para desarrollo)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /servicios/{document=**} {
      allow read, write: if true; // Solo para desarrollo
    }
  }
}
```

**⚠️ Importante**: En producción, configura reglas de seguridad apropiadas.

## Notas

- Los datos del recibo fiscal provienen de un archivo JSON local (`public/data.json`)
- Los servicios se almacenan en Firebase Firestore
- El formato del recibo cumple con los requisitos legales para comprobantes fiscales en República Dominicana
- La aplicación es responsive y optimizada para impresión
- Todos los componentes están construidos con TypeScript para mayor seguridad de tipos

## Próximas Funcionalidades

- Gestión de clientes
- Sistema de facturación completo
- Generación automática de NCF
- Historial de facturas
- Reportes y estadísticas
