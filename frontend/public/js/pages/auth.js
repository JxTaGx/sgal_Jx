/* frontend/public/js/auth.js */

/**
 * Verifica si el usuario está autenticado. Si no hay token,
 * redirige a la página de login.
 */
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        // Redirige al login si no hay token
        window.location.href = 'login.html';
    }
}

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