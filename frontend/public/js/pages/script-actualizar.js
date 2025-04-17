document.addEventListener('DOMContentLoaded', function() {
    // Mapeo de los campos antiguos a los nuevos selectores
    const fieldSelectors = {
        // Campos de texto (por orden en el formulario)
        'tipoInsumo': '.sensor__form-group:nth-child(1) .sensor__form-input',
        'nombreInsumo': '.sensor__form-group:nth-child(3) .sensor__form-input',
        'unidadMedida': '.sensor__form-group:nth-child(4) .sensor__form-input',
        // Campos numéricos
        'cantidad': '.sensor__form-group:nth-child(5) .sensor__form-input',
        'valorUnitario': '.sensor__form-group:nth-child(6) .sensor__form-input',
        'valorTotal': '.sensor__form-group:nth-child(7) .sensor__form-input',
        'descripcion': '.sensor__textarea'
    };

    // Campos de solo texto (no permite números)
    const textOnlyFields = ['tipoInsumo', 'nombreInsumo', 'unidadMedida'];
    
    // Campos de solo números (no permite letras)
    const numberOnlyFields = ['cantidad', 'valorUnitario', 'valorTotal', 'descripcion'];
    
    // Todos los campos requeridos (marcados con * en el HTML)
    const requiredFields = [
        'tipoInsumo', 'nombreInsumo', 'unidadMedida', 
        'cantidad', 'valorUnitario'
    ];
    
    // Agregar validación para campos de solo texto
    textOnlyFields.forEach(fieldId => {
        const field = document.querySelector(fieldSelectors[fieldId]);
        if (field) {
            field.addEventListener('keypress', function(e) {
                if (!/^[a-zA-Z´ñÑáéíóúÁÉÍÓÚ\s]$/.test(e.key)) {
                    e.preventDefault();
                    showErrorNotification('Los números no están permitidos en este campo');
                }
            });
            
            // Limpiar cualquier número que se haya copiado y pegado
            field.addEventListener('input', function() {
                this.value = this.value.replace(/[0-9]/g, '');
            });
        }
    });
    
    // Agregar validación para campos de solo números
    numberOnlyFields.forEach(fieldId => {
        const field = document.querySelector(fieldSelectors[fieldId]);
        if (field) {
            field.addEventListener('keypress', function(e) {
                if (!/^\d$/.test(e.key) && e.key !== '.') {
                    e.preventDefault();
                    showErrorNotification('Solo se permiten números en este campo');
                }
            });
            
            // También limpiar cualquier letra que se haya copiado y pegado
            field.addEventListener('input', function() {
                this.value = this.value.replace(/[^\d.]/g, '');
            });
        }
    });
    
    // Validar al hacer clic en el botón de guardar
    const saveButton = document.querySelector('.sensor__button--save');
    if (saveButton) {
        saveButton.addEventListener('click', function(e) {
            if (!validateAllFields()) {
                e.preventDefault();
            } else {
                showSuccessNotification('Cambios guardados correctamente');
            }
        });
    }
    
    /**
     * Valida que todos los campos requeridos estén completos
     * @returns {boolean}
     */
    function validateAllFields() {
        let allFieldsComplete = true;
        let firstEmptyField = null;
        
        // Verificar que todos los campos requeridos estén completos
        for (const fieldId of requiredFields) {
            const field = document.querySelector(fieldSelectors[fieldId]);
            if (field && !field.value.trim()) {
                allFieldsComplete = false;
                if (!firstEmptyField) {
                    firstEmptyField = field;
                }
            }
        }
        
        if (!allFieldsComplete) {
            showErrorNotification('Todos los campos marcados con * son obligatorios');
            if (firstEmptyField) {
                firstEmptyField.focus();
            }
            return false;
        }
        
        return true;
    }
    
    /**
     * Muestra una notificación de error
     * @param {string} message 
     */
    function showErrorNotification(message) {
        // Verificar si ya existe la notificación
        let errorNotification = document.querySelector('.notification--error');
        
        // Si no existe, crear una nueva
        if (!errorNotification) {
            errorNotification = document.createElement('div');
            errorNotification.className = 'notification--error';
            errorNotification.style.display = 'none';
            errorNotification.style.position = 'fixed';
            errorNotification.style.top = '20px';
            errorNotification.style.left = '50%';
            errorNotification.style.transform = 'translateX(-50%)';
            errorNotification.style.backgroundColor = '#FEE48B';
            errorNotification.style.color = '#FDC300';
            errorNotification.style.padding = '10px 20px';
            errorNotification.style.borderRadius = '5px';
            errorNotification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
            errorNotification.style.zIndex = '9999';
            document.body.appendChild(errorNotification);
        }
        
        // Mostrar el mensaje
        errorNotification.textContent = message;
        errorNotification.style.display = 'block';
        
        // Ocultar después de 4 segundos
        setTimeout(() => {
            errorNotification.style.display = 'none';
        }, 4000);
    }
    
    /**
     * Muestra una notificación de éxito
     * @param {string} message 
     */
    function showSuccessNotification(message) {
        // Verificar si ya existe la notificación
        let successNotification = document.querySelector('.notification--success');
        
        // Si no existe, crear una nueva
        if (!successNotification) {
            successNotification = document.createElement('div');
            successNotification.className = 'notification--success';
            successNotification.style.display = 'none';
            successNotification.style.position = 'fixed';
            successNotification.style.top = '20px';
            successNotification.style.left = '50%';
            successNotification.style.transform = 'translateX(-50%)';
            successNotification.style.backgroundColor = '#E8F5E9';
            successNotification.style.color = '#2E7D32';
            successNotification.style.padding = '10px 20px';
            successNotification.style.borderRadius = '5px';
            successNotification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
            successNotification.style.zIndex = '9999';
            document.body.appendChild(successNotification);
        }
        
        // Mostrar el mensaje
        successNotification.textContent = message;
        successNotification.style.display = 'block';
        
        // Ocultar después de 4 segundos
        setTimeout(() => {
            successNotification.style.display = 'none';
        }, 4000);
    }
});