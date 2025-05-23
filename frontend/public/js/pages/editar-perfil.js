document.querySelectorAll('.form__field-input--text').forEach(input => {
    input.addEventListener('keypress', function(e) {
        if (!/^[a-zA-Z´ñÑáéíóú]$/.test(e.key)) {
            e.preventDefault();
            showErrorNotification('Los números no están permitidos en el campo de texto');
        }
    });
});

/**
 * Muestra una notificación de error
 * @param {string} message 
 */
function showErrorNotification(message) {
    const errorNotification = document.querySelector('.notification--error');
    errorNotification.textContent = message;
    errorNotification.style.display = 'block';
    
    setTimeout(() => {
        errorNotification.style.display = 'none';
    }, 4000);
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
            showErrorNotification(`Todos los campos son obligatorios`);
        }
    });
    
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
    // Validar que todos los campos requeridos estén completos
    if (!validateRequiredFields()) {
        return false;
    }
    
    // Validar el formato del correo electrónico
    const email = document.getElementById('email').value;
    if (!validateEmail(email)) {
        showErrorNotification('El formato del correo electrónico no es válido');
        return false;
    }
    
    // Validar que los correos electrónicos coincidan
    if (!validateEmailsMatch()) {
        return false;
    }
    
    // Validar formato del teléfono (solo números)
    const telefono = document.getElementById('form-field__input--number').value;
    if (!/^\d+$/.test(telefono)) {
        showErrorNotification('El número telefónico solo debe contener dígitos');
        return false;
    }
    
    return true;
}

// Asignar validación al botón "Guardar"
document.addEventListener('DOMContentLoaded', function() {
    const saveLink = document.querySelector('.button__group--green a:last-of-type');
    
    if (saveLink) {
        saveLink.addEventListener('click', function(e) {
            e.preventDefault();

            if (validateForm()) {
                window.location.href = this.getAttribute('href');
            }
        });
    }
});

document.getElementById('email').addEventListener('blur', function() {
    if (this.value && !validateEmail(this.value)) {
        showErrorNotification('El formato del correo electrónico no es válido');
    }
});

document.getElementById('confirmar-email').addEventListener('blur', function() {
    const email = document.getElementById('email').value;
    if (this.value && email && this.value !== email) {
        showErrorNotification('Los correos electrónicos no coinciden');
    }
});

document.getElementById('telefono').addEventListener('input', function() {
    this.value = this.value.replace(/[^\d]/g, '');
});

const backLink = document.querySelector('.button__group--green a:first-of-type');
if (backLink) {
    backLink.addEventListener('click', function(e) {
    });
}