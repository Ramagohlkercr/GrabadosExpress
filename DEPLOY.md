# 🚀 Guía de Deploy - GrabadosExpress

## Arquitectura
- **Frontend**: React + Vite → Vercel o Netlify
- **Backend**: Node.js + Express → Railway o Render
- **Base de datos**: PostgreSQL → Railway, Supabase, o Neon

---

## 1️⃣ Deploy del Backend (Railway)

### Opción A: Railway (Recomendado)

1. Ir a [railway.app](https://railway.app) y crear cuenta con GitHub
2. Click "New Project" → "Deploy from GitHub"
3. Seleccionar el repositorio y carpeta `/server`
4. Agregar PostgreSQL: "Add Plugin" → "PostgreSQL"
5. Configurar variables de entorno:
   ```
   NODE_ENV=production
   JWT_SECRET=tu-clave-secreta-muy-larga
   CORS_ORIGIN=https://grabados-express.vercel.app
   ```
6. Railway auto-detecta el Dockerfile o usa el package.json

### Opción B: Render

1. Ir a [render.com](https://render.com)
2. "New" → "Web Service"
3. Conectar repo y configurar:
   - Root Directory: `server`
   - Build Command: `npm install`
   - Start Command: `npm start`
4. Agregar PostgreSQL desde el dashboard
5. Configurar las mismas variables de entorno

---

## 2️⃣ Deploy del Frontend (Vercel)

### Opción A: Vercel (Recomendado)

1. Ir a [vercel.com](https://vercel.com)
2. "Import Project" → Seleccionar repo de GitHub
3. Configurar:
   - Framework Preset: **Vite**
   - Root Directory: `.` (raíz)
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Variables de entorno:
   ```
   VITE_API_URL=https://tu-backend.railway.app/api
   ```
5. Deploy!

### Opción B: Netlify

1. Ir a [netlify.com](https://netlify.com)
2. "Add new site" → "Import an existing project"
3. Conectar GitHub y seleccionar repo
4. Ya está configurado en `netlify.toml`
5. Agregar variable de entorno:
   ```
   VITE_API_URL=https://tu-backend.railway.app/api
   ```

---

## 3️⃣ Configurar Base de Datos

### Correr migraciones

Después de tener la DB creada, correr:

```bash
cd server
npm run migrate
```

O desde Railway/Render ejecutar el comando manualmente.

---

## 4️⃣ Verificar Deploy

1. **Backend**: Visitar `https://tu-backend.railway.app/api/health`
   - Debería responder `{ "status": "ok" }`

2. **Frontend**: Visitar tu URL de Vercel/Netlify
   - Debería cargar la app y conectar al backend

---

## 🔧 Troubleshooting

### Error CORS
- Verificar que `CORS_ORIGIN` en el backend tenga la URL exacta del frontend
- No incluir `/` al final de la URL

### Error de conexión a DB
- Verificar `DATABASE_URL` tiene el formato correcto
- Railway provee la variable automáticamente si usás su PostgreSQL

### Frontend no conecta al backend
- Verificar `VITE_API_URL` esté configurada correctamente
- Después de cambiar variables, hacer redeploy

---

## 📦 Scripts útiles

```bash
# Desarrollo local
npm run dev          # Frontend en http://localhost:3000
cd server && npm run dev  # Backend en http://localhost:3001

# Build para producción
npm run build        # Genera carpeta /dist

# Migraciones
cd server && npm run migrate
```

---

## 🔐 Seguridad

- [ ] Cambiar `JWT_SECRET` a una clave segura (32+ caracteres)
- [ ] Configurar `CORS_ORIGIN` solo con tu dominio
- [ ] No subir archivos `.env` al repositorio
- [ ] Usar HTTPS en producción
