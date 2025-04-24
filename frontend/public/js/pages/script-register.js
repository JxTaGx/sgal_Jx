// script-register.js (Updated with Conditional Back Button Logic)

document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector(".register__container");
    const btnVolver = document.querySelector('#btn-volver-registro'); // Target the specific button ID
    const submitButton = document.querySelector('.register__button--submit'); // Target submit button

    // --- Error Handling Functions ---
    const prepareErrorContainers = () => {
        const formGroups = document.querySelectorAll('.register__form-group');
        formGroups.forEach(group => {
            // Avoid adding multiple containers if script runs again
            if (!group.querySelector('.error-container')) {
                const errorContainer = document.createElement('div');
                errorContainer.className = 'error-container';
                errorContainer.style.height = '20px';
                errorContainer.style.visibility = 'hidden';
                errorContainer.style.color = 'red'; // Make errors visible
                errorContainer.style.fontSize = '0.8em';
                errorContainer.style.marginTop = '4px';
                group.appendChild(errorContainer);
            }
        });
    };
    prepareErrorContainers();

    const showError = (input, message) => {
        const formGroup = input.closest('.register__form-group');
        const errorContainer = formGroup?.querySelector('.error-container');
        if (errorContainer) {
            errorContainer.textContent = message;
            errorContainer.style.visibility = 'visible';
        }
        input.classList.add('input-error'); // Add error class for styling
    };

    const clearError = (input) => {
        const formGroup = input.closest('.register__form-group');
        const errorContainer = formGroup?.querySelector('.error-container');
        if (errorContainer) {
            errorContainer.textContent = '';
            errorContainer.style.visibility = 'hidden';
        }
        input.classList.remove('input-error');
    };

    // --- Input Validation Functions ---
    const validateDocumentType = (value) => value !== ''; // Ensure a selection is made
    const validateDocumentNumber = (value) => /^\d{8,15}$/.test(value);
    const validateUserType = (value) => value !== ''; // Ensure a selection is made
    const validateName = (value) => /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s']{2,50}$/.test(value); // Allow apostrophe
    const validatePhone = (value) => /^[0-9]{7,15}$/.test(value);
    const validateEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    const validatePassword = (value) => value.length >= 8;

    // --- Form Validation Function ---
    const validateForm = (formData) => {
        let isValid = true;
        // Clear all previous errors
        document.querySelectorAll('.register__input, .register__select').forEach(clearError);

        if (!validateDocumentType(formData.documentType)) { showError(document.querySelector("select[name='documentType']"), "Seleccione un tipo"); isValid = false; }
        if (!validateDocumentNumber(formData.documentNumber)) { showError(document.querySelector("input[name='documentNumber']"), "Número inválido (8-15 dígitos)"); isValid = false; }
        if (!validateUserType(formData.userType)) { showError(document.querySelector("select[name='userType']"), "Seleccione un tipo"); isValid = false; }
        if (!validateName(formData.firstName)) { showError(document.querySelector("input[name='firstName']"), "Nombre inválido"); isValid = false; }
        if (!validateName(formData.lastName)) { showError(document.querySelector("input[name='lastName']"), "Apellido inválido"); isValid = false; }
        if (!validatePhone(formData.phone)) { showError(document.querySelector("input[name='phone']"), "Teléfono inválido (7-15 dígitos)"); isValid = false; }
        if (!validateEmail(formData.email)) { showError(document.querySelector("input[name='email']"), "Correo inválido"); isValid = false; }
        if (formData.email !== formData.confirmEmail) { showError(document.querySelector("input[name='confirmEmail']"), "Los correos no coinciden"); isValid = false; }
        else if (!validateEmail(formData.confirmEmail)) { showError(document.querySelector("input[name='confirmEmail']"), "Confirme el correo"); isValid = false;} // Also check if confirm email is valid format
        if (!validatePassword(formData.password)) { showError(document.querySelector("input[name='password']"), "Mínimo 8 caracteres"); isValid = false; }

        return isValid;
    };

    // --- Event Listeners for Real-time Validation ---
    form.querySelectorAll('.register__input, .register__select').forEach(input => {
        input.addEventListener('input', () => clearError(input)); // Clear error on input/change
        input.addEventListener('change', () => clearError(input));
         // Special handling for confirm email
         if (input.name === 'email' || input.name === 'confirmEmail') {
             input.addEventListener('input', () => {
                 const emailInput = document.querySelector("input[name='email']");
                 const confirmEmailInput = document.querySelector("input[name='confirmEmail']");
                 if (emailInput.value && confirmEmailInput.value && emailInput.value !== confirmEmailInput.value) {
                     showError(confirmEmailInput, "Los correos no coinciden");
                 } else if (emailInput.value && confirmEmailInput.value) {
                      clearError(confirmEmailInput); // Clear if they match now
                 }
             });
         }
    });


    // --- Conditional Back Button Logic ---
    function setupVolverButtonRegistro() {
        if (!btnVolver) {
            console.warn("Botón Volver (#btn-volver-registro) no encontrado.");
            return;
        }
        const urlParams = new URLSearchParams(window.location.search);
        const origin = urlParams.get('origin');

        btnVolver.addEventListener('click', () => {
            if (origin === 'produccion') {
                window.location.href = '../views/integracion.html#create'; // Adjust path if needed
            } else {
                window.location.href = '../views/lista-usuario.html'; // Adjust path if needed
            }
        });
        console.log(`Botón Volver (Registro) configurado para ir a: ${origin === 'produccion' ? '../views/integracion.html#create' : '../views/lista-usuario.html'}`);
    }
    setupVolverButtonRegistro(); // Initialize the back button logic

    // --- Form Submit Logic ---
    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        // Disable button during submission
        if(submitButton) submitButton.disabled = true; submitButton.textContent = 'Registrando...';


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

        if (!validateForm(formData)) {
             if(submitButton) submitButton.disabled = false; submitButton.textContent = 'Registrarse'; // Re-enable button
            return; // Stop submission if validation fails
        }

        console.log("Enviando datos:", formData);

        try {
            const response = await fetch("http://localhost:3000/user", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            const result = await response.json(); // Try parsing JSON regardless of status

            if (!response.ok) {
                // Use error message from backend if available
                throw new Error(result.error || result.message || `Error ${response.status}`);
            }

            console.log("Respuesta del servidor:", result);
            alert("Usuario registrado con éxito");

            // Decide where to redirect after successful creation
             const urlParams = new URLSearchParams(window.location.search);
             const origin = urlParams.get('origin');
             if (origin === 'produccion') {
                 window.location.href = '../views/integracion.html#create'; // Go back to production create
             } else {
                 window.location.href = '../views/lista-usuario.html'; // Go to user list
             }
             // Don't reset form if redirecting immediately
             // form.reset();

        } catch (error) {
            console.error("Error:", error);
            alert(`Error al registrar: ${error.message}`);
             if(submitButton) submitButton.disabled = false; submitButton.textContent = 'Registrarse'; // Re-enable button on error
        }
    });
});