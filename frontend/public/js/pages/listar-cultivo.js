/**
 * Script for the Crop Listing page
 * Features:
 * - Search functionality
 * - Form validations
 * - Error handling with try-catch
 * - Custom error messages
 */

// Wait for DOM to be fully loaded before executing code
document.addEventListener("DOMContentLoaded", () => {
    // Initialize components
    initializeSearch();
    setupButtonActions();
    setupTableActions();
    });
    
    /**
   * Initialize the search functionality
   */
    function initializeSearch() {
    const searchInput = document.querySelector(".main-container__search");
    const tableRows = document.querySelectorAll(".table:not(.table--header) .table__row");
    
    if (!searchInput || !tableRows.length) {
        console.error("Search elements not found in the DOM");
        return;
    }
    
    searchInput.addEventListener("input", () => {
        try {
        const searchTerm = searchInput.value.toLowerCase().trim();
        
        tableRows.forEach((row) => {
            const cropName = row.querySelector(".table__cell")?.textContent.toLowerCase() || "";
            const cropVariety = row.querySelectorAll(".table__cell")[1]?.textContent.toLowerCase() || "";
            
          // Show/hide rows based on search term
            if (cropName.includes(searchTerm) || cropVariety.includes(searchTerm)) {
            row.style.display = "";
            } else {
            row.style.display = "none";
            }
        });
        } catch (error) {
        showError("Error al buscar: " + error.message);
        }
    });
    }
    
    /**
   * Set up button actions
   */
    function setupButtonActions() {
    // Add crop button - already has onclick in HTML
    
    // Generate report button
    const reportButton = document.querySelector(".button--gray");
    if (reportButton) {
        reportButton.addEventListener("click", generateReport);
    }
    
    // Return button is already linked via HTML
    }
    
    /**
   * Set up table row actions
   */
    function setupTableActions() {
    const tableLinks = document.querySelectorAll(".table__link");
    
    tableLinks.forEach(link => {
        link.addEventListener("click", (event) => {
        // If you need additional actions before navigating to the view page
        console.log("Viewing crop details...");
        });
    });
    }
    
    /**
   * Generate a report of current crops
   */
    function generateReport() {
    try {
        const tableRows = document.querySelectorAll(".table:not(.table--header) .table__row");
        if (!tableRows.length) {
        throw new Error("No hay datos de cultivos para generar el reporte");
        }
        
      // In a real application, you would implement report generation logic here
        alert("Generando reporte de cultivos...");
        
      // Example: Collect data for report
        const reportData = [];
        tableRows.forEach(row => {
        const cells = row.querySelectorAll(".table__cell");
        if (cells.length >= 6) {
            reportData.push({
            nombre: cells[0].textContent,
            variedad: cells[1].textContent,
            fechaSiembra: cells[2].textContent,
            area: cells[3].textContent,
            etapa: cells[4].textContent,
            rendimiento: cells[5].textContent.split(" ")[0]
            });
        }
        });
        
        console.log("Report data:", reportData);
        
    } catch (error) {
        showError("Error al generar el reporte: " + error.message);
    }
    }
    
    /**
   * Create a new crop - this would normally be on the create-cultivo.html page
   * but including validation logic here as per requirements
   * @param {Object} cropData - The crop data to validate
   * @returns {boolean} - Whether the data is valid
   */
    function validateCropData(cropData) {
    try {
      // Required fields validation
        const requiredFields = ["nombre", "variedad", "fechaSiembra", "area", "etapa", "rendimiento"];
        for (const field of requiredFields) {
        if (!cropData[field]) {
            throw new Error(`El campo ${getFieldLabel(field)} es obligatorio`);
        }
        }
        
      // Length validations
        if (cropData.nombre.length < 3) {
        throw new Error("El nombre del cultivo debe tener al menos 3 caracteres");
        }
        
        if (cropData.nombre.length > 50) {
        throw new Error("El nombre del cultivo no puede exceder 50 caracteres");
        }
        
      // Area validation - must be a positive number
        const area = parseFloat(cropData.area);
        if (isNaN(area) || area <= 0) {
        throw new Error("El área debe ser un número positivo");
        }
        
      // Date validation - must be a valid date
        const fechaSiembra = new Date(cropData.fechaSiembra);
        if (isNaN(fechaSiembra.getTime())) {
        throw new Error("La fecha de siembra no es válida");
        }
        
      // Rendimiento validation - must be a positive number
        const rendimiento = parseFloat(cropData.rendimiento);
        if (isNaN(rendimiento) || rendimiento <= 0) {
        throw new Error("El rendimiento esperado debe ser un número positivo");
        }
        
        return true;
    } catch (error) {
        showError(error.message);
        return false;
    }
    }
    
    /**
   * Add a new crop to the table
   * @param {Object} cropData - The crop data to add
   */
    function addCropToTable(cropData) {
    try {
        if (!validateCropData(cropData)) {
        return false;
        }
        
        const tableBody = document.querySelector(".table:not(.table--header)");
        if (!tableBody) {
        throw new Error("No se encontró la tabla para agregar el cultivo");
        }
        
      // Create row element
        const row = document.createElement("tr");
        row.className = "table__row";
        
      // Add cells with data
        row.innerHTML = `
        <td class="table__cell">${cropData.nombre}</td>
        <td class="table__cell">${cropData.variedad}</td>
        <td class="table__cell">${cropData.fechaSiembra}</td>
        <td class="table__cell">${cropData.area}</td>
        <td class="table__cell">${cropData.etapa}</td>
        <td class="table__cell">${cropData.rendimiento} ton/ha 
            <a href="visualizar-cultivo.html" class="table__link">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" class="table__icon">
                <path d="M6 8L9 11L17 3" stroke="#313131" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M17 9V15C17 15.5304 16.7893 16.0391 16.4142 16.4142C16.0391 16.7893 15.5304 17 15 17H3C2.46957 17 1.96086 16.7893 1.58579 16.4142C1.21071 16.0391 1 15.5304 1 15V3C1 2.46957 1.21071 1.96086 1.58579 1.58579C1.96086 1.21071 2.46957 1 3 1H12" stroke="#313131" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            </a>
        </td>
        `;
        
      // Add row to table
        tableBody.appendChild(row);
        
        return true;
    } catch (error) {
        showError("Error al agregar cultivo: " + error.message);
        return false;
    }
    }
    
    /**
   * Get a human-readable label for a field
   * @param {string} field - The field name
   * @returns {string} - The human-readable label
   */
    function getFieldLabel(field) {
    const labels = {
        nombre: "Nombre del cultivo",
        variedad: "Variedad",
        fechaSiembra: "Fecha de siembra",
        area: "Área",
        etapa: "Etapa actual",
        rendimiento: "Rendimiento esperado"
    };
    
    return labels[field] || field;
    }
    
    /**
   * Display an error message
   * @param {string} message - The error message to display
   */
    function showError(message) {
    // Check if error container already exists
    let errorContainer = document.querySelector(".error-message");
    
    if (!errorContainer) {
      // Create error container if it doesn't exist
        errorContainer = document.createElement("div");
        errorContainer.className = "error-message";
        errorContainer.style.backgroundColor = "#f8d7da";
        errorContainer.style.color = "#721c24";
        errorContainer.style.padding = "1rem";
        errorContainer.style.marginTop = "1rem";
        errorContainer.style.borderRadius = "0.5rem";
        errorContainer.style.textAlign = "center";
        errorContainer.style.maxWidth = "80%";
        errorContainer.style.margin = "1rem auto";
        
      // Add to page
        const mainContainer = document.querySelector(".main-container");
        if (mainContainer) {
        mainContainer.insertBefore(errorContainer, mainContainer.firstChild);
        } else {
        document.body.insertBefore(errorContainer, document.body.firstChild);
        }
    }
    
    // Update error message
    errorContainer.textContent = message;
    
    // Hide after 5 seconds
    setTimeout(() => {
        errorContainer.style.display = "none";
    }, 5000);
    }
    
    /**
   * Example function to create a crop form - this would typically be on create-cultivo.html
   * Included here to demonstrate the validation logic
   */
    function createCropForm() {
    const formHTML = `
        <form id="create-crop-form" class="crop-form">
        <div class="form-group">
          <label for="nombre">Nombre del Cultivo *</label>
            <input type="text" id="nombre" name="nombre" required minlength="3" maxlength="50">
            <span class="error-message"></span>
        </div>
        
        <div class="form-group">
          <label for="variedad">Variedad *</label>
            <input type="text" id="variedad" name="variedad" required>
            <span class="error-message"></span>
        </div>
        
        <div class="form-group">
          <label for="fechaSiembra">Fecha de Siembra *</label>
            <input type="date" id="fechaSiembra" name="fechaSiembra" required>
            <span class="error-message"></span>
        </div>
        
        <div class="form-group">
          <label for="area">Área (ha) *</label>
            <input type="number" id="area" name="area" step="0.1" min="0.1" required>
            <span class="error-message"></span>
        </div>
        
        <div class="form-group">
          <label for="etapa">Etapa Actual *</label>
            <select id="etapa" name="etapa" required>
            <option value="">Seleccione una etapa</option>
            <option value="Germinación">Germinación</option>
            <option value="Crecimiento vegetativo">Crecimiento vegetativo</option>
            <option value="Floración">Floración</option>
            <option value="Fructificación">Fructificación</option>
            <option value="Maduración">Maduración</option>
            <option value="Cosecha">Cosecha</option>
            </select>
            <span class="error-message"></span>
        </div>
        
        <div class="form-group">
          <label for="rendimiento">Rendimiento Esperado (ton/ha) *</label>
            <input type="number" id="rendimiento" name="rendimiento" step="0.1" min="0.1" required>
            <span class="error-message"></span>
        </div>
        
        <button type="submit" class="button button--green">Guardar Cultivo</button>
        <button type="button" class="button button--gray" onclick="location.href='listar-cultivos.html'">Cancelar</button>
        </form>
    `;
    
    // Example of how to attach form validation to this form
    const setupFormValidation = () => {
        const form = document.getElementById("create-crop-form");
        if (!form) return;
        
        form.addEventListener("submit", (event) => {
        event.preventDefault();
        
        try {
          // Get form data
            const formData = {
            nombre: form.nombre.value.trim(),
            variedad: form.variedad.value.trim(),
            fechaSiembra: form.fechaSiembra.value,
            area: form.area.value,
            etapa: form.etapa.value,
            rendimiento: form.rendimiento.value
            };
            
          // Validate data
            if (validateCropData(formData)) {
            // In a real app, you would submit this data to a server
            alert("Cultivo guardado correctamente");
            window.location.href = "listar-cultivos.html";
            }
        } catch (error) {
            showError("Error al procesar el formulario: " + error.message);
        }
        });
        
      // Add individual field validation
        const fields = form.querySelectorAll("input, select");
        fields.forEach(field => {
        field.addEventListener("blur", () => {
            validateField(field);
        });
        });
    };
    
    // Field-level validation
    const validateField = (field) => {
        const errorSpan = field.nextElementSibling;
        if (!errorSpan) return;
        
        try {
        errorSpan.textContent = "";
        
        // Validate based on field type
        if (field.hasAttribute("required") && !field.value.trim()) {
            throw new Error(`Este campo es obligatorio`);
        }
        
        if (field.hasAttribute("minlength") && field.value.length < parseInt(field.getAttribute("minlength"))) {
            throw new Error(`Debe tener al menos ${field.getAttribute("minlength")} caracteres`);
        }
        
        if (field.hasAttribute("maxlength") && field.value.length > parseInt(field.getAttribute("maxlength"))) {
            throw new Error(`No puede exceder ${field.getAttribute("maxlength")} caracteres`);
        }
        
        // Numeric validations
        if (field.type === "number" && field.hasAttribute("min") && parseFloat(field.value) < parseFloat(field.getAttribute("min"))) {
            throw new Error(`El valor mínimo es ${field.getAttribute("min")}`);
        }
        
        return true;
        } catch (error) {
        errorSpan.textContent = error.message;
        return false;
        }
    };
    }