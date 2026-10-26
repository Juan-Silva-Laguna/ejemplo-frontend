# Frontend de notas: HTML, CSS y JavaScript en Vercel

Este repositorio contiene un sitio estatico en HTML, CSS y JavaScript. `index.html` es el menu principal; `notas.html` y `categorias.html` son paginas separadas; `landing-pages/` contiene otras paginas HTML de ejemplo. No utiliza React, Node como servidor ni un proceso de compilacion. Se publica en Vercel y consume la API Flask desplegada por separado en Cloud Run.

Conserva todos estos archivos y la carpeta `landing-pages/` en el repositorio. No subas solo `index.html`: las paginas comparten `styles.css` y las paginas de notas/categorias dependen de `app.js` y `categorias.js`.

Orden de preparacion: **MySQL y tablas en Aiven -> backend en Cloud Run -> este frontend en Vercel**. Este manual supone que esta carpeta sera la raiz de su propio repositorio Git.

## 1. Que necesitas

- Cuenta en https://vercel.com/ y un repositorio Git en GitHub, GitLab o Bitbucket.
- Los tres archivos del frontend en la raiz del repositorio.
- Una API funcional en Cloud Run y su URL HTTPS, por ejemplo `https://notas-api-ejemplo.us-central1.run.app`.
- La ruta `/api/categorias` de esa API debe devolver JSON, no un error de permisos ni una pagina HTML.

La URL anterior es ilustrativa. Copia la que realmente entrega Cloud Run. No configures aqui host MySQL, usuario, contrasena, `.env` del backend ni certificado CA.

## 2. Como se conectan los componentes

En producción, `app.js` y `categorias.js` usan rutas relativas como `/api/notas` y `/api/categorias`; Vercel necesita una **reescritura externa**. Al abrir el frontend desde `localhost` o `127.0.0.1`, ambos scripts apuntan automáticamente a `https://prueba.hostless.app` para desarrollo con Live Server.

```text
Navegador pide https://tu-web.vercel.app/api/notas
    -> Vercel reenvia a https://tu-api.run.app/api/notas
    -> Cloud Run consulta MySQL por TLS
    -> La respuesta JSON vuelve al navegador
```

El navegador sigue viendo el mismo origen de Vercel. Con esta estrategia no necesitas modificar `fetch` ni agregar CORS a Flask. Tampoco necesitas acceso a MySQL desde Vercel.

La reescritura no oculta ni protege la API: **actualmente no hay autenticacion y cualquiera con acceso puede modificar las notas**. Usa datos de demostracion. Antes de almacenar informacion privada, incorpora autenticacion y autorizacion en el backend.

## 3. Crear vercel.json

Crea un archivo llamado **`vercel.json`** al lado de `index.html`, con este contenido:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://TU-URL-REAL-DE-CLOUD-RUN/api/:path*"
    }
  ]
}
```

Reemplaza `https://TU-URL-REAL-DE-CLOUD-RUN` por la URL completa que copiaste, sin una barra final. Conserva `/api/:path*` tanto en origen como en destino.

Ejemplo de destino: `https://notas-api-ejemplo.us-central1.run.app/api/:path*`. No uses `localhost`, el host de Aiven ni una URL de la consola de Google Cloud.

Esta configuracion conserva rutas como `/api/notas/12` y permite que las solicitudes de crear, editar y borrar lleguen al backend. No es una redireccion del navegador ni una funcion que tengas que programar.

**Estado actual:** esta carpeta incluye `vercel.json` con destino a `https://prueba.hostless.app`. El nombre debe ser exactamente `vercel.json` (no `vecerl.json`), y la raiz del proyecto en Vercel debe apuntar a esta carpeta. Si cambia la URL del backend, actualiza el destino y vuelve a desplegar.

## 4. Publicar el repositorio Git

1. Crea un repositorio independiente para el frontend.
2. Sube todos los archivos HTML, `styles.css`, `app.js`, `categorias.js`, la carpeta `landing-pages/`, `vercel.json` y este manual.
3. No subas la carpeta padre completa con el backend, certificados o credenciales.
4. Confirma en la web del proveedor Git que `index.html`, `notas.html`, `categorias.html` y `landing-pages/` estan directamente en la raiz del repositorio.

Si prefieres usar Git desde PowerShell y aun no inicializaste esta carpeta como repositorio independiente:

```powershell
git init
git add index.html notas.html categorias.html landing-pages styles.css app.js categorias.js vercel.json README.md
git commit -m "Preparar frontend para Vercel"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/TU-REPOSITORIO.git
git push -u origin main
```

Sustituye la URL. Si ya existe un repositorio o un remoto, no repitas `git init` ni `git remote add`: usa su flujo normal. Estos comandos son para que los ejecutes al publicar; no se ejecutaron al redactar este manual.

## 5. Importar el proyecto en Vercel

1. En el panel de Vercel, elige `Add New > Project`.
2. Conecta tu proveedor Git si todavia no lo hiciste.
3. Selecciona el repositorio **del frontend** y pulsa `Import`.
4. Revisa estos ajustes antes de desplegar:

| Ajuste | Valor |
| --- | --- |
| Framework Preset | `Other` |
| Root Directory | Raiz del repositorio, normalmente `./` |
| Build Command | Sin comando; usa Override vacio si el panel propone uno |
| Output Directory | `.` si debes indicarlo; los archivos se sirven desde la raiz |
| Install Command | Sin comando; no hay dependencias que instalar |
| Environment Variables | Ninguna para el funcionamiento actual |

Si conservas temporalmente un repositorio con las tres carpetas, `Root Directory` seria `frontend`; para el repositorio independiente solicitado debe ser su raiz.

5. Pulsa `Deploy`.
6. Espera a que el estado sea `Ready`.
7. Abre la URL HTTPS asignada por Vercel y guardala como URL del frontend.

No selecciones Vite o Next.js: no hay `package.json` ni script `npm run build`. Si el asistente genera esos comandos, vuelve a `Other` y quitalos.

## 6. Variables de entorno: que no hacer

Este frontend es JavaScript estatico. Crear una variable `API_URL` en el panel de Vercel **no modifica automaticamente `app.js` ni sustituye texto en `vercel.json`**. Tampoco existe `process.env` en este codigo del navegador.

En esta configuracion, la URL de la API se escribe en `vercel.json` y se versiona. Esa URL no es un secreto. Para cambiar de backend, cambia el destino y publica otro despliegue.

Nunca coloques contrasenas de MySQL en JavaScript, HTML, JSON publico o variables destinadas al navegador. El navegador solo se comunica con la API; la API conserva las credenciales de Aiven en Secret Manager.

## 7. Verificar que funciona de extremo a extremo

1. Abre `https://TU-FRONTEND.vercel.app/api/categorias` directamente. Debe mostrar JSON (`[]` si esta vacio).
5. Abre `/notas.html`; no debe aparecer el mensaje de que no se pudieron cargar las notas.
6. Abre `/categorias.html` y crea una categoria de prueba.
7. Regresa a `/notas.html` y crea una nota asociada a esa categoria.
8. Edita la nota y vuelve a cargar la pagina: el cambio debe seguir guardado en MySQL.
9. Prueba la busqueda, elimina la categoria desde su pagina y confirma que la nota se conserva sin categoria.
10. Elimina la nota de prueba.
11. Abre `/landing-pages/index.html` y comprueba que carguen sus dos ejemplos.

En las herramientas del navegador, abre `Network` y revisa las solicitudes `/api/...`: GET debe responder `200`, creacion `201` y eliminacion `204`. PUT responde `200`.

Si el sitio esta protegido por Vercel Deployment Protection, autentica primero tu navegador. Las vistas previas y produccion pueden tener politicas de acceso diferentes.

## 8. Probar localmente con Live Server

Abre la carpeta `frontend` en VS Code y usa Live Server sobre `index.html`. Normalmente el sitio quedara en `http://127.0.0.1:5500` o `http://localhost:5500`.

En otra terminal PowerShell, cambia a la carpeta donde clonaste el repositorio backend y arráncalo en el puerto 9000. Reemplaza la ruta de ejemplo:

```powershell
cd C:\ruta\a\tu\repositorio-backend
$env:PORT = "9000"
.\.venv\Scripts\Activate.ps1
python app.py
```

El `.env` y el certificado de Aiven deben estar configurados en esa carpeta. Deja esta terminal abierta mientras pruebas.

El frontend local detecta `localhost` o `127.0.0.1` y llama a `https://prueba.hostless.app/api/...`. Flask permite CORS unicamente desde `http://localhost:5500` y `http://127.0.0.1:5500`. Si Live Server usa otro puerto, actualiza `LOCAL_FRONTEND_ORIGINS` en el backend para incluir el origen exacto y reinicia Flask.

Abre `/notas.html` y `/categorias.html` desde Live Server. Para verificar el backend directamente, visita `https://prueba.hostless.app/api/notas`. El frontend local consulta la base de Aiven configurada en el backend; crear o eliminar datos cambia esa base real.

En Vercel, el navegador no usa la URL local: el frontend vuelve a las rutas relativas y `vercel.json` las reescribe hacia Cloud Run. Para validar esa ruta, crea una vista previa y prueba `/api/categorias`.

## 9. Actualizaciones y dominio propio

Con el repositorio conectado, un push a la rama de produccion configurada en Vercel, normalmente `main`, genera un despliegue nuevo. Otras ramas pueden generar vistas previas.

Las vistas previas usan la misma API si conservan el mismo `vercel.json`: **no son entornos de datos aislados**. No hagas pruebas destructivas sobre produccion.

Para cambiar de API, actualiza el destino de la reescritura, sube el cambio y comprueba `/api/categorias` en el nuevo despliegue. Si eliminas o recreas el servicio Cloud Run, confirma que la URL siga siendo la correcta.

Para un dominio propio, utiliza `Project > Settings > Domains`, agrega tu dominio y configura los registros DNS indicados por Vercel. Espera a que el dominio y HTTPS esten verificados. Al usar rutas relativas, el frontend conserva `/api/...` en el dominio nuevo sin cambiar `app.js`.

## 10. Problemas frecuentes

| Sintoma | Causa probable / solucion |
| --- | --- |
| La pagina principal devuelve 404 | Root Directory incorrecto o `index.html` fuera de la salida publicada |
| /api/notas devuelve 404 de Vercel | Falta `vercel.json`, no esta en la raiz o no se redesplego |
| Unexpected token '<' / no es JSON | `/api` recibio HTML: revisar reescritura, URL de API y permisos |
| 403 al consultar la API | Cloud Run no permite invocacion publica o una politica la bloquea |
| 502 / 504 | Revisar disponibilidad, tiempos y logs de Cloud Run y conectividad con Aiven |
| 503 con error JSON de base de datos | Revisar secretos, CA, IP permitidas y tablas desde el backend |
| Error de CORS | Revisar si se cambio fetch a una URL absoluta; este manual usa el proxy de Vercel |
| Funciona en Vercel pero no abriendo el HTML | El navegador local no ejecuta las reescrituras de Vercel |
| Agregue API_URL al panel y no cambia nada | No hay compilacion que consuma esa variable; editar `vercel.json` |
| Fallo en npm run build | Framework equivocado: elegir Other y quitar el comando de compilacion |

Si decides reemplazar la reescritura por llamadas directas del navegador a Cloud Run, necesitaras cambiar `app.js` e implementar CORS en el backend, incluidos los preflight OPTIONS y los metodos utilizados. No mezcles ambas estrategias sin revisar la configuracion.

## Referencias

- Proyectos en Vercel: https://vercel.com/docs/projects/overview
- Reescrituras externas: https://vercel.com/docs/rewrites
- Configuracion del proyecto: https://vercel.com/docs/project-configuration
- Desarrollo local: https://vercel.com/docs/cli/dev