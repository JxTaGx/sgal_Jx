/**
 * Sistema de validación para la página de Listar Insumos
 * Incluye:
 * - Validaciones con HTML5 (required, minlength, maxlength)
 * - Validaciones adicionales con JavaScript
 * - Mensajes de error personalizados
 * - Validación previa al envío de formularios
 * - Manejo de errores con try-catch
 */

// Esperar a que el DOM esté completamente cargado
document.addEventListener("DOMContentLoaded", function() {
    // Inicializar validaciones
    initializeValidations();
    
    // Inicializar funcionalidad de filtrado
    initializeFiltering();
    
    // Inicializar funcionalidad de paginación
    initializePagination();
});

/**
 * Inicializa todas las validaciones necesarias en la página
 */
function initializeValidations() {
    try {
        // Obtener elementos del formulario de búsqueda
        const searchInput = document.querySelector(".search-panel__input");
        const filterButton = document.querySelector(".button--green");
        
        // Aplicar atributos de validación HTML5 al campo de búsqueda
        if (searchInput) {
            searchInput.setAttribute("minlength", "3");
            searchInput.setAttribute("maxlength", "50");
            searchInput.setAttribute("pattern", "[A-Za-zÀ-ÿ0-9 ]+");
            searchInput.setAttribute("title", "Solo se permiten letras, números y espacios");
            
            // Validación en tiempo real
            searchInput.addEventListener("input", function() {
                validateSearchInput(searchInput);
            });
        }
        
        // Validar búsqueda al hacer clic en el botón de filtrado
        if (filterButton) {
            filterButton.addEventListener("click", function(event) {
                try {
                    if (!validateSearchInput(searchInput)) {
                        event.preventDefault();
                    } else {
                        // Aquí se procesaría la búsqueda/filtrado
                        filterInsumos(searchInput.value);
                    }
                } catch (error) {
                    showErrorMessage("Error al filtrar: " + error.message);
                    event.preventDefault();
                }
            });
        }
        
        // Capturar el formulario de creación de insumo cuando se navegue a esa página
        document.querySelectorAll("a").forEach(link => {
            if (link.href.includes("create-insumo.html")) {
                link.addEventListener("click", function() {
                    // Almacenar en sessionStorage para usar en la página de creación
                    sessionStorage.setItem("validationsEnabled", "true");
                });
            }
        });
        
        // Si estamos en la página de creación de insumo y está habilitada la validación
        if (window.location.href.includes("create-insumo.html") && 
            sessionStorage.getItem("validationsEnabled") === "true") {
            setupCreateInsumoValidations();
        }
        
    } catch (error) {
        console.error("Error al inicializar validaciones:", error);
        showErrorMessage("Ocurrió un error al cargar las validaciones: " + error.message);
    }
}

/**
 * Valida el campo de búsqueda
 * @param {HTMLInputElement} input - Campo de entrada a validar
 * @returns {boolean} - Resultado de la validación
 */
function validateSearchInput(input) {
    try {
        // Limpiar mensajes de error previos
        clearErrorMessage(input);
        
        // Validar que el campo tenga un valor si se va a buscar
        if (input.value.trim() === "") {
            // Si está vacío permitimos que continúe (no es un error buscar sin filtros)
            return true;
        }
        
        // Validar longitud mínima si se ha ingresado algo
        if (input.value.trim().length < 3) {
            showInputError(input, "El término de búsqueda debe tener al menos 3 caracteres");
            return false;
        }
        
        // Validar caracteres especiales
        const regex = /^[A-Za-zÀ-ÿ0-9 ]+$/;
        if (!regex.test(input.value)) {
            showInputError(input, "Solo se permiten letras, números y espacios");
            return false;
        }
        
        return true;
    } catch (error) {
        console.error("Error en validación:", error);
        showErrorMessage("Error al validar el campo: " + error.message);
        return false;
    }
}

/**
 * Configura las validaciones para el formulario de creación de insumos
 * Esta función se activaría en la página de creación de insumo
 */
function setupCreateInsumoValidations() {
    try {
        // Asumiendo que existe un formulario con id "createInsumoForm"
        const form = document.getElementById("createInsumoForm");
        
        if (form) {
            // Prevenir envío si hay errores
            form.addEventListener("submit", function(event) {
                try {
                    if (!validateCreateInsumoForm()) {
                        event.preventDefault();
                    }
                } catch (error) {
                    showErrorMessage("Error al validar formulario: " + error.message);
                    event.preventDefault();
                }
            });
            
            // Añadir validaciones HTML5 a los campos (asumiendo que existen)
            const nameInput = form.querySelector('[name="nombre"]');
            if (nameInput) {
                nameInput.setAttribute("required", "");
                nameInput.setAttribute("minlength", "3");
                nameInput.setAttribute("maxlength", "100");
                nameInput.addEventListener("input", function() {
                    validateInputField(nameInput, "nombre");
                });
            }
            
            const codigoInput = form.querySelector('[name="codigo"]');
            if (codigoInput) {
                codigoInput.setAttribute("required", "");
                codigoInput.setAttribute("pattern", "[A-Z]{3}-[0-9]{4}");
                codigoInput.setAttribute("title", "Formato: XXX-0000 (3 letras mayúsculas, guion, 4 números)");
                codigoInput.addEventListener("input", function() {
                    validateInputField(codigoInput, "codigo");
                });
            }
            
            const cantidadInput = form.querySelector('[name="cantidad"]');
            if (cantidadInput) {
                cantidadInput.setAttribute("required", "");
                cantidadInput.setAttribute("min", "1");
                cantidadInput.setAttribute("type", "number");
                cantidadInput.addEventListener("input", function() {
                    validateInputField(cantidadInput, "cantidad");
                });
            }
            
            const precioInput = form.querySelector('[name="precio"]');
            if (precioInput) {
                precioInput.setAttribute("required", "");
                precioInput.setAttribute("min", "0.01");
                precioInput.setAttribute("step", "0.01");
                precioInput.setAttribute("type", "number");
                precioInput.addEventListener("input", function() {
                    validateInputField(precioInput, "precio");
                });
            }
            
            const emailInput = form.querySelector('[name="email"]');
            if (emailInput) {
                emailInput.setAttribute("required", "");
                emailInput.setAttribute("type", "email");
                emailInput.addEventListener("input", function() {
                    validateEmail(emailInput);
                });
            }
        }
    } catch (error) {
        console.error("Error al configurar validaciones del formulario:", error);
        showErrorMessage("Ocurrió un error al configurar el formulario: " + error.message);
    }
}

/**
 * Valida el formulario completo de creación de insumo
 * @returns {boolean} - Resultado de la validación
 */
function validateCreateInsumoForm() {
    try {
        const form = document.getElementById("createInsumoForm");
        let isValid = true;
        
        // Validar cada campo individualmente
        form.querySelectorAll("input, select, textarea").forEach(field => {
            if (field.name === "email") {
                if (!validateEmail(field)) {
                    isValid = false;
                }
            } else {
                if (!validateInputField(field, field.name)) {
                    isValid = false;
                }
            }
        });
        
        return isValid;
    } catch (error) {
        console.error("Error en validación de formulario:", error);
        showErrorMessage("Error al validar el formulario: " + error.message);
        return false;
    }
}

/**
 * Valida un campo de entrada genérico
 * @param {HTMLElement} field - Campo a validar
 * @param {string} fieldName - Nombre del campo para mensajes de error
 * @returns {boolean} - Resultado de la validación
 */
function validateInputField(field, fieldName) {
    try {
        clearErrorMessage(field);
        
        // Validar si es requerido
        if (field.hasAttribute("required") && field.value.trim() === "") {
            showInputError(field, `El campo ${fieldName} es obligatorio`);
            return false;
        }
        
        // Validar longitud mínima
        if (field.hasAttribute("minlength") && 
            field.value.length < parseInt(field.getAttribute("minlength"))) {
            const minLength = field.getAttribute("minlength");
            showInputError(field, `El campo ${fieldName} debe tener al menos ${minLength} caracteres`);
            return false;
        }
        
        // Validar longitud máxima
        if (field.hasAttribute("maxlength") && 
            field.value.length > parseInt(field.getAttribute("maxlength"))) {
            const maxLength = field.getAttribute("maxlength");
            showInputError(field, `El campo ${fieldName} no puede exceder los ${maxLength} caracteres`);
            return false;
        }
        
        // Validar valor mínimo (para números)
        if (field.hasAttribute("min") && 
            parseFloat(field.value) < parseFloat(field.getAttribute("min"))) {
            const min = field.getAttribute("min");
            showInputError(field, `El valor mínimo para ${fieldName} es ${min}`);
            return false;
        }
        
        // Validar patrón
        if (field.hasAttribute("pattern") && field.value !== "") {
            const pattern = new RegExp("^" + field.getAttribute("pattern") + "$");
            if (!pattern.test(field.value)) {
                showInputError(field, field.getAttribute("title") || `El formato de ${fieldName} no es válido`);
                return false;
            }
        }
        
        return true;
    } catch (error) {
        console.error(`Error al validar campo ${fieldName}:`, error);
        showInputError(field, `Error al validar: ${error.message}`);
        return false;
    }
}

/**
 * Valida un campo de correo electrónico
 * @param {HTMLInputElement} emailField - Campo de correo a validar
 * @returns {boolean} - Resultado de la validación
 */
function validateEmail(emailField) {
    try {
        clearErrorMessage(emailField);
        
        const email = emailField.value.trim();
        
        // Validar si es requerido
        if (emailField.hasAttribute("required") && email === "") {
            showInputError(emailField, "El correo electrónico es obligatorio");
            return false;
        }
        
        // Si no es requerido y está vacío, es válido
        if (email === "") {
            return true;
        }
        
        // Validar formato de correo
        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        if (!emailRegex.test(email)) {
            showInputError(emailField, "El formato del correo electrónico no es válido");
            return false;
        }
        
        return true;
    } catch (error) {
        console.error("Error al validar email:", error);
        showInputError(emailField, "Error al validar el correo: " + error.message);
        return false;
    }
}

/**
 * Inicializa la funcionalidad de filtrado
 */
function initializeFiltering() {
    try {
        const searchInput = document.querySelector(".search-panel__input");
        
        // Implementar búsqueda en tiempo real (opcional)
        if (searchInput) {
            searchInput.addEventListener("keyup", function(event) {
                // Filtrar al presionar Enter
                if (event.key === "Enter") {
                    if (validateSearchInput(searchInput)) {
                        filterInsumos(searchInput.value);
                    }
                }
            });
        }
    } catch (error) {
        console.error("Error al inicializar filtrado:", error);
    }
}

/**
 * Filtra los insumos según el término de búsqueda
 * @param {string} searchTerm - Término a buscar
 */
function filterInsumos(searchTerm) {
    try {
        searchTerm = searchTerm.toLowerCase().trim();
        const insumoCards = document.querySelectorAll(".insumo-card");
        
        // Si no hay término de búsqueda, mostrar todos
        if (searchTerm === "") {
            insumoCards.forEach(card => {
                card.style.display = "block";
            });
            return;
        }
        
        // Filtrar tarjetas según el término de búsqueda
        let foundResults = false;
        
        insumoCards.forEach(card => {
            const title = card.querySelector(".insumo-card__title").textContent.toLowerCase();
            const infoElements = card.querySelectorAll(".insumo-card__info");
            let infoText = "";
            
            infoElements.forEach(info => {
                infoText += " " + info.textContent.toLowerCase();
            });
            
            if (title.includes(searchTerm) || infoText.includes(searchTerm)) {
                card.style.display = "block";
                foundResults = true;
            } else {
                card.style.display = "none";
            }
        });
        
        // Mostrar mensaje si no hay resultados
        let noResultsMessage = document.getElementById("noResultsMessage");
        
        if (!foundResults) {
            if (!noResultsMessage) {
                noResultsMessage = document.createElement("p");
                noResultsMessage.id = "noResultsMessage";
                noResultsMessage.textContent = "No se encontraron insumos que coincidan con la búsqueda.";
                noResultsMessage.style.textAlign = "center";
                noResultsMessage.style.marginTop = "2rem";
                noResultsMessage.style.color = "var(--gray-750)";
                
                const insumosContainer = document.querySelector(".insumos");
                if (insumosContainer) {
                    insumosContainer.appendChild(noResultsMessage);
                }
            }
        } else if (noResultsMessage) {
            noResultsMessage.remove();
        }
    } catch (error) {
        console.error("Error al filtrar insumos:", error);
        showErrorMessage("Error al filtrar: " + error.message);
    }
}

/**
 * Inicializa la funcionalidad de paginación
 */
function initializePagination() {
    try {
        const pageButtons = document.querySelectorAll(".page-footer__page-button");
        const insumoCards = document.querySelectorAll(".insumo-card");
        
        if (pageButtons.length > 0) {
            // Definir cantidad de insumos por página
            const itemsPerPage = 3;
            
            // Marcar el primer botón como activo por defecto
            pageButtons[0].classList.add("active");
            
            // Añadir evento a botones de paginación
            pageButtons.forEach((button, index) => {
                button.addEventListener("click", function() {
                    try {
                        // Quitar clase 'active' de todos los botones
                        pageButtons.forEach(btn => btn.classList.remove("active"));
                        
                        // Añadir clase 'active' al botón actual
                        this.classList.add("active");
                        
                        // Calcular qué insumos mostrar
                        const startIndex = index * itemsPerPage;
                        const endIndex = startIndex + itemsPerPage;
                        
                        // Ocultar/mostrar insumos según la página
                        insumoCards.forEach((card, cardIndex) => {
                            if (cardIndex >= startIndex && cardIndex < endIndex) {
                                card.style.display = "block";
                            } else {
                                card.style.display = "none";
                            }
                        });
                    } catch (error) {
                        console.error("Error en paginación:", error);
                        showErrorMessage("Error al cambiar de página: " + error.message);
                    }
                });
            });
            
            // Simular clic en el primer botón para inicializar
            pageButtons[0].click();
        }
    } catch (error) {
        console.error("Error al inicializar paginación:", error);
    }
}

/**
 * Muestra un mensaje de error debajo de un campo de entrada
 * @param {HTMLElement} inputElement - Campo con error
 * @param {string} message - Mensaje de error
 */
function showInputError(inputElement, message) {
    try {
        // Eliminar mensajes previos
        clearErrorMessage(inputElement);
        
        // Añadir clase de error al campo
        inputElement.classList.add("input-error");
        
        // Crear elemento para el mensaje de error
        const errorElement = document.createElement("p");
        errorElement.className = "error-message";
        errorElement.textContent = message;
        errorElement.style.color = "red";
        errorElement.style.fontSize = "1.2rem";
        errorElement.style.margin = "0.5rem 0";
        
        // Insertar después del campo
        inputElement.parentNode.insertBefore(errorElement, inputElement.nextSibling);
    } catch (error) {
        console.error("Error al mostrar mensaje de error:", error);
    }
}

/**
 * Limpia un mensaje de error
 * @param {HTMLElement} inputElement - Campo a limpiar
 */
function clearErrorMessage(inputElement) {
    try {
        // Quitar clase de error
        inputElement.classList.remove("input-error");
        
        // Eliminar mensaje si existe
        const nextSibling = inputElement.nextSibling;
        if (nextSibling && nextSibling.className === "error-message") {
            nextSibling.remove();
        }
    } catch (error) {
        console.error("Error al limpiar mensaje:", error);
    }
}

/**
 * Muestra un mensaje de error general
 * @param {string} message - Mensaje de error
 */
function showErrorMessage(message) {
    try {
        // Verificar si ya existe un mensaje de error global
        let errorContainer = document.getElementById("globalErrorContainer");
        
        if (!errorContainer) {
            // Crear contenedor de error
            errorContainer = document.createElement("div");
            errorContainer.id = "globalErrorContainer";
            errorContainer.style.backgroundColor = "rgba(255, 0, 0, 0.1)";
            errorContainer.style.border = "1px solid red";
            errorContainer.style.borderRadius = "5px";
            errorContainer.style.padding = "1rem";
            errorContainer.style.margin = "1rem 0";
            errorContainer.style.position = "fixed";
            errorContainer.style.top = "1rem";
            errorContainer.style.right = "1rem";
            errorContainer.style.zIndex = "1000";
            errorContainer.style.maxWidth = "30rem";
            
            // Añadir al DOM
            document.body.appendChild(errorContainer);
            
            // Agregar botón para cerrar
            const closeButton = document.createElement("button");
            closeButton.textContent = "×";
            closeButton.style.position = "absolute";
            closeButton.style.top = "0.5rem";
            closeButton.style.right = "0.5rem";
            closeButton.style.background = "none";
            closeButton.style.border = "none";
            closeButton.style.fontSize = "2rem";
            closeButton.style.cursor = "pointer";
            closeButton.style.color = "red";
            
            closeButton.addEventListener("click", function() {
                errorContainer.remove();
            });
            
            errorContainer.appendChild(closeButton);
        }
        
        // Crear elemento para el mensaje
        const errorMessage = document.createElement("p");
        errorMessage.textContent = message;
        errorMessage.style.margin = "0.5rem 0";
        
        // Añadir mensaje al contenedor
        errorContainer.appendChild(errorMessage);
        
        // Configurar desaparición automática después de 5 segundos
        setTimeout(function() {
            if (errorContainer.contains(errorMessage)) {
                errorMessage.remove();
            }
            
            // Si no quedan mensajes, quitar el contenedor
            if (errorContainer.querySelectorAll("p").length === 0) {
                errorContainer.remove();
            }
        }, 5000);
    } catch (error) {
        console.error("Error al mostrar mensaje global:", error);
        // En este caso extremo, usar alert como fallback
        alert("Error: " + message);
    }
}

// Exportar funciones para pruebas (si se usa en un entorno modular)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        validateSearchInput,
        validateInputField,
        validateEmail,
        filterInsumos
    };
}