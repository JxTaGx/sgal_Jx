// Esperar a que el DOM esté completamente cargado
document.addEventListener("DOMContentLoaded", () => {
    // Obtener referencias a elementos del formulario
    const form = document.querySelector(".cultivo-form");
    const idCicloInput = form.querySelector('input[value="Tomate Cherry Orgánico"]');
    const nombreCicloInput = form.querySelector('input[value="Sweet 100"]');
    const periodoSiembraInput = form.querySelector('input[value="15/03/2023"]');
    const novedadesInput = form.querySelector('input[value="2.5"]');
    const descripcionInput = form.querySelector('input[value="Crecimiento vegetativo"]');
    const saveButton = form.querySelector(".cultivo-form__btn--save");
    const cancelButton = form.querySelector(".cultivo-form__btn--cancel");

    // Configurar IDs para facilitar el acceso a los campos
    idCicloInput.id = "idCiclo";
    nombreCicloInput.id = "nombreCiclo";
    periodoSiembraInput.id = "periodoSiembra";
    novedadesInput.id = "novedades";
    descripcionInput.id = "descripcion";

    /**
     * Mostrar mensaje de error en un campo específico
     * @param {HTMLElement} input - El elemento input con error
     * @param {string} message - Mensaje de error a mostrar
     */
    const showError = (input, message) => {
        try {
            // Buscar si ya existe un mensaje de error para este campo
            let errorElement = input.parentElement.querySelector(".error-message");

            // Si no existe, crear uno nuevo
            if (!errorElement) {
                errorElement = document.createElement("span");
                errorElement.className = "error-message";
                errorElement.style.color = "#ff0000";
                errorElement.style.fontSize = "1.2rem";
                errorElement.style.display = "block";
                errorElement.style.marginTop = "0.5rem";
                input.parentElement.appendChild(errorElement);
            }

            // Establecer mensaje y estilo al input
            errorElement.textContent = message;
            input.style.borderColor = "#ff0000";
        } catch (error) {
            console.error("Error al mostrar mensaje de error:", error);
        }
    };

    /**
     * Eliminar mensaje de error de un campo
     * @param {HTMLElement} input - El elemento input a limpiar
     */
    const clearError = (input) => {
        try {
            const errorElement = input.parentElement.querySelector(".error-message");
            if (errorElement) {
                errorElement.remove();
            }
            input.style.borderColor = "";
        } catch (error) {
            console.error("Error al limpiar mensaje de error:", error);
        }
    };

    /**
     * Validar campo según criterios específicos
     * @param {HTMLElement} input - Campo a validar
     * @returns {boolean} - Si el campo es válido
     */
    const validateField = (input) => {
        try {
            clearError(input);
            const value = input.value.trim();

            // Validación según el tipo de campo
            switch (input.id) {
                case "idCiclo":
                    if (value.length < 3) {
                        showError(input, "El ID del ciclo debe tener al menos 3 caracteres");
                        return false;
                    }
                    break;

                case "nombreCiclo":
                    if (value.length < 2) {
                        showError(input, "El nombre del ciclo debe tener al menos 2 caracteres");
                        return false;
                    }
                    break;

                case "periodoSiembra":
                    const datePattern = /^(\d{2})\/(\d{2})\/(\d{4})$/;
                    if (!datePattern.test(value)) {
                        showError(input, "El formato de fecha debe ser DD/MM/AAAA");
                        return false;
                    }

                    // Validar fecha realista
                    const [, day, month, year] = value.match(datePattern);
                    const date = new Date(year, month - 1, day);

                    if (
                        date.getFullYear() !== parseInt(year) ||
                        date.getMonth() !== parseInt(month) - 1 ||
                        date.getDate() !== parseInt(day)
                    ) {
                        showError(input, "La fecha no es válida");
                        return false;
                    }
                    break;

                case "novedades":
                    if (value.length < 1 || value.length > 100) {
                        showError(input, "Las novedades deben tener entre 1 y 100 caracteres");
                        return false;
                    }
                    break;

                case "descripcion":
                    if (value.length < 5) {
                        showError(input, "La descripción debe tener al menos 5 caracteres");
                        return false;
                    }
                    break;
            }

            return true;
        } catch (error) {
            console.error(`Error al validar campo ${input.id}:`, error);
            showError(input, "Error en la validación del campo");
            return false;
        }
    };

    /**
     * Validar todo el formulario
     * @returns {boolean} - Si el formulario es válido
     */
    const validateForm = () => {
        try {
            const inputs = [
                idCicloInput,
                nombreCicloInput,
                periodoSiembraInput,
                novedadesInput,
                descripcionInput
            ];

            return inputs.every(input => validateField(input));
        } catch (error) {
            console.error("Error al validar formulario:", error);
            alert("Ha ocurrido un error al validar el formulario. Por favor, inténtelo de nuevo.");
            return false;
        }
    };

    // Evento para validación en tiempo real cuando se pierde el foco
    form.querySelectorAll("input").forEach(input => {
        input.addEventListener("blur", () => {
            validateField(input);
        });

        // Eliminar error cuando el usuario comienza a escribir
        input.addEventListener("input", () => {
            clearError(input);
        });
    });

    // Evento para el botón de guardado
    saveButton.addEventListener("click", (e) => {
        try {
            e.preventDefault();

            if (validateForm()) {
                // Simulación de envío exitoso
                const successMessage = document.createElement("div");
                successMessage.className = "success-message";
                successMessage.textContent = "¡Datos guardados correctamente!";
                successMessage.style.backgroundColor = "var(--primary-900)";
                successMessage.style.color = "white";
                successMessage.style.padding = "1rem";
                successMessage.style.borderRadius = "0.5rem";
                successMessage.style.textAlign = "center";
                successMessage.style.marginTop = "1rem";

                // Insertar el mensaje antes de los botones
                const buttonsContainer = document.querySelector(".cultivo-form__buttons");
                form.insertBefore(successMessage, buttonsContainer);

                // Redirigir después de 2 segundos
                setTimeout(() => {
                    window.location.href = "visualizar-ciclo-cultivo.html";
                }, 2000);
            } else {
                // Mostrar mensaje de error general
                const errorSummary = document.createElement("div");
                errorSummary.className = "error-summary";
                errorSummary.textContent =
                    "Por favor, corrija los errores en el formulario antes de continuar.";
                errorSummary.style.backgroundColor = "#ffebee";
                errorSummary.style.color = "#d32f2f";
                errorSummary.style.padding = "1rem";
                errorSummary.style.borderRadius = "0.5rem";
                errorSummary.style.textAlign = "center";
                errorSummary.style.marginTop = "1rem";

                // Verificar si ya existe un mensaje de error general
                const existingError = form.querySelector(".error-summary");
                if (existingError) {
                    existingError.remove();
                }

                // Insertar el mensaje al principio del formulario
                form.insertBefore(errorSummary, form.firstChild);

                // Eliminado el scroll automático
                // errorSummary.scrollIntoView({ behavior: "smooth" });
            }
        } catch (error) {
            console.error("Error al procesar el formulario:", error);
            alert("Ha ocurrido un error al procesar el formulario. Por favor, inténtelo de nuevo.");
        }
    });

    // Evento para el botón de cancelar
    cancelButton.addEventListener("click", () => {
        try {
            if (confirm("¿Está seguro de que desea cancelar? Los cambios no se guardarán.")) {
                window.location.href = "visualizar-ciclo-cultivo.html";
            }
        } catch (error) {
            console.error("Error al cancelar el formulario:", error);
        }
    });

    // Prevenir envío del formulario con Enter
    form.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
        }
    });

    // Inicialización: validar campos con valores predeterminados
    console.log("Formulario de Actualizar Ciclo Cultivo inicializado");
});