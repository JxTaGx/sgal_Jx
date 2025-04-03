/**
 * Script de validación para el formulario de actualización de insumos
 * Aplica validaciones HTML5 y JavaScript con manejo de errores personalizado
 */

document.addEventListener("DOMContentLoaded", () => {
    // Referencias a elementos del formulario
    const form = document.querySelector(".form");
    
    // Selecciones más precisas mediante el orden o atributos específicos
    const tipoInsumoInput = document.querySelector('input[placeholder="Escribe aquí..."]:first-of-type');
    const nombreInsumoInput = document.querySelector('input[value="Harina de trigo"]');
    const unidadMedidaInput = document.querySelector('input[placeholder="Escribe aquí..."]:last-of-type');
    const cantidadInput = document.querySelector('input[type="number"][value="50"]');
    const valorUnitarioInput = document.querySelector('input[value="$2,500"]');
    const valorTotalInput = document.querySelector('input[value="$125,000"]');
    const descripcionTextarea = document.querySelector(".form__textarea");
    const saveButton = document.querySelector(".form__button--save");
    
    // Verificación de elementos
    if (!tipoInsumoInput || !nombreInsumoInput || !unidadMedidaInput || 
        !cantidadInput || !valorUnitarioInput || !descripcionTextarea || !saveButton) {
        console.error("No se pudieron encontrar todos los elementos del formulario");
      return; // Detener ejecución si faltan elementos
    }
    
    // Configurar atributos de validación HTML5
    tipoInsumoInput.setAttribute("required", "");
    tipoInsumoInput.setAttribute("minlength", "3");
    tipoInsumoInput.setAttribute("maxlength", "50");
    tipoInsumoInput.setAttribute("id", "tipoInsumo");
    tipoInsumoInput.setAttribute("name", "tipoInsumo");
    
    nombreInsumoInput.setAttribute("required", "");
    nombreInsumoInput.setAttribute("minlength", "3");
    nombreInsumoInput.setAttribute("maxlength", "100");
    nombreInsumoInput.setAttribute("id", "nombreInsumo");
    nombreInsumoInput.setAttribute("name", "nombreInsumo");
    
    unidadMedidaInput.setAttribute("required", "");
    unidadMedidaInput.setAttribute("minlength", "2");
    unidadMedidaInput.setAttribute("maxlength", "20");
    unidadMedidaInput.setAttribute("id", "unidadMedida");
    unidadMedidaInput.setAttribute("name", "unidadMedida");
    
    cantidadInput.setAttribute("required", "");
    cantidadInput.setAttribute("min", "1");
    cantidadInput.setAttribute("max", "10000");
    cantidadInput.setAttribute("id", "cantidad");
    cantidadInput.setAttribute("name", "cantidad");
    
    valorUnitarioInput.setAttribute("required", "");
    valorUnitarioInput.setAttribute("id", "valorUnitario");
    valorUnitarioInput.setAttribute("name", "valorUnitario");
    // No usar pattern aquí ya que puede interferir con la validación personalizada
    
    descripcionTextarea.setAttribute("maxlength", "500");
    descripcionTextarea.setAttribute("id", "descripcion");
    descripcionTextarea.setAttribute("name", "descripcion");
    
    // Crear contenedor para mensajes de error
    const createErrorContainer = (inputElement) => {
      // Verificar si ya existe un contenedor de error
        const existingError = inputElement.parentNode.querySelector(".form__error");
        if (existingError) {
        return existingError;
        }
        
        const errorContainer = document.createElement("div");
        errorContainer.className = "form__error";
        errorContainer.style.color = "red";
        errorContainer.style.fontSize = "1.2rem";
        errorContainer.style.marginTop = "0.5rem";
        inputElement.parentNode.appendChild(errorContainer);
        return errorContainer;
    };
    
    // Crear contenedores de error para cada campo
    const tipoInsumoError = createErrorContainer(tipoInsumoInput);
    const nombreInsumoError = createErrorContainer(nombreInsumoInput);
    const unidadMedidaError = createErrorContainer(unidadMedidaInput);
    const cantidadError = createErrorContainer(cantidadInput);
    const valorUnitarioError = createErrorContainer(valorUnitarioInput);
    const descripcionError = createErrorContainer(descripcionTextarea);
    
    // Función para validar formato de valor unitario
    const validarFormatoMoneda = (valor) => {
      // Acepta formatos como $1,000 o $1,000.00
        const regex = /^\$[0-9]{1,3}(,[0-9]{3})*(\.[0-9]{1,2})?$/;
        return regex.test(valor);
    };
    
    // Función para validar cada campo individualmente
    const validarCampo = (input, errorElement, mensaje) => {
        try {
        // Verificar si es requerido y está vacío
        if (input.hasAttribute("required") && !input.value.trim()) {
            throw new Error("Este campo es obligatorio");
        }
        
        // Verificar longitud mínima
        if (input.hasAttribute("minlength") && 
            input.value.length < parseInt(input.getAttribute("minlength"), 10)) {
            throw new Error(mensaje || `Debe tener al menos ${input.getAttribute("minlength")} caracteres`);
        }
        
        // Verificar longitud máxima
        if (input.hasAttribute("maxlength") && 
            input.value.length > parseInt(input.getAttribute("maxlength"), 10)) {
            throw new Error(mensaje || `Debe tener como máximo ${input.getAttribute("maxlength")} caracteres`);
        }
        
        // Verificar valor mínimo para campos numéricos
        if (input.hasAttribute("min") && 
            parseFloat(input.value) < parseFloat(input.getAttribute("min"))) {
            throw new Error(mensaje || `El valor mínimo es ${input.getAttribute("min")}`);
        }
        
        // Verificar valor máximo para campos numéricos
        if (input.hasAttribute("max") && 
            parseFloat(input.value) > parseFloat(input.getAttribute("max"))) {
            throw new Error(mensaje || `El valor máximo es ${input.getAttribute("max")}`);
        }
        
        // Validaciones adicionales específicas
        if (input === valorUnitarioInput) {
            if (!validarFormatoMoneda(input.value)) {
            throw new Error("El formato debe ser $X,XXX o $X,XXX.XX");
            }
        }
        
        // Si llegamos aquí, el campo es válido
        errorElement.textContent = "";
        input.style.borderColor = "var(--green-border)";
        return true;
        } catch (error) {
        errorElement.textContent = error.message;
        input.style.borderColor = "red";
        return false;
        }
    };
    
    // Configurar mensajes de error personalizados
    const mensajesError = {
        tipoInsumo: "El tipo de insumo debe tener entre 3 y 50 caracteres",
        nombreInsumo: "El nombre del insumo debe tener entre 3 y 100 caracteres",
        unidadMedida: "La unidad de medida debe tener entre 2 y 20 caracteres",
        cantidad: "La cantidad debe ser un número entre 1 y 10000",
        valorUnitario: "El valor unitario debe tener formato $X,XXX",
        descripcion: "La descripción no puede exceder los 500 caracteres"
    };
    
    // Validar todos los campos
    const validarFormulario = () => {
        try {
        // Validar cada campo individual
        const tipoInsumoValido = validarCampo(
            tipoInsumoInput,
            tipoInsumoError,
            mensajesError.tipoInsumo
        );
        
        const nombreInsumoValido = validarCampo(
            nombreInsumoInput,
            nombreInsumoError,
            mensajesError.nombreInsumo
        );
        
        const unidadMedidaValido = validarCampo(
            unidadMedidaInput,
            unidadMedidaError,
            mensajesError.unidadMedida
        );
        
        const cantidadValido = validarCampo(
            cantidadInput,
            cantidadError,
            mensajesError.cantidad
        );
        
        const valorUnitarioValido = validarCampo(
            valorUnitarioInput,
            valorUnitarioError,
            mensajesError.valorUnitario
        );
        
        const descripcionValido = validarCampo(
            descripcionTextarea,
            descripcionError,
            mensajesError.descripcion
        );
        
        // Si todos los campos obligatorios son válidos, devuelve true
        return (
            tipoInsumoValido &&
            nombreInsumoValido &&
            unidadMedidaValido &&
            cantidadValido &&
            valorUnitarioValido &&
            descripcionValido
        );
        } catch (error) {
        console.error("Error en la validación del formulario:", error);
        return false;
        }
    };
    
    // Función para calcular y actualizar el valor total
    const actualizarValorTotal = () => {
        try {
        if (!cantidadInput.value || !valorUnitarioInput.value) {
            return;
        }
        
        const cantidad = parseInt(cantidadInput.value, 10);
        // Eliminar $ y comas para convertir a número
        const valorUnitarioStr = valorUnitarioInput.value
            .replace("$", "")
            .replace(/,/g, "");
        const valorUnitario = parseFloat(valorUnitarioStr);
        
        if (!isNaN(cantidad) && !isNaN(valorUnitario)) {
          const valorTotal = cantidad * valorUnitario;
            valorTotalInput.value = `$${valorTotal.toLocaleString()}`;
        }
        } catch (error) {
        console.error("Error al calcular el valor total:", error);
        }
    };
    
    // Eventos de validación para cada campo
    tipoInsumoInput.addEventListener("blur", () => {
        validarCampo(tipoInsumoInput, tipoInsumoError, mensajesError.tipoInsumo);
    });
    
    nombreInsumoInput.addEventListener("blur", () => {
        validarCampo(nombreInsumoInput, nombreInsumoError, mensajesError.nombreInsumo);
    });
    
    unidadMedidaInput.addEventListener("blur", () => {
        validarCampo(unidadMedidaInput, unidadMedidaError, mensajesError.unidadMedida);
    });
    
    cantidadInput.addEventListener("blur", () => {
        if (validarCampo(cantidadInput, cantidadError, mensajesError.cantidad)) {
        actualizarValorTotal();
        }
    });
    
    cantidadInput.addEventListener("input", actualizarValorTotal);
    
    valorUnitarioInput.addEventListener("blur", () => {
        if (validarCampo(valorUnitarioInput, valorUnitarioError, mensajesError.valorUnitario)) {
        actualizarValorTotal();
        }
    });
    
    valorUnitarioInput.addEventListener("input", actualizarValorTotal);
    
    descripcionTextarea.addEventListener("blur", () => {
        validarCampo(descripcionTextarea, descripcionError, mensajesError.descripcion);
    });
    
    // Evento de envío del formulario
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        
        try {
        const esValido = validarFormulario();
        
        if (esValido) {
          // Simular envío exitoso
            alert("Insumo actualizado correctamente");
          // Redireccionar a la página de visualización
            window.location.href = "visualizar-insumo.html";
        } else {
            throw new Error("Por favor, corrija los errores antes de guardar");
        }
        } catch (error) {
        alert(error.message);
        console.error("Error al enviar el formulario:", error);
        }
    });
    
    // Configurar el botón de guardar para que active la validación del formulario
    saveButton.addEventListener("click", (event) => {
        event.preventDefault();
        
        try {
        const esValido = validarFormulario();
        
        if (esValido) {
          // Simular envío exitoso
            alert("Insumo actualizado correctamente");
          // Redireccionar a la página de visualización
            window.location.href = "visualizar-insumo.html";
        } else {
            throw new Error("Por favor, corrija los errores antes de guardar");
        }
        } catch (error) {
        alert(error.message);
        console.error("Error al guardar:", error);
        }
    });
    
    // Inicializar: calcular valor total al cargar la página
    actualizarValorTotal();
    
    // Validar todos los campos al inicio para mostrar posibles errores
    console.log("Inicializando validación...");
    });