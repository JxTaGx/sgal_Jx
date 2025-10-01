/* frontend/public/js/permissions.js */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Proteger la página: si no hay token, redirigir al login.
    const token = localStorage.getItem('token');
    if (!token) {
        // Excepciones: no proteger el login, el registro o la página de recuperación.
        if (!window.location.pathname.endsWith('login.html') &&
            !window.location.pathname.endsWith('register.html') &&
            !window.location.pathname.endsWith('recover.html')) {
            window.location.href = 'login.html';
            return; // Detener la ejecución del script
        }
    }

    // 2. Gestionar la visibilidad del menú según el rol del usuario.
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        const userType = user.userType;
        const navLinks = {
            'Ciclo Cultivo': document.querySelector('a[href="../views/listar-ciclo-cultivo-sebas.html"]'),
            'Cultivos': document.querySelector('a[href="../views/listar-cultivo-sebas.html"]'),
            'Sensores': document.querySelector('a[href="../views/listar-sensor-sebas.html"]'),
            'Insumos': document.querySelector('a[href="../views/listar-insumo-sebas.html"]'),
            'Usuarios': document.querySelector('a[href="../views/lista-usuario.html"]'),
            'Integración': document.querySelector('a[href="../views/integracion.html"]')
        };

        // Permisos basados en tu documento de requerimientos
        const permissions = {
            'SADMIN': ['Ciclo Cultivo', 'Cultivos', 'Sensores', 'Insumos', 'Usuarios', 'Integración'],
            'ADMIN': ['Ciclo Cultivo', 'Cultivos', 'Sensores', 'Insumos', 'Usuarios', 'Integración'],
            'PAP': ['Sensores'], // Personal de Apoyo solo ve Sensores
            'VTE': ['Cultivos', 'Ciclo Cultivo', 'Sensores'] // Visitante ve datos de solo lectura
        };

        const allowedLinks = permissions[userType] || [];

        // Ocultar los enlaces a los que el usuario no tiene acceso
        for (const linkName in navLinks) {
            if (navLinks[linkName] && !allowedLinks.includes(linkName)) {
                navLinks[linkName].parentElement.style.display = 'none';
            }
        }

        // 3. Personalizar el saludo y el rol en el header
        const welcomeMessage = document.getElementById('welcome-message');
        const userInfo = document.getElementById('user-info');

        if (welcomeMessage) {
            welcomeMessage.textContent = `Bienvenid@ ${user.firstName}`;
        }
        if (userInfo) {
            userInfo.textContent = user.userType.toUpperCase();
        }

        // --- Ocultar botones específicos por rol ---
        const pathname = window.location.pathname;

        // Ocultar botón "Crear Sensor" para VTE y PAP
        if (userType === 'VTE' || userType === 'PAP') {
            if (pathname.endsWith('listar-sensor-sebas.html')) {
                const crearSensorLink = document.querySelector('a[href="create-sensor.html"]');
                if (crearSensorLink) {
                    crearSensorLink.style.display = 'none';
                }
            }
        }
        
        // Ocultar botones adicionales solo para VTE
        if (userType === 'VTE') {
            // Ocultar botón "Crear" en Ciclo Cultivo
            if (pathname.endsWith('listar-ciclo-cultivo-sebas.html')) {
                const crearCicloLink = document.querySelector('a[href="create-ciclo-cultivo.html"]');
                if (crearCicloLink && crearCicloLink.parentElement) {
                    crearCicloLink.parentElement.style.display = 'none';
                }
            }
            
            // Ocultar botón "Crear" en Cultivos
            if (pathname.endsWith('listar-cultivo-sebas.html')) {
                const crearCultivoLink = document.querySelector('a[href="create-cultivo.html"]');
                if (crearCultivoLink && crearCultivoLink.parentElement) {
                    crearCultivoLink.parentElement.style.display = 'none';
                }
            }

            // Ocultar botón "Editar" en la vista de detalle de Ciclo Cultivo
            if (pathname.endsWith('visualizar-ciclo-cultivo.html')) {
                const editarCicloBtn = document.getElementById('editar-btn');
                if (editarCicloBtn) editarCicloBtn.style.display = 'none';
            }

            // Ocultar botón "Editar" en la vista de detalle de Cultivo
            if (pathname.endsWith('visualizar-cultivo.html')) {
                const editarCultivoBtn = document.querySelector('.ciclo-cultivo__btn--edit');
                if (editarCultivoBtn) editarCultivoBtn.style.display = 'none';
            }

            // Ocultar botón "Actualizar Sensor"
            if (pathname.endsWith('visualizar-sensor.html')) {
                const actualizarSensorBtn = document.querySelector('.button--edit');
                if (actualizarSensorBtn) actualizarSensorBtn.style.display = 'none';
            }
        }

        // Rol: Administrador (ADMIN)
        if (userType === 'ADMIN') {
            // Ocultar botón "Crear Usuario" en la lista de usuarios
            if (pathname.endsWith('lista-usuario.html')) {
                const crearUsuarioBtn = document.querySelector("button[onclick=\"window.location.href='register.html'\"]");
                if (crearUsuarioBtn) {
                    crearUsuarioBtn.style.display = 'none';
                }
            }
        }
    }
});

/**
 * Cierra la sesión del usuario eliminando el token y los datos de usuario
 * de localStorage y redirigiendo al login.
 */
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

/**
 * Obtiene la información del usuario guardada en localStorage.
 * @returns {object|null} El objeto del usuario o null si no existe.
 */
function getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}