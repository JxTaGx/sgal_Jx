document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector(".register__container");

    // Preparamos contenedores de error para cada campo
    const prepareErrorContainers = () => {
        const formGroups = document.querySelectorAll('.register__form-group');
        formGroups.forEach(group => {
            const errorContainer = document.createElement('div');
            errorContainer.className = 'error-container';
            errorContainer.style.height = '20px'; // Altura fija
            errorContainer.style.visibility = 'hidden'; // Inicialmente oculto
            group.appendChild(errorContainer);
        });
    };

    prepareErrorContainers();

    // Función para mostrar errores
    const showError = (input, message) => {
        const formGroup = input.closest('.register__form-group');
        const errorContainer = formGroup.querySelector('.error-container');
        
        errorContainer.textContent = message;
        errorContainer.style.visibility = 'visible';
        input.classList.add('input-error');
    };

    // Función para limpiar errores
    const clearError = (input) => {
        const formGroup = input.closest('.register__form-group');
        const errorContainer = formGroup.querySelector('.error-container');
        
        errorContainer.style.visibility = 'hidden';
        input.classList.remove('input-error');
    };

    // Validaciones individuales (igual que antes)
    const validateDocumentType = (value) => {
        const validTypes = ['tp', 'cc', 'ce', 'ppt', 'pep'];
        return validTypes.includes(value);
    };

    const validateDocumentNumber = (value) => {
        return /^\d{8,15}$/.test(value);
    };

    const validateUserType = (value) => {
        const validTypes = ['SADMIN', 'ADMIN', 'PAP', 'VTE'];
        return validTypes.includes(value);
    };

    const validateName = (value) => {
        return /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,50}$/.test(value);
    };

    const validatePhone = (value) => {
        return /^[0-9]{7,15}$/.test(value);
    };

    const validateEmail = (value) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    };

    const validatePassword = (value) => {
        return value.length >= 8;
    };

    // Validación general del formulario (igual que antes)
    const validateForm = (formData) => {
        let isValid = true;

        // Validar tipo de documento
        if (!validateDocumentType(formData.documentType)) {
            showError(document.querySelector("select[name='documentType']"), "Seleccione un tipo de documento válido");
            isValid = false;
        }

        // Validar número de documento
        if (!validateDocumentNumber(formData.documentNumber)) {
            showError(document.querySelector("input[name='documentNumber']"), "Número de documento inválido (8-15 dígitos)");
            isValid = false;
        }

        // Validar tipo de usuario
        if (!validateUserType(formData.userType)) {
            showError(document.querySelector("select[name='userType']"), "Seleccione un tipo de usuario válido");
            isValid = false;
        }

        // Validar nombre
        if (!validateName(formData.firstName)) {
            showError(document.querySelector("input[name='firstName']"), "Nombre inválido (solo letras, 2-50 caracteres)");
            isValid = false;
        }

        // Validar apellido
        if (!validateName(formData.lastName)) {
            showError(document.querySelector("input[name='lastName']"), "Apellido inválido (solo letras, 2-50 caracteres)");
            isValid = false;
        }

        // Validar teléfono
        if (!validatePhone(formData.phone)) {
            showError(document.querySelector("input[name='phone']"), "Teléfono inválido (7-15 dígitos)");
            isValid = false;
        }

        // Validar email
        if (!validateEmail(formData.email)) {
            showError(document.querySelector("input[name='email']"), "Correo electrónico inválido");
            isValid = false;
        }

        // Validar confirmación de email
        if (formData.email !== formData.confirmEmail) {
            showError(document.querySelector("input[name='confirmEmail']"), "Los correos no coinciden");
            isValid = false;
        }

        // Validar contraseña
        if (!validatePassword(formData.password)) {
            showError(document.querySelector("input[name='password']"), "La contraseña debe tener al menos 8 caracteres");
            isValid = false;
        }

        return isValid;
    };

    // Event listeners para validación en tiempo real (igual que antes)
    document.querySelector("select[name='documentType']").addEventListener('change', (e) => {
        clearError(e.target);
    });

    document.querySelector("input[name='documentNumber']").addEventListener('input', (e) => {
        clearError(e.target);
    });

    document.querySelector("select[name='userType']").addEventListener('change', (e) => {
        clearError(e.target);
    });

    document.querySelector("input[name='firstName']").addEventListener('input', (e) => {
        clearError(e.target);
    });

    document.querySelector("input[name='lastName']").addEventListener('input', (e) => {
        clearError(e.target);
    });

    document.querySelector("input[name='phone']").addEventListener('input', (e) => {
        clearError(e.target);
    });

    document.querySelector("input[name='email']").addEventListener('input', (e) => {
        clearError(e.target);
        const confirmEmail = document.querySelector("input[name='confirmEmail']");
        if (confirmEmail.value && confirmEmail.value !== e.target.value) {
            showError(confirmEmail, "Los correos no coinciden");
        } else {
            clearError(confirmEmail);
        }
    });

    document.querySelector("input[name='confirmEmail']").addEventListener('input', (e) => {
        const email = document.querySelector("input[name='email']").value;
        if (e.target.value !== email) {
            showError(e.target, "Los correos no coinciden");
        } else {
            clearError(e.target);
        }
    });

    document.querySelector("input[name='password']").addEventListener('input', (e) => {
        clearError(e.target);
    });

    // Evento submit del formulario (igual que antes)
    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const formData = {
            documentType: document.querySelector("select[name='documentType']").value,
            documentNumber: document.querySelector("input[name='documentNumber']").value,
            userType: document.querySelector("select[name='userType']").value,
            firstName: document.querySelector("input[name='firstName']").value,
            lastName: document.querySelector("input[name='lastName']").value,
            phone: document.querySelector("input[name='phone']").value,
            email: document.querySelector("input[name='email']").value,
            confirmEmail: document.querySelector("input[name='confirmEmail']").value,
            password: document.querySelector("input[name='password']").value
        };

        // Limpiar todos los errores antes de validar
        document.querySelectorAll('.register__input, .register__select').forEach(input => {
            clearError(input);
        });

        if (!validateForm(formData)) {
            return;
        }

        console.log("Enviando datos:", formData);

        try {
            const response = await fetch("http://localhost:3000/user", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Error en la conexión con el servidor");
            }

            const result = await response.json();
            console.log("Respuesta del servidor:", result);
            alert("Usuario registrado con éxito");

            form.reset();
        } catch (error) {
            console.error("Error:", error);
            alert(error.message || "Hubo un problema al registrar el usuario");
        }
    });
});