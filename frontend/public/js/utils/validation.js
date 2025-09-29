function validateField(input) {
    let message = '';
    const value = input.value.trim();

    if (input.required && value === '') {
        message = 'Este campo es obligatorio.';
    } else if (input.type === 'email' && value !== '' && !/^\S+@\S+\.\S+$/.test(value)) {
        message = 'Por favor, introduce un email válido.';
    } else if (input.minLength > 0 && value.length < input.minLength) {
        message = `Debe tener al menos ${input.minLength} caracteres.`;
    } else if (input.pattern && !new RegExp(input.pattern).test(value)) {
        message = input.title || 'El formato no es válido.';
    } else if (input.id === 'confirmEmail' && value !== document.getElementById('email').value) {
        message = 'Los correos electrónicos no coinciden.';
    }

    const errorContainer = input.closest('.register__form-group').querySelector('.error-container');
    if (errorContainer) {
        errorContainer.textContent = message;
        errorContainer.style.visibility = message ? 'visible' : 'hidden';
    }
    
    if (message) {
        input.classList.add('input-error');
    } else {
        input.classList.remove('input-error');
    }

    return !message;
}

function validateForm(form) {
    let isValid = true;
    form.querySelectorAll('input[required], select[required]').forEach(input => {
        if (!validateField(input)) {
            isValid = false;
        }
    });
    return isValid;
}