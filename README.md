👤 Autor:[Ing. Edwar Hernando Velásquez]

📧 Email: ricoprogramar@gmail.com
🔗 LinkedIn: linkedin.com/in/tuusuario
🐙 GitHub: github.com/The-Mechatronic
🤖 Pag. Web: ricoprogramar.com

# Mi Proyecto

## Descripción
Este proyecto es una aplicación web que integra un backend en Node.js con Express y un frontend basado en HTML, CSS y JavaScript. 
Además, maneja una base de datos para gestionar usuarios, sensores, contacto y servicios.

## Estructura del Proyecto

```
/mi-proyecto
│-- /backend/                # Todo el backend organizado aquí
│   │-- server.js            # Punto de entrada del servidor
│   │-- /config/             # Configuración del proyecto
│   │   ├── db.js            # Conexión a la base de datos
│   │-- /routes/             # Rutas de la API
│   │   ├── registerRoutes.js         # Rutas para usuarios
│   │   ├── sensorsRoutes.js       # Rutas para sensores
│   │   ├── contactRoutes.js       # Rutas para contacto
│   │   ├── servicesRoutes.js      # Rutas para servicios
│   │-- /controllers/        # Lógica de las rutas (controladores)
│   │   ├── registerController.js
│   │   ├── sensorsController.js
│   │   ├── contactController.js
│   │   ├── servicesController.js
│   │-- /models/             # Modelos de la base de datos
│   │   ├── registerModel.js
│   │   ├── sensorsModel.js
│   │   ├── contacModel.js
│   │   ├── servicesModel.js
│   │-- /middlewares/        # Middlewares (autenticación, logs, validaciones)
│   │   ├── authMiddleware.js
│   │   ├── logger.js
│   │-- /utils/              # Utilidades y funciones reutilizables
│   │   ├── helpers.js
│   │-- package.json         # Dependencias del backend
│   │-- .env                 # Variables de entorno (credenciales, puertos, etc.)
│
│-- /frontend/               # Todo el frontend organizado aquí
│   │-- /public/             # Archivos estáticos (CSS, JS, imágenes)
│   │   ├── /css/            # Estilos
│   │   │-- main.css             # Archivo principal que importa los demás
│   │   │-- reset.css            # Normalización y reseteo de estilos
│   │   │-- variables.css        # Variables de colores, tipografías, etc.
│   │   │-- layout.css           # Estructura general (grid, flexbox, espaciados)
│   │   │-- components/
│   │   │   ├── navbar.css       # Estilos del navbar
│   │   │   ├── footer.css       # Estilos del footer
│   │   │   ├── sidebar.css      # Estilos del sidebar
│   │   │   ├── form.css         # Estilos del formulario
│   │   │-- pages/
│   │   │   ├── home.css         # Estilos de la página de inicio
│   │   │   ├── register.css     # Estilos de la página de registro
│   │   │   ├── sensors.css      # Estilos de la página de sensores
│   │   │   ├── contact.css      # Estilos de la página de contacto
│   │   │   ├── services.css     # Estilos de la página de servicios
│   │   │-- themes/
│   │   │   ├── dark-mode.css    # Tema oscuro
│   │   │   ├── light-mode.css   # Tema claro
│   │   ├── /js/                 # Scripts frontend
│   │   │   │-- /pages/
│   │   │   │   │-- contact.js
│   │   │   │   │-- sensors.js
│   │   │   │   │-- services.js
│   │   │   │   │-- register.js
│   │   │   │-- /validations/
│   │   │   │   │-- constactValidation.js
│   │   │   │   │-- sensorsValidation.js
│   │   │   │   │-- servicesValidation.js
│   │   │   │   │-- registerValidation.js
│   │   ├── /img/                # Imágenes
│   │-- /views/                  # Vistas HTML
│   │   ├── index.html  
│   │   ├── register.html
│   │   ├── sensors.html
│   │   ├── contact.html
│   │   ├── services.html
│   │   ├── /components/     # Componentes reutilizables
│   │   │   ├── navbar.html  # Navbar
│   │   │   ├── footer.html  # Footer
│   │   │   ├── sidebar.html # Sidebar
│   │-- package.json         # Dependencias del frontend (si usas npm para frontend)
│
│-- /database/               # Archivos relacionados con la base de datos
│   │-- esquema.sql          # Script SQL para crear la base de datos
│   │-- datos_prueba.sql     # Datos de prueba
│
│-- /tests/                  # Pruebas unitarias y de integración
│   │-- backend.test.js      # Pruebas del backend
│   │-- frontend.test.js     # Pruebas del frontend
│
│-- .gitignore               # Archivos y carpetas a ignorar en Git
│-- README.md                # Documentación del proyecto
```
## Descripción detallada estructura
📂 /backend/
Aquí va toda la lógica del servidor.

server.js → Punto de entrada del backend.
/config/ → Contiene la configuración del servidor y la base de datos.
/routes/ → Define las rutas de la API.
/controllers/ → Aquí va la lógica de negocio de cada ruta.
/models/ → Define cómo se estructuran los datos en la base de datos.
/middlewares/ → Contiene autenticación, validaciones, logs, etc.
/utils/ → Funciones de utilidad para no repetir código.

📂 /frontend/
Aquí va todo lo relacionado con la interfaz de usuario.

/public/ → Contiene CSS, JS y archivos estáticos.
/views/ → Aquí van los archivos HTML.
    /components/  → Componentes reutilizables

📂 /database/
Aquí guardamos archivos relacionados con la base de datos.

esquema.sql → Script SQL para crear las tablas.
datos_prueba.sql → Datos de prueba para hacer test.

📂 /tests/
Aquí van las pruebas automatizadas del backend y frontend.

## Instalación

### Requisitos previos
- Node.js superior a la 18 y npm
- Workbench 8.0
- Base de datos (MySQL)

### Creación del servidor y configuraciones
- mkdir proyecto-mysql # Crea una carpeta para tu proyecto y accede a ella desde la terminal:
- cd proyecto-mysql

- npm init -y # Inicializa un proyecto de Node.js:

- npm install express mysql2 cors dotenv # Instala las dependencias necesarias:

- cp .env.example .env  # Configurar variables de entorno

- node backend/server.js # Realizar conexión con la BD

### Clonar el repositorio
```sh
git clone https://github.com/The-Mechatronic/PlantillaEstructuraProyecto.git
cd mi-proyecto
```
### Configuración del Frontend
```sh
cd frontend
npm install
npm start  # Iniciar el servidor de desarrollo
```

## Uso
- Acceder a la API en `http://localhost:3000`
- Acceder a la interfaz en `http://localhost:8080`
- puerto 3306 || 3400

## Pruebas
Ejecutar pruebas unitarias y de integración:
```sh
cd tests
npm test
```

## Contribución
1. Hacer un fork del repositorio (crear una copia del repositorio en tu propia cuenta.)
2. Crear una rama (`feature-nueva`)
3. Realizar cambios y hacer commit
4. Crear un pull request

## Flujo 
Resumen del Flujo
1. Frontend o cliente envía una petición HTTP (Ej: GET /api/user)
2. El servidor (server.js) la recibe y la dirige a la ruta correcta (routes/user.js)
3. La ruta (users.js) llama al controlador (usersController.js)
4. El controlador ejecuta la lógica y llama al modelo (usersModel.js)
5. El modelo consulta la base de datos (db.js)
6. El resultado viaja de regreso: Modelo → Controlador → Ruta → Servidor → Cliente

## Prefijos para indicar el tipo de cambio en GitHub:
1. feat: (feature/funcionalidad) Nueva funcionalidad.
2. fix: Corrección de errores.
3. docs: Cambios en la documentación.
4. style: Cambios en el formato del código (sin afectar la lógica).
5. refactor: Refactorización del código (sin cambios en la funcionalidad).
6. test: Adición o modificación de pruebas.
7. chore: Cambios en el proceso de construcción o herramientas auxiliares.

# Ejemplos
1. feat: Agregar validación de formulario 
2. fix: Corregir error de renderizado en la página de inicio
3. feat: Implementar paginación en la lista de productos

📜 Licencia
Creative Commons Attribution 4.0	CC-BY-4.0
https://creativecommons.org/licenses/by/4.0/
