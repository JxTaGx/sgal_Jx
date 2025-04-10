/**
 * Script para validación y manejo de ciclo de cultivos
 * Implementa validaciones y funcionalidades para la página de Listar Ciclo Cultivos
 */

// Esperar a que el DOM esté completamente cargado
document.addEventListener("DOMContentLoaded", () => {
    // Referencias a elementos principales
    const searchForm = document.querySelector(".header");
    const searchInput = document.querySelector(".header__search");
    const filterButton = document.querySelector(".button--green");
    const cards = document.querySelectorAll(".card");
    const paginationButtons = document.querySelectorAll(".pagination__button");
    const createButton = document.querySelector(".button--return");
    
    // Referencia al formulario de reporte (si existe)
    const reportButton = document.querySelector(".button--gray");
    
    // Configurar las validaciones y eventos
    setupValidations();
    setupEventListeners();
    setupSearch();
    setupPagination();
    
    /**
     * Configuración de validaciones
     */
    function setupValidations() {
      // Añadir atributos de validación HTML5 al campo de búsqueda
        if (searchInput) {
        searchInput.setAttribute("required", "true");
        searchInput.setAttribute("minlength", "3");
        searchInput.setAttribute("maxlength", "50");
        searchInput.setAttribute("pattern", "[A-Za-z0-9\\s-]+");
        searchInput.setAttribute("title", "Ingrese al menos 3 caracteres alfanuméricos");
        }
    }
    
    /**
     * Configuración de listeners de eventos
     */
    function setupEventListeners() {
      // Validar búsqueda al hacer clic en filtrar
        if (searchForm && filterButton) {
        filterButton.addEventListener("click", (e) => {
            try {
            e.preventDefault();
            if (validateSearch(searchInput.value)) {
              // Simulación de filtrado (aquí iría la lógica real de filtrado)
                filterCultivos(searchInput.value);
            }
            } catch (error) {
            showErrorMessage(error.message);
            }
        });
        }
    
      // Evento para el botón de generar reporte
        if (reportButton) {
        reportButton.addEventListener("click", (e) => {
            try {
            // Aquí se validaría si hay datos para generar el reporte
            if (cards.length === 0) {
                e.preventDefault();
                throw new Error("No hay datos disponibles para generar un reporte");
            }
            } catch (error) {
            e.preventDefault();
            showErrorMessage(error.message);
            }
        });
        }
    
      // Evento para las tarjetas (detalles)
        cards.forEach((card) => {
        const detailsButton = card.querySelector(".card__button");
        if (detailsButton) {
            detailsButton.addEventListener("click", (e) => {
            try {
              // Simulación de validación antes de ver detalles
                const cardTitle = card.querySelector(".card__title").textContent;
                console.log(`Accediendo a detalles de: ${cardTitle}`);
            } catch (error) {
                e.preventDefault();
                showErrorMessage("No se pudo acceder a los detalles en este momento");
            }
            });
        }
        });
    }
    
    /**
     * Configuración de funcionalidad de búsqueda
     */
    function setupSearch() {
      // Validar búsqueda mientras el usuario escribe
        if (searchInput) {
        searchInput.addEventListener("input", () => {
            try {
            validateSearch(searchInput.value, false);
            // Eliminar mensajes de error si la validación es correcta
            const errorContainer = document.getElementById("error-container");
            if (errorContainer) {
                errorContainer.remove();
            }
            } catch (error) {
            // No mostrar error mientras escribe, solo cambiar estilo
            searchInput.style.borderColor = "red";
            }
        });
        }
    }
    
    /**
     * Configuración de paginación
     */
    function setupPagination() {
        paginationButtons.forEach((button, index) => {
        button.addEventListener("click", () => {
            try {
            // Simular cambio de página
            paginationButtons.forEach((btn) => btn.classList.remove("active"));
            button.classList.add("active");
            console.log(`Cambiando a página ${index + 1}`);
            
            // Aquí iría el código para cargar los datos de la página seleccionada
            } catch (error) {
            showErrorMessage("Error al cambiar de página");
            }
        });
        });
    }
    
    /**
     * Validar el texto de búsqueda
     * @param {string} searchText - Texto a validar
     * @param {boolean} showError - Indicador para mostrar mensajes de error
     * @returns {boolean} - Indica si el texto es válido
     */
    function validateSearch(searchText, showError = true) {
        try {
        // Validar longitud mínima
        if (searchText.trim().length < 3) {
            throw new Error("La búsqueda debe contener al menos 3 caracteres");
        }
        
        // Validar caracteres permitidos
        const validPattern = /^[A-Za-z0-9\s-]+$/;
        if (!validPattern.test(searchText)) {
            throw new Error("La búsqueda solo puede contener letras, números, espacios y guiones");
        }
        
        // Validar caracteres especiales peligrosos (prevención de inyección)
        const dangerousPattern = /[<>(){}[\]"'`;]/;
        if (dangerousPattern.test(searchText)) {
            throw new Error("La búsqueda contiene caracteres no permitidos");
        }
        
        // Si llega aquí, la validación es exitosa
        searchInput.style.borderColor = ""; // Restablecer estilo
        return true;
        } catch (error) {
        searchInput.style.borderColor = "red";
        if (showError) {
            showErrorMessage(error.message);
        }
        return false;
        }
    }
    
    /**
     * Filtrar cultivos según el texto de búsqueda
     * @param {string} searchText - Texto para filtrar
     */
    function filterCultivos(searchText) {
        try {
        // Convertir a minúsculas para comparación no sensible a mayúsculas
        const search = searchText.toLowerCase();
        
        // Contar cuántas tarjetas coinciden con la búsqueda
        let matchCount = 0;
        
        // Iterar sobre todas las tarjetas y mostrar/ocultar según coincidencia
        cards.forEach((card) => {
            const title = card.querySelector(".card__title").textContent.toLowerCase();
            const info = card.querySelector(".card__info").textContent.toLowerCase();
            
          // Verificar si el texto de búsqueda está en el título o info
            if (title.includes(search) || info.includes(search)) {
            card.style.display = "block";
            matchCount++;
            } else {
            card.style.display = "none";
            }
        });
        
        // Mostrar mensaje si no hay coincidencias
        if (matchCount === 0) {
            showInfoMessage("No se encontraron resultados para esta búsqueda");
        } else {
            showInfoMessage(`Se encontraron ${matchCount} resultados`);
        }
        } catch (error) {
        showErrorMessage("Error al filtrar los cultivos: " + error.message);
        }
    }
    
    /**
     * Mostrar mensaje de error personalizado
     * @param {string} message - Mensaje de error a mostrar
     */
    function showErrorMessage(message) {
      // Eliminar mensaje anterior si existe
        const existingError = document.getElementById("error-container");
        if (existingError) {
        existingError.remove();
        }
    
      // Crear contenedor de error
        const errorContainer = document.createElement("div");
        errorContainer.id = "error-container";
        errorContainer.style.backgroundColor = "#FEE9A2";
        errorContainer.style.color = "#FDC300";
        errorContainer.style.padding = "10px";
        errorContainer.style.margin = "10px 0";
        errorContainer.style.borderRadius = "5px";
        errorContainer.style.borderLeft = "5px solid #FDC300";
        errorContainer.style.textAlign = "center";
        errorContainer.style.fontWeight = "bold";
        errorContainer.textContent = message;
    
      // Insertar después del encabezado
        const header = document.querySelector(".header");
        header.parentNode.insertBefore(errorContainer, header.nextSibling);
      
      // Eliminar después de 5 segundos
        setTimeout(() => {
        errorContainer.remove();
        }, 5000);
    }
    
    /**
     * Mostrar mensaje informativo
     * @param {string} message - Mensaje informativo a mostrar
     */
    function showInfoMessage(message) {
      // Eliminar mensaje anterior si existe
        const existingInfo = document.getElementById("info-container");
        if (existingInfo) {
        existingInfo.remove();
        }
    
      // Crear contenedor de información
        const infoContainer = document.createElement("div");
        infoContainer.id = "info-container";
        infoContainer.style.backgroundColor = "#e8f4f8";
        infoContainer.style.color = "#006699";
        infoContainer.style.padding = "10px";
        infoContainer.style.margin = "10px 0";
        infoContainer.style.borderRadius = "5px";
        infoContainer.style.borderLeft = "5px solid #006699";
        infoContainer.style.textAlign = "center";
        infoContainer.style.fontWeight = "bold";
        infoContainer.textContent = message;
    
      // Insertar después del encabezado
        const header = document.querySelector(".header");
        header.parentNode.insertBefore(infoContainer, header.nextSibling);
      
      // Eliminar después de 5 segundos
        setTimeout(() => {
        infoContainer.remove();
        }, 5000);
    }
    });