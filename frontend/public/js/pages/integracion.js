// integracion.js

document.addEventListener('DOMContentLoaded', function() {
    // --- Global Variables ---
    let currentProductionId = null; // ID of production being viewed/updated/toggled
    let currentPage = 1;
    const productionsPerPage = 5; // Items per page in the list view
    let allSuppliesData = []; // Holds full data for all supplies {id, name, value, ...}
    let allSensorsData = []; // Holds full data for all sensors
    let selectedSuppliesCreate = []; // Supplies selected in the CREATE form {id, name, quantity, unit_value}
    let selectedSensorsCreate = []; // Sensors selected in the CREATE form {id, name, quantity}
    let selectedSuppliesUpdate = []; // Supplies selected in the UPDATE form {id, name, quantity, unit_value}
    let selectedSensorsUpdate = []; // Sensors selected in the UPDATE form {id, name, quantity}
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
        await populateDropdownsAndSensorData(); // Fetch dropdown data and all sensors/supplies
        await restoreCreateFormState(); // Try restoring state AFTER dropdowns are populated
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

        // Get selected sensors from the new structure
        // We save the selectedSensorsCreate array directly

        return {
            name: form.querySelector('[data-field="name"]')?.value || '',
            responsible: form.querySelector('[data-field="responsible"]')?.value || '',
            cultivation: form.querySelector('[data-field="cultivation"]')?.value || '',
            cycle: form.querySelector('[data-field="cycle"]')?.value || '',
            // sensors field is handled by selectedSensorsCreate
            startDate: form.querySelector('[data-field="start-date"]')?.value || '',
            endDate: form.querySelector('[data-field="end-date"]')?.value || '',
            selectedSupplies: selectedSuppliesCreate,
            selectedSensors: selectedSensorsCreate // Save the selected sensors array
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

            // Repopulate selected supplies list
            if (Array.isArray(formData.selectedSupplies)) {
                selectedSuppliesCreate = formData.selectedSupplies;
                renderSelectedSupplies('create'); // Render the restored list for CREATE form
                console.log("Selected supplies restored.");
            }

             // Repopulate selected sensors list
            if (Array.isArray(formData.selectedSensors)) {
                selectedSensorsCreate = formData.selectedSensors;
                renderSelectedSensors('create'); // Use new render function
                console.log("Selected sensors restored.");
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
        if (!prodIdInput) return; // Ensure the input exists

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

    // --- Dropdown & Data Population ---
    async function populateDropdownsAndSensorData() { // Renamed
        try {
            const integrationDataResponse = await fetch(`${API_BASE_URL}/integracion/data`);
            if (!integrationDataResponse.ok) throw new Error('Error al obtener datos de integración');
            const integrationDataResult = await integrationDataResponse.json();
             if (!integrationDataResult.success) throw new Error(integrationDataResult.error || 'Error en datos de integración');
             const data = integrationDataResult.data;

             // Populate standard selects (Users, Cultivations, Cycles, Status)
             document.querySelectorAll('[data-field="responsible"]').forEach(select => populateSelect(select, data.users || [], "Seleccione un responsable"));
             document.querySelectorAll('[data-field="cultivation"]').forEach(select => populateSelect(select, data.cultivations || [], "Seleccione un cultivo"));
             document.querySelectorAll('[data-field="cycle"]').forEach(select => populateSelect(select, data.cycles || [], "Seleccione un ciclo"));
             document.querySelectorAll('[data-field="status"]').forEach(select => populateSelect(select, [{id: 'active', name: 'Activo'}, {id: 'inactive', name: 'Inactivo'}], "Seleccione estado"));

             // Fetch and store ALL sensor data
             const sensorsResponse = await fetch(`http://localhost:3000/sensor/s`); // Use the correct endpoint for sensors
             if (!sensorsResponse.ok) throw new Error(`Error al obtener lista de sensores: ${sensorsResponse.statusText}`);
             const sensorsResult = await sensorsResponse.json();
              // Adjust based on the actual structure returned by /sensor/s
             allSensorsData = sensorsResult.success ? sensorsResult.data : (Array.isArray(sensorsResult) ? sensorsResult : []);
             if (!Array.isArray(allSensorsData)) {
                  allSensorsData = [];
                  console.warn('Formato inesperado de datos de sensores:', sensorsResult);
                  throw new Error('Formato inesperado de datos de sensores detallados');
             }

             // Populate the AVAILABLE sensor dropdown (single select) in Create and Update forms
             document.querySelectorAll('[data-field="available-sensors"]').forEach(select => {
                populateSelect(select, allSensorsData || [], "Seleccione un sensor");
             });

             // Fetch and store ALL supply data
             const suppliesResponse = await fetch(`http://localhost:3000/api/insumos`);
             if (!suppliesResponse.ok) throw new Error(`Error al obtener lista de insumos: ${suppliesResponse.statusText}`);
             const suppliesResult = await suppliesResponse.json();
             allSuppliesData = suppliesResult.success ? suppliesResult.data : (Array.isArray(suppliesResult) ? suppliesResult : []);
             if (!Array.isArray(allSuppliesData)) {
                  allSuppliesData = [];
                  console.warn('Formato inesperado de datos de insumos:', suppliesResult);
                  throw new Error('Formato inesperado de datos de insumos detallados');
             }

             // Populate the AVAILABLE supply dropdown (single select)
             document.querySelectorAll('[data-field="available-supplies"]').forEach(select => {
                populateSelect(select, allSuppliesData || [], "Seleccione un insumo para agregar");
             });

         } catch (error) {
             console.error('Error al poblar datos:', error);
             showSnackbar(`Error al cargar datos iniciales: ${error.message || 'Error desconocido'}`, 'error');
         }
    }

    // Helper for populating selects
    function populateSelect(selectElement, options, defaultOptionText) {
        if (!selectElement) return;
        selectElement.innerHTML = `<option value="">${defaultOptionText}</option>`;
        options.forEach(opt => {
            // Adjust property names based on data source (user, cultivation, cycle, sensor, supply)
             const id = opt.id || opt.id_cultivo || opt.id_ciclo || opt.id_insumo || opt.id_sensor; // Use sensor id too
             const name = opt.name || opt.nombre_cultivo || opt.nombre_ciclo || opt.nombre_insumo || opt.nombre_sensor; // Use sensor name too

             if (id !== undefined && name !== undefined) {
                 const option = document.createElement('option');
                 option.value = id;
                 option.textContent = name;
                 selectElement.appendChild(option);
             } else {
                 console.warn("Opción inválida para select:", opt);
             }
        });
    }

    // REMOVE populateMultiSelect as it's no longer used for sensors


    // --- Form Setups ---
    function setupCreateForm() {
        const form = document.querySelector('[data-form="create"]');
        if (!form) return;

        form.querySelector('[data-action="cancel"]')?.addEventListener('click', resetForms);
        form.querySelector('[data-action="save-draft"]')?.addEventListener('click', saveAsDraft);
        form.addEventListener('submit', async (e) => { e.preventDefault(); await createProduction(); });

        // Listeners for validation
        form.querySelectorAll('[required]').forEach(input => input.addEventListener('change', validateCreateForm));

        // Add listener for new "Agregar Sensor" button
        form.querySelector('[data-action="add-selected-sensor"]')?.addEventListener('click', () => addSelectedSensorToList('create'));

        // Add listener for "Agregar Insumo" button
        form.querySelector('[data-action="add-selected-supply"]')?.addEventListener('click', () => addSelectedSupplyToList('create'));

        // Delegate event listener for removing sensors/supplies in the create form
        const selectedListsContainer = form; // Attach listener to the form itself or a container div
        selectedListsContainer.addEventListener('click', (e) => {
            if (e.target.matches('.dashboard__button--remove-sensor')) {
                const sensorId = e.target.getAttribute('data-sensor-id');
                if (sensorId) removeSelectedSensor(sensorId, 'create');
            } else if (e.target.matches('.dashboard__button--remove-supply')) {
                const supplyId = e.target.getAttribute('data-supply-id');
                if (supplyId) removeSelectedSupply(supplyId, 'create');
            }
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
                await populateExistingUpdateForm(updateFormEl, result.data); // This function needs modification
                updateFormEl.classList.remove('dashboard__form--hidden');
                showSnackbar("Datos cargados. Puede actualizar.", "success");
            } catch (error) {
                console.error('Error buscando para actualizar:', error);
                showSnackbar(error.message, 'error');
                if (errorSpan) { errorSpan.textContent = error.message; errorSpan.style.display = 'block'; }
                updateFormEl.classList.add('dashboard__form--hidden');
            }
        });

        // Delegate event listeners for buttons INSIDE the dynamic update form
        updateFormEl.addEventListener('click', (e) => {
             if (e.target.matches('[data-action="cancel-update"]')) {
                 updateFormEl.classList.add('dashboard__form--hidden');
                 updateFormEl.innerHTML = '';
                 selectedSuppliesUpdate = [];
                 selectedSensorsUpdate = []; // Clear update sensors
                 currentProductionId = null;
             } else if (e.target.matches('[data-action="add-selected-supply-update"]')) {
                 addSelectedSupplyToList('update');
             } else if (e.target.matches('[data-action="add-selected-sensor-update"]')) { // Add listener for adding sensor in update
                 addSelectedSensorToList('update');
             } else if (e.target.matches('.dashboard__button--remove-supply')) {
                 const supplyId = e.target.getAttribute('data-supply-id');
                 if (supplyId) removeSelectedSupply(supplyId, 'update');
             } else if (e.target.matches('.dashboard__button--remove-sensor')) { // Add listener for removing sensor in update
                 const sensorId = e.target.getAttribute('data-sensor-id');
                 if (sensorId) removeSelectedSensor(sensorId, 'update');
             }
        });

        updateFormEl.addEventListener('submit', async function(e) {
            e.preventDefault();
            await updateProduction();
        });

         // Modify validation listeners for update form
         updateFormEl.addEventListener('change', (e) => {
             // Validate on change for selects and potentially number inputs
             if (e.target.matches('select[required], input[type="number"], input[type="date"]')) {
                 validateUpdateForm();
             }
         });
         updateFormEl.addEventListener('input', (e) => {
             // Validate on input for text fields
             if (e.target.matches('input[required]:not([type="number"]):not([type="date"])')) {
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

    // --- Sensor Management Functions ---

    /**
     * Adds a selected sensor to the list for either Create or Update form.
     * @param {'create' | 'update'} context - Specifies which form's list to update.
     */
    function addSelectedSensorToList(context) {
        const form = document.querySelector(`[data-form="${context}"]`);
        if (!form) return;
        const sensorSelect = form.querySelector('[data-field="available-sensors"]');
        const quantityInput = form.querySelector('[data-field="sensor-quantity"]');
        const errorSpan = form.querySelector('[data-error="sensors"]'); // Use the correct error span

        const sensorId = sensorSelect?.value;
        const quantity = parseInt(quantityInput?.value);

        if (!sensorId) { showSnackbar('Seleccione un sensor', 'warning'); return; }
        if (isNaN(quantity) || quantity < 1 || quantity > 3) { showSnackbar('Ingrese una cantidad válida (1-3)', 'warning'); return; }

        const targetSensorList = context === 'create' ? selectedSensorsCreate : selectedSensorsUpdate;

        // Check if max sensors reached
        if (targetSensorList.length >= 3) {
            showSnackbar('Solo puede agregar un máximo de 3 sensores.', 'warning');
            if (errorSpan) { errorSpan.textContent = 'Máximo 3 sensores'; errorSpan.style.display = 'block'; }
            return;
        }

        // Check if sensor already added
        if (targetSensorList.some(item => item.id == sensorId)) {
            showSnackbar('Sensor ya agregado', 'warning');
            return;
        }

        // Find sensor data to get the name
        if (!Array.isArray(allSensorsData) || allSensorsData.length === 0) {
             showSnackbar('Error: Lista de sensores no cargada', 'error'); return;
        }
        const sensorData = allSensorsData.find(s => s.id == sensorId || s.id_sensor == sensorId); // Check both possible ID fields
        if (!sensorData || !sensorData.nombre_sensor) { // Adjust property name if needed
             showSnackbar('Error: Datos del sensor no encontrados', 'error'); return;
        }

        targetSensorList.push({
            id: sensorData.id || sensorData.id_sensor, // Use the actual ID
            name: sensorData.nombre_sensor, // Adjust property name if needed
            quantity: quantity
        });

        renderSelectedSensors(context); // Use new render function
        if (sensorSelect) sensorSelect.value = "";
        if (quantityInput) quantityInput.value = "1"; // Reset quantity to 1
        if (errorSpan) errorSpan.style.display = 'none';

        if (context === 'create') validateCreateForm();
        else if (context === 'update') validateUpdateForm();
    }

     /**
     * Removes a sensor from the list for either Create or Update form.
     * @param {string} sensorIdToRemove - The ID of the sensor to remove.
     * @param {'create' | 'update'} context - Specifies which form's list to update.
     */
    function removeSelectedSensor(sensorIdToRemove, context) {
        if (context === 'create') {
            selectedSensorsCreate = selectedSensorsCreate.filter(item => item.id != sensorIdToRemove);
            renderSelectedSensors('create');
            validateCreateForm(); // Re-validate after removing
        } else if (context === 'update') {
            selectedSensorsUpdate = selectedSensorsUpdate.filter(item => item.id != sensorIdToRemove);
            renderSelectedSensors('update');
            validateUpdateForm(); // Re-validate after removing
        }
    }

    /**
     * Renders the list of selected sensors in the UI for the specified form.
     * @param {'create' | 'update'} context - Specifies which form's list area to update.
     */
    function renderSelectedSensors(context) {
        const container = document.querySelector(`[data-form="${context}"] [data-list="selected-sensors"]`);
        if (!container) {
            console.error(`Contenedor [data-list="selected-sensors"] no encontrado para contexto: ${context}`);
            return;
        }
        container.innerHTML = ''; // Clear previous content

        const sensorList = context === 'create' ? selectedSensorsCreate : selectedSensorsUpdate;
        const errorSpan = document.querySelector(`[data-form="${context}"] [data-error="sensors"]`);

        if (sensorList.length === 0) {
            container.innerHTML = '<p>No hay sensores agregados.</p>';
             if (errorSpan && context === 'create') { // Show required error only on create if empty
                errorSpan.textContent = 'Debe agregar al menos un sensor (máx. 3)';
                errorSpan.style.display = 'block';
            }
        } else {
            const list = document.createElement('ul');
            list.className = 'dashboard__items-list dashboard__sensors-list-items'; // Use a general class + specific
            sensorList.forEach(item => {
                const listItem = document.createElement('li');
                listItem.className = 'dashboard__selected-item';
                const itemId = item.id || `unknown-${Math.random()}`; // Fallback ID
                listItem.innerHTML = `
                    <span>${item.name || 'Sensor Desconocido'} (Cantidad: ${item.quantity})</span>
                    <button type="button" class="dashboard__button--remove-item dashboard__button--remove-sensor" data-sensor-id="${itemId}" title="Eliminar Sensor">&times;</button>
                `;
                list.appendChild(listItem);
            });
            container.appendChild(list);
             if (errorSpan) errorSpan.style.display = 'none'; // Hide error if list is not empty
        }

        // Disable add button if max is reached
        const addButton = document.querySelector(`[data-form="${context}"] [data-action="add-selected-sensor"]`);
        if (addButton) {
            addButton.disabled = sensorList.length >= 3;
        }
         // Also potentially disable quantity input or sensor select if max reached
         const sensorSelect = document.querySelector(`[data-form="${context}"] [data-field="available-sensors"]`);
         const quantityInput = document.querySelector(`[data-form="${context}"] [data-field="sensor-quantity"]`);
         if (sensorSelect) sensorSelect.disabled = sensorList.length >= 3;
         if (quantityInput) quantityInput.disabled = sensorList.length >= 3;
    }

    // --- Supply Management Functions ---
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
            id: supplyData.id,
            name: supplyData.nombre_insumo,
            quantity: quantity,
            unit_value: supplyData.valor_unitario
        });

        renderSelectedSupplies(context); // Make sure this function exists and works
        if (supplySelect) supplySelect.value = "";
        if (quantityInput) quantityInput.value = "";
        if (errorSpan) errorSpan.style.display = 'none';

        if (context === 'create') validateCreateForm();
        else if (context === 'update') validateUpdateForm();
    }

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

    function renderSelectedSupplies(context) {
        const container = document.querySelector(`[data-form="${context}"] [data-list="selected-supplies"]`);
        if (!container) return;
        container.innerHTML = '';

        const supplyList = context === 'create' ? selectedSuppliesCreate : selectedSuppliesUpdate;
        const errorSpan = document.querySelector(`[data-form="${context}"] [data-error="supplies"]`);

        if (supplyList.length === 0) {
            container.innerHTML = '<p>No hay insumos agregados.</p>';
             if (errorSpan && context === 'create') { // Show error only on create if required
                errorSpan.textContent = 'Debe agregar al menos un insumo';
                errorSpan.style.display = 'block';
            }
        } else {
            const list = document.createElement('ul');
            list.className = 'dashboard__items-list dashboard__supplies-list-items';
            supplyList.forEach(item => {
                const listItem = document.createElement('li');
                listItem.className = 'dashboard__selected-item';
                const itemId = item.id || `unknown-${Math.random()}`;
                listItem.innerHTML = `
                    <span>${item.name || 'N/A'} (Cantidad: ${item.quantity})</span>
                    <button type="button" class="dashboard__button--remove-item dashboard__button--remove-supply" data-supply-id="${itemId}" title="Eliminar Insumo">&times;</button>
                `;
                list.appendChild(listItem);
            });
            container.appendChild(list);
            if (errorSpan) errorSpan.style.display = 'none';
        }
         calculateEstimation(context); // Update estimation when supplies change
    }


    // --- CRUD Operations ---

    async function createProduction() {
        if (!validateCreateForm()) { // Validation now includes sensor check
             showSnackbar("Formulario inválido. Revise los campos marcados.", "warning"); return;
        }
        const form = document.querySelector('[data-form="create"]');
        const supplyIdsForApi = selectedSuppliesCreate.map(item => item.id);
        const sensorIdsForApi = selectedSensorsCreate.map(item => item.id); // Get sensor IDs

        const newProduction = {
            name: form.querySelector('[data-field="name"]').value,
            responsible: form.querySelector('[data-field="responsible"]').value,
            cultivation: form.querySelector('[data-field="cultivation"]').value,
            cycle: form.querySelector('[data-field="cycle"]').value,
            sensors: sensorIdsForApi, // Send sensor IDs
            supplies: supplyIdsForApi,
            startDate: form.querySelector('[data-field="start-date"]').value,
            endDate: form.querySelector('[data-field="end-date"]').value
        };
         try {
            const response = await fetch(`${API_BASE_URL}/productions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newProduction) });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.error || `Error HTTP ${response.status}`);
            showSnackbar(`Producción creada: ${result.displayId || result.id}`);
            resetForms(); // Resets create form, clears selected arrays, regenerates ID
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

            // Basic Info
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

            // Simulated Metrics and Charts
             updateSimulatedMetrics(resultSection);
             createAllCharts(resultSection, generateSensorData());

            // Display Sensors (using the new function)
             const sensorsContainerView = resultSection.querySelector('[data-info="sensors"]');
             if (sensorsContainerView) { await displayProductionSensorsView(sensorsContainerView, production.sensors || []); }
             else { console.warn("Contenedor [data-info='sensors'] no encontrado en la vista."); }


            // Display Supplies
             const suppliesContainerView = resultSection.querySelector('[data-info="supplies"]');
             if (suppliesContainerView) { await displayProductionSuppliesView(suppliesContainerView, production.supplies || []); }
             else { console.warn("Contenedor [data-info='supplies'] no encontrado en la vista."); }

            resultSection.classList.remove('dashboard__result--hidden');

        } catch (error) {
            console.error('Error al visualizar producción:', error);
            showSnackbar(`Error al visualizar: ${error.message}`, 'error');
            resultSection.classList.add('dashboard__result--hidden');
        }
    }

    async function updateProduction() {
        if (!validateUpdateForm()) { // Validation now includes sensor check
             showSnackbar("Formulario de actualización inválido.", "warning"); return;
        }
        const form = document.querySelector('[data-form="update"]');
        if (!form || !currentProductionId) {
            showSnackbar("No se ha seleccionado una producción para actualizar.", "error"); return;
        }

        const supplyIdsForApi = selectedSuppliesUpdate.map(item => item.id);
        const sensorIdsForApi = selectedSensorsUpdate.map(item => item.id); // Get sensor IDs for update

        const updatedData = {
            name: form.querySelector('[data-field="name"]').value,
            responsible: form.querySelector('[data-field="responsible"]').value,
            cultivation: form.querySelector('[data-field="cultivation"]').value,
            cycle: form.querySelector('[data-field="cycle"]').value,
            sensors: sensorIdsForApi, // Send updated sensor IDs
            supplies: supplyIdsForApi,
            end_date: form.querySelector('[data-field="end-date"]').value,
            status: form.querySelector('[data-field="status"]').value
        };
        try {
            showSnackbar("Actualizando...", "info");
            const response = await fetch(`${API_BASE_URL}/productions/${currentProductionId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatedData) });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.error || `Error HTTP ${response.status}`);
            showSnackbar('Producción actualizada exitosamente');
            form.classList.add('dashboard__form--hidden');
            form.innerHTML = '';
            selectedSuppliesUpdate = [];
            selectedSensorsUpdate = []; // Clear sensors update list
            currentProductionId = null;
            await loadProductionsList();
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
             ...currentProductionData, // Start with current data
             status: newStatus, // Change status
             // Ensure correct format for arrays/dates if sending full object
             sensors: Array.isArray(currentProductionData.sensors) ? currentProductionData.sensors : [], // Send as array
             supplies: Array.isArray(currentProductionData.supplies) ? currentProductionData.supplies : [], // Send as array
             start_date: undefined, // Do NOT send start_date for status toggle
             end_date: currentProductionData.end_date ? new Date(currentProductionData.end_date).toISOString().split('T')[0] : undefined,
             // Remove fields not in DB table or that shouldn't be sent
             responsible_name: undefined, cultivation_name: undefined, cycle_name: undefined, created_at: undefined, updated_at: undefined,
             id_ciclo: undefined, id_cultivo: undefined, id_insumo: undefined, id_sensor: undefined, nombre_ciclo: undefined, nombre_cultivo: undefined, nombre_insumo: undefined, nombre_sensor: undefined
             // Add any other fields that are part of the object but not in the 'productions' table
         };
         // Explicitly remove start_date if it was included by spread
         delete updatePayload.start_date;

         // Clean up undefined keys before sending
         Object.keys(updatePayload).forEach(key => updatePayload[key] === undefined && delete updatePayload[key]);

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

              if (input.type === 'date') {
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

        // Validate NEW sensors (at least 1, max 3)
        const sensorErrorElement = form.querySelector('[data-error="sensors"]');
        if (selectedSensorsCreate.length === 0) {
             if (sensorErrorElement) { sensorErrorElement.textContent = 'Debe agregar al menos un sensor (máx. 3)'; sensorErrorElement.style.display = 'block'; }
             isValid = false;
        } else if (selectedSensorsCreate.length > 3) {
             if (sensorErrorElement) { sensorErrorElement.textContent = 'Solo puede agregar un máximo de 3 sensores.'; sensorErrorElement.style.display = 'block'; }
             isValid = false;
        } else {
             if (sensorErrorElement) { sensorErrorElement.style.display = 'none'; }
        }

        // Validate supplies (at least 1)
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

             if (input.type === 'date') {
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

        // Validate NEW sensors for update form (at least 1, max 3)
        const sensorErrorElement = form.querySelector('[data-error="sensors"]');
        if (selectedSensorsUpdate.length === 0) {
            if (sensorErrorElement) { sensorErrorElement.textContent = 'Debe agregar al menos un sensor (máx. 3)'; sensorErrorElement.style.display = 'block'; }
            isValid = false;
        } else if (selectedSensorsUpdate.length > 3) {
            if (sensorErrorElement) { sensorErrorElement.textContent = 'Solo puede agregar un máximo de 3 sensores.'; sensorErrorElement.style.display = 'block'; }
            isValid = false;
        } else {
            if (sensorErrorElement) { sensorErrorElement.style.display = 'none'; }
        }


        // Validate supplies for update form (at least 1)
        const supplyErrorElement = form.querySelector('[data-error="supplies"]');
        if (selectedSuppliesUpdate.length === 0) {
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


    // --- Populate Update Form ---
    async function populateExistingUpdateForm(formElement, productionData) {
        formElement.innerHTML = ''; // Clear previous content
        selectedSuppliesUpdate = [];
        selectedSensorsUpdate = []; // Clear sensors update list

        // Dynamically create the form structure, including the NEW sensor section
        formElement.innerHTML = `
            <div class="dashboard__form-group"> <label class="dashboard__label">ID Producción</label> <input class="dashboard__input" type="text" value="prod-${productionData.id}" readonly> </div>
            <div class="dashboard__form-group"> <label class="dashboard__label">Nombre</label> <input class="dashboard__input" type="text" data-field="name" required> <span class="dashboard__error" data-error="name"></span> </div>
            <div class="dashboard__form-group"> <label class="dashboard__label">Responsable</label> <select class="dashboard__select" data-field="responsible" required></select> <span class="dashboard__error" data-error="responsible"></span> </div>
            <div class="dashboard__form-group"> <label class="dashboard__label">Cultivo</label> <select class="dashboard__select" data-field="cultivation" required></select> <span class="dashboard__error" data-error="cultivation"></span> </div>
            <div class="dashboard__form-group"> <label class="dashboard__label">Ciclo</label> <select class="dashboard__select" data-field="cycle" required></select> <span class="dashboard__error" data-error="cycle"></span> </div>

            <div class="dashboard__form-group dashboard__form-group--full-width">
                <label class="dashboard__label">Sensores</label>
                <div class="dashboard__sensor-selection">
                    <div class="dashboard__sensor-add-area">
                        <select class="dashboard__select" data-field="available-sensors" title="Seleccione un sensor disponible">
                            <option value="">Seleccione un sensor</option>
                        </select>
                        <input type="number" class="dashboard__input" data-field="sensor-quantity" placeholder="Cant." min="1" max="3" value="1" title="Ingrese la cantidad (1-3)">
                        <button class="dashboard__button dashboard__button--primary" type="button" data-action="add-selected-sensor-update" title="Agregar el sensor seleccionado">Agregar</button>
                    </div>
                </div>
                 <label class="dashboard__label" style="margin-top: 1rem;">Sensores Seleccionados (Máx. 3):</label>
                 <div class="dashboard__selected-items-list" data-list="selected-sensors">
                     <p>Cargando sensores asignados...</p>
                 </div>
                 <span class="dashboard__error" data-error="sensors"></span>
            </div>

             <div class="dashboard__form-group dashboard__form-group--full-width">
                <label class="dashboard__label">Insumos Asignados</label>
                <div class="dashboard__supply-add-area">
                    <select class="dashboard__select" data-field="available-supplies"> <option value="">Seleccione insumo a agregar...</option> </select>
                    <input type="number" class="dashboard__input" placeholder="Cantidad" min="1" data-field="supply-quantity">
                    <button class="dashboard__button dashboard__button--primary" type="button" data-action="add-selected-supply-update">Agregar</button>
                </div>
                <div class="dashboard__selected-items-list" data-list="selected-supplies"> <p>Cargando insumos asignados...</p> </div>
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

        // Populate standard fields (name, dates)
        formElement.querySelector('[data-field="name"]').value = productionData.name || '';
        const startDateInput = formElement.querySelector('[data-field="start-date"]');
        const endDateInput = formElement.querySelector('[data-field="end-date"]');
        try { startDateInput.value = productionData.start_date ? new Date(productionData.start_date).toISOString().split('T')[0] : ''; startDateInput.disabled = true; } catch (e) { console.error("Error parsing start date:", e); }
        try { endDateInput.value = productionData.end_date ? new Date(productionData.end_date).toISOString().split('T')[0] : ''; } catch (e) { console.error("Error parsing end date:", e); }

        // Populate Selects (Responsible, Cultivation, Cycle, Status, Available Sensors, Available Supplies)
        try {
            const dropdownsResponse = await fetch(`${API_BASE_URL}/integracion/data`); // Fetch common dropdown data
            const dropdownsResult = await dropdownsResponse.json();
            if (!dropdownsResult.success) throw new Error("Error cargando datos para selects");
            const dropdownData = dropdownsResult.data;

            populateSelectExisting(formElement.querySelector('[data-field="responsible"]'), dropdownData.users || [], productionData.responsible);
            populateSelectExisting(formElement.querySelector('[data-field="cultivation"]'), dropdownData.cultivations || [], productionData.cultivation);
            populateSelectExisting(formElement.querySelector('[data-field="cycle"]'), dropdownData.cycles || [], productionData.cycle);
            populateSelectExisting(formElement.querySelector('[data-field="status"]'), [{id: 'active', name: 'Activo'}, {id: 'inactive', name: 'Inactivo'}], productionData.status);

            // Populate AVAILABLE sensors dropdown
            const availableSensorsSelect = formElement.querySelector('[data-field="available-sensors"]');
            if (availableSensorsSelect) {
                 populateSelect(availableSensorsSelect, allSensorsData || [], "Seleccione un sensor"); // Use global allSensorsData
             }

             // Populate AVAILABLE supplies dropdown
             const availableSuppliesSelect = formElement.querySelector('[data-field="available-supplies"]');
             if (availableSuppliesSelect) {
                 populateSelect(availableSuppliesSelect, allSuppliesData || [], "Seleccione insumo a agregar...");
             }
        } catch (error) { console.error("Error populating selects:", error); showSnackbar("Error al cargar opciones.", "error");}

        // Populate Initial SENSORS List for Update
        selectedSensorsUpdate = []; // Reset before populating
        const initialSensorIds = Array.isArray(productionData.sensors) ? productionData.sensors.map(String) : [];
        if (initialSensorIds.length > 0 && allSensorsData.length > 0) {
            initialSensorIds.forEach(sensorId => {
                const sensorData = allSensorsData.find(s => String(s.id) === sensorId || String(s.id_sensor) === sensorId);
                if (sensorData) {
                    selectedSensorsUpdate.push({
                        id: sensorData.id || sensorData.id_sensor,
                        name: sensorData.nombre_sensor || `Sensor ID ${sensorId}`,
                        quantity: 1 // Default quantity to 1 as it's not stored
                    });
                } else {
                     console.warn(`Data for initial sensor ID ${sensorId} not found.`);
                     selectedSensorsUpdate.push({ id: sensorId, name: `Sensor ID ${sensorId} (No encontrado)`, quantity: 1 });
                }
            });
        }
        renderSelectedSensors('update'); // Render the initial sensor list for update

        // Populate Initial Supplies List for Update (remains similar)
        selectedSuppliesUpdate = [];
        const initialSupplyIds = Array.isArray(productionData.supplies) ? productionData.supplies.map(String) : [];
        if (initialSupplyIds.length > 0 && allSuppliesData.length > 0) {
            initialSupplyIds.forEach(supplyId => {
                const supplyData = allSuppliesData.find(s => String(s.id) === supplyId || String(s.id_insumo) === supplyId);
                if (supplyData) {
                    selectedSuppliesUpdate.push({
                        id: supplyData.id,
                        name: supplyData.nombre_insumo,
                        quantity: 1, // Default quantity
                        unit_value: supplyData.valor_unitario
                    });
                } else {
                     console.warn(`Data for initial supply ID ${supplyId} not found.`);
                     selectedSuppliesUpdate.push({ id: supplyId, name: `Insumo ID ${supplyId} (No encontrado)`, quantity: 0, unit_value: 0 });
                }
            });
        }
        renderSelectedSupplies('update');

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


    // --- Helper function to display sensors in the VIEW panel ---
    async function displayProductionSensorsView(container, sensorIds) {
        // Similar logic to displayProductionSuppliesView, but for sensors
        if (!container) return;
        container.innerHTML = '<p>Cargando sensores...</p>';
        const ids = Array.isArray(sensorIds) ? sensorIds.map(String) : [];
        if (ids.length === 0) { container.innerHTML = '<p>No hay sensores asignados.</p>'; return; }

        try {
            // Ensure allSensorsData is loaded
            if (allSensorsData.length === 0) {
                const sensorsResponse = await fetch(`http://localhost:3000/sensor/s`);
                if (!sensorsResponse.ok) throw new Error('Error al cargar lista de sensores para vista');
                const sensorsResult = await sensorsResponse.json();
                allSensorsData = sensorsResult.success ? sensorsResult.data : (Array.isArray(sensorsResult) ? sensorsResult : []);
                if (!Array.isArray(allSensorsData)) throw new Error('Formato inesperado de sensores');
            }

            container.innerHTML = '';
            const list = document.createElement('ul');
            list.className = 'dashboard__items-list dashboard__sensors-list-items dashboard__sensors-list-items--view'; // Add view specific class if needed

            ids.forEach(id => {
                const sensor = allSensorsData.find(s => String(s.id) === id || String(s.id_sensor) === id);
                const li = document.createElement('li');
                li.className = 'dashboard__selected-item';
                if (sensor) {
                    const statusText = sensor.estado ? sensor.estado.toLowerCase() : 'desconocido';
                    const statusColor = (statusText === 'activo' || statusText === 'disponible') ? 'var(--color-success)' : 'var(--color-error)';
                    li.innerHTML = `
                        <i class="material-icons dashboard__sensor-icon">${getSensorIcon(sensor.tipo_sensor)}</i>
                        <span>${sensor.nombre_sensor || 'Sin nombre'}</span>
                        <span style="font-size: 0.9em; color: ${statusColor}; margin-left: auto;">(${statusText})</span>
                    `;
                } else {
                    li.innerHTML = `
                         <i class="material-icons dashboard__sensor-icon">help_outline</i>
                         <span>Sensor ID ${id} (No encontrado)</span>`;
                }
                list.appendChild(li);
            });
            container.appendChild(list);
            if (list.children.length === 0 && ids.length > 0) container.innerHTML = '<p>Detalles de sensores no encontrados.</p>';
        } catch (error) {
            console.error("Error mostrando sensores en vista:", error);
            container.innerHTML = '<p>Error al cargar datos de sensores.</p>';
        }
    }
    // Helper function to display supplies in the VIEW panel
    async function displayProductionSuppliesView(container, supplyIds) {
        if (!container) return;
        container.innerHTML = '<p>Cargando insumos...</p>';
        const ids = Array.isArray(supplyIds) ? supplyIds.map(String) : [];
        if (ids.length === 0) { container.innerHTML = '<p>No hay insumos asignados.</p>'; return; }

        try {
            if (allSuppliesData.length === 0) {
                const suppliesResponse = await fetch(`http://localhost:3000/api/insumos`);
                if (!suppliesResponse.ok) throw new Error('Error al obtener lista de insumos para vista');
                const suppliesResult = await suppliesResponse.json();
                allSuppliesData = suppliesResult.success ? suppliesResult.data : (Array.isArray(suppliesResult) ? suppliesResult : []);
                 if (!Array.isArray(allSuppliesData)) throw new Error('Formato inesperado de insumos');
            }

            container.innerHTML = '';
            const list = document.createElement('ul'); list.className = 'dashboard__items-list dashboard__supplies-list-items dashboard__supplies-list-items--view';
            ids.forEach(id => {
                const supply = allSuppliesData.find(s => String(s.id) === id || String(s.id_insumo) === id);
                const li = document.createElement('li');
                li.className = 'dashboard__selected-item'; // Reuse item style
                li.textContent = supply ? supply.nombre_insumo : `Insumo ID ${id} (No encontrado)`;
                list.appendChild(li);
            });
            container.appendChild(list);
            if (list.children.length === 0 && ids.length > 0) container.innerHTML = '<p>Detalles de insumos no encontrados.</p>';
        } catch (error) {
            console.error("Error mostrando insumos en vista:", error); container.innerHTML = '<p>Error al cargar datos de insumos.</p>';
        }
    }


    // --- Utility Functions ---
    function formatDate(dateInput) {
        if (!dateInput || dateInput === '0000-00-00' || (typeof dateInput === 'string' && dateInput.startsWith('0001-'))) {
            return 'No definida';
        }
        try {
            let date;
            if (dateInput instanceof Date) { date = dateInput; }
            else {
                 if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) { date = new Date(dateInput + 'T00:00:00Z'); }
                 else { date = new Date(dateInput); }
            }
            if (isNaN(date.getTime())) { return 'Fecha inválida'; }
            const options = { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' };
            return date.toLocaleDateString('es-ES', options);
        } catch (e) {
            console.error(`formatDate: Error procesando la fecha "${dateInput}":`, e);
            return 'Fecha inválida';
        }
    }

    let snackbarTimeoutId = null;
    function showSnackbar(message, type = 'success') {
        const snackbar = document.querySelector('[data-snackbar]');
        const messageElement = snackbar?.querySelector('[data-snackbar-message]');
        const closeButton = snackbar?.querySelector('[data-action="close-snackbar"]');
        if (!snackbar || !messageElement) return;
        if (snackbarTimeoutId) clearTimeout(snackbarTimeoutId);
        messageElement.textContent = message;
        const typeClasses = { success: 'snackbar--success', error: 'snackbar--error', warning: 'snackbar--warning', info: 'snackbar--info' };
        snackbar.className = 'snackbar'; // Reset classes
        snackbar.classList.add(typeClasses[type] || typeClasses['info'], 'snackbar--visible');
        const hideSnackbar = () => snackbar.classList.remove('snackbar--visible');
         if (closeButton) {
             const newBtn = closeButton.cloneNode(true);
             closeButton.parentNode.replaceChild(newBtn, closeButton);
             newBtn.addEventListener('click', hideSnackbar);
         }
        snackbarTimeoutId = setTimeout(hideSnackbar, 5000);
    }

    function resetForms() {
        document.querySelectorAll('form').forEach(form => {
             form.reset();
             form.querySelectorAll('.dashboard__error').forEach(span => { span.textContent=''; span.style.display='none';});

             // Reset specific sections
             if (form.getAttribute('data-form') === 'create') {
                 selectedSuppliesCreate = []; renderSelectedSupplies('create');
                 selectedSensorsCreate = []; renderSelectedSensors('create'); // Reset sensors create
                 clearEstimation('create');
                 const createBtn = form.querySelector('[data-action="create"]'); if(createBtn) createBtn.disabled = true;
                 const addSensorBtn = form.querySelector('[data-action="add-selected-sensor"]'); if(addSensorBtn) addSensorBtn.disabled = false;
                 const sensorSelect = form.querySelector('[data-field="available-sensors"]'); if(sensorSelect) sensorSelect.disabled = false;
                 const quantityInput = form.querySelector('[data-field="sensor-quantity"]'); if(quantityInput) quantityInput.disabled = false;

             } else if (form.getAttribute('data-form') === 'update') {
                 form.innerHTML = '';
                 selectedSuppliesUpdate = [];
                 selectedSensorsUpdate = []; // Reset sensors update
                 form.classList.add('dashboard__form--hidden');
             }
        });
         document.querySelectorAll('.dashboard__result').forEach(el => el.classList.add('dashboard__result--hidden'));
         document.querySelectorAll('[data-field="production-id"]:not([readonly])').forEach(input => input.value = '');
         setInitialProductionId();
         currentProductionId = null;
         sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }

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
                  if (tabName === 'list') loadProductionsList();
             });
         });
     }

    // Keep calculateEstimation, clearEstimation, saveAsDraft, loadProductionsList, navigateToActionTab, generateReport, getSensorIcon etc.
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
             else { possible = false; } // Need valid unit value and quantity
         });

         if (possible) {
             investmentInput.value = `$${totalInvestment.toFixed(2)}`;
             const estimatedGoal = totalInvestment * 1.3; // Example goal calculation
             goalInput.value = `$${estimatedGoal.toFixed(2)}`;
         } else {
             // Indicate if calculation wasn't possible due to missing data
             investmentInput.value = 'N/A (Datos incompletos)';
             goalInput.value = 'N/A (Datos incompletos)';
         }
    }
    function clearEstimation(context) {
         const form = document.querySelector(`[data-form="${context}"]`);
         if (!form) return;
         const investmentInput = form.querySelector('[data-field="investment"]'); if(investmentInput) investmentInput.value='';
         const goalInput = form.querySelector('[data-field="goal"]'); if(goalInput) goalInput.value='';
    }
     function saveAsDraft() {
         showSnackbar('Borrador guardado exitosamente (simulado)');
     }


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
                     .some(field => field && String(field).toLowerCase().includes(searchTerm)))
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

     function navigateToActionTab(tabName, productionId) {
         const targetTab = document.querySelector(`.navigation__tab[data-tab="${tabName}"]`);
         if (targetTab) {
            targetTab.click();
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

    function getSensorIcon(type) {
        if (!type) return 'sensors';
        const typeLower = type.toLowerCase();
        const icons = { 'humedad': 'opacity', 'temperatura': 'thermostat', 'nutrientes': 'eco', 'luz': 'wb_sunny', 'ph': 'science' };
        return icons[typeLower] || 'sensors';
    }

    // Helper for simulated metrics
     function updateSimulatedMetrics(section) {
         const health = section.querySelector('[data-metric="health"]'); if (health) health.textContent = `${Math.floor(Math.random()*20)+70}%`;
         const growth = section.querySelector('[data-metric="growth"]'); if (growth) growth.textContent = `${Math.floor(Math.random()*20)+50}cm`;
         const yield_ = section.querySelector('[data-metric="yield"]'); if (yield_) yield_.textContent = `${Math.floor(Math.random()*20)+70}%`;
     }
     // Helper for creating all charts
     function createAllCharts(section, data) {
         createChart(section.querySelector('[data-chart="humidity"]'), 'Humedad (%)', data.humidity);
         createChart(section.querySelector('[data-chart="temperature"]'), 'Temperatura (°C)', data.temperature);
         createChart(section.querySelector('[data-chart="nutrients"]'), 'Nutrientes (%)', data.nutrients);
         createChart(section.querySelector('[data-chart="growth"]'), 'Crecimiento (cm)', data.growth);
     }
     // Generate simulated sensor data
    function generateSensorData() {
        return {
            humidity: Array(7).fill(0).map(() => Math.floor(Math.random() * 20) + 60),
            temperature: Array(7).fill(0).map(() => Math.floor(Math.random() * 10) + 20),
            nutrients: Array(7).fill(0).map(() => Math.floor(Math.random() * 20) + 40),
            growth: Array(7).fill(0).map((_, i) => i * 10 + Math.floor(Math.random() * 5))
        };
    }
    // Helper for creating individual chart
    let charts = {}; // Store chart instances
    function createChart(canvasElement, label, data) {
         if (!canvasElement) return;
         const chartId = canvasElement.getAttribute('data-chart');
         if (charts[chartId]) { charts[chartId].destroy(); } // Destroy existing chart
         const ctx = canvasElement.getContext('2d');
         const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
         charts[chartId] = new Chart(ctx, {
             type: 'line', data: { labels: days.slice(0, data.length), datasets: [{ label: label, data: data, borderColor: 'var(--color-primary)', backgroundColor: 'rgba(111, 192, 70, 0.1)', tension: 0.4, fill: true }] },
             options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: false }, x: { ticks: { autoSkip: true, maxTicksLimit: 7 } } } }
         });
     }

    // --- Run Initialization ---
    init();
});