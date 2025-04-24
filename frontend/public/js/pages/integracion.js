// integracion.js (Updated with Supply Edit and State Preservation)

document.addEventListener('DOMContentLoaded', function() {
    // --- Global Variables ---
    let currentProductionId = null; // ID of production being viewed/updated/toggled
    let currentPage = 1;
    const productionsPerPage = 5; // Items per page in the list view
    let allSuppliesData = []; // Holds full data for all supplies {id, name, value, ...}
    let selectedSuppliesCreate = []; // Supplies selected in the CREATE form {id, name, quantity, unit_value}
    let selectedSuppliesUpdate = []; // Supplies selected in the UPDATE form {id, name, quantity, unit_value}
    let filteredProductions = []; // Holds productions after filtering for list view
    const API_BASE_URL = 'http://localhost:3000/api'; // Base URL for most API calls
    const SESSION_STORAGE_KEY = 'productionFormData'; // Key for saving form state

    // --- Initialization ---
    async function init() {
        setupNavigation();
        setupCreateForm();
        setupViewForm();
        setupUpdateForm();
        setupEnableForm();
        setupListSection();
        setupReportForm();
        await populateDropdownsAndSupplyData(); // Fetch dropdown data and all supplies
        await restoreCreateFormState(); // <<< Try restoring state AFTER dropdowns are populated
        await setInitialProductionId(); // Generate ID for create form
        await loadProductionsList(); // Load initial list of productions
    }

    // --- State Preservation Functions ---

    /**
     * Gathers data from the 'Create Production' form.
     * @returns {object|null} Form data object or null if form not found.
     */
    function getCreateFormData() {
        const form = document.querySelector('[data-form="create"]');
        if (!form) return null;

        const sensorsSelect = form.querySelector('[data-field="sensors"]');

        return {
            name: form.querySelector('[data-field="name"]')?.value || '',
            responsible: form.querySelector('[data-field="responsible"]')?.value || '',
            cultivation: form.querySelector('[data-field="cultivation"]')?.value || '',
            cycle: form.querySelector('[data-field="cycle"]')?.value || '',
            sensors: sensorsSelect ? Array.from(sensorsSelect.selectedOptions).map(opt => opt.value) : [],
            startDate: form.querySelector('[data-field="start-date"]')?.value || '',
            endDate: form.querySelector('[data-field="end-date"]')?.value || '',
            selectedSupplies: selectedSuppliesCreate // <<< Save the selected supplies array
        };
    }

    /**
     * Saves the current 'Create Production' form data to sessionStorage.
     */
    function saveCreateFormState() {
        const formData = getCreateFormData();
        if (formData) {
            try {
                sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(formData));
                console.log("Form state saved to sessionStorage.");
            } catch (e) {
                console.error("Error saving form state to sessionStorage:", e);
                 showSnackbar("Error al guardar el estado del formulario.", "error");
            }
        }
    }

    /**
     * Restores the 'Create Production' form data from sessionStorage.
     */
    async function restoreCreateFormState() {
        const savedState = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (!savedState) return; // No saved state

        const form = document.querySelector('[data-form="create"]');
        if (!form) return;

        try {
            const formData = JSON.parse(savedState);
            console.log("Restoring form state from sessionStorage:", formData);

            // Repopulate standard fields only if they exist in saved data
            if (formData.name) form.querySelector('[data-field="name"]').value = formData.name;
            if (formData.responsible) form.querySelector('[data-field="responsible"]').value = formData.responsible;
            if (formData.cultivation) form.querySelector('[data-field="cultivation"]').value = formData.cultivation;
            if (formData.cycle) form.querySelector('[data-field="cycle"]').value = formData.cycle;
            if (formData.startDate) form.querySelector('[data-field="start-date"]').value = formData.startDate;
            if (formData.endDate) form.querySelector('[data-field="end-date"]').value = formData.endDate;


            // Repopulate multi-select sensors - Wait for options to be populated first if needed
            // This might require ensuring dropdowns are populated BEFORE restoring state
            const sensorsSelect = form.querySelector('[data-field="sensors"]');
            if (sensorsSelect && Array.isArray(formData.sensors)) {
                // Defer selection slightly if options might not be ready immediately
                setTimeout(() => {
                    Array.from(sensorsSelect.options).forEach(option => {
                        option.selected = formData.sensors.includes(option.value);
                    });
                     console.log("Sensor selections restored.");
                }, 100); // Small delay
            }

            // Repopulate selected supplies list
            if (Array.isArray(formData.selectedSupplies)) {
                selectedSuppliesCreate = formData.selectedSupplies;
                renderSelectedSupplies('create'); // Render the restored list for CREATE form
                console.log("Selected supplies restored.");
            }

            sessionStorage.removeItem(SESSION_STORAGE_KEY); // Clear storage after restoring
            console.log("Form state restored and removed from sessionStorage.");

            // Re-validate form to enable/disable create button and update estimations
            validateCreateForm();

        } catch (e) {
            console.error("Error restoring form state:", e);
            showSnackbar("Error al restaurar el estado del formulario.", "error");
            sessionStorage.removeItem(SESSION_STORAGE_KEY); // Clear invalid data
        }
    }

    /**
 * Saves form state and redirects to the specified URL, adding an origin parameter.
 * Called by the '+' buttons in the create form.
 * @param {string} moduleType - Identifier for the module being created (e.g., 'user', 'cultivation').
 * @param {string} url - The base URL to redirect to.
 */
window.redirectToCreate = function(moduleType, url) { // Make it globally accessible
    console.log(`Redirecting to create ${moduleType} from production...`);
    saveCreateFormState(); // Save current data

    // Append the origin parameter to the URL
    const urlWithOrigin = `${url}?origin=produccion`;

    window.location.href = urlWithOrigin; // Perform redirection with the origin parameter
}

    // --- End State Preservation Functions ---

    // --- Initial ID Generation ---
    async function setInitialProductionId() {
         const prodIdInput = document.querySelector('[data-form="create"] [data-field="production-id"]');
        if (!prodIdInput) return; // Asegurarse que el input exista

        try {
            const prodResponse = await fetch(`${API_BASE_URL}/productions`);
            if (!prodResponse.ok) throw new Error('Failed to fetch productions for ID generation');
            const productionsResult = await prodResponse.json();
            const productionsData = (productionsResult && Array.isArray(productionsResult.data)) ? productionsResult.data : [];
            const nextId = productionsData.length > 0 ?
                Math.max(0, ...productionsData.map(p => parseInt(p.id) || 0)) + 1 : 1;
            prodIdInput.value = `prod-${nextId}`;
        } catch(e) {
            console.error("Error fetching next production ID:", e);
            prodIdInput.value = 'prod-error';
            showSnackbar('Error al generar ID de producción.', 'error');
        }
    }

    // --- Dropdown Population ---
    async function populateDropdownsAndSupplyData() {
        try {
            const integrationDataResponse = await fetch(`${API_BASE_URL}/integracion/data`);
            if (!integrationDataResponse.ok) throw new Error('Error al obtener datos de integración');
            const integrationDataResult = await integrationDataResponse.json();
             if (!integrationDataResult.success) throw new Error(integrationDataResult.error || 'Error en datos de integración');
             const data = integrationDataResult.data;

             // Poblar selects en TODOS los formularios donde existan (Create y Update)
             document.querySelectorAll('[data-field="responsible"]').forEach(select => populateSelect(select, data.users || [], "Seleccione un responsable"));
             document.querySelectorAll('[data-field="cultivation"]').forEach(select => populateSelect(select, data.cultivations || [], "Seleccione un cultivo"));
             document.querySelectorAll('[data-field="cycle"]').forEach(select => populateSelect(select, data.cycles || [], "Seleccione un ciclo"));
             document.querySelectorAll('[data-field="sensors"]').forEach(select => populateMultiSelect(select, data.sensors || [])); // Para sensores (multiple)
             document.querySelectorAll('[data-field="status"]').forEach(select => populateSelect(select, [{id: 'active', name: 'Activo'}, {id: 'inactive', name: 'Inactivo'}], "Seleccione estado")); // Para estado (update form)


             // Fetch y almacenar TODOS los datos de insumos
             const suppliesResponse = await fetch(`http://localhost:3000/api/insumos`); // Endpoint directo
             if (!suppliesResponse.ok) throw new Error(`Error al obtener lista de insumos: ${suppliesResponse.statusText}`);
             const suppliesResult = await suppliesResponse.json();
             allSuppliesData = suppliesResult.success ? suppliesResult.data : (Array.isArray(suppliesResult) ? suppliesResult : []);
             if (!Array.isArray(allSuppliesData)) {
                  allSuppliesData = [];
                  console.warn('Formato inesperado de datos de insumos:', suppliesResult);
                  throw new Error('Formato inesperado de datos de insumos detallados');
             }

             // Poblar el dropdown de SELECCIÓN de insumos (solo en formularios Create y Update)
             document.querySelectorAll('[data-field="available-supplies"]').forEach(select => {
                select.innerHTML = '<option value="">Seleccione un insumo para agregar</option>';
                allSuppliesData.forEach(supply => {
                    if (supply && supply.id && supply.nombre_insumo) {
                         const option = document.createElement('option');
                         option.value = supply.id; // Usa el ID correcto (PK)
                         option.textContent = supply.nombre_insumo;
                         select.appendChild(option);
                    }
                });
             });

         } catch (error) {
             console.error('Error al poblar datos:', error);
             showSnackbar(`Error al cargar datos iniciales: ${error.message || 'Error desconocido'}`, 'error');
         }
    }

    // Helper para poblar selects estándar
    function populateSelect(selectElement, options, defaultOptionText) {
        if (!selectElement) return;
        selectElement.innerHTML = `<option value="">${defaultOptionText}</option>`;
        options.forEach(opt => {
             if (opt && opt.id !== undefined && opt.name !== undefined) {
                 const option = document.createElement('option');
                 option.value = opt.id;
                 option.textContent = opt.name;
                 selectElement.appendChild(option);
             }
        });
    }
    // Helper para poblar multi-selects
    function populateMultiSelect(selectElement, options) {
        if (!selectElement) return;
        selectElement.innerHTML = ''; // No default option for multi-select typically
        options.forEach(opt => {
             if (opt && opt.id !== undefined && opt.name !== undefined) {
                 const option = document.createElement('option');
                 option.value = opt.id;
                 option.textContent = opt.name;
                 selectElement.appendChild(option);
             }
        });
    }

    // --- Form Setups (Create, View, Update, Enable, List, Report) ---
    function setupCreateForm() {
        const form = document.querySelector('[data-form="create"]');
        if (!form) return;

        form.querySelector('[data-action="cancel"]')?.addEventListener('click', resetForms);
        form.querySelector('[data-action="save-draft"]')?.addEventListener('click', saveAsDraft); // Keep simulation
        form.addEventListener('submit', async (e) => { e.preventDefault(); await createProduction(); });

        // Listeners de validación y botón Agregar Insumo
        form.querySelectorAll('[required]').forEach(input => input.addEventListener('change', validateCreateForm));
        form.querySelector('[data-field="sensors"]')?.addEventListener('change', validateCreateForm);
        form.querySelector('[data-action="add-selected-supply"]')?.addEventListener('click', () => addSelectedSupplyToList('create')); // Specify context

        // Deshabilitar botón Crear inicialmente
        const createBtn = form.querySelector('[data-action="create"]'); if (createBtn) createBtn.disabled = true;
        // Listeners para habilitar botón (validarán con la nueva lógica de insumos)
        form.querySelectorAll('input[required], select[required]').forEach(el => {
            el.addEventListener('change', validateCreateForm);
            if (el.tagName === 'INPUT') el.addEventListener('input', validateCreateForm);
        });
    }

    function setupViewForm() {
        const form = document.querySelector('[data-form="view"]');
        if (!form) return;
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            const productionIdInput = form.querySelector('[data-field="production-id"]');
            const productionId = productionIdInput?.value?.trim();
            if (!productionId) { showSnackbar("Ingrese ID de producción a buscar", "warning"); return; }
            const idMatch = productionId.match(/(\d+)$/);
            const actualId = idMatch ? idMatch[1] : productionId;
            await viewProduction(actualId);
        });
    }

     function setupUpdateForm() {
        const searchForm = document.querySelector('[data-form="search-update"]');
        const updateFormEl = document.querySelector('[data-form="update"]');
        if (!searchForm || !updateFormEl) return;

        searchForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const productionIdInput = searchForm.querySelector('[data-field="production-id"]');
            const productionId = productionIdInput?.value?.trim();
            const errorSpan = searchForm.querySelector('[data-error="production-id"]');
            if(errorSpan) { errorSpan.textContent = ''; errorSpan.style.display = 'none'; }
            if (!productionId) {
                showSnackbar("Ingrese ID", "warning");
                if (errorSpan) { errorSpan.textContent = 'Ingrese ID'; errorSpan.style.display = 'block'; }
                return;
            }
            updateFormEl.classList.add('dashboard__form--hidden');
            const idMatch = productionId.match(/(\d+)$/);
            const actualId = idMatch ? idMatch[1] : productionId;
            try {
                showSnackbar("Buscando producción...", "info");
                const response = await fetch(`${API_BASE_URL}/productions/${actualId}`);
                if (!response.ok) throw new Error(response.status === 404 ? "Producción no encontrada." : `Error al buscar: ${response.statusText}`);
                const result = await response.json();
                if (!result.success || !result.data) throw new Error(result.error || "No se encontraron datos.");

                currentProductionId = actualId;
                await populateExistingUpdateForm(updateFormEl, result.data); // Populate the dynamic form
                updateFormEl.classList.remove('dashboard__form--hidden');
                showSnackbar("Datos cargados. Puede actualizar.", "success");
            } catch (error) {
                console.error('Error buscando para actualizar:', error);
                showSnackbar(error.message, 'error');
                if (errorSpan) { errorSpan.textContent = error.message; errorSpan.style.display = 'block'; }
                updateFormEl.classList.add('dashboard__form--hidden');
            }
        });

        // Delegar eventos para botones dentro del formulario dinámico de actualización
        updateFormEl.addEventListener('click', (e) => {
             if (e.target.matches('[data-action="cancel-update"]')) {
                 updateFormEl.classList.add('dashboard__form--hidden');
                 updateFormEl.innerHTML = ''; // Limpiar contenido dinámico
                 selectedSuppliesUpdate = []; // Limpiar insumos de actualización
                 currentProductionId = null;
             } else if (e.target.matches('[data-action="add-selected-supply-update"]')) {
                 addSelectedSupplyToList('update'); // Agregar insumo en modo update
             } else if (e.target.matches('.dashboard__button--remove-supply')) {
                 const supplyId = e.target.getAttribute('data-supply-id');
                 if (supplyId) removeSelectedSupply(supplyId, 'update'); // Remover insumo en modo update
             }
        });

        updateFormEl.addEventListener('submit', async function(e) {
            e.preventDefault();
            await updateProduction();
        });

         // Validar campos requeridos en el form de actualización al cambiar
         updateFormEl.addEventListener('change', (e) => {
             if (e.target.matches('[required], [data-field="sensors"], [data-field="available-supplies"]')) { // Validate on select changes too
                 validateUpdateForm();
             }
         });
         updateFormEl.addEventListener('input', (e) => {
             if (e.target.matches('input[required], input[data-field="supply-quantity"]')) { // Validate on text/number inputs
                 validateUpdateForm();
             }
         });
    }

    function setupEnableForm() {
        const form = document.querySelector('[data-form="enable"]');
        const resultSection = document.querySelector('[data-result="enable"]');
        if (!form || !resultSection) return;

        form.addEventListener('submit', async function(e) {
             e.preventDefault();
             const idInput = form.querySelector('[data-field="production-id"]');
             const productionId = idInput?.value?.trim();
             const errorSpan = form.querySelector('[data-error="production-id"]');
             if(errorSpan) { errorSpan.textContent = ''; errorSpan.style.display = 'none'; }

             if (!productionId) {
                 showSnackbar('Ingrese ID de producción', 'warning');
                 if (errorSpan) { errorSpan.textContent = 'Ingrese ID'; errorSpan.style.display = 'block'; }
                 return;
             }

             resultSection.classList.add('dashboard__result--hidden');

             const idMatch = productionId.match(/(\d+)$/);
             const actualId = idMatch ? idMatch[1] : productionId;

             try {
                 showSnackbar("Buscando producción...", "info");
                const response = await fetch(`${API_BASE_URL}/productions/${actualId}`);
                 if (!response.ok) throw new Error(response.status === 404 ? 'Producción no encontrada' : `Error al buscar: ${response.statusText}`);
                 const result = await response.json();
                 if (!result.success || !result.data) throw new Error(result.error || 'No se encontraron datos');

                 const production = result.data;
                 currentProductionId = production.id; // Guarda ID numérico para toggle

                 const content = resultSection.querySelector('[data-content="status"]');
                 if (content) {
                      const statusText = production.status === 'active' ? 'Activo' : 'Inactivo';
                      const statusClass = production.status === 'active' ? 'active' : 'inactive';
                     content.innerHTML = `
                         <div class="dashboard__info-item"> <div class="dashboard__info-label">Producción</div> <div class="dashboard__info-value">${production.name || 'N/A'} (ID: prod-${production.id})</div> </div>
                         <div class="dashboard__info-item"> <div class="dashboard__info-label">Estado Actual</div> <div class="dashboard__info-value"> <span class="status-badge status-badge--${statusClass}">${statusText}</span> </div> </div>`;
                 }

                 const toggleButton = resultSection.querySelector('[data-action="toggle-status"]');
                 if (toggleButton) {
                     toggleButton.textContent = production.status === 'active' ? 'Deshabilitar' : 'Habilitar';
                     // Remover listener anterior antes de añadir uno nuevo para evitar duplicados
                     const newButton = toggleButton.cloneNode(true);
                     toggleButton.parentNode.replaceChild(newButton, toggleButton);
                     newButton.addEventListener('click', async () => await toggleProductionStatus(production));
                     newButton.disabled = false; // Habilitar botón
                 }
                 resultSection.classList.remove('dashboard__result--hidden');

             } catch (error) {
                 console.error('Error buscando para habilitar/deshabilitar:', error);
                 showSnackbar(error.message, 'error');
                  if (errorSpan) { errorSpan.textContent = error.message; errorSpan.style.display = 'block'; }
                 resultSection.classList.add('dashboard__result--hidden');
                 const toggleButton = resultSection.querySelector('[data-action="toggle-status"]');
                 if (toggleButton) toggleButton.disabled = true;
             }
        });
    }

    function setupListSection() {
        const listSection = document.querySelector('[data-panel="list"]');
        if (!listSection) { console.error("Sección de listado no encontrada."); return; }

        const searchInput = listSection.querySelector('[data-field="search"]');
        const filterSelect = listSection.querySelector('[data-field="filter-status"]');
        const prevButton = listSection.querySelector('[data-action="prev-page"]');
        const nextButton = listSection.querySelector('[data-action="next-page"]');

        let searchTimeout;
         if(searchInput) {
            searchInput.addEventListener('input', () => {
                 clearTimeout(searchTimeout);
                 searchTimeout = setTimeout(() => { currentPage = 1; loadProductionsList(); }, 350); // Debounce
            });
         }
         if(filterSelect) { filterSelect.addEventListener('change', () => { currentPage = 1; loadProductionsList(); }); }
         if(prevButton) { prevButton.addEventListener('click', () => { if (currentPage > 1) { currentPage--; loadProductionsList(); } }); }
         if(nextButton) {
             nextButton.addEventListener('click', () => {
                 const paginationInfo = listSection.querySelector('[data-info="page"]');
                 const totalPages = parseInt(paginationInfo?.dataset.totalPages || '1');
                 if (currentPage < totalPages) { currentPage++; loadProductionsList(); }
            });
         }
    }

    function setupReportForm() {
        const form = document.querySelector('[data-form="report"]');
        if (form) {
             form.addEventListener('submit', async (e) => { e.preventDefault(); await generateReport(); });
         } else { console.warn("Formulario de reportes no encontrado."); }
    }

    // --- Supply Management ---

    /**
     * Adds a selected supply to the list for either Create or Update form.
     * @param {'create' | 'update'} context - Specifies which form's list to update.
     */
    function addSelectedSupplyToList(context) {
        const form = document.querySelector(`[data-form="${context}"]`);
        if (!form) return;
        const supplySelect = form.querySelector('[data-field="available-supplies"]');
        const quantityInput = form.querySelector('[data-field="supply-quantity"]');
        const errorSpan = form.querySelector('[data-error="supplies"]');

        const supplyId = supplySelect?.value;
        const quantity = parseInt(quantityInput?.value);

        if (!supplyId) { showSnackbar('Seleccione un insumo', 'warning'); return; }
        if (isNaN(quantity) || quantity <= 0) { showSnackbar('Ingrese una cantidad válida', 'warning'); return; }

        const targetSupplyList = context === 'create' ? selectedSuppliesCreate : selectedSuppliesUpdate;

        if (targetSupplyList.some(item => item.id == supplyId)) { showSnackbar('Insumo ya agregado', 'warning'); return; }
        if (!Array.isArray(allSuppliesData) || allSuppliesData.length === 0) {
             showSnackbar('Error: Lista de insumos no cargada', 'error'); return;
        }

        const supplyData = allSuppliesData.find(s => s.id == supplyId || s.id_insumo == supplyId);
        if (!supplyData || !supplyData.nombre_insumo) {
             showSnackbar('Error: Datos del insumo no encontrados', 'error'); return;
        }

        targetSupplyList.push({
            id: supplyData.id, // Use the actual PK 'id' from allSuppliesData
            name: supplyData.nombre_insumo,
            quantity: quantity,
            unit_value: supplyData.valor_unitario
        });

        renderSelectedSupplies(context);
        if (supplySelect) supplySelect.value = "";
        if (quantityInput) quantityInput.value = "";
        if (errorSpan) errorSpan.style.display = 'none';

        if (context === 'create') validateCreateForm();
        else if (context === 'update') validateUpdateForm();
    }

    /**
     * Removes a supply from the list for either Create or Update form.
     * @param {string} supplyIdToRemove - The ID of the supply to remove.
     * @param {'create' | 'update'} context - Specifies which form's list to update.
     */
    function removeSelectedSupply(supplyIdToRemove, context) {
         if (context === 'create') {
            selectedSuppliesCreate = selectedSuppliesCreate.filter(item => item.id != supplyIdToRemove);
            renderSelectedSupplies('create');
            validateCreateForm();
         } else if (context === 'update') {
            selectedSuppliesUpdate = selectedSuppliesUpdate.filter(item => item.id != supplyIdToRemove);
            renderSelectedSupplies('update');
            validateUpdateForm();
         }
    }

    /**
     * Renders the list of selected supplies in the UI for the specified form.
     * @param {'create' | 'update'} context - Specifies which form's list area to update.
     */
    function renderSelectedSupplies(context) {
        const container = document.querySelector(`[data-form="${context}"] [data-list="selected-supplies"]`);
        if (!container) return;
        container.innerHTML = '';

        const supplyList = context === 'create' ? selectedSuppliesCreate : selectedSuppliesUpdate;

        if (supplyList.length === 0) {
            container.innerHTML = '<p>No hay insumos agregados.</p>';
        } else {
            const list = document.createElement('ul');
            list.className = 'dashboard__supplies-list-items';
            supplyList.forEach(item => {
                const listItem = document.createElement('li');
                const itemId = item.id || `unknown-${Math.random()}`;
                listItem.innerHTML = `
                    <span>${item.name || 'N/A'} (Cantidad: ${item.quantity})</span>
                    <button type="button" class="dashboard__button--remove-supply" data-supply-id="${itemId}" title="Eliminar">&times;</button>
                `;
                // Attach listener only for create context here; update context uses delegation
                if (context === 'create') {
                    listItem.querySelector('.dashboard__button--remove-supply')?.addEventListener('click', (e) => {
                         const idToRemove = e.currentTarget.getAttribute('data-supply-id');
                         if (idToRemove && !idToRemove.startsWith('unknown-')) removeSelectedSupply(idToRemove, 'create');
                    });
                }
                list.appendChild(listItem);
            });
            container.appendChild(list);
        }
    }

    // --- CRUD Operations ---

    async function createProduction() {
        if (!validateCreateForm()) {
             showSnackbar("Formulario inválido. Revise los campos marcados.", "warning"); return;
        }
        const form = document.querySelector('[data-form="create"]');
        const supplyIdsForApi = selectedSuppliesCreate.map(item => item.id); // Use create list
        const newProduction = {
            name: form.querySelector('[data-field="name"]').value,
            responsible: form.querySelector('[data-field="responsible"]').value,
            cultivation: form.querySelector('[data-field="cultivation"]').value,
            cycle: form.querySelector('[data-field="cycle"]').value,
            sensors: Array.from(form.querySelector('[data-field="sensors"]').selectedOptions).map(opt => opt.value),
            supplies: supplyIdsForApi, // Send IDs from create list
            startDate: form.querySelector('[data-field="start-date"]').value,
            endDate: form.querySelector('[data-field="end-date"]').value
        };
         try {
            const response = await fetch(`${API_BASE_URL}/productions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newProduction) });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.error || `Error HTTP ${response.status}`);
            showSnackbar(`Producción creada: ${result.displayId || result.id}`);
            resetForms(); // Resets create form, clears selectedSuppliesCreate, regenerates ID
            await loadProductionsList();
        } catch (error) {
            console.error('Error al crear producción:', error);
            showSnackbar(`Error al crear: ${error.message}`, 'error');
        }
    }

    async function viewProduction(productionId) {
        const resultSection = document.querySelector('[data-panel="view"] [data-result="view"]');
        if (!resultSection) return;
        resultSection.classList.add('dashboard__result--hidden');

        try {
            const response = await fetch(`${API_BASE_URL}/productions/${productionId}`);
            if (!response.ok) throw new Error(response.status === 404 ? 'Producción no encontrada' : `Error al obtener producción: ${response.statusText}`);
            const result = await response.json();
            if (!result.success || !result.data) throw new Error(result.error || 'Producción no encontrada en la respuesta');

            const production = result.data;
            currentProductionId = production.id;

            // Llenar info básica
            const basicInfoContainer = resultSection.querySelector('[data-info="basic"]');
            if(basicInfoContainer) {
                basicInfoContainer.innerHTML = '';
                const infoItems = [
                     { label: 'ID', value: `prod-${production.id}` }, { label: 'Nombre', value: production.name },
                     { label: 'Responsable', value: production.responsible_name || 'N/A' }, { label: 'Cultivo', value: production.cultivation_name || 'N/A' },
                     { label: 'Ciclo', value: production.cycle_name || 'N/A' }, { label: 'Fecha Inicio', value: formatDate(production.start_date) },
                     { label: 'Fecha Fin Est.', value: formatDate(production.end_date) }, { label: 'Estado', value: production.status === 'active' ? 'Activo' : 'Inactivo' }
                ];
                infoItems.forEach(item => {
                    const infoDiv = document.createElement('div'); infoDiv.className = 'dashboard__info-item';
                    infoDiv.innerHTML = `<div class="dashboard__info-label">${item.label}</div><div class="dashboard__info-value">${item.value || 'N/A'}</div>`;
                    basicInfoContainer.appendChild(infoDiv);
                });
            } else { console.warn("Contenedor [data-info='basic'] no encontrado en la vista."); }

            // Métricas simuladas
             updateSimulatedMetrics(resultSection);
            // Gráficos simulados
             createAllCharts(resultSection, generateSensorData());
            // Mostrar Sensores (usa IDs del backend)
             await displayProductionSensorsView(resultSection, production.sensors || []);
            // Mostrar Insumos (usa IDs del backend)
             const suppliesContainer = resultSection.querySelector('[data-info="supplies"]');
             if (suppliesContainer) { await displayProductionSuppliesView(resultSection, production.supplies || []); }
             else { console.warn("Contenedor [data-info='supplies'] no encontrado en la vista."); }

            resultSection.classList.remove('dashboard__result--hidden');

        } catch (error) {
            console.error('Error al visualizar producción:', error);
            showSnackbar(`Error al visualizar: ${error.message}`, 'error');
            resultSection.classList.add('dashboard__result--hidden');
        }
    }
     // Helper para métricas simuladas
     function updateSimulatedMetrics(section) {
         const health = section.querySelector('[data-metric="health"]'); if (health) health.textContent = `${Math.floor(Math.random()*20)+70}%`;
         const growth = section.querySelector('[data-metric="growth"]'); if (growth) growth.textContent = `${Math.floor(Math.random()*20)+50}cm`;
         const yield_ = section.querySelector('[data-metric="yield"]'); if (yield_) yield_.textContent = `${Math.floor(Math.random()*20)+70}%`;
     }
     // Helper para crear todos los gráficos
     function createAllCharts(section, data) {
         createChart(section.querySelector('[data-chart="humidity"]'), 'Humedad (%)', data.humidity);
         createChart(section.querySelector('[data-chart="temperature"]'), 'Temperatura (°C)', data.temperature);
         createChart(section.querySelector('[data-chart="nutrients"]'), 'Nutrientes (%)', data.nutrients);
         createChart(section.querySelector('[data-chart="growth"]'), 'Crecimiento (cm)', data.growth);
     }
     // Generar datos simulados de sensores
    function generateSensorData() {
        return {
            humidity: Array(7).fill(0).map(() => Math.floor(Math.random() * 20) + 60),
            temperature: Array(7).fill(0).map(() => Math.floor(Math.random() * 10) + 20),
            nutrients: Array(7).fill(0).map(() => Math.floor(Math.random() * 20) + 40),
            growth: Array(7).fill(0).map((_, i) => i * 10 + Math.floor(Math.random() * 5))
        };
    }
    // Helper para crear gráfico individual
    let charts = {}; // Almacenar instancias de gráficos para destruir
    function createChart(canvasElement, label, data) {
         if (!canvasElement) return;
         const chartId = canvasElement.getAttribute('data-chart');
         if (charts[chartId]) { charts[chartId].destroy(); }
         const ctx = canvasElement.getContext('2d');
         const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
         charts[chartId] = new Chart(ctx, {
             type: 'line', data: { labels: days.slice(0, data.length), datasets: [{ label: label, data: data, borderColor: 'var(--color-primary)', backgroundColor: 'rgba(111, 192, 70, 0.1)', tension: 0.4, fill: true }] },
             options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: false }, x: { ticks: { autoSkip: true, maxTicksLimit: 7 } } } }
         });
     }
     // Mostrar Sensores en la vista
    async function displayProductionSensorsView(resultSection, sensorIds) {
        const container = resultSection.querySelector('[data-info="sensors"]');
        if (!container) return;
        container.innerHTML = '<p>Cargando sensores...</p>';
        const ids = Array.isArray(sensorIds) ? sensorIds.map(String) : [];
        if (ids.length === 0) { container.innerHTML = '<p>No hay sensores asignados.</p>'; return; }
        try {
             const sensorsResponse = await fetch(`http://localhost:3000/sensores`); // Assume endpoint exists
             if (!sensorsResponse.ok) throw new Error('Error al cargar lista de sensores');
             const sensorsResult = await sensorsResponse.json(); // Assume array or {data: []}
             const allSensors = (sensorsResult && Array.isArray(sensorsResult.data)) ? sensorsResult.data : (Array.isArray(sensorsResult) ? sensorsResult : []);

            container.innerHTML = '';
            ids.forEach(id => {
                const sensor = allSensors.find(s => String(s.id) === id);
                if (sensor) {
                     const card = document.createElement('div'); card.className = 'dashboard__sensor-card';
                     const sensorStatus = sensor.estado ? sensor.estado.toLowerCase() : 'desconocido';
                     const statusColor = (sensorStatus === 'activo' || sensorStatus === 'disponible') ? 'var(--color-success)' : 'var(--color-error)';
                     card.innerHTML = `<i class="material-icons dashboard__sensor-icon">${getSensorIcon(sensor.tipo_sensor)}</i> <div class="dashboard__sensor-info"> <div class="dashboard__sensor-name">${sensor.nombre_sensor || 'Sin nombre'}</div> <div class="dashboard__sensor-meta"> <span>${sensor.tipo_sensor || 'Tipo desc.'}</span> <span style="color: ${statusColor}; text-transform: capitalize;"> ${sensorStatus} </span> </div> </div>`;
                     container.appendChild(card);
                 } else {
                     const card = document.createElement('div'); card.className = 'dashboard__sensor-card dashboard__sensor-card--not-found';
                     card.innerHTML = `<i class="material-icons dashboard__sensor-icon">help_outline</i> <div class="dashboard__sensor-info"> <div class="dashboard__sensor-name">Sensor ID ${id}</div> <div class="dashboard__sensor-meta"> <span>No encontrado</span> </div> </div>`;
                     container.appendChild(card);
                 }
            });
             if (container.children.length === 0 && ids.length > 0) container.innerHTML = '<p>Detalles de sensores no encontrados.</p>';
         } catch (error) {
             console.error("Error mostrando sensores:", error); container.innerHTML = '<p>Error al cargar datos de sensores.</p>';
         }
    }
     // Obtener icono para el tipo de sensor
    function getSensorIcon(type) {
        if (!type) return 'sensors';
        const typeLower = type.toLowerCase();
        const icons = { 'humedad': 'opacity', 'temperatura': 'thermostat', 'nutrientes': 'eco', 'luz': 'wb_sunny' };
        return icons[typeLower] || 'sensors';
    }
     // Mostrar Insumos en la vista
    async function displayProductionSuppliesView(resultSection, supplyIds) {
         const container = resultSection.querySelector('[data-info="supplies"]');
        if (!container) return;
        container.innerHTML = '<p>Cargando insumos...</p>';
        const ids = Array.isArray(supplyIds) ? supplyIds.map(String) : [];
        if (ids.length === 0) { container.innerHTML = '<p>No hay insumos asignados.</p>'; return; }
        try {
            if (allSuppliesData.length === 0) { // Fetch if not already loaded
                const suppliesResponse = await fetch(`http://localhost:3000/api/insumos`);
                if (!suppliesResponse.ok) throw new Error('Error al obtener lista de insumos para vista');
                const suppliesResult = await suppliesResponse.json();
                allSuppliesData = suppliesResult.success ? suppliesResult.data : (Array.isArray(suppliesResult) ? suppliesResult : []);
                 if (!Array.isArray(allSuppliesData)) throw new Error('Formato inesperado de insumos');
            }
            container.innerHTML = '';
            const list = document.createElement('ul'); list.className = 'dashboard__supplies-list-items dashboard__supplies-list-items--view';
            ids.forEach(id => {
                const supply = allSuppliesData.find(s => String(s.id) === id || String(s.id_insumo) === id);
                const li = document.createElement('li');
                li.textContent = supply ? supply.nombre_insumo : `Insumo ID ${id} (No encontrado)`;
                list.appendChild(li);
            });
            container.appendChild(list);
            if (list.children.length === 0 && ids.length > 0) container.innerHTML = '<p>Detalles de insumos no encontrados.</p>';
        } catch (error) {
            console.error("Error mostrando insumos:", error); container.innerHTML = '<p>Error al cargar datos de insumos.</p>';
        }
    }

    async function updateProduction() {
        if (!validateUpdateForm()) {
             showSnackbar("Formulario de actualización inválido.", "warning"); return;
        }
        const form = document.querySelector('[data-form="update"]');
        if (!form || !currentProductionId) {
            showSnackbar("No se ha seleccionado una producción para actualizar.", "error"); return;
        }

        const supplyIdsForApi = selectedSuppliesUpdate.map(item => item.id); // <<< Use UPDATE list

        const updatedData = {
            name: form.querySelector('[data-field="name"]').value,
            responsible: form.querySelector('[data-field="responsible"]').value,
            cultivation: form.querySelector('[data-field="cultivation"]').value,
            cycle: form.querySelector('[data-field="cycle"]').value,
            sensors: Array.from(form.querySelector('[data-field="sensors"]').selectedOptions).map(opt => opt.value),
            supplies: supplyIdsForApi, // <<< SEND the final list of supply IDs
            end_date: form.querySelector('[data-field="end-date"]').value,
            status: form.querySelector('[data-field="status"]').value
        };
        try {
            showSnackbar("Actualizando...", "info");
            const response = await fetch(`${API_BASE_URL}/productions/${currentProductionId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatedData) });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.error || `Error HTTP ${response.status}`);
            showSnackbar('Producción actualizada exitosamente');
            form.classList.add('dashboard__form--hidden'); // Oculta form
            form.innerHTML = ''; // Limpia contenido dinámico
            selectedSuppliesUpdate = []; // Limpia lista de update
            currentProductionId = null; // Resetea ID
            await loadProductionsList(); // Refresca lista
        } catch (error) {
            console.error('Error al actualizar producción:', error);
            showSnackbar(`Error al actualizar: ${error.message}`, 'error');
        }
    }

    async function toggleProductionStatus(currentProductionData) {
        if (!currentProductionData || !currentProductionData.id) {
             showSnackbar("Error: No se pudo identificar la producción.", "error"); return;
        }
        const newStatus = currentProductionData.status === 'active' ? 'inactive' : 'active';
        const actionText = newStatus === 'active' ? 'habilitar' : 'deshabilitar';
        showSnackbar(`Intentando ${actionText}...`, "info");

        // Send minimal payload if backend supports partial updates, otherwise send all required fields
         const updatePayload = {
             // Assuming backend needs most fields for PUT even for status change
             ...currentProductionData, // Start with current data
             status: newStatus, // Change status
             // Ensure correct format for arrays/dates if sending full object
             sensors: Array.isArray(currentProductionData.sensors) ? currentProductionData.sensors.join(',') : currentProductionData.sensors,
             supplies: Array.isArray(currentProductionData.supplies) ? currentProductionData.supplies.join(',') : currentProductionData.supplies,
             start_date: currentProductionData.start_date ? new Date(currentProductionData.start_date).toISOString().split('T')[0] : undefined,
             end_date: currentProductionData.end_date ? new Date(currentProductionData.end_date).toISOString().split('T')[0] : undefined,
             // Remove fields not in DB table or that shouldn't be sent
             responsible_name: undefined, cultivation_name: undefined, cycle_name: undefined, created_at: undefined, updated_at: undefined
         };
          // IMPORTANT: Remove start_date as it shouldn't be updated by this action either
         delete updatePayload.start_date;


        try {
            const response = await fetch(`${API_BASE_URL}/productions/${currentProductionData.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatePayload) });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.error || `Error al cambiar estado (HTTP ${response.status})`);
            showSnackbar(`Producción ${actionText}da exitosamente.`);

            // Refresh view and list
            const enableForm = document.querySelector('[data-form="enable"]');
            const idInput = enableForm?.querySelector('[data-field="production-id"]');
             if(enableForm && idInput && idInput.value) {
                 enableForm.dispatchEvent(new Event('submit', { bubbles: true })); // Resubmit search
             } else {
                 const resultSection = document.querySelector('[data-result="enable"]');
                 if (resultSection) resultSection.classList.add('dashboard__result--hidden');
             }
            await loadProductionsList();
        } catch (error) {
            console.error('Error al cambiar estado:', error);
            showSnackbar(`Error al ${actionText}: ${error.message}`, 'error');
        }
    }

    // --- Validation ---
    function validateCreateForm() {
        const form = document.querySelector('[data-form="create"]');
        if (!form) return false;
        let isValid = true;
        form.querySelectorAll('[required]:not([disabled])').forEach(input => {
             const fieldName = input.getAttribute('data-field');
             const errorElement = form.querySelector(`[data-error="${fieldName}"]`);
             let fieldValid = true; let errorMessage = 'Este campo es requerido';

             if (input.tagName === 'SELECT' && input.multiple) { // Sensors validation
                 if (input.selectedOptions.length === 0 && input.hasAttribute('required')) { fieldValid = false; }
                 else if (input.selectedOptions.length > 3) { fieldValid = false; errorMessage = 'Máximo 3 sensores'; }
             } else if (input.type === 'date') {
                 if (!input.value) { fieldValid = false; }
                 // Date range validation
                 if (fieldName === 'end-date') {
                     const startDateInput = form.querySelector('[data-field="start-date"]');
                     if (startDateInput && input.value && startDateInput.value && new Date(input.value) < new Date(startDateInput.value)) {
                         fieldValid = false; errorMessage = 'La fecha de fin debe ser posterior a la de inicio.';
                     }
                 }
             } else if (!input.value || (typeof input.value === 'string' && !input.value.trim())) {
                 fieldValid = false;
             }

             if (!fieldValid) { if (errorElement) { errorElement.textContent = errorMessage; errorElement.style.display = 'block'; } isValid = false; }
             else { if (errorElement) { errorElement.style.display = 'none'; } }
        });
        // Validate supplies
        const supplyErrorElement = form.querySelector('[data-error="supplies"]');
        if (selectedSuppliesCreate.length === 0) {
             if (supplyErrorElement) { supplyErrorElement.textContent = 'Debe agregar al menos un insumo'; supplyErrorElement.style.display = 'block'; }
             isValid = false;
         } else {
             if (supplyErrorElement) { supplyErrorElement.style.display = 'none'; }
        }
         // Update estimations & button state
         if (isValid) calculateEstimation('create'); else clearEstimation('create');
         const createButton = form.querySelector('[data-action="create"]'); if (createButton) createButton.disabled = !isValid;
         return isValid;
    }

    function validateUpdateForm() {
        const form = document.querySelector('[data-form="update"]');
        if (!form || form.classList.contains('dashboard__form--hidden')) return false;
        let isValid = true;
        form.querySelectorAll('[required]:not([disabled])').forEach(input => {
             const fieldName = input.getAttribute('data-field');
             const errorElement = form.querySelector(`[data-error="${fieldName}"]`);
             let fieldValid = true; let errorMessage = 'Este campo es requerido';

             if (input.tagName === 'SELECT' && input.multiple) { // Sensors validation
                 if (input.selectedOptions.length === 0 && input.hasAttribute('required')) { fieldValid = false; }
                 else if (input.selectedOptions.length > 3) { fieldValid = false; errorMessage = 'Máximo 3 sensores'; }
             } else if (input.type === 'date') {
                 if (!input.value) { fieldValid = false; }
                 // Date range validation (vs disabled start date)
                 if (fieldName === 'end-date') {
                     const startDateInput = form.querySelector('[data-field="start-date"]');
                     if (startDateInput && input.value && startDateInput.value && new Date(input.value) < new Date(startDateInput.value)) {
                         fieldValid = false; errorMessage = 'La fecha de fin debe ser posterior a la de inicio.';
                     }
                 }
             } else if (!input.value || (typeof input.value === 'string' && !input.value.trim())) {
                 fieldValid = false;
             }

             if (!fieldValid) { if (errorElement) { errorElement.textContent = errorMessage; errorElement.style.display = 'block'; } isValid = false; }
             else { if (errorElement) { errorElement.style.display = 'none'; } }
        });
        // Validate supplies
        const supplyErrorElement = form.querySelector('[data-error="supplies"]');
        if (selectedSuppliesUpdate.length === 0) { // <<< Check UPDATE list
            if (supplyErrorElement) { supplyErrorElement.textContent = 'Debe agregar al menos un insumo'; supplyErrorElement.style.display = 'block'; }
            isValid = false;
        } else {
            if (supplyErrorElement) { supplyErrorElement.style.display = 'none'; }
        }
        // Enable/Disable update button
        const updateButton = form.querySelector('button[type="submit"]');
        if (updateButton) updateButton.disabled = !isValid;
        return isValid;
    }

    // --- Populate Update Form (Modified for Supplies) ---
    async function populateExistingUpdateForm(formElement, productionData) {
        formElement.innerHTML = ''; // Clear previous content
        selectedSuppliesUpdate = []; // Clear previous update supplies list

        // Dynamically create the form structure
        formElement.innerHTML = `
            <div class="dashboard__form-group"> <label class="dashboard__label">ID Producción</label> <input class="dashboard__input" type="text" value="prod-${productionData.id}" readonly> </div>
            <div class="dashboard__form-group"> <label class="dashboard__label">Nombre</label> <input class="dashboard__input" type="text" data-field="name" required> <span class="dashboard__error" data-error="name"></span> </div>
            <div class="dashboard__form-group"> <label class="dashboard__label">Responsable</label> <select class="dashboard__select" data-field="responsible" required></select> <span class="dashboard__error" data-error="responsible"></span> </div>
            <div class="dashboard__form-group"> <label class="dashboard__label">Cultivo</label> <select class="dashboard__select" data-field="cultivation" required></select> <span class="dashboard__error" data-error="cultivation"></span> </div>
            <div class="dashboard__form-group"> <label class="dashboard__label">Ciclo</label> <select class="dashboard__select" data-field="cycle" required></select> <span class="dashboard__error" data-error="cycle"></span> </div>
            <div class="dashboard__form-group"> <label class="dashboard__label">Sensores (Máx. 3)</label> <select class="dashboard__select" data-field="sensors" multiple size="3" required></select> <span class="dashboard__error" data-error="sensors"></span> </div>
            <div class="dashboard__form-group dashboard__form-group--full-width">
                <label class="dashboard__label">Insumos Asignados</label>
                <div class="dashboard__supply-add-area">
                    <select class="dashboard__select" data-field="available-supplies"> <option value="">Seleccione insumo a agregar...</option> </select>
                    <input type="number" class="dashboard__input" placeholder="Cantidad" min="1" data-field="supply-quantity">
                    <button class="dashboard__button dashboard__button--primary" type="button" data-action="add-selected-supply-update">Agregar</button>
                </div>
                <div class="dashboard__selected-supplies-list" data-list="selected-supplies"> <p>Cargando insumos asignados...</p> </div>
                <span class="dashboard__error" data-error="supplies"></span>
            </div>
            <div class="dashboard__form-group"> <label class="dashboard__label">Fecha Inicio</label> <input class="dashboard__input" type="date" data-field="start-date" disabled> <span class="dashboard__error" data-error="start-date"></span> </div>
            <div class="dashboard__form-group"> <label class="dashboard__label">Fecha Fin Est.</label> <input class="dashboard__input" type="date" data-field="end-date" required> <span class="dashboard__error" data-error="end-date"></span> </div>
            <div class="dashboard__form-group"> <label class="dashboard__label">Estado</label> <select class="dashboard__select" data-field="status" required></select> <span class="dashboard__error" data-error="status"></span> </div>
            <div class="dashboard__form-actions">
                <button class="dashboard__button dashboard__button--secondary" type="button" data-action="cancel-update">Cancelar</button>
                <button class="dashboard__button dashboard__button--primary" type="submit" disabled>Actualizar Producción</button>
            </div>
        `;

        // Populate standard fields
        formElement.querySelector('[data-field="name"]').value = productionData.name || '';
        const startDateInput = formElement.querySelector('[data-field="start-date"]');
        const endDateInput = formElement.querySelector('[data-field="end-date"]');
        try { startDateInput.value = productionData.start_date ? new Date(productionData.start_date).toISOString().split('T')[0] : ''; startDateInput.disabled = true; } catch (e) { console.error("Error parsing start date:", e); }
        try { endDateInput.value = productionData.end_date ? new Date(productionData.end_date).toISOString().split('T')[0] : ''; } catch (e) { console.error("Error parsing end date:", e); }

        // Populate Selects
        try {
            const dropdownsResponse = await fetch(`${API_BASE_URL}/integracion/data`);
            const dropdownsResult = await dropdownsResponse.json();
            if (!dropdownsResult.success) throw new Error("Error cargando datos para selects");
            const dropdownData = dropdownsResult.data;

            populateSelectExisting(formElement.querySelector('[data-field="responsible"]'), dropdownData.users || [], productionData.responsible);
            populateSelectExisting(formElement.querySelector('[data-field="cultivation"]'), dropdownData.cultivations || [], productionData.cultivation);
            populateSelectExisting(formElement.querySelector('[data-field="cycle"]'), dropdownData.cycles || [], productionData.cycle);
            populateSelectExisting(formElement.querySelector('[data-field="status"]'), [{id: 'active', name: 'Activo'}, {id: 'inactive', name: 'Inactivo'}], productionData.status);

            const sensorsSelect = formElement.querySelector('[data-field="sensors"]');
            if (sensorsSelect) {
                populateMultiSelect(sensorsSelect, dropdownData.sensors || []);
                 const selectedSensorIds = Array.isArray(productionData.sensors) ? productionData.sensors.map(String) : [];
                 Array.from(sensorsSelect.options).forEach(opt => { opt.selected = selectedSensorIds.includes(String(opt.value)); }); // Use opt.value
            }

             const availableSuppliesSelect = formElement.querySelector('[data-field="available-supplies"]');
             if (availableSuppliesSelect) {
                 availableSuppliesSelect.innerHTML = '<option value="">Seleccione insumo a agregar...</option>';
                 allSuppliesData.forEach(supply => {
                     if (supply && supply.id && supply.nombre_insumo) {
                         const option = document.createElement('option'); option.value = supply.id; option.textContent = supply.nombre_insumo; availableSuppliesSelect.appendChild(option);
                     }
                 });
             }
        } catch (error) { console.error("Error populating selects:", error); showSnackbar("Error al cargar opciones.", "error");}

        // Populate Initial Supplies List for Update
        selectedSuppliesUpdate = []; // Reset before populating
        if (Array.isArray(productionData.supplies) && productionData.supplies.length > 0 && allSuppliesData.length > 0) {
             // NOTE: We don't know the original quantities. This just lists the assigned supplies.
             // The user will need to re-add them with quantities if quantity matters for update logic.
             // Or, the structure needs to change to store quantity per production.
            productionData.supplies.forEach(supplyId => {
                const supplyData = allSuppliesData.find(s => String(s.id) === String(supplyId) || String(s.id_insumo) === String(supplyId));
                if (supplyData) {
                    selectedSuppliesUpdate.push({
                        id: supplyData.id, // Use the PK ID
                        name: supplyData.nombre_insumo,
                        quantity: 1, // Quantity is unknown - defaulting to 1. Consider making this non-editable or displaying differently.
                        unit_value: supplyData.valor_unitario
                    });
                } else {
                     console.warn(`Data for initial supply ID ${supplyId} not found.`);
                     // Add a placeholder if needed
                     selectedSuppliesUpdate.push({ id: supplyId, name: `Insumo ID ${supplyId} (No encontrado)`, quantity: 0, unit_value: 0 });
                }
            });
        }
        renderSelectedSupplies('update'); // Render the initial list
        validateUpdateForm(); // Validate form after populating everything
    }

    // Helper used by populateExistingUpdateForm
    function populateSelectExisting(selectElement, options, selectedValue) {
        if (!selectElement) return;
         selectElement.innerHTML = '<option value="">Seleccione...</option>';
         options.forEach(opt => {
             if (opt && opt.id !== undefined && opt.name !== undefined) {
                 const option = document.createElement('option');
                 option.value = opt.id; option.textContent = opt.name;
                 if (String(opt.id) === String(selectedValue)) option.selected = true;
                 selectElement.appendChild(option);
             }
         });
    }


    // --- Estimation Calculation ---
    function calculateEstimation(context) {
        const form = document.querySelector(`[data-form="${context}"]`);
        if (!form) return;
        const investmentInput = form.querySelector('[data-field="investment"]');
        const goalInput = form.querySelector('[data-field="goal"]');
        if (!investmentInput || !goalInput) return;

        const supplyList = context === 'create' ? selectedSuppliesCreate : selectedSuppliesUpdate;

        if (supplyList.length === 0) { investmentInput.value = ''; goalInput.value = ''; return; }

        let totalInvestment = 0; let possible = true;
        supplyList.forEach(item => {
             const unitValue = parseFloat(item.unit_value);
             if (!isNaN(unitValue) && item.quantity > 0) { totalInvestment += unitValue * item.quantity; }
             else { possible = false; }
         });

         if (possible) {
             investmentInput.value = `$${totalInvestment.toFixed(2)}`;
             const estimatedGoal = totalInvestment * 1.3; // Example goal
             goalInput.value = `$${estimatedGoal.toFixed(2)}`;
         } else {
             investmentInput.value = 'N/A'; goalInput.value = 'N/A';
         }
    }
    function clearEstimation(context) {
         const form = document.querySelector(`[data-form="${context}"]`);
         if (!form) return;
         const investmentInput = form.querySelector('[data-field="investment"]'); if(investmentInput) investmentInput.value='';
         const goalInput = form.querySelector('[data-field="goal"]'); if(goalInput) goalInput.value='';
    }
     // Guardar como borrador (simulado)
     function saveAsDraft() {
         showSnackbar('Borrador guardado exitosamente (simulado)');
         // Implement actual saving to localStorage if needed
     }


    // --- List Loading and Navigation ---
    async function loadProductionsList() {
        const listSection = document.querySelector('[data-panel="list"]');
        if (!listSection) return;
        const tableBody = listSection.querySelector('[data-list="productions"]');
        const paginationInfo = listSection.querySelector('[data-info="page"]');
        const prevButton = listSection.querySelector('[data-action="prev-page"]');
        const nextButton = listSection.querySelector('[data-action="next-page"]');
        if (!tableBody || !paginationInfo || !prevButton || !nextButton) return;

        const searchTerm = listSection.querySelector('[data-field="search"]')?.value?.toLowerCase() || '';
        const filterStatus = listSection.querySelector('[data-field="filter-status"]')?.value || 'all';

        tableBody.innerHTML = '<tr><td colspan="6" class="dashboard__table-cell dashboard__table-cell--loading">Cargando producciones...</td></tr>';
        paginationInfo.textContent = 'Página - de -'; paginationInfo.dataset.totalPages = '1';
        prevButton.disabled = true; nextButton.disabled = true;

        try {
            const response = await fetch(`${API_BASE_URL}/productions`);
            if (!response.ok) throw new Error(`Error al obtener producciones: ${response.statusText}`);
            const result = await response.json();
            if (!result.success) throw new Error(result.error || 'Error al procesar producciones');
            const allProductions = Array.isArray(result.data) ? result.data : [];

            filteredProductions = allProductions.filter(p =>
                 (filterStatus === 'all' || p.status === filterStatus) &&
                 (!searchTerm || [`prod-${p.id}`, p.name, p.cultivation_name, p.cycle_name, p.responsible_name]
                     .some(field => field && field.toLowerCase().includes(searchTerm)))
            );

            const totalProductions = filteredProductions.length;
            const totalPages = Math.ceil(totalProductions / productionsPerPage) || 1;
            currentPage = Math.max(1, Math.min(currentPage, totalPages));
            const startIndex = (currentPage - 1) * productionsPerPage;
            const paginatedProductions = filteredProductions.slice(startIndex, startIndex + productionsPerPage);

            tableBody.innerHTML = '';
            if (paginatedProductions.length === 0) {
                 tableBody.innerHTML = '<tr><td colspan="6" class="dashboard__table-cell dashboard__table-cell--no-results">No se encontraron producciones.</td></tr>';
            } else {
                paginatedProductions.forEach(p => {
                     const row = document.createElement('tr'); row.className = 'dashboard__table-row';
                     const statusText = p.status === 'active' ? 'Activo' : 'Inactivo'; const statusClass = p.status;
                     const toggleIcon = p.status === 'active' ? 'toggle_on' : 'toggle_off'; const toggleTitle = p.status === 'active' ? 'Deshabilitar' : 'Habilitar';
                     row.innerHTML = `
                         <td class="dashboard__table-cell" data-label="ID">prod-${p.id}</td>
                         <td class="dashboard__table-cell" data-label="Nombre">${p.name||'N/A'}</td>
                         <td class="dashboard__table-cell" data-label="Cultivo">${p.cultivation_name||'N/A'}</td>
                         <td class="dashboard__table-cell" data-label="Ciclo">${p.cycle_name||'N/A'}</td>
                         <td class="dashboard__table-cell" data-label="Estado"><span class="status-badge status-badge--${statusClass}">${statusText}</span></td>
                         <td class="dashboard__table-cell dashboard__table-cell--actions" data-label="Acciones">
                             <button class="dashboard__button dashboard__button--icon action-view" title="Ver Detalles"><i class="material-icons">visibility</i></button>
                             <button class="dashboard__button dashboard__button--icon action-edit" title="Editar"><i class="material-icons">edit</i></button>
                             <button class="dashboard__button dashboard__button--icon action-toggle" title="${toggleTitle}"><i class="material-icons">${toggleIcon}</i></button>
                         </td>`;
                     row.querySelector('.action-view').addEventListener('click', () => navigateToActionTab('view', p.id));
                     row.querySelector('.action-edit').addEventListener('click', () => navigateToActionTab('update', p.id));
                     row.querySelector('.action-toggle').addEventListener('click', () => navigateToActionTab('enable', p.id));
                     tableBody.appendChild(row);
                });
            }
            paginationInfo.textContent = `Página ${currentPage} de ${totalPages}`;
            paginationInfo.dataset.totalPages = totalPages.toString();
            prevButton.disabled = currentPage === 1;
            nextButton.disabled = currentPage === totalPages;
        } catch (error) {
            console.error('Error cargando lista de producciones:', error);
            showSnackbar(`Error al cargar lista: ${error.message}`, 'error');
            tableBody.innerHTML = `<tr><td colspan="6" class="dashboard__table-cell dashboard__table-cell--error">Error al cargar.</td></tr>`;
        }
    }
     // Helper para navegar desde la lista a otra pestaña y buscar
     function navigateToActionTab(tabName, productionId) {
         const targetTab = document.querySelector(`.navigation__tab[data-tab="${tabName}"]`);
         if (targetTab) {
            targetTab.click(); // Cambia a la pestaña deseada
             setTimeout(() => {
                 let inputSelector, formSelector;
                 if (tabName === 'view') { inputSelector = '[data-form="view"] [data-field="production-id"]'; formSelector = '[data-form="view"]'; }
                 else if (tabName === 'update') { inputSelector = '[data-form="search-update"] [data-field="production-id"]'; formSelector = '[data-form="search-update"]'; }
                 else if (tabName === 'enable') { inputSelector = '[data-form="enable"] [data-field="production-id"]'; formSelector = '[data-form="enable"]'; }
                 else { return; }

                 const input = document.querySelector(inputSelector); const form = document.querySelector(formSelector);
                 if (input && form) { input.value = `prod-${productionId}`; form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); }
                 else { console.warn(`Elementos no encontrados para tab ${tabName}`); }
             }, 150);
         } else { console.error(`Tab ${tabName} no encontrada.`); }
     }

    // --- Report Generation (Simulated) ---
     async function generateReport() {
        const form = document.querySelector('[data-form="report"]'); if(!form) return;
        const startDate = form.querySelector('[data-field="start-date"]').value; const endDate = form.querySelector('[data-field="end-date"]').value;
        const format = form.querySelector('input[name="format"]:checked')?.value || 'excel'; const errorSpan = form.querySelector('[data-error="date-range"]');
         if (errorSpan) { errorSpan.textContent=''; errorSpan.style.display='none';}
        if (!startDate || !endDate) { if(errorSpan){ errorSpan.textContent='Seleccione ambas fechas'; errorSpan.style.display='block';} showSnackbar('Seleccione un rango de fechas', 'warning'); return; }
        if (new Date(startDate) > new Date(endDate)) { if(errorSpan){ errorSpan.textContent='Inicio > Fin'; errorSpan.style.display='block';} showSnackbar('Rango de fechas inválido', 'warning'); return; }
        showSnackbar(`Generando reporte ${format.toUpperCase()}...`, 'info');
        try { await new Promise(resolve => setTimeout(resolve, 1500)); showSnackbar(`Reporte ${format.toUpperCase()} generado (simulado)`); form.reset(); }
        catch (error) { showSnackbar('Error al generar reporte', 'error'); }
    }

    // --- Utility Functions ---
    function formatDate(dateString) {
         if (!dateString || dateString === '0000-00-00' || dateString.startsWith('0001-')) return 'No definida';
         try { const date = new Date(dateString + 'T00:00:00Z'); if (isNaN(date.getTime())) return 'Fecha inválida';
              const options = { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }; return date.toLocaleDateString('es-ES', options); }
         catch(e) { return 'Fecha inválida'; }
    }
    let snackbarTimeoutId = null;
    function showSnackbar(message, type = 'success') {
        const snackbar = document.querySelector('[data-snackbar]'); const messageElement = snackbar?.querySelector('[data-snackbar-message]'); const closeButton = snackbar?.querySelector('[data-action="close-snackbar"]');
        if (!snackbar || !messageElement) return;
        if (snackbarTimeoutId) clearTimeout(snackbarTimeoutId); messageElement.textContent = message;
        const typeClasses = { success: 'snackbar--success', error: 'snackbar--error', warning: 'snackbar--warning', info: 'snackbar--info' };
        snackbar.className = 'snackbar'; // Reset classes first
        snackbar.classList.add(typeClasses[type] || typeClasses['info'], 'snackbar--visible');
        const hideSnackbar = () => snackbar.classList.remove('snackbar--visible');
         if (closeButton) { const newBtn = closeButton.cloneNode(true); closeButton.parentNode.replaceChild(newBtn, closeButton); newBtn.addEventListener('click', hideSnackbar); }
        snackbarTimeoutId = setTimeout(hideSnackbar, 5000);
    }
    function resetForms() {
        document.querySelectorAll('form').forEach(form => {
             form.reset(); form.querySelectorAll('.dashboard__error').forEach(span => { span.textContent=''; span.style.display='none';});
             if (form.getAttribute('data-form') === 'create') {
                 selectedSuppliesCreate = []; renderSelectedSupplies('create'); clearEstimation('create');
                 const createBtn = form.querySelector('[data-action="create"]'); if(createBtn) createBtn.disabled = true;
             } else if (form.getAttribute('data-form') === 'update') {
                 form.innerHTML = ''; selectedSuppliesUpdate = []; form.classList.add('dashboard__form--hidden');
             }
        });
         document.querySelectorAll('.dashboard__result').forEach(el => el.classList.add('dashboard__result--hidden'));
         document.querySelectorAll('[data-field="production-id"]:not([readonly])').forEach(input => input.value = '');
         setInitialProductionId();
         currentProductionId = null;
         // Clear sessionStorage just in case
         sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }
     // General Setup Navigation (Tabs)
     function setupNavigation() {
         const tabs = document.querySelectorAll('.navigation__tab');
         const sections = document.querySelectorAll('.dashboard__section');
         tabs.forEach(tab => {
             tab.addEventListener('click', function() {
                 const tabName = this.getAttribute('data-tab');
                 tabs.forEach(t => t.classList.remove('navigation__tab--active'));
                 this.classList.add('navigation__tab--active');
                 sections.forEach(section => {
                     section.classList.remove('dashboard__section--active');
                     if (section.getAttribute('data-panel') === tabName) {
                         section.classList.add('dashboard__section--active');
                     }
                 });
                  // Optionally reset forms when changing tabs (except maybe create?)
                  // resetForms(); // Uncomment or modify if needed
                  if (tabName === 'list') loadProductionsList(); // Refresh list when clicking tab
             });
         });
     }

    // --- Run Initialization ---
    init();
});