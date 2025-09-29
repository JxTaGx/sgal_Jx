/**
 * Muestra u oculta un mensaje de error para un campo de formulario específico.
 * @param {HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement} input - El elemento del campo.
 * @param {string} message - El mensaje de error. Si está vacío, oculta el error.
 */
function displayFieldError(input, message) {
    const formGroup = input.closest('.form__group, .register__form-group, .dashboard__form-group');
    if (!formGroup) return;

    let errorContainer = formGroup.querySelector('.error-container');
    if (!errorContainer) {
        errorContainer = document.createElement('div');
        errorContainer.className = 'error-container';
        formGroup.appendChild(errorContainer);
    }

    errorContainer.textContent = message;
    if (message) {
        errorContainer.style.visibility = 'visible';
        input.classList.add('input-error');
    } else {
        errorContainer.style.visibility = 'hidden';
        input.classList.remove('input-error');
    }
}

/**
 * Valida un campo individual basado en sus atributos HTML.
 * @param {HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement} input - El campo a validar.
 * @returns {boolean} - True si el campo es válido.
 */
export function validateField(input) {
    let message = '';
    const value = input.value.trim();

    if (input.required && value === '') {
        message = 'Este campo es obligatorio.';
    } else if (input.minLength > 0 && value.length < input.minLength) {
        message = `Debe tener al menos ${input.minLength} caracteres.`;
    } else if (input.pattern && !new RegExp(input.pattern).test(value)) {
        message = input.title || 'El formato no es válido.';
    } else if (input.type === 'number' && input.min !== '' && parseFloat(value) < parseFloat(input.min)) {
        message = `El valor no puede ser menor que ${input.min}.`;
    } else if (input.type === 'email' && value !== '' && !/^\S+@\S+\.\S+$/.test(value)) {
        message = 'Introduce un correo electrónico válido.';
    } else if (input.name === 'confirmEmail' && value !== document.querySelector('[name="email"]').value) {
        message = 'Los correos electrónicos no coinciden.';
    }

    displayFieldError(input, message);
    return !message;
}

/**
 * Valida todos los campos requeridos en un formulario.
 * @param {HTMLFormElement} form - El formulario a validar.
 * @returns {boolean} - True si todos los campos son válidos.
 */
export function validateForm(form) {
    let isFormValid = true;
    form.querySelectorAll('[required], [pattern], [minlength]').forEach(input => {
        if (!validateField(input)) {
            isFormValid = false;
        }
    });
    return isFormValid;
}

/**
 * Agrega listeners de validación en tiempo real a todos los campos de un formulario.
 * @param {HTMLFormElement} form - El formulario al que se añadirán los listeners.
 */
export function addRealTimeValidation(form) {
    form.querySelectorAll('input, select, textarea').forEach(input => {
        input.addEventListener('blur', () => validateField(input));
        input.addEventListener('input', () => validateField(input));
    });
}