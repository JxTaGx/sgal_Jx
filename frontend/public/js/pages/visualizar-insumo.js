/**
 * Validación de formulario para la página "Visualizar Insumo"
 * Incluye validaciones HTML5 y JavaScript adicionales
 * Implementa manejo de errores y mensajes personalizados
 */

// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', () => {
    // Referencias a elementos del formulario
    const form = document.querySelector('.form');
    const tipoInsumoInput = form.querySelector('input[placeholder="Escribe aquí..."]');
    const nombreInsumoInput = form.querySelector('input[value="Harina de trigo"]');
    const unidadMedidaInput = form.querySelector('input[placeholder="Escribe aquí..."]');
    const cantidadInput = form.querySelector('input[type="number"]');
    const valorUnitarioInput = form.querySelector('input[value="$2,500"]');
    const descripcionTextarea = form.querySelector('textarea');
    const editBtn = form.querySelector('.editBtn');
    const backBtn = form.querySelector('.backBtn');
    const desBtn = form.querySelector('.desBtn');
  
    // Configurar atributos de validación HTML5
    setupValidationAttributes();
    
    // Añadir listeners para eventos de validación
    setupEventListeners();
    
    // Configurar botones
    setupButtons();
  
    /**
     * Configura los atributos de validación HTML5 para los campos del formulario
     */
    function setupValidationAttributes() {
      try {
        // Tipo de insumo: requerido, longitud entre 3 y 50 caracteres
        tipoInsumoInput.setAttribute('required', '');
        tipoInsumoInput.setAttribute('minlength', '3');
        tipoInsumoInput.setAttribute('maxlength', '50');
        tipoInsumoInput.setAttribute('id', 'tipoInsumo');
  
        // Nombre del insumo: requerido, longitud entre 3 y 100 caracteres
        nombreInsumoInput.setAttribute('required', '');
        nombreInsumoInput.setAttribute('minlength', '3');
        nombreInsumoInput.setAttribute('maxlength', '100');
        nombreInsumoInput.setAttribute('id', 'nombreInsumo');
  
        // Unidad de medida: requerido, longitud entre 1 y 20 caracteres
        unidadMedidaInput.setAttribute('required', '');
        unidadMedidaInput.setAttribute('minlength', '1');
        unidadMedidaInput.setAttribute('maxlength', '20');
        unidadMedidaInput.setAttribute('id', 'unidadMedida');
  
        // Cantidad: requerido, valor mínimo 0
        cantidadInput.setAttribute('required', '');
        cantidadInput.setAttribute('min', '0');
        cantidadInput.setAttribute('id', 'cantidad');
  
        // Valor unitario: requerido, patrón para formato de moneda
        valorUnitarioInput.setAttribute('required', '');
        valorUnitarioInput.setAttribute('pattern', '\\$?\\d+([,.]\\d{1,3})*(\\.\\d{1,2})?');
        valorUnitarioInput.setAttribute('id', 'valorUnitario');
        
        // Descripción: opcional, longitud máxima 500 caracteres
        descripcionTextarea.setAttribute('maxlength', '500');
        descripcionTextarea.setAttribute('id', 'descripcion');
      } catch (error) {
        console.error('Error al configurar atributos de validación:', error);
      }
    }
  
    /**
     * Configura los event listeners para la validación en tiempo real
     */
    function setupEventListeners() {
      try {
        // Validar campos al perder el foco
        tipoInsumoInput.addEventListener('blur', validateField);
        nombreInsumoInput.addEventListener('blur', validateField);
        unidadMedidaInput.addEventListener('blur', validateField);
        cantidadInput.addEventListener('blur', validateField);
        valorUnitarioInput.addEventListener('blur', validateField);
        
        // Actualizar valor total al cambiar cantidad o valor unitario
        cantidadInput.addEventListener('input', updateTotal);
        valorUnitarioInput.addEventListener('input', updateTotal);
        
        // Validar formulario completo al intentar enviarlo
        form.addEventListener('submit', validateForm);
      } catch (error) {
        console.error('Error al configurar event listeners:', error);
      }
    }
  
    /**
     * Configura los botones del formulario
     */
    function setupButtons() {
      try {
        // Botón Editar: habilita los campos para edición
        editBtn.addEventListener('click', (e) => {
          e.preventDefault();
          enableFormEditing();
        });
        
        // Botón Volver: confirma si se quiere abandonar la página
        backBtn.addEventListener('click', (e) => {
          if (formWasModified()) {
            if (!confirm('¿Está seguro de que desea volver sin guardar los cambios?')) {
              e.preventDefault();
            }
          }
        });
        
        // Botón Deshabilitar: confirma la acción
        desBtn.addEventListener('click', (e) => {
          if (!confirm('¿Está seguro de que desea deshabilitar este insumo?')) {
            e.preventDefault();
          }
        });
      } catch (error) {
        console.error('Error al configurar botones:', error);
      }
    }
  
    /**
     * Valida un campo individual cuando pierde el foco
     * @param {Event} event - El evento de pérdida de foco
     */
    function validateField(event) {
      try {
        const field = event.target;
        const fieldName = field.id;
        const value = field.value.trim();
        
        // Remover cualquier mensaje de error anterior
        removeErrorMessage(field);
        
        // Validaciones específicas por campo
        if (field.hasAttribute('required') && !value) {
          showErrorMessage(field, `El campo ${getFieldLabel(fieldName)} es obligatorio`);
          return false;
        }
        
        if (field.hasAttribute('minlength') && value.length < parseInt(field.getAttribute('minlength'))) {
          const minLength = field.getAttribute('minlength');
          showErrorMessage(field, `${getFieldLabel(fieldName)} debe tener al menos ${minLength} caracteres`);
          return false;
        }
        
        // Validación específica para valor unitario (formato de moneda)
        if (fieldName === 'valorUnitario' && !validateCurrencyFormat(value)) {
          showErrorMessage(field, 'Formato inválido. Use: $X,XXX.XX');
          return false;
        }
        
        return true;
      } catch (error) {
        console.error('Error al validar campo:', error);
        return false;
      }
    }
  
    /**
     * Valida el formulario completo antes de enviarlo
     * @param {Event} event - El evento de envío del formulario
     */
    function validateForm(event) {
      try {
        let isValid = true;
        
        // Validar todos los campos obligatorios
        const requiredFields = form.querySelectorAll('[required]');
        requiredFields.forEach(field => {
          if (!validateField({ target: field })) {
            isValid = false;
          }
        });
        
        // Prevenir envío si hay errores
        if (!isValid) {
          event.preventDefault();
          showGeneralError('Por favor, corrija los errores antes de continuar.');
        }
      } catch (error) {
        console.error('Error al validar formulario:', error);
        event.preventDefault();
        showGeneralError('Ocurrió un error al procesar el formulario.');
      }
    }
  
    /**
     * Actualiza el valor total basado en cantidad y valor unitario
     */
    function updateTotal() {
      try {
        const cantidad = parseFloat(cantidadInput.value) || 0;
        const valorUnitario = parseCurrencyValue(valorUnitarioInput.value);
        const total = cantidad * valorUnitario;
        
        // Actualizar el campo de valor total
        const valorTotalInput = form.querySelector('input[value="$125,000"]');
        if (valorTotalInput) {
          valorTotalInput.value = formatCurrency(total);
        }
      } catch (error) {
        console.error('Error al actualizar total:', error);
      }
    }
  
    /**
     * Habilita la edición de los campos del formulario
     */
    function enableFormEditing() {
      try {
        // Cambiar atributos disabled
        const disabledFields = form.querySelectorAll('input[disabled]');
        disabledFields.forEach(field => {
          if (field.value !== 'INS-001') { // Mantener ID de insumo deshabilitado
            field.removeAttribute('disabled');
          }
        });
        
        // Cambiar el texto del botón Editar
        editBtn.textContent = 'Guardar';
        editBtn.removeEventListener('click', enableFormEditing);
        
        // Añadir nuevo evento para guardar
        editBtn.addEventListener('click', (e) => {
          e.preventDefault();
          if (validateAllFields()) {
            saveChanges();
          }
        });
      } catch (error) {
        console.error('Error al habilitar edición:', error);
      }
    }
  
    /**
     * Valida todos los campos del formulario
     * @return {boolean} - Verdadero si todos los campos son válidos
     */
    function validateAllFields() {
      try {
        let isValid = true;
        const allFields = [
          tipoInsumoInput,
          nombreInsumoInput,
          unidadMedidaInput,
          cantidadInput,
          valorUnitarioInput
        ];
        
        allFields.forEach(field => {
          if (!validateField({ target: field })) {
            isValid = false;
          }
        });
        
        return isValid;
      } catch (error) {
        console.error('Error al validar todos los campos:', error);
        return false;
      }
    }
  
    /**
     * Guarda los cambios del formulario
     */
    function saveChanges() {
      try {
        // Aquí se implementaría la lógica para guardar los cambios
        // Por ejemplo, mediante una llamada a una API o almacenamiento local
        
        // Simulación exitosa
        showSuccessMessage('Insumo actualizado correctamente');
        
        // Redirigir a la página de listado después de un breve retraso
        setTimeout(() => {
          window.location.href = 'listar-insumo-sebas.html';
        }, 2000);
      } catch (error) {
        console.error('Error al guardar cambios:', error);
        showGeneralError('No se pudieron guardar los cambios. Intente nuevamente.');
      }
    }
  
    /**
     * Verifica si el formulario ha sido modificado
     * @return {boolean} - Verdadero si algún campo ha sido modificado
     */
    function formWasModified() {
      // Implementación simple: verificar si algún campo no tiene disabled
      const editableFields = form.querySelectorAll('input:not([disabled]), textarea');
      return editableFields.length > 1; // Más de uno porque textarea siempre es editable
    }
  
    /**
     * Valida formato de moneda
     * @param {string} value - Valor a validar
     * @return {boolean} - Verdadero si el formato es válido
     */
    function validateCurrencyFormat(value) {
      // Formato aceptado: $X,XXX.XX o X,XXX.XX
      const currencyRegex = /^\$?[\d,]+(\.\d{1,2})?$/;
      return currencyRegex.test(value);
    }
  
    /**
     * Convierte un valor de moneda a número
     * @param {string} value - Valor de moneda (ej: "$2,500")
     * @return {number} - Valor numérico
     */
    function parseCurrencyValue(value) {
      try {
        // Remover símbolo de moneda y comas
        const cleanValue = value.replace(/[$,]/g, '');
        return parseFloat(cleanValue) || 0;
      } catch (error) {
        console.error('Error al analizar valor de moneda:', error);
        return 0;
      }
    }
  
    /**
     * Formatea un número como moneda
     * @param {number} value - Valor numérico
     * @return {string} - Valor formateado (ej: "$2,500.00")
     */
    function formatCurrency(value) {
      try {
        return '$' + value.toLocaleString('es-CO', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2
        });
      } catch (error) {
        console.error('Error al formatear moneda:', error);
        return '$0';
      }
    }
  
    /**
     * Muestra un mensaje de error bajo un campo específico
     * @param {HTMLElement} field - Campo con error
     * @param {string} message - Mensaje de error
     */
    function showErrorMessage(field, message) {
      try {
        // Verificar si ya existe un mensaje de error
        removeErrorMessage(field);
        
        // Crear nuevo mensaje de error
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = message;
        errorElement.style.color = 'red';
        errorElement.style.fontSize = '1.2rem';
        errorElement.style.marginTop = '0.5rem';
        
        // Insertar después del campo
        field.parentNode.appendChild(errorElement);
        
        // Marcar el campo visualmente
        field.style.borderColor = 'red';
      } catch (error) {
        console.error('Error al mostrar mensaje de error:', error);
      }
    }
  
    /**
     * Elimina el mensaje de error de un campo
     * @param {HTMLElement} field - Campo del que eliminar el error
     */
    function removeErrorMessage(field) {
      try {
        const parent = field.parentNode;
        const errorElement = parent.querySelector('.error-message');
        
        if (errorElement) {
          parent.removeChild(errorElement);
        }
        
        // Restaurar estilo de borde
        field.style.borderColor = '';
      } catch (error) {
        console.error('Error al eliminar mensaje de error:', error);
      }
    }
  
    /**
     * Muestra un mensaje de error general
     * @param {string} message - Mensaje de error
     */
    function showGeneralError(message) {
      try {
        // Verificar si ya existe un mensaje general
        let errorContainer = document.querySelector('.general-error');
        
        if (!errorContainer) {
          // Crear contenedor para mensaje general
          errorContainer = document.createElement('div');
          errorContainer.className = 'general-error';
          errorContainer.style.backgroundColor = '#FDC300';
          errorContainer.style.color = '#FDC300';
          errorContainer.style.padding = '1rem';
          errorContainer.style.borderRadius = '0.4rem';
          errorContainer.style.marginBottom = '2rem';
          errorContainer.style.textAlign = 'center';
          errorContainer.style.width = '100%';
          
          // Insertar al principio del formulario
          form.insertBefore(errorContainer, form.firstChild);
        }
        
        errorContainer.textContent = message;
        
        // Desplazar al inicio del formulario
        errorContainer.scrollIntoView({ behavior: 'smooth' });
      } catch (error) {
        console.error('Error al mostrar error general:', error);
        alert(message); // Fallback a alerta estándar
      }
    }
  
    /**
     * Muestra un mensaje de éxito
     * @param {string} message - Mensaje de éxito
     */
    function showSuccessMessage(message) {
      try {
        // Verificar si ya existe un mensaje
        let successContainer = document.querySelector('.success-message');
        
        if (!successContainer) {
          // Crear contenedor para mensaje de éxito
          successContainer = document.createElement('div');
          successContainer.className = 'success-message';
          successContainer.style.backgroundColor = '#e8f5e9';
          successContainer.style.color = '#2e7d32';
          successContainer.style.padding = '1rem';
          successContainer.style.borderRadius = '0.4rem';
          successContainer.style.marginBottom = '2rem';
          successContainer.style.textAlign = 'center';
          successContainer.style.width = '100%';
          
          // Insertar al principio del formulario
          form.insertBefore(successContainer, form.firstChild);
        }
        
        successContainer.textContent = message;
      } catch (error) {
        console.error('Error al mostrar mensaje de éxito:', error);
        alert(message); // Fallback a alerta estándar
      }
    }
  
    /**
     * Obtiene la etiqueta legible de un campo según su ID
     * @param {string} fieldId - ID del campo
     * @return {string} - Etiqueta legible
     */
    function getFieldLabel(fieldId) {
      const labels = {
        'tipoInsumo': 'Tipo de insumo',
        'nombreInsumo': 'Nombre del insumo',
        'unidadMedida': 'Unidad de medida',
        'cantidad': 'Cantidad',
        'valorUnitario': 'Valor unitario',
        'descripcion': 'Descripción'
      };
      
      return labels[fieldId] || fieldId;
    }
  });