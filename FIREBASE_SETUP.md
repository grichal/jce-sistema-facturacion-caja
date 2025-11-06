# Configuración de Firebase

## Pasos para configurar Firebase

### 1. Crear archivo .env.local

Crea un archivo `.env.local` en la raíz del proyecto con el siguiente contenido:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=tu-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=tu-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=tu-measurement-id
```

### 2. Obtener las credenciales de Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto (o crea uno nuevo)
3. Ve a **Project Settings** (⚙️) > **General**
4. En la sección **"Your apps"**, selecciona la app web o crea una nueva
5. Copia las credenciales y pégalas en tu archivo `.env.local`

### 3. Configurar Firestore

1. En Firebase Console, ve a **Firestore Database**
2. Crea una base de datos (modo de prueba para desarrollo)
3. Configura las reglas de seguridad según tus necesidades

#### Reglas de Firestore (Ejemplo para desarrollo)

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

### 4. Estructura de la colección

La colección `servicios` se creará automáticamente al agregar el primer servicio. Cada documento tendrá la siguiente estructura:

```json
{
  "nombre": "Nombre del servicio",
  "descripcion": "Descripción del servicio",
  "precio": 1000.00,
  "activo": true
}
```

### 5. Verificar la configuración

Después de configurar Firebase:

1. Ejecuta `npm install` para instalar las dependencias
2. Ejecuta `npm run dev` para iniciar el servidor
3. Ve a la página de Servicios (`/servicios`)
4. Intenta crear un nuevo servicio para verificar que la conexión funciona

### Solución de problemas

- **Error: "Firebase no está inicializado"**: Verifica que todas las variables de entorno estén correctamente configuradas en `.env.local`
- **Error: "Permission denied"**: Verifica las reglas de seguridad de Firestore
- **Error: "Collection not found"**: La colección se creará automáticamente al agregar el primer documento

