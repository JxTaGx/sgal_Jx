document.addEventListener('DOMContentLoaded', async () => {
    document.querySelectorAll('.form__field-input--text').forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (!/^[a-zA-Z´ñÑáéíóú\s]$/.test(e.key)) { // Added space character to allow spaces
                e.preventDefault();
                showErrorNotification('Los números no están permitidos en el campo de texto');
            }
        });
    });

    const params = new URLSearchParams(window.location.search);
    const id = parseInt(params.get('id'), 10);
    if (!id || id <= 0) {
        console.error('ID inválido:', id);
        showErrorNotification('ID de usuario inválido.');
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/user/${id}`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Usuario no encontrado');
        }
        const result = await response.json();
        const usuario = result.data;

        if (usuario) {
            document.getElementById('nombre-de-usuario').value = usuario.firstName || '';
            document.getElementById('tipo-de-documento').value = usuario.documentType || '';
            document.getElementById('numero-de-documento').value = usuario.documentNumber || '';
            document.getElementById('tipo-de-usuario').value = usuario.userType || '';
            document.getElementById('email').value = usuario.email || '';
            document.getElementById('confirmar-email').value = usuario.email || ''; // Populate confirm email too
            document.getElementById('telefono').value = usuario.phone || '';
        } else {
            throw new Error('Datos de usuario no recibidos.');
        }
    } catch (error) {
        console.error('Error al cargar usuario:', error);
        showErrorNotification(`Error al cargar datos: ${error.message}`);
    }

    // Manejar la actualización del formulario
    const form = document.getElementById('edit-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!validateForm()) { // Call validateForm before submitting
                return;
            }

            const data = {
                firstName: document.getElementById('nombre-de-usuario').value,
                documentType: document.getElementById('tipo-de-documento').value,
                documentNumber: document.getElementById('numero-de-documento').value,
                userType: document.getElementById('tipo-de-usuario').value,
                email: document.getElementById('email').value,
                confirmEmail: document.getElementById('confirmar-email').value, // Though not typically sent
                phone: document.getElementById('telefono').value
                // Do not send password unless it's being changed, handle separately
            };

            try {
                const updateResponse = await fetch(`http://localhost:3000/user/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });

                if (!updateResponse.ok) {
                    const errorData = await updateResponse.json();
                    throw new Error(errorData.message || 'Error al actualizar usuario');
                }

                alert('Usuario actualizado correctamente');
                window.location.href = 'lista-usuario.html';
            } catch (error) {
                console.error('Error al actualizar usuario:', error);
                showErrorNotification(`Error al actualizar: ${error.message}`);
            }
        });
    }

    // Event listeners for specific field validations (moved from global scope)
    const emailInput = document.getElementById('email');
    if (emailInput) {
        emailInput.addEventListener('blur', function() {
            if (this.value && !validateEmail(this.value)) {
                showErrorNotification('El formato del correo electrónico no es válido');
            }
        });
    }

    const confirmEmailInput = document.getElementById('confirmar-email');
    if (confirmEmailInput) {
        confirmEmailInput.addEventListener('blur', function() {
            const email = document.getElementById('email').value;
            if (this.value && email && this.value !== email) {
                showErrorNotification('Los correos electrónicos no coinciden');
            }
        });
    }

    const telefonoInput = document.getElementById('telefono');
    if (telefonoInput) {
        telefonoInput.addEventListener('input', function() {
            this.value = this.value.replace(/[^\d]/g, '');
        });
    }

    const backLink = document.querySelector('.button__group--green a:first-of-type');
    if (backLink) {
        // No specific action needed on click here, it's a link.
    }
});


/**
 * Muestra una notificación de error
 * @param {string} message 
 */
function showErrorNotification(message) {
    const errorNotification = document.getElementById('error-message'); // Use ID for consistency
    if (errorNotification) {
        errorNotification.textContent = message;
        errorNotification.style.display = 'block';

        setTimeout(() => {
            errorNotification.style.display = 'none';
        }, 4000);
    }
}

/**
 * Valida el formato del correo electrónico
 * @param {string} email 
 * @returns {boolean} 
 */
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Valida que todos los campos requeridos estén completos
 * @returns {boolean}
 */
function validateRequiredFields() {
    let allFieldsComplete = true;
    document.querySelectorAll('input[required]').forEach(input => {
        if (!input.value.trim()) {
            allFieldsComplete = false;
            // showErrorNotification(`El campo "${input.previousElementSibling?.textContent || input.id || input.name}" es obligatorio.`);
        }
    });
    if (!allFieldsComplete) {
        showErrorNotification('Todos los campos son obligatorios.');
    }
    return allFieldsComplete;
}


/**
 * Valida que los correos electrónicos coincidan
 * @returns {boolean} 
 */
function validateEmailsMatch() {
    const email = document.getElementById('email').value;
    const confirmEmail = document.getElementById('confirmar-email').value;

    if (email !== confirmEmail) {
        showErrorNotification('Los correos electrónicos no coinciden');
        return false;
    }
    return true;
}

/**
 * Valida el formulario completo
 * @returns {boolean} 
 */
function validateForm() {
    if (!validateRequiredFields()) {
        return false;
    }

    const email = document.getElementById('email').value;
    if (!validateEmail(email)) {
        showErrorNotification('El formato del correo electrónico no es válido');
        return false;
    }

    if (!validateEmailsMatch()) {
        return false;
    }

    const telefono = document.getElementById('telefono').value;
    if (!/^\d{7,15}$/.test(telefono)) { // Example: 7 to 15 digits for phone
        showErrorNotification('El número telefónico debe tener entre 7 y 15 dígitos.');
        return false;
    }
    return true;
}