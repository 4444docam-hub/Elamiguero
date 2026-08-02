# FriendApp - Conoce Nuevos Amigos

Aplicación móvil para conocer nuevos amigos con chat en tiempo real con Supabase, emparejamiento por deslizamiento (swipe) y gestión de perfiles.

## Características

- **Autenticación**: Inicio de sesión y registro con Supabase Auth
- **Gestión de perfil**: Operaciones CRUD con Supabase Storage para imágenes
- **Emparejamiento por swipe**: Desliza a la derecha para enviar solicitud de amistad, a la izquierda para omitir
- **Chat en tiempo real**: Supabase Realtime para mensajería en vivo
- **Compartir imágenes**: Envía imágenes en los chats mediante Supabase Storage
- **Solicitudes de amistad**: Acepta o rechaza solicitudes
- **Insignias de no leídos**: Notificaciones numéricas en la barra de pestañas (mensajes no leídos y solicitudes pendientes)

## Stack Tecnológico

### Base de datos y backend
- **Supabase** - Alternativa open source a Firebase
  - Base de datos PostgreSQL
  - Supabase Auth (autenticación JWT)
  - Supabase Storage (subida de archivos)
  - Supabase Realtime (suscripciones WebSocket)
  - Seguridad a nivel de fila (RLS)

### Frontend (móvil)
- React Native con Expo
- React Navigation para la navegación
- Supabase JS Client
- Expo Image Picker
- AsyncStorage para la persistencia de la sesión

## Estructura del proyecto

```
friend-app/
├── supabase/
│   └── schema.sql           # Esquema de la base de datos y políticas
├── mobile/
│   ├── src/
│   │   ├── context/
│   │   │   ├── AuthContext.js          # Contexto de autenticación
│   │   │   └── NotificationContext.js  # Contexto de notificaciones (insignias)
│   │   ├── navigation/
│   │   │   └── AppNavigator.js         # Configuración de navegación
│   │   ├── screens/
│   │   │   ├── LoginScreen.js
│   │   │   ├── RegisterScreen.js
│   │   │   ├── HomeScreen.js           # Tarjetas de swipe
│   │   │   ├── ProfileScreen.js
│   │   │   ├── ChatListScreen.js
│   │   │   ├── ChatScreen.js           # Chat en tiempo real
│   │   │   └── FriendsScreen.js
│   │   ├── services/
│   │   │   ├── api.js                  # Llamadas a la API de Supabase
│   │   │   └── supabase.js             # Configuración del cliente de Supabase
│   │   └── utils/
│   │       └── constants.js
│   ├── App.js
│   ├── app.json
│   └── package.json
└── README.md
```

## Requisitos previos

- Node.js (v16 o superior)
- Expo CLI (`npm install -g expo-cli`)
- Cuenta de Supabase (https://supabase.com)
- Android Studio o Xcode para emuladores

## Instrucciones de configuración

### 1. Crear un proyecto de Supabase

1. Ve a https://supabase.com y crea un nuevo proyecto
2. Anota tu **URL del proyecto** y tu **Anon Key** en Configuración > API

### 2. Configurar el esquema de la base de datos

1. Ve al Editor SQL en el Dashboard de Supabase
2. Copia y ejecuta el contenido de `supabase/schema.sql`
3. Esto creará todas las tablas, políticas y buckets de almacenamiento

### 3. Configurar la app móvil

```bash
cd friend-app/mobile
npm install
```

Edita `src/utils/constants.js` con tus credenciales de Supabase:

```javascript
export const SUPABASE_URL = 'https://TU_PROYECTO.supabase.co';
export const SUPABASE_ANON_KEY = 'TU_ANON_KEY';
```

### 4. Ejecutar la app

```bash
expo start
```

Escanea el código QR con la app Expo Go (Android) o la cámara (iOS).

## Esquema de la base de datos

### Tablas

| Tabla | Descripción |
|-------|-------------|
| `profiles` | Perfiles de usuario (extiende auth.users) |
| `friend_requests` | Solicitudes de amistad pendientes |
| `friendships` | Amistades aceptadas |
| `conversations` | Conversaciones de chat |
| `conversation_participants` | Miembros de la conversación |
| `messages` | Mensajes del chat |

### Buckets de almacenamiento

| Bucket | Propósito |
|--------|-----------|
| `profile-images` | Fotos de perfil de los usuarios |
| `chat-images` | Imágenes compartidas en el chat |

## Seguridad a nivel de fila (RLS)

Todas las tablas tienen RLS habilitado con políticas:
- Los usuarios solo pueden ver/editar su propio perfil
- Los usuarios solo pueden ver sus propias solicitudes de amistad
- Los usuarios solo pueden acceder a las conversaciones en las que participan
- Los usuarios solo pueden enviar mensajes a sus conversaciones

## Suscripciones en tiempo real

La app usa Supabase Realtime para:
- Nuevos mensajes en conversaciones activas
- Solicitudes de amistad entrantes

## Licencia

MIT
