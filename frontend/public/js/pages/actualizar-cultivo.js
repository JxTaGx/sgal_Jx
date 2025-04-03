/**
 * Script de validación para formulario de actualización de cultivos
 * Implementa validaciones de HTML5 y JavaScript con manejo de errores
 */

// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', () => {
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
            label.setAttribute('for', id);
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
        'variedad': {
        required: true,
        minLength: 2,
        maxLength: 30,
        errorMessage: 'La variedad debe tener entre 2 y 30 caracteres'
        },
        'fechadesiembra': {
        required: true,
        pattern: /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/,
        errorMessage: 'Formato de fecha inválido. Use DD/MM/AAAA'
        },
        'areacultivadaha': {
        required: true,
        pattern: /^[0-9]+(\.[0-9]{1,2})?$/,
        errorMessage: 'El área debe ser un número positivo con hasta 2 decimales'
        },
        'etapaactual': {
        required: true,
        minLength: 3,
        maxLength: 30,
        errorMessage: 'La etapa actual debe tener entre 3 y 30 caracteres'
        },
        'metododecultivo': {
        required: true,
        minLength: 3,
        maxLength: 30,
        errorMessage: 'El método de cultivo debe tener entre 3 y 30 caracteres'
        },
        'rendimientoesperadotonha': {
        required: true,
        pattern: /^[0-9]+(\.[0-9]{1,2})?$/,
        errorMessage: 'El rendimiento debe ser un número positivo con hasta 2 decimales'
        },
        'metododeriego': {
        required: true,
        minLength: 3,
        maxLength: 30,
        errorMessage: 'El método de riego debe tener entre 3 y 30 caracteres'
        },
        'plandefertilizacion': {
        required: true,
        minLength: 3,
        maxLength: 50,
        errorMessage: 'El plan de fertilización debe tener entre 3 y 50 caracteres'
        },
        'controldeplagas': {
        required: true,
        minLength: 3,
        maxLength: 50,
        errorMessage: 'El control de plagas debe tener entre 3 y 50 caracteres'
        }
    };
    
    /**
     * Configura los atributos de validación HTML5 para cada input
     */
    const setupHtml5Validation = () => {
        try {
        inputs.forEach(input => {
            const fieldId = input.id.toLowerCase();
            const config = validationConfig[fieldId];
            
            if (!config) {
            console.warn(`No se encontró configuración para el campo con ID: ${fieldId}`);
            return;
            }
            
          // Agregar atributos HTML5
            if (config.required) {
            input.setAttribute('required', '');
            }
            
            if (config.minLength) {
            input.setAttribute('minlength', config.minLength);
            }
            
            if (config.maxLength) {
            input.setAttribute('maxlength', config.maxLength);
            }
            
            if (config.pattern) {
            input.setAttribute('pattern', config.pattern.source);
            }
            
          // Para depuración
            console.log(`Configurado campo: ${fieldId} con validaciones:`, config);
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
        // Eliminar mensaje de error existente si hay uno
        const existingError = input.parentElement.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        // Crear nuevo mensaje de error
        const errorElement = document.createElement('span');
        errorElement.className = 'error-message';
        errorElement.style.color = 'red';
        errorElement.style.fontSize = '1.2rem';
        errorElement.style.display = 'block';
        errorElement.style.marginTop = '0.5rem';
        errorElement.textContent = message;
        
        // Agregar estilo al input con error
        input.style.borderColor = 'red';
        
        // Insertar mensaje después del input
        input.insertAdjacentElement('afterend', errorElement);
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
        const errorElement = input.nextElementSibling;
        if (errorElement && errorElement.classList.contains('error-message')) {
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
        const fieldId = input.id.toLowerCase();
        const config = validationConfig[fieldId];
        const value = input.value.trim();
        
        if (!config) {
            console.warn(`No se encontró configuración para validar el campo: ${fieldId}`);
            return true;
        }
        
        // Validar requerido
        if (config.required && value === '') {
            showError(input, 'Este campo es obligatorio');
            return false;
        }
        
        // Validar longitud mínima
        if (config.minLength && value.length < config.minLength) {
            showError(input, config.errorMessage);
            return false;
        }
        
        // Validar longitud máxima
        if (config.maxLength && value.length > config.maxLength) {
            showError(input, config.errorMessage);
            return false;
        }
        
        // Validar patrón
        if (config.pattern && !config.pattern.test(value)) {
            showError(input, config.errorMessage);
            return false;
        }
        
        clearError(input);
        return true;
        } catch (error) {
        console.error('Error durante la validación del campo:', error);
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
          // Para cada campo, validamos y actualizamos el estado general
            const fieldValid = validateField(input);
            isValid = isValid && fieldValid;
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
        // Crear un input de tipo file oculto
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);
        
        // Al hacer clic en el placeholder de imagen, abrir el selector de archivos
        imageUpload.addEventListener('click', () => {
            fileInput.click();
        });
        
        // Cuando se selecciona un archivo
        fileInput.addEventListener('change', (event) => {
            if (event.target.files && event.target.files[0]) {
            const reader = new FileReader();
            
            reader.onload = (e) => {
              // Reemplazar el SVG con la imagen seleccionada
                imageUpload.innerHTML = '';
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
        
        // Cambiar el cursor y añadir texto indicativo
        imageUpload.style.cursor = 'pointer';
        const helpText = document.createElement('p');
        helpText.textContent = 'Haz clic para subir una imagen';
        helpText.style.marginTop = '1rem';
        helpText.style.fontSize = '1.4rem';
        helpText.style.color = 'var(--gray-750)';
        imageUpload.appendChild(helpText);
        } catch (error) {
        console.error('Error al configurar la carga de imágenes:', error);
        }
    };
    
    /**
     * Configura los event listeners para el formulario
     */
    const setupEventListeners = () => {
        try {
        // Validar cada campo al perder el foco
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
            validateField(input);
            });
            
          // Limpiar error al comenzar a escribir
            input.addEventListener('input', () => {
            clearError(input);
            });
        });
        
        // Validar todo el formulario al intentar enviarlo
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            
            if (validateForm()) {
            try {
              // Simulación de envío exitoso
                saveChanges();
            } catch (error) {
                console.error('Error al guardar los cambios:', error);
                showNotification('Error al guardar los cambios. Inténtelo de nuevo.', 'error');
            }
            } else {
            showNotification('Por favor, corrija los errores en el formulario.', 'error');
            }
        });
        
        // Configurar botón de guardar para enviar el formulario
        saveButton.addEventListener('click', (event) => {
            event.preventDefault();
            
            if (validateForm()) {
            try {
                saveChanges();
            } catch (error) {
                console.error('Error al guardar los cambios:', error);
                showNotification('Error al guardar los cambios. Inténtelo de nuevo.', 'error');
            }
            } else {
            showNotification('Por favor, corrija los errores en el formulario.', 'error');
            }
        });
        
        // Configurar botón de cancelar
        cancelButton.addEventListener('click', (event) => {
            event.preventDefault();
            
            try {
            // Confirmación antes de cancelar
            if (confirm('¿Está seguro que desea cancelar? Los cambios no guardados se perderán.')) {
                window.location.href = 'visualizar-cultivo.html';
            }
            } catch (error) {
            console.error('Error al cancelar:', error);
            }
        });
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
        // Crear elemento de notificación
        const notification = document.createElement('div');
        notification.className = `notification notification--${type}`;
        notification.textContent = message;
        
        // Estilos para la notificación
        notification.style.position = 'fixed';
        notification.style.bottom = '2rem';
        notification.style.right = '2rem';
        notification.style.padding = '1.5rem 2rem';
        notification.style.borderRadius = '0.5rem';
        notification.style.zIndex = '1000';
        notification.style.minWidth = '30rem';
        notification.style.boxShadow = '0 0.2rem 1rem rgba(0, 0, 0, 0.2)';
        notification.style.animation = 'fadeIn 0.3s ease-in-out';
        
        if (type === 'success') {
            notification.style.backgroundColor = 'var(--primary-900)';
            notification.style.color = 'var(--white)';
        } else {
            notification.style.backgroundColor = '#ff4d4d';
            notification.style.color = 'var(--white)';
        }
        
        // Agregar al DOM
        document.body.appendChild(notification);
        
        // Eliminar después de 3 segundos
        setTimeout(() => {
            notification.style.animation = 'fadeOut 0.3s ease-in-out';
            setTimeout(() => {
            document.body.removeChild(notification);
            }, 300);
        }, 3000);
        } catch (error) {
        console.error('Error al mostrar notificación:', error);
        }
    };
    
    /**
     * Simula el guardado de los cambios del formulario
     */
    const saveChanges = () => {
        try {
        // Simular un retraso de operación en el servidor
        setTimeout(() => {
            showNotification('¡Cambios guardados correctamente!', 'success');
            setTimeout(() => {
            window.location.href = 'visualizar-cultivo.html';
            }, 2000);
        }, 1000);
        } catch (error) {
        console.error('Error al guardar los cambios:', error);
        throw error; // Re-lanzar el error para manejarlo en el nivel superior
        }
    };
    
    /**
     * Añade estilos CSS para animaciones
     */
    const addAnimationStyles = () => {
        try {
        const styleSheet = document.createElement('style');
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
        console.log("=== CAMPOS DEL FORMULARIO ===");
        inputs.forEach(input => {
        console.log(`Campo: id="${input.id}", value="${input.value}"`);
        });
    };
    
    /**
     * Inicializa todas las funcionalidades
     */
    const init = () => {
        try {
        // Log para depuración
        logFormFields();
        
        setupHtml5Validation();
        setupImageUpload();
        setupEventListeners();
        addAnimationStyles();
        
        console.log("Inicialización completada");
        } catch (error) {
        console.error('Error durante la inicialización:', error);
        }
    };
    
    // Iniciar la aplicación
    init();
    });