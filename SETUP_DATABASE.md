# 🚀 Configuración de Base de Datos - Neon PostgreSQL

## Paso 1: Crear cuenta en Neon (Gratis)

1. Ve a **https://console.neon.tech**
2. Click en "Sign Up" (puedes usar GitHub para registrarte más rápido)
3. Crea un nuevo proyecto:
   - Nombre: `grabados-express`
   - Región: `AWS US East` (o la más cercana a Argentina)

## Paso 2: Obtener la URL de conexión

1. En el dashboard de Neon, ve a **Dashboard** → **Connection Details**
2. Asegúrate de que está seleccionado **Pooled connection**
3. Copia el **Connection string** completo

Se ve algo así:
```
postgresql://neondb_owner:abc123xyz@ep-cool-name-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
```

## Paso 3: Configurar el servidor

1. Abre el archivo `server/.env`
2. Reemplaza la línea `DATABASE_URL` con tu connection string:

```env
DATABASE_URL=postgresql://TU_USUARIO:TU_PASSWORD@TU_HOST.neon.tech/neondb?sslmode=require
```

## Paso 4: Ejecutar migraciones

En la terminal, ejecuta:

```bash
cd server
npm run migrate
```

Esto creará todas las tablas necesarias en tu base de datos.

## Paso 5: Iniciar el servidor

```bash
npm run dev
```

El servidor estará disponible en `http://localhost:3001`

## Paso 6: Iniciar el frontend

En otra terminal:

```bash
cd ..  # volver a la raíz del proyecto
npm run dev
```

El frontend estará disponible en `http://localhost:3000`

---

## 🔧 Verificar que funciona

1. Abre `http://localhost:3000` en tu navegador
2. Ve a la sección "Asistente"
3. Crea un pedido de prueba
4. Ve a "Pedidos" y verifica que aparece
5. Recarga la página - el pedido debe persistir

## 📱 Acceso desde múltiples dispositivos

Para que dos personas accedan desde diferentes dispositivos:

### Desarrollo Local (misma red WiFi)
1. Obtén tu IP local: `ipconfig` en Windows
2. Ambos pueden acceder usando `http://TU_IP:3000`

### Producción (recomendado)
1. Deploy el frontend en **Vercel** 
2. Deploy el servidor en **Render** o **Railway**
3. Ambos acceden desde cualquier lugar con la URL de Vercel

---

## ❓ Troubleshooting

### Error de conexión a la base de datos
- Verifica que el `DATABASE_URL` esté correcto
- Asegúrate de que no tenga espacios extra
- Neon usa SSL, asegúrate de incluir `?sslmode=require`

### Los pedidos no se guardan
- Abre la consola del navegador (F12)
- Busca errores de red o de API
- Verifica que el servidor esté corriendo en puerto 3001
