document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Acceso denegado. Por favor, inicie sesión.');
        window.location.href = 'login.html';
        return;
    }

    // --- Selectores de los campos del formulario ---
    const nombreInput = document.getElementById('nombre-de-usuario');
    const apellidoInput = document.getElementById('apellido-de-usuario'); // <-- Selector para el nuevo campo
    const tipoDocInput = document.getElementById('tipo-de-documento');
    const numDocInput = document.getElementById('numero-de-documento');
    const tipoUsuarioInput = document.getElementById('tipo-de-usuario');
    const emailInput = document.getElementById('email');
    const confirmEmailInput = document.getElementById('confirmar-email');
    const telefonoInput = document.getElementById('telefono');
    const form = document.getElementById('edit-form');

    const params = new URLSearchParams(window.location.search);
    const id = parseInt(params.get('id'), 10);
    if (!id || id <= 0) {
        showErrorNotification('ID de usuario inválido.');
        return;
    }

    // --- Cargar datos del usuario en el formulario ---
    try {
        const response = await fetch(`http://localhost:3000/user/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Usuario no encontrado');
        }
        const result = await response.json();
        const usuario = result.data;

        if (usuario) {
            nombreInput.value = usuario.firstName || '';
            apellidoInput.value = usuario.lastName || ''; // <-- Rellenamos el campo de apellido
            tipoDocInput.value = usuario.documentType || '';
            numDocInput.value = usuario.documentNumber || '';
            tipoUsuarioInput.value = usuario.userType || '';
            emailInput.value = usuario.email || '';
            confirmEmailInput.value = usuario.email || '';
            telefonoInput.value = usuario.phone || '';
        } else {
            throw new Error('Datos de usuario no recibidos.');
        }
    } catch (error) {
        console.error('Error al cargar usuario:', error);
        showErrorNotification(`Error al cargar datos: ${error.message}`);
    }

    // --- Enviar formulario actualizado ---
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!validateForm()) { // Llama a la función de validación
                return;
            }

            // Objeto de datos que se enviará al servidor
            const data = {
                firstName: nombreInput.value,
                lastName: apellidoInput.value, // <-- AHORA SÍ SE LEE Y ENVÍA EL APELLIDO
                documentType: tipoDocInput.value,
                documentNumber: numDocInput.value,
                userType: tipoUsuarioInput.value,
                email: emailInput.value,
                phone: telefonoInput.value
            };

            try {
                const updateResponse = await fetch(`http://localhost:3000/user/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(data)
                });

                const result = await updateResponse.json();

                if (!updateResponse.ok) {
                    // Usamos el error que viene del backend
                    throw new Error(result.error || 'Error desconocido al actualizar');
                }

                alert('Usuario actualizado correctamente');
                window.location.href = 'lista-usuario.html';
            } catch (error) {
                console.error('Error al actualizar usuario:', error);
                showErrorNotification(`Error al actualizar: ${error.message}`);
            }
        });
    }
    
    // --- Resto de funciones de validación (se mantienen igual) ---
    // ... (incluye aquí las funciones showErrorNotification, validateEmail, validateForm, etc.)
});

// Asegúrate de tener estas funciones de validación en tu archivo
function showErrorNotification(message) {
    const errorNotification = document.getElementById('error-message');
    if (errorNotification) {
        errorNotification.textContent = message;
        errorNotification.style.display = 'block';
        setTimeout(() => { errorNotification.style.display = 'none'; }, 4000);
    }
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateForm() {
    // Aquí puedes añadir toda la lógica de validación del formulario si la tienes
    const email = document.getElementById('email').value;
    const confirmEmail = document.getElementById('confirmar-email').value;

    if (email !== confirmEmail) {
        showErrorNotification('Los correos electrónicos no coinciden');
        return false;
    }
    return true;
}