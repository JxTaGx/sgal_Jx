/**
 * Script de validación para formulario de actualización de cultivos
 * Implementa validaciones de HTML5 y JavaScript con manejo de errores
 */

// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', async () => {
    // Elementos del formulario
    const form = document.querySelector('.update-crop__form');
    const inputs = Array.from(form.querySelectorAll('.update-crop__input'));
    const saveButton = document.querySelector('.update-crop__button--save');
    const cancelButton = document.querySelector('.update-crop__button--cancel');
    const imageUpload = document.querySelector('.update-crop__image-placeholder');

    // Asignar IDs a los inputs basados en sus labels si no los tienen
    inputs.forEach(input => {
        if (!input.id) {
            const label = input.previousElementSibling;
            if (label && label.textContent) {
                const id = label.textContent.toLowerCase().replace(/\s/g, '').replace(/[^a-zA-Z0-9]/g, '');
                input.id = id;
                if (label.tagName === 'LABEL') { // Ensure it's a label before setting 'for'
                    label.setAttribute('for', id);
                }
            }
        }
    });

    // Mapeo de IDs de campos a sus validaciones
    const validationConfig = {
        'nombredelcultivo': {
            required: true,
            minLength: 3,
            maxLength: 50,
            errorMessage: 'El nombre del cultivo debe tener entre 3 y 50 caracteres'
        },
        'tipocultivo': { // Corrected ID from HTML
            required: true,
            minLength: 2,
            maxLength: 30,
            errorMessage: 'El tipo de cultivo debe tener entre 2 y 30 caracteres'
        },
        'tamaño': { // Corrected ID (using 'tamaño' as per label, but ensure consistency)
            required: true,
            // pattern: /^[0-9]+(\.[0-9]{1,2})?\s*(m²|ha)$/i, // Example: 10 m² or 1.5 ha
            errorMessage: 'El tamaño debe ser un número seguido de m² o ha (ej: 100 m²)'
        },
        'ubicación': { // Corrected ID
            required: true,
            minLength: 3,
            maxLength: 100,
            errorMessage: 'La ubicación debe tener entre 3 y 100 caracteres'
        },
        'estado': {
            required: true,
            // You might want a select for "estado" or specific allowed values
            errorMessage: 'El estado es obligatorio'
        },
        'descripción': { // Corrected ID
            required: false, // Assuming description is optional
            maxLength: 200,
            errorMessage: 'La descripción no puede exceder los 200 caracteres'
        }
        // ID field is disabled, so no validation needed here
    };


    /**
     * Configura los atributos de validación HTML5 para cada input
     */
    const setupHtml5Validation = () => {
        try {
            inputs.forEach(input => {
                if (input.disabled) return; // Skip disabled inputs like ID
                const fieldId = input.id.toLowerCase();
                const config = validationConfig[fieldId];

                if (!config) {
                    // console.warn(`No se encontró configuración para el campo con ID: ${fieldId}`);
                    return;
                }

                if (config.required) input.setAttribute('required', '');
                if (config.minLength) input.setAttribute('minlength', config.minLength);
                if (config.maxLength) input.setAttribute('maxlength', config.maxLength);
                if (config.pattern) input.setAttribute('pattern', config.pattern.source);

                // console.log(`Configurado campo: ${fieldId} con validaciones:`, config);
            });
        } catch (error) {
            console.error('Error al configurar validaciones HTML5:', error);
        }
    };

    /**
     * Crea y muestra un mensaje de error para un campo específico
     * @param {HTMLElement} input - El campo de entrada con error
     * @param {string} message - El mensaje de error a mostrar
     */
    const showError = (input, message) => {
        try {
            const errorContainer = input.parentElement.querySelector('.error-message') || document.createElement('span');
            errorContainer.className = 'error-message'; // Ensure class for potential existing spans
            errorContainer.style.color = 'var(--secondary-4-950, red)'; // Use CSS variable or fallback
            errorContainer.style.fontSize = '1.2rem';
            errorContainer.style.display = 'block';
            errorContainer.style.marginTop = '0.5rem';
            errorContainer.textContent = message;

            input.style.borderColor = 'var(--secondary-4-950, red)';

            if (!input.parentElement.querySelector('.error-message')) {
                input.insertAdjacentElement('afterend', errorContainer);
            }
        } catch (error) {
            console.error('Error al mostrar mensaje de error:', error);
        }
    };


    /**
     * Elimina el mensaje de error de un campo
     * @param {HTMLElement} input - El campo de entrada a limpiar
     */
    const clearError = (input) => {
        try {
            const errorElement = input.parentElement.querySelector('.error-message');
            if (errorElement) {
                errorElement.remove();
            }
            input.style.borderColor = '';
        } catch (error) {
            console.error('Error al limpiar mensaje de error:', error);
        }
    };


    /**
     * Valida un campo de entrada individual
     * @param {HTMLElement} input - El campo a validar
     * @returns {boolean} - True si el campo es válido, false si no
     */
    const validateField = (input) => {
        try {
            if (input.disabled) return true; // Skip disabled inputs
            const fieldId = input.id ? input.id.toLowerCase() : '';
            const config = validationConfig[fieldId];
            const value = input.value.trim();

            if (!config) {
                // console.warn(`No se encontró configuración para validar el campo: ${fieldId}`);
                return true; // Consider valid if no config
            }

            clearError(input); // Clear previous error before validating

            if (config.required && value === '') {
                showError(input, 'Este campo es obligatorio.');
                return false;
            }
            if (config.minLength && value.length < config.minLength) {
                showError(input, config.errorMessage || `Mínimo ${config.minLength} caracteres.`);
                return false;
            }
            if (config.maxLength && value.length > config.maxLength) {
                showError(input, config.errorMessage || `Máximo ${config.maxLength} caracteres.`);
                return false;
            }
            if (config.pattern && !config.pattern.test(value)) {
                showError(input, config.errorMessage || 'Formato inválido.');
                return false;
            }
            return true;
        } catch (error) {
            console.error('Error durante la validación del campo:', error);
            showError(input, 'Error de validación inesperado.');
            return false;
        }
    };


    /**
     * Valida todo el formulario
     * @returns {boolean} - True si todo el formulario es válido, false si no
     */
    const validateForm = () => {
        try {
            let isValid = true;
            inputs.forEach(input => {
                if (!validateField(input)) {
                    isValid = false;
                }
            });
            return isValid;
        } catch (error) {
            console.error('Error durante la validación del formulario:', error);
            return false;
        }
    };

    /**
     * Configura la funcionalidad para carga de imágenes
     */
    const setupImageUpload = () => {
        try {
            if (!imageUpload) return;
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*';
            fileInput.style.display = 'none';
            document.body.appendChild(fileInput);

            imageUpload.addEventListener('click', () => fileInput.click());

            fileInput.addEventListener('change', (event) => {
                if (event.target.files && event.target.files[0]) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        imageUpload.innerHTML = ''; // Clear placeholder
                        const img = document.createElement('img');
                        img.src = e.target.result;
                        img.style.maxWidth = '100%';
                        img.style.maxHeight = '100%';
                        img.style.objectFit = 'contain';
                        imageUpload.appendChild(img);
                    };
                    reader.readAsDataURL(event.target.files[0]);
                }
            });

            imageUpload.style.cursor = 'pointer';
            if (!imageUpload.querySelector('p')) { // Add help text only if not already image
                 const helpText = document.createElement('p');
                 helpText.textContent = 'Haz clic para cambiar/subir una imagen';
                 helpText.style.marginTop = '1rem';
                 helpText.style.fontSize = '1.4rem';
                 helpText.style.color = 'var(--gray-750)';
                 imageUpload.appendChild(helpText);
            }

        } catch (error) {
            console.error('Error al configurar la carga de imágenes:', error);
        }
    };


    /**
     * Configura los event listeners para el formulario
     */
    const setupEventListeners = () => {
        try {
            inputs.forEach(input => {
                if (input.disabled) return;
                input.addEventListener('blur', () => validateField(input));
                input.addEventListener('input', () => clearError(input));
            });

            if (form) {
                form.addEventListener('submit', async (event) => { // Make async for fetch
                    event.preventDefault();
                    if (validateForm()) {
                        try {
                            await saveChanges(); // await the saveChanges
                        } catch (error) {
                            console.error('Error al guardar los cambios:', error);
                            showNotification('Error al guardar los cambios. Inténtelo de nuevo.', 'error');
                        }
                    } else {
                        showNotification('Por favor, corrija los errores en el formulario.', 'error');
                    }
                });
            }


            if (cancelButton) {
                cancelButton.addEventListener('click', (event) => {
                    // No preventDefault if it's an <a> tag
                    // event.preventDefault(); 
                    try {
                        if (confirm('¿Está seguro que desea cancelar? Los cambios no guardados se perderán.')) {
                            window.location.href = 'visualizar-cultivo.html';
                        }
                    } catch (error) {
                        console.error('Error al cancelar:', error);
                    }
                });
            }
        } catch (error) {
            console.error('Error al configurar event listeners:', error);
        }
    };


    /**
     * Muestra una notificación al usuario
     * @param {string} message - El mensaje a mostrar
     * @param {string} type - El tipo de notificación (success, error)
     */
    const showNotification = (message, type = 'success') => {
        try {
            let notification = document.querySelector(`.notification--${type}`);
            if (!notification) {
                notification = document.createElement('div');
                notification.className = `notification notification--${type}`;
                document.body.appendChild(notification);

                // Estilos para la notificación
                Object.assign(notification.style, {
                    position: 'fixed',
                    bottom: '2rem',
                    right: '2rem',
                    padding: '1.5rem 2rem',
                    borderRadius: '0.5rem',
                    zIndex: '1000',
                    minWidth: '30rem',
                    boxShadow: '0 0.2rem 1rem rgba(0, 0, 0, 0.2)',
                    animation: 'fadeIn 0.3s ease-in-out'
                });
            }

            notification.textContent = message;
            notification.style.display = 'block'; // Ensure it's visible


            if (type === 'success') {
                notification.style.backgroundColor = 'var(--primary-900)';
                notification.style.color = 'var(--white)';
            } else { // error or other
                notification.style.backgroundColor = 'var(--secondary-4-500, #FDC300)'; // Using a fallback
                notification.style.color = 'var(--black, #000000)';
            }


            setTimeout(() => {
                notification.style.animation = 'fadeOut 0.3s ease-in-out forwards';
                notification.addEventListener('animationend', () => {
                    if (notification.parentNode) { // Check if it's still in DOM
                        notification.remove();
                    }
                }, { once: true });
            }, 3000);
        } catch (error) {
            console.error('Error al mostrar notificación:', error);
        }
    };

    /**
     * Simula el guardado de los cambios del formulario
     */
    const saveChanges = async () => { // Make it async
        const idCultivo = localStorage.getItem("idCultivo");
        if (!idCultivo) {
            showNotification("No se encontró el ID del cultivo para actualizar.", "error");
            return;
        }

        const datosActualizados = {
            nombre_cultivo: document.getElementById("nombredelcultivo")?.value, // Use corrected IDs
            tipo_cultivo: document.getElementById("tipocultivo")?.value,
            tamano: document.getElementById("tamaño")?.value,
            ubicacion: document.getElementById("ubicación")?.value,
            estado: document.getElementById("estado")?.value,
            descripcion: document.getElementById("descripción")?.value
            // id_cultivo is not sent in body for PUT usually, it's in URL
        };

        // Remove undefined fields to avoid issues with backend
        Object.keys(datosActualizados).forEach(key => {
            if (datosActualizados[key] === undefined) {
                delete datosActualizados[key];
            }
        });


        try {
            const res = await fetch(`http://localhost:3000/cultivos/${idCultivo}`, { // Ensure endpoint is correct
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(datosActualizados)
            });

            if (res.ok) {
                showNotification('¡Cambios guardados correctamente!', 'success');
                setTimeout(() => {
                    window.location.href = 'visualizar-cultivo.html';
                }, 1500); // Redirect after 1.5 seconds
            } else {
                const errorData = await res.json().catch(() => ({ message: "Error desconocido del servidor." }));
                throw new Error(errorData.message || `Error al actualizar el cultivo (HTTP ${res.status})`);
            }
        } catch (error) {
            console.error('Error al guardar los cambios:', error);
            showNotification(error.message || 'Error al guardar los cambios. Inténtelo de nuevo.', 'error');
        }
    };

    /**
     * Añade estilos CSS para animaciones
     */
    const addAnimationStyles = () => {
        try {
            if (document.getElementById('animation-styles')) return; // Avoid adding multiple times
            const styleSheet = document.createElement('style');
            styleSheet.id = 'animation-styles';
            styleSheet.textContent = `
                @keyframes fadeIn {
                from { opacity: 0; transform: translateY(1rem); }
                to { opacity: 1; transform: translateY(0); }
                }
                
                @keyframes fadeOut {
                from { opacity: 1; transform: translateY(0); }
                to { opacity: 0; transform: translateY(1rem); }
                }
                
                .update-crop__button:hover {
                filter: brightness(1.1);
                transform: translateY(-0.2rem);
                transition: all 0.2s ease;
                }
                
                .update-crop__button {
                transition: all 0.2s ease;
                }
                
                .update-crop__input:focus {
                border-color: var(--primary-900);
                box-shadow: 0 0 0.5rem rgba(57, 169, 0, 0.3);
                outline: none;
                transition: all 0.3s ease;
                }
                
                .update-crop__input {
                transition: all 0.3s ease;
                }
            `;
            document.head.appendChild(styleSheet);
        } catch (error) {
            console.error('Error al añadir estilos de animación:', error);
        }
    };

    // Función para logear todos los campos del formulario (ayuda para depuración)
    const logFormFields = () => {
        // console.log("=== CAMPOS DEL FORMULARIO ===");
        inputs.forEach(input => {
            // console.log(`Campo: id="${input.id}", value="${input.value}"`);
        });
    };

    /**
     * Inicializa todas las funcionalidades
     */
    const init = async () => { // Make init async to await data loading
        try {
            logFormFields();
            setupHtml5Validation();
            setupImageUpload();
            setupEventListeners();
            addAnimationStyles();

            // Load existing data
            const idCultivo = localStorage.getItem("idCultivo");
            if (!idCultivo) {
                showNotification("No se encontró el ID del cultivo para cargar datos.", "error");
                return;
            }

            const res = await fetch(`http://localhost:3000/cultivos/${idCultivo}`); // Ensure correct endpoint
            if (!res.ok) {
                const errorData = await res.json().catch(() => null);
                throw new Error(errorData?.message || `Error al cargar datos del cultivo (HTTP ${res.status}).`);
            }
            const cultivo = await res.json();

            if (cultivo && cultivo.data) { // Check if data exists in the response
                const cultivoData = cultivo.data;
                document.getElementById("nombredelcultivo").value = cultivoData.nombre_cultivo || '';
                document.getElementById("tipocultivo").value = cultivoData.tipo_cultivo || '';
                document.getElementById("tamaño").value = cultivoData.tamano || '';
                document.getElementById("ubicación").value = cultivoData.ubicacion || '';
                document.getElementById("estado").value = cultivoData.estado || '';
                document.getElementById("descripción").value = cultivoData.descripcion || '';
                document.getElementById("idCultivoMostrar").value = cultivoData.id_cultivo || ''; // Use the correct ID field from your data
                 // Handle image if available in cultivoData.fotografia
                if (cultivoData.fotografia && imageUpload) {
                    imageUpload.innerHTML = ''; // Clear placeholder
                    const img = document.createElement('img');
                    img.src = cultivoData.fotografia; // Assuming this is a URL or base64 string
                    img.style.maxWidth = '100%';
                    img.style.maxHeight = '100%';
                    img.style.objectFit = 'contain';
                    imageUpload.appendChild(img);
                }

            } else {
                throw new Error('No se recibieron datos válidos del cultivo.');
            }


            // console.log("Inicialización completada");
        } catch (error) {
            console.error('Error durante la inicialización:', error);
            showNotification(`Error al inicializar: ${error.message}`, 'error');
        }
    };

    // Iniciar la aplicación
    init();
});