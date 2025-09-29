document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("register-form");
    const btnVolver = document.getElementById('btn-volver-registro');
    const submitButton = document.querySelector('.register__button--submit');
    const token = localStorage.getItem('token');

    // Si no hay formulario en la página, no se ejecuta el resto del script.
    if (!form) return;

    // --- MANEJO DEL BOTÓN VOLVER ---
    if (btnVolver) {
        btnVolver.addEventListener('click', () => {
            const urlParams = new URLSearchParams(window.location.search);
            const origin = urlParams.get('origin');
            
            // Si el usuario vino desde la página de integración, se le regresa allí.
            if (origin === 'produccion') {
                window.location.href = '../views/integracion.html';
            } else {
                // De lo contrario, se le regresa a la lista de usuarios.
                window.location.href = '../views/lista-usuario.html';
            }
        });
    }

    // --- LÓGICA DE VALIDACIÓN DEL FORMULARIO ---
    
    // Asocia un evento a cada campo para validar en tiempo real cuando el usuario interactúa.
    form.querySelectorAll('input[required], select[required]').forEach(input => {
        // Valida cuando el usuario sale del campo.
        input.addEventListener('blur', (e) => validateField(e.target));
        // Valida mientras el usuario escribe.
        input.addEventListener('input', (e) => validateField(e.target));
    });

    /**
     * Valida un campo individual del formulario y muestra/oculta el mensaje de error.
     * @param {HTMLElement} input - El campo del formulario a validar.
     * @returns {boolean} - True si el campo es válido, de lo contrario False.
     */
    function validateField(input) {
        let message = '';
        const value = input.value.trim();
        const errorContainer = input.parentElement.querySelector('.error-container') || createErrorContainer(input.parentElement);

        // 1. Validación de campo requerido
        if (input.required && value === '') {
            message = 'Este campo es obligatorio.';
        } 
        // 2. Validación de longitud mínima
        else if (input.minLength > 0 && value.length < input.minLength) {
            message = `Debe tener al menos ${input.minLength} caracteres.`;
        }
        // 3. Validación de patrón (para números, letras, etc.)
        else if (input.pattern && !new RegExp(input.pattern).test(value)) {
            message = input.title || 'El formato no es válido.';
        }
        // 4. Validación de tipo email
        else if (input.type === 'email' && value !== '' && !/^\S+@\S+\.\S+$/.test(value)) {
            message = 'Por favor, introduce un correo electrónico válido.';
        }
        // 5. Validación de confirmación de correo
        else if (input.id === 'confirmEmail' && value !== document.getElementById('email').value) {
            message = 'Los correos electrónicos no coinciden.';
        }

        // Muestra u oculta el mensaje de error
        if (message) {
            errorContainer.textContent = message;
            errorContainer.style.visibility = 'visible';
            input.classList.add('input-error');
            return false;
        } else {
            errorContainer.style.visibility = 'hidden';
            input.classList.remove('input-error');
            return true;
        }
    }

    /**
     * Valida todos los campos del formulario.
     * @returns {boolean} - True si todo el formulario es válido.
     */
    function validateForm() {
        let isFormValid = true;
        form.querySelectorAll('input[required], select[required]').forEach(input => {
            if (!validateField(input)) {
                isFormValid = false;
            }
        });
        return isFormValid;
    }

    /**
     * Crea un div para mensajes de error si no existe.
     * @param {HTMLElement} parent - El elemento padre donde se insertará el contenedor de error.
     * @returns {HTMLElement} - El contenedor del error.
     */
    function createErrorContainer(parent) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-container';
        parent.appendChild(errorDiv);
        return errorDiv;
    }

    // --- LÓGICA DE ENVÍO DEL FORMULARIO ---
    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        // Si el formulario no es válido, muestra una alerta y detiene el envío.
        if (!validateForm()) {
            alert("Por favor, corrige los errores marcados en el formulario.");
            return;
        }

        // Verifica que el usuario que está creando es un admin logueado
        if (!token) {
            alert("Acción no autorizada. Debes ser un administrador para crear usuarios.");
            window.location.href = 'login.html';
            return;
        }

        submitButton.disabled = true;
        submitButton.textContent = 'Registrando...';

        const formData = {
            documentType: form.documentType.value,
            documentNumber: form.documentNumber.value,
            userType: form.userType.value,
            firstName: form.firstName.value,
            lastName: form.lastName.value,
            phone: form.phone.value,
            email: form.email.value,
            confirmEmail: form.confirmEmail.value,
            password: form.password.value
        };

        try {
            const response = await fetch("http://localhost:3000/user", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (!response.ok) {
                // Si hay un array de errores de express-validator, los muestra.
                if (result.errors) {
                    const errorMessages = result.errors.map(err => err.msg).join('\n');
                    throw new Error(errorMessages);
                }
                throw new Error(result.error || `Error ${response.status}`);
            }

            alert("Usuario registrado con éxito");

            // Redirige según desde dónde se abrió el formulario.
            const urlParams = new URLSearchParams(window.location.search);
            const origin = urlParams.get('origin');
            if (origin === 'produccion') {
                window.location.href = '../views/integracion.html';
            } else {
                window.location.href = '../views/lista-usuario.html';
            }

        } catch (error) {
            console.error("Error:", error);
            alert(`Error al registrar: ${error.message}`);
        } finally {
            // Reactiva el botón sin importar si hubo éxito o error.
            submitButton.disabled = false;
            submitButton.textContent = 'Registrarse';
        }
    });
});