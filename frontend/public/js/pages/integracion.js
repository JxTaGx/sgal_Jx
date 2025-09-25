// integracion.js

document.addEventListener('DOMContentLoaded', function() {
    // --- Global Variables ---
    let currentProductionId = null; 
    let currentPage = 1;
    const productionsPerPage = 5; 
    let allSuppliesData = []; 
    let allSensorsData = []; 
    let selectedSuppliesCreate = []; 
    let selectedSensorsCreate = [];
    let selectedSuppliesUpdate = [];
    let selectedSensorsUpdate = [];
    let filteredProductions = []; 
    const API_BASE_URL = 'http://localhost:3000/api'; 
    const SESSION_STORAGE_KEY = 'productionFormData';
    let cycleProgressGauge = null; 
    let sensorsComparisonChart = null;
    let harvestProjectionChart = null;

    /**
     * Obtiene los headers de autorización para las peticiones fetch.
     * @returns {HeadersInit} Un objeto de Headers con el token de autorización.
     */
    function getAuthHeaders() {
        const token = localStorage.getItem('token');
        const headers = new Headers();
        headers.append('Content-Type', 'application/json');
        if (token) {
            headers.append('Authorization', `Bearer ${token}`);
        }
        return headers;
    }

    // --- Initialization ---
    async function init() {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'login.html'; 
            return;
        }

        setupNavigation();
        setupCreateForm();
        setupViewForm();
        setupUpdateForm();
        setupEnableForm();
        setupListSection();
        setupReportForm();
        await populateDropdownsAndData();
        await restoreCreateFormState();
        await setInitialProductionId();
        await loadProductionsList();
    }

    function formatCurrencyCOP(amount) {
        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount)) {
            return 'COP 0';
        }
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(parsedAmount);
    }
    
    // --- State Preservation ---
    function getCreateFormData() {
        const form = document.querySelector('[data-form="create"]');
        if (!form) return null;

        return {
            name: form.querySelector('[data-field="name"]')?.value || '',
            responsible: form.querySelector('[data-field="responsible"]')?.value || '',
            cultivation: form.querySelector('[data-field="cultivation"]')?.value || '',
            cycle: form.querySelector('[data-field="cycle"]')?.value || '',
            startDate: form.querySelector('[data-field="start-date"]')?.value || '',
            endDate: form.querySelector('[data-field="end-date"]')?.value || '',
            selectedSupplies: selectedSuppliesCreate,
            selectedSensors: selectedSensorsCreate
        };
    }
    
    function saveCreateFormState() {
        const formData = getCreateFormData();
        if (formData) {
            try {
                sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(formData));
            } catch (e) {
                console.error("Error saving form state:", e);
                showSnackbar("Error al guardar el estado del formulario.", "error");
            }
        }
    }

    async function restoreCreateFormState() {
        const savedState = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (!savedState) return;

        const form = document.querySelector('[data-form="create"]');
        if (!form) return;

        try {
            const formData = JSON.parse(savedState);

            if (formData.name) form.querySelector('[data-field="name"]').value = formData.name;
            if (formData.responsible) form.querySelector('[data-field="responsible"]').value = formData.responsible;
            if (formData.cultivation) form.querySelector('[data-field="cultivation"]').value = formData.cultivation;
            if (formData.cycle) form.querySelector('[data-field="cycle"]').value = formData.cycle;
            if (formData.startDate) form.querySelector('[data-field="start-date"]').value = formData.startDate;
            if (formData.endDate) form.querySelector('[data-field="end-date"]').value = formData.endDate;
            if (Array.isArray(formData.selectedSupplies)) {
                selectedSuppliesCreate = formData.selectedSupplies;
                renderSelectedSupplies('create');
            }
            if (Array.isArray(formData.selectedSensors)) {
                selectedSensorsCreate = formData.selectedSensors;
                renderSelectedSensors('create');
            }

            sessionStorage.removeItem(SESSION_STORAGE_KEY);
            checkFormValidityForSubmitButton();
        } catch (e) {
            console.error("Error restoring form state:", e);
            sessionStorage.removeItem(SESSION_STORAGE_KEY);
        }
    }
    
    window.redirectToCreate = function(moduleType, url) {
        saveCreateFormState();
        window.location.href = `${url}?origin=produccion`;
    }

    // --- Initial ID Generation ---
    async function setInitialProductionId() {
        const prodIdInput = document.querySelector('[data-form="create"] [data-field="production-id"]');
        if (!prodIdInput) return;

        try {
            const prodResponse = await fetch(`${API_BASE_URL}/productions`, { headers: getAuthHeaders() });
            if (!prodResponse.ok) throw new Error('Failed to fetch productions for ID generation');
            const productionsResult = await prodResponse.json();
            const productionsData = (productionsResult && Array.isArray(productionsResult.data)) ? productionsResult.data : [];
            const nextId = productionsData.length > 0 ?
                Math.max(0, ...productionsData.map(p => parseInt(p.id) || 0)) + 1 : 1;
            prodIdInput.value = `prod-${nextId}`;
        } catch (e) {
            console.error("Error fetching next production ID:", e);
            prodIdInput.value = 'prod-error';
            showSnackbar('Error al generar ID de producción.', 'error');
        }
    }
    
    // --- Data Population ---
    async function populateDropdownsAndData() {
        try {
            const [integrationRes, sensorsRes, suppliesRes] = await Promise.all([
                fetch(`${API_BASE_URL}/integracion/data`, { headers: getAuthHeaders() }),
                fetch(`http://localhost:3000/sensor/s`, { headers: getAuthHeaders() }),
                fetch(`http://localhost:3000/api/insumos`, { headers: getAuthHeaders() })
            ]);

            if (!integrationRes.ok) throw new Error('Error al obtener datos de integración');
            const integrationDataResult = await integrationRes.json();
            if (!integrationDataResult.success) throw new Error(integrationDataResult.error);
            const data = integrationDataResult.data;

            document.querySelectorAll('[data-field="responsible"]').forEach(select => populateSelect(select, data.users || [], "Seleccione responsable"));
            document.querySelectorAll('[data-field="cultivation"]').forEach(select => populateSelect(select, data.cultivations || [], "Seleccione cultivo"));
            document.querySelectorAll('[data-field="cycle"]').forEach(select => populateSelect(select, data.cycles || [], "Seleccione ciclo"));

            if (!sensorsRes.ok) throw new Error('Error al obtener sensores');
            const sensorsResult = await sensorsRes.json();
            allSensorsData = sensorsResult.success ? sensorsResult.data : [];
            document.querySelectorAll('[data-field="available-sensors"]').forEach(select => populateSelect(select, allSensorsData, "Seleccione un sensor"));

            if (!suppliesRes.ok) throw new Error('Error al obtener insumos');
            const suppliesResult = await suppliesRes.json();
            allSuppliesData = suppliesResult.success ? suppliesResult.data : [];
            document.querySelectorAll('[data-field="available-supplies"]').forEach(select => populateSelect(select, allSuppliesData, "Seleccione un insumo"));

        } catch (error) {
            console.error('Error al poblar datos:', error);
            showSnackbar(`Error al cargar datos iniciales: ${error.message}`, 'error');
        }
    }

    function populateSelect(selectElement, options, defaultOptionText) {
        if (!selectElement) return;
        selectElement.innerHTML = `<option value="">${defaultOptionText}</option>`;
        options.forEach(opt => {
            const id = opt.id || opt.id_cultivo || opt.id_ciclo || opt.id_insumo;
            const name = opt.name || opt.nombre_cultivo || opt.nombre_ciclo || opt.nombre_insumo || opt.nombre_sensor;
            if (id !== undefined && name !== undefined) {
                const option = document.createElement('option');
                option.value = id;
                option.textContent = name;
                selectElement.appendChild(option);
            }
        });
    }

    // --- Form Setup & Event Listeners ---
    function setupNavigation() {
        const tabs = document.querySelectorAll('.navigation__tab');
        const sections = document.querySelectorAll('.dashboard__section');
        tabs.forEach(tab => {
            tab.addEventListener('click', function() {
                const tabName = this.getAttribute('data-tab');
                tabs.forEach(t => t.classList.remove('navigation__tab--active'));
                this.classList.add('navigation__tab--active');
                sections.forEach(section => {
                    section.style.display = section.getAttribute('data-panel') === tabName ? 'block' : 'none';
                });
                if (tabName === 'list') loadProductionsList();
            });
        });
    }
    
    // Asigna los eventos para el formulario de creación
    function setupCreateForm() {
        const form = document.querySelector('[data-form="create"]');
        if (!form) return;

        form.addEventListener('submit', async (e) => { e.preventDefault(); await createProduction(); });
        form.querySelector('[data-action="add-selected-sensor"]')?.addEventListener('click', () => addSelectedSensorToList('create'));
        form.querySelector('[data-action="add-selected-supply"]')?.addEventListener('click', () => addSelectedSupplyToList('create'));
        
        form.addEventListener('click', (e) => {
            if (e.target.matches('.dashboard__button--remove-sensor')) {
                removeSelectedSensor(e.target.getAttribute('data-sensor-id'), 'create');
            } else if (e.target.matches('.dashboard__button--remove-supply')) {
                removeSelectedSupply(e.target.getAttribute('data-supply-id'), 'create');
            }
        });
    }

    function setupViewForm() {
        // Cambia el selector del formulario de búsqueda
        const form = document.querySelector('[data-form="view-search"]');
        if (!form) return;
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            // Cambia el selector del input
            const productionIdInput = form.querySelector('[data-field="production-id-search"]');
            const productionId = productionIdInput?.value?.trim();
            if (!productionId) {
                showSnackbar("Ingrese ID de producción a buscar", "warning");
                // Asegúrate de que el span de error también coincida si lo usas
                const errorSpan = form.querySelector('[data-error="production-id-search"]');
                if (errorSpan) { errorSpan.textContent = 'Ingrese ID'; errorSpan.style.display = 'block'; }
                return;
            }
            const idMatch = productionId.match(/(\d+)$/);
            const actualId = idMatch ? idMatch[1] : productionId;
            await viewProductionDashboard(actualId); // Llama a la nueva función para el dashboard
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
            if (errorSpan) { errorSpan.textContent = ''; errorSpan.style.display = 'none'; }
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
                const response = await fetch(`${API_BASE_URL}/productions/${actualId}`, { headers: getAuthHeaders() });
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
            if (errorSpan) { errorSpan.textContent = ''; errorSpan.style.display = 'none'; }

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
                const response = await fetch(`${API_BASE_URL}/productions/${actualId}`, { headers: getAuthHeaders() });
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
                    newButton.addEventListener('click', async() => await toggleProductionStatus(production));
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
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => { currentPage = 1; loadProductionsList(); }, 350); // Debounce
            });
        }
        if (filterSelect) { filterSelect.addEventListener('change', () => { currentPage = 1; loadProductionsList(); }); }
        if (prevButton) { prevButton.addEventListener('click', () => { if (currentPage > 1) { currentPage--; loadProductionsList(); } }); }
        if (nextButton) {
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
            form.addEventListener('submit', async(e) => { e.preventDefault(); await generateReport(); });
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

        // if (context === 'create') validateCreateForm();
        // else if (context === 'update') validateUpdateForm();
        checkFormValidityForSubmitButton(context); // Check button status after adding
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
            // validateCreateForm(); // Re-validate after removing
            checkFormValidityForSubmitButton('create');
        } else if (context === 'update') {
            selectedSensorsUpdate = selectedSensorsUpdate.filter(item => item.id != sensorIdToRemove);
            renderSelectedSensors('update');
            // validateUpdateForm(); // Re-validate after removing
            checkFormValidityForSubmitButton('update');
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
            // Don't show error message here immediately, let validateForm handle it on submit attempt
            // if (errorSpan && context === 'create') {
            //     errorSpan.textContent = 'Debe agregar al menos un sensor (máx. 3)';
            //     errorSpan.style.display = 'block';
            // }
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

        // if (context === 'create') validateCreateForm();
        // else if (context === 'update') validateUpdateForm();
        checkFormValidityForSubmitButton(context); // Check button status after adding
    }

    function removeSelectedSupply(supplyIdToRemove, context) {
        if (context === 'create') {
            selectedSuppliesCreate = selectedSuppliesCreate.filter(item => item.id != supplyIdToRemove);
            renderSelectedSupplies('create');
            // validateCreateForm();
            checkFormValidityForSubmitButton('create');
        } else if (context === 'update') {
            selectedSuppliesUpdate = selectedSuppliesUpdate.filter(item => item.id != supplyIdToRemove);
            renderSelectedSupplies('update');
            // validateUpdateForm();
            checkFormValidityForSubmitButton('update');
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
            // Don't show error message here immediately
            // if (errorSpan && context === 'create') {
            //     errorSpan.textContent = 'Debe agregar al menos un insumo';
            //     errorSpan.style.display = 'block';
            // }
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
        if (!validateCreateForm(false)) {
            showSnackbar("Formulario inválido. Revise los campos marcados.", "warning");
            return;
        }

        const form = document.querySelector('[data-form="create"]');
        const supplyIdsForApi = selectedSuppliesCreate.map(item => item.id);
        const sensorIdsForApi = selectedSensorsCreate.map(item => item.id);

        const newProduction = {
            name: form.querySelector('[data-field="name"]').value,
            responsible: form.querySelector('[data-field="responsible"]').value,
            cultivation: form.querySelector('[data-field="cultivation"]').value,
            cycle: form.querySelector('[data-field="cycle"]').value,
            sensors: sensorIdsForApi,
            supplies: supplyIdsForApi,
            startDate: form.querySelector('[data-field="start-date"]').value,
            endDate: form.querySelector('[data-field="end-date"]').value
        };
        try {
            const response = await fetch(`${API_BASE_URL}/productions`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(newProduction) });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.error || `Error HTTP ${response.status}`);
            showSnackbar(`Producción creada: ${result.displayId || result.id}`);
            resetForms();
            await loadProductionsList();
        } catch (error) {
            console.error('Error al crear producción:', error);
            showSnackbar(`Error al crear: ${error.message}`, 'error');
        }
    }

    async function viewProductionDashboard(productionId) {
        const dashboardResultSection = document.querySelector('[data-result="view-production-dashboard"]');
        if (!dashboardResultSection) {
            console.error("Sección del dashboard de producción no encontrada.");
            return;
        }
        dashboardResultSection.classList.add('dashboard__result--hidden');
        showSnackbar("Cargando datos de producción...", "info");

        try {
            const response = await fetch(`${API_BASE_URL}/productions/${productionId}`, { headers: getAuthHeaders() });
            if (!response.ok) {
                throw new Error(response.status === 404 ? 'Producción no encontrada' : `Error al obtener producción: ${response.statusText}`);
            }
            const result = await response.json();
            if (!result.success || !result.data) {
                throw new Error(result.error || 'Producción no encontrada en la respuesta');
            }

            const production = result.data;
            currentProductionId = production.id;

            const totalInvestmentEl = dashboardResultSection.querySelector('[data-metric="total-investment"]');
            const maintenanceCostEl = dashboardResultSection.querySelector('[data-metric="maintenance-cost"]');
            const estimatedProfitEl = dashboardResultSection.querySelector('[data-metric="estimated-profit"]');
            const healthViewEl = dashboardResultSection.querySelector('[data-metric="health-view"]');

            let calculatedTotalInvestment = 0;
            let suppliesCostDetails = [];

            if (Array.isArray(production.supplies) && production.supplies.length > 0 && allSuppliesData.length > 0) {
                production.supplies.forEach(supplyId => {
                    const supplyData = allSuppliesData.find(s => String(s.id) === String(supplyId) || String(s.id_insumo) === String(supplyId));
                    if (supplyData && supplyData.valor_unitario != null) {
                        const costOfSupplyItem = parseFloat(supplyData.valor_unitario);
                        if (!isNaN(costOfSupplyItem)) {
                            calculatedTotalInvestment += costOfSupplyItem;
                            suppliesCostDetails.push({
                                name: supplyData.nombre_insumo || `Insumo ${supplyData.id_insumo || supplyId}`,
                                cost: costOfSupplyItem,
                                type: supplyData.tipo_insumo || 'Desconocido'
                            });
                        }
                    }
                });
            }

            if (totalInvestmentEl) totalInvestmentEl.textContent = formatCurrencyCOP(calculatedTotalInvestment);

            const simulatedMaintenanceCost = calculatedTotalInvestment * 0.1;
            const simulatedRevenue = calculatedTotalInvestment * 1.5;
            const simulatedProfit = simulatedRevenue - (calculatedTotalInvestment + simulatedMaintenanceCost);

            if (maintenanceCostEl) maintenanceCostEl.textContent = formatCurrencyCOP(simulatedMaintenanceCost);
            if (estimatedProfitEl) {
                estimatedProfitEl.textContent = formatCurrencyCOP(simulatedProfit);
                estimatedProfitEl.style.color = simulatedProfit >= 0 ? 'var(--color-success)' : 'var(--color-error)';
            }
            if (healthViewEl) healthViewEl.textContent = `${Math.floor(Math.random() * 20) + 75}%`;

            const detailsContainer = dashboardResultSection.querySelector('[data-info="production-details"]');
            if (detailsContainer) {
                detailsContainer.innerHTML = `
                    <div class="dashboard__info-item"><div class="dashboard__info-label">ID Producción</div><div class="dashboard__info-value">prod-${production.id}</div></div>
                    <div class="dashboard__info-item"><div class="dashboard__info-label">Nombre</div><div class="dashboard__info-value">${production.name || 'N/A'}</div></div>
                    <div class="dashboard__info-item"><div class="dashboard__info-label">Responsable</div><div class="dashboard__info-value">${production.responsible_name || 'N/A'}</div></div>
                    <div class="dashboard__info-item"><div class="dashboard__info-label">Cultivo</div><div class="dashboard__info-value">${production.cultivation_name || 'N/A'}</div></div>
                    <div class="dashboard__info-item"><div class="dashboard__info-label">Ciclo</div><div class="dashboard__info-value">${production.cycle_name || 'N/A'}</div></div>
                    <div class="dashboard__info-item"><div class="dashboard__info-label">Fecha Inicio</div><div class="dashboard__info-value">${formatDate(production.start_date)}</div></div>
                    <div class="dashboard__info-item"><div class="dashboard__info-label">Fecha Fin Est.</div><div class="dashboard__info-value">${formatDate(production.end_date)}</div></div>
                    <div class="dashboard__info-item"><div class="dashboard__info-label">Estado</div><div class="dashboard__info-value"><span class="status-badge status-badge--${production.status === 'active' ? 'active' : 'inactive'}">${production.status === 'active' ? 'Activo' : 'Inactivo'}</span></div></div>
                `;
            }

            const financialCtx = dashboardResultSection.querySelector('[data-chart="financial-breakdown"]')?.getContext('2d');
            if (financialCtx) {
                if (window.financialBreakdownChart instanceof Chart) {
                    window.financialBreakdownChart.destroy();
                }
                window.financialBreakdownChart = new Chart(financialCtx, {
                    type: 'doughnut',
                    data: {
                        labels: ['Costo Insumos', 'Mantenimiento (Est.)'],
                        datasets: [{
                            label: 'Desglose de Costos',
                            data: [calculatedTotalInvestment, simulatedMaintenanceCost],
                            backgroundColor: ['rgba(75, 192, 192, 0.7)', 'rgba(255, 159, 64, 0.7)'],
                            borderColor: ['rgba(75, 192, 192, 1)', 'rgba(255, 159, 64, 1)'],
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { position: 'top' },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        return `${context.label}: ${formatCurrencyCOP(context.raw)}`;
                                    }
                                }
                            }
                        }
                    }
                });
            }

            const suppliesCostCtx = dashboardResultSection.querySelector('[data-chart="supplies-cost-distribution"]')?.getContext('2d');
            if (suppliesCostCtx && suppliesCostDetails.length > 0) {
                if (window.suppliesCostChart instanceof Chart) {
                    window.suppliesCostChart.destroy();
                }
                const costsByType = suppliesCostDetails.reduce((acc, item) => {
                    acc[item.type] = (acc[item.type] || 0) + item.cost;
                    return acc;
                }, {});

                window.suppliesCostChart = new Chart(suppliesCostCtx, {
                    type: 'pie',
                    data: {
                        labels: Object.keys(costsByType),
                        datasets: [{
                            label: 'Costo por Tipo de Insumo',
                            data: Object.values(costsByType),
                            backgroundColor: [
                                'rgba(255, 99, 132, 0.7)', 'rgba(54, 162, 235, 0.7)',
                                'rgba(255, 206, 86, 0.7)', 'rgba(75, 192, 192, 0.7)',
                                'rgba(153, 102, 255, 0.7)', 'rgba(255, 159, 64, 0.7)',
                                'rgba(199, 199, 199, 0.7)'
                            ],
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        plugins: {
                            legend: { position: 'right' },
                            tooltip: { callbacks: { label: (c) => `${c.label}: ${formatCurrencyCOP(c.raw)}` } }
                        }
                    }
                });
            }


            const sensorSimData = generateSensorData();
            createChart(dashboardResultSection.querySelector('[data-chart="humidity-view"]'), 'Humedad (%)', sensorSimData.humidity);
            createChart(dashboardResultSection.querySelector('[data-chart="temperature-view"]'), 'Temperatura (°C)', sensorSimData.temperature);
            createChart(dashboardResultSection.querySelector('[data-chart="nutrients-view"]'), 'Nutrientes (%)', sensorSimData.nutrients);
            createChart(dashboardResultSection.querySelector('[data-chart="growth-view"]'), 'Crecimiento (cm)', sensorSimData.growth);

            const sensorsListViewContainer = dashboardResultSection.querySelector('[data-info="sensors-list-view"]');
            if (sensorsListViewContainer) {
                sensorsListViewContainer.innerHTML = '<p>Cargando sensores...</p>';
                const sensorIds = Array.isArray(production.sensors) ? production.sensors.map(String) : [];
                if (sensorIds.length === 0) {
                    sensorsListViewContainer.innerHTML = '<p>No hay sensores asignados a esta producción.</p>';
                } else if (allSensorsData.length > 0) {
                    let listHtml = '<ul>';
                    sensorIds.forEach(id => {
                        const sensorData = allSensorsData.find(s => String(s.id) === id || String(s.id_sensor) === id);
                        if (sensorData) {
                            listHtml += `<li>
                                           <span class="dashboard__list-item-main">${sensorData.nombre_sensor || `Sensor ${id}`} (${sensorData.tipo_sensor || 'N/A'})</span>
                                           <span class="dashboard__list-item-detail">Estado: ${sensorData.estado || 'Desconocido'}</span>
                                         </li>`;
                        } else {
                            listHtml += `<li><span class="dashboard__list-item-main">Sensor ID ${id}</span> <span class="dashboard__list-item-detail">Detalles no encontrados</span></li>`;
                        }
                    });
                    listHtml += '</ul>';
                    sensorsListViewContainer.innerHTML = listHtml;
                } else {
                     sensorsListViewContainer.innerHTML = '<p>Datos maestros de sensores no disponibles para mostrar detalles.</p>';
                }
            }

            const suppliesListViewContainer = dashboardResultSection.querySelector('[data-info="supplies-list-view"]');
            if (suppliesListViewContainer) {
                suppliesListViewContainer.innerHTML = '<p>Cargando insumos...</p>';
                 if (suppliesCostDetails.length === 0) {
                    suppliesListViewContainer.innerHTML = '<p>No hay insumos asignados o con costos definidos para esta producción.</p>';
                } else {
                    let listHtml = '<ul>';
                    suppliesCostDetails.forEach(item => {
                         listHtml += `<li>
                                       <span class="dashboard__list-item-main">${item.name}</span>
                                       <span class="dashboard__list-item-detail">Costo Unitario: ${formatCurrencyCOP(item.cost)}</span>
                                     </li>`;
                    });
                    listHtml += '</ul>';
                    suppliesListViewContainer.innerHTML = listHtml;
                }
            }

            dashboardResultSection.classList.remove('dashboard__result--hidden');
            showSnackbar("Dashboard de producción cargado.", "success");

            const cycleGaugeCtx = dashboardResultSection.querySelector('[data-chart="cycle-progress-gauge"]')?.getContext('2d');
            const cycleProgressTextEl = dashboardResultSection.querySelector('[data-info="cycle-progress-text"]');
            if (cycleGaugeCtx && production.start_date && production.end_date) {
                const startDate = new Date(production.start_date);
                const endDate = new Date(production.end_date);
                const today = new Date();
                let progressPercent = 0;
                let daysRemaining = 0;
                let totalCycleDays = 0;
                if (startDate < endDate) {
                    totalCycleDays = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));
                    if (today < startDate) {
                        progressPercent = 0;
                        daysRemaining = totalCycleDays;
                    } else if (today > endDate) {
                        progressPercent = 100;
                        daysRemaining = 0;
                    } else {
                        const elapsedDays = Math.round((today - startDate) / (1000 * 60 * 60 * 24));
                        progressPercent = Math.min(100, Math.max(0, (elapsedDays / totalCycleDays) * 100));
                        daysRemaining = totalCycleDays - elapsedDays;
                    }
                }
                if (cycleProgressGauge instanceof Chart) {
                    cycleProgressGauge.destroy();
                }
                cycleProgressGauge = new Chart(cycleGaugeCtx, {
                    type: 'doughnut',
                    data: {
                        datasets: [{
                            data: [progressPercent, 100 - progressPercent],
                            backgroundColor: ['var(--color-primary)', 'var(--gray-150, #e9ecef)'],
                            borderWidth: 0,
                            circumference: 180,
                            rotation: 270,
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: true,
                        aspectRatio: 2,
                        cutout: '70%',
                        plugins: {
                            tooltip: { enabled: false }
                        }
                    }
                });
                if (cycleProgressTextEl) {
                    cycleProgressTextEl.innerHTML = `${progressPercent.toFixed(0)}% <small>(${daysRemaining} días rest.)</small>`;
                }
            } else if (cycleProgressTextEl) {
                cycleProgressTextEl.textContent = "Fechas no disp.";
            }

            const yieldValueEl = dashboardResultSection.querySelector('[data-metric="yield-value"]');
            const waterEfficiencyEl = dashboardResultSection.querySelector('[data-metric="water-efficiency"]');
            if (yieldValueEl) yieldValueEl.textContent = `${(Math.random() * 3 + 4).toFixed(1)} kg/m² (Est.)`;
            if (waterEfficiencyEl) {
                const efficiencies = ["Óptima", "Buena", "Mejorable"];
                waterEfficiencyEl.textContent = efficiencies[Math.floor(Math.random() * efficiencies.length)];
            }

            const sensorsCompCtx = dashboardResultSection.querySelector('[data-chart="sensors-comparison-chart"]')?.getContext('2d');
            if (sensorsCompCtx) {
                const numPoints = 10;
                const timeLabels = getTimeLabels(numPoints);
                const humidityData1 = generateRealisticSensorData('humidity', numPoints, 65, 15, -2, 2);
                const humidityData2 = generateRealisticSensorData('humidity', numPoints, 60, 18, 0, 2.5);
                if (sensorsComparisonChart instanceof Chart) {
                    sensorsComparisonChart.destroy();
                }
                sensorsComparisonChart = new Chart(sensorsCompCtx, {
                    type: 'line',
                    data: {
                        labels: timeLabels,
                        datasets: [{
                            label: 'Humedad Sensor A01',
                            data: humidityData1,
                            borderColor: 'var(--color-primary)',
                            backgroundColor: 'transparent',
                            tension: 0.3,
                            pointRadius: 2,
                        }, {
                            label: 'Humedad Sensor A02',
                            data: humidityData2,
                            borderColor: 'var(--color-accent)',
                            backgroundColor: 'transparent',
                            tension: 0.3,
                            pointRadius: 2,
                        }]
                    },
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        plugins: { legend: { position: 'top', labels: { font: { size: 10 } } } },
                        scales: {
                            y: { ticks: { font: { size: 10 }, callback: (v) => `${v}%` } },
                            x: { ticks: { font: { size: 10 } } }
                        }
                    }
                });
            }

            const harvestCtx = dashboardResultSection.querySelector('[data-chart="harvest-projection-chart"]')?.getContext('2d');
            if (harvestCtx) {
                const estimatedYieldCurrent = (parseFloat(production.tamano) || 100) * (Math.random() * 2 + 4.5);
                const targetYield = estimatedYieldCurrent * (Math.random() * 0.3 + 1.1);
                if (harvestProjectionChart instanceof Chart) {
                    harvestProjectionChart.destroy();
                }
                harvestProjectionChart = new Chart(harvestCtx, {
                    type: 'bar',
                    data: {
                        labels: ['Proyección Actual', 'Objetivo de Cosecha'],
                        datasets: [{
                            label: 'Producción Estimada (kg)',
                            data: [estimatedYieldCurrent.toFixed(0), targetYield.toFixed(0)],
                            backgroundColor: ['rgba(75, 192, 192, 0.7)', 'rgba(54, 162, 235, 0.7)'],
                            borderColor: ['rgba(75, 192, 192, 1)', 'rgba(54, 162, 235, 1)'],
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true, maintainAspectRatio: false, indexAxis: 'y',
                        plugins: { legend: { display: false } },
                        scales: { x: { beginAtZero: true, ticks: { font: { size: 10 }, callback: (v) => `${v} kg` } }, y: { ticks: { font: { size: 10 } } } }
                    }
                });
            }

            const sensorsPanelContainer = dashboardResultSection.querySelector('[data-info="sensors-panel"]');
            if (sensorsPanelContainer) {
                sensorsPanelContainer.innerHTML = '';
                const sensorIds = Array.isArray(production.sensors) ? production.sensors.map(String) : [];
                if (sensorIds.length === 0) {
                    sensorsPanelContainer.innerHTML = '<p class="dashboard__notice">No hay sensores asignados a esta producción.</p>';
                } else if (allSensorsData.length > 0) {
                    sensorIds.forEach((id, index) => {
                        const sensorData = allSensorsData.find(s => String(s.id) === id || String(s.id_sensor) === id);
                        if (sensorData) {
                            const card = document.createElement('div');
                            card.className = 'dashboard__sensor-card-individual';
                            let baseVal, variation, trend, seasonalF, unitSuffix = sensorData.unidad_medida || '';
                            let sensorDataType = (sensorData.tipo_sensor || 'unknown').toLowerCase();
                            if (sensorDataType.includes('humedad')) {
                                baseVal = 60; variation = 20; trend = -5; seasonalF = 3; unitSuffix = '%';
                            } else if (sensorDataType.includes('temperatura')) {
                                baseVal = 22; variation = 8; trend = 0; seasonalF = 5; unitSuffix = '°C';
                            } else if (sensorDataType.includes('ph')) {
                                baseVal = 6.5; variation = 1; trend = 0.1; seasonalF = 0; unitSuffix = '';
                            } else if (sensorDataType.includes('ec') || sensorDataType.includes('conductividad')) {
                                baseVal = 1.5; variation = 0.5; trend = 0.2; seasonalF = 0; unitSuffix = 'mS/cm';
                            } else {
                                baseVal = 50; variation = 20; trend = 0; seasonalF = 0;
                            }
                            const realisticData = generateRealisticSensorData(sensorDataType, 15, baseVal, variation, trend, seasonalF);
                            const timeLabels = getTimeLabels(realisticData.length);
                            const currentValue = realisticData[realisticData.length - 1];
                            let currentStatus = 'status-normal';
                            let statusText = 'Normal';
                            if (sensorDataType.includes('temperatura') && (currentValue < 15 || currentValue > 30)) {
                                currentStatus = 'status-alert'; statusText = 'Alerta';
                            } else if (sensorDataType.includes('humedad') && (currentValue < 40 || currentValue > 85)) {
                                currentStatus = 'status-caution'; statusText = 'Precaución';
                            }
                            card.innerHTML = `
                        <div class="dashboard__sensor-card-header">
                            <h4 class="dashboard__sensor-card-title">${sensorData.nombre_sensor || `Sensor ${id}`}</h4>
                            <span class="dashboard__sensor-card-status ${currentStatus}">${statusText}</span>
                        </div>
                        <div class="dashboard__sensor-card-details">
                            Tipo: <strong>${sensorData.tipo_sensor || 'N/A'}</strong> | 
                            Unidad: <strong>${sensorData.unidad_medida || 'N/A'}</strong> |
                            ID: <strong>${sensorData.identificador || 'N/A'}</strong> |
                            Estado DB: <strong>${sensorData.estado || 'Desc.'}</strong>
                        </div>
                        <div class="dashboard__sensor-current-value">${currentValue.toFixed(1)} ${unitSuffix}</div>
                        <div class="dashboard__sensor-chart-container">
                            <canvas data-chart="sensor-detail-${sensorData.id || index}"></canvas>
                        </div>
                    `;
                            sensorsPanelContainer.appendChild(card);
                            const sensorChartCtx = card.querySelector(`[data-chart="sensor-detail-${sensorData.id || index}"]`);
                            if (sensorChartCtx) {
                                createChart(sensorChartCtx, sensorData.nombre_sensor || `Sensor ${id}`, realisticData, timeLabels, unitSuffix);
                            }
                        } else {
                            const notice = document.createElement('p');
                            notice.className = 'dashboard__notice dashboard__notice--warning';
                            notice.textContent = `Detalles no encontrados para el Sensor ID ${id}.`;
                            sensorsPanelContainer.appendChild(notice);
                        }
                    });
                } else {
                    sensorsPanelContainer.innerHTML = '<p class="dashboard__notice dashboard__notice--error">Datos maestros de sensores no disponibles para mostrar detalles.</p>';
                }
            }
            const suppliesTableContainer = dashboardResultSection.querySelector('[data-info="supplies-table-view"]');
            if (suppliesTableContainer) {
                const tableBody = suppliesTableContainer.querySelector('tbody');
                tableBody.innerHTML = '';
                if (suppliesCostDetails.length === 0) {
                    tableBody.innerHTML = '<tr><td colspan="5" class="dashboard__notice">No hay insumos asignados o con costos definidos para esta producción.</td></tr>';
                } else {
                    const productionSupplyIDs = Array.isArray(production.supplies) ? production.supplies.map(String) : [];
                    productionSupplyIDs.forEach(prodSupplyId => {
                        const supplyData = allSuppliesData.find(s => String(s.id) === prodSupplyId || String(s.id_insumo) === prodSupplyId);
                        if (supplyData) {
                            const row = tableBody.insertRow();
                            row.innerHTML = `
                            <td>${supplyData.nombre_insumo || 'N/A'}</td>
                            <td>${supplyData.tipo_insumo || 'N/A'}</td>
                            <td><span class="description-truncate" title="${supplyData.descripcion || ''}">${supplyData.descripcion || 'Sin descripción'}</span></td>
                            <td>${supplyData.unidad_medida || 'N/A'}</td>
                            <td>${formatCurrencyCOP(parseFloat(supplyData.valor_unitario))}</td>
                            `;
                        }
                    });
                    if (tableBody.rows.length === 0) {
                        tableBody.innerHTML = '<tr><td colspan="5" class="dashboard__notice">No se encontraron detalles para los insumos asignados.</td></tr>';
                    }
                }
            }

            const activityLogContainer = dashboardResultSection.querySelector('[data-info="activity-log"]');
            if (activityLogContainer) {
                activityLogContainer.innerHTML = '';
                const activities = [
                    { time: "Hace 1 hora", event: `Monitoreo de ${production.name || 'producción'} completado. Valores estables.` },
                    { time: "Hace 5 horas", event: "Alerta de Temperatura Alta en Sensor T-02, normalizada." },
                    { time: "Hace 1 día", event: `Riego programado ejecutado para el cultivo ${production.cultivation_name || ''}.` },
                    { time: "Hace 2 días", event: `Inicio del ciclo '${production.cycle_name || ''}'. Responsable: ${production.responsible_name || 'N/A'}.` },
                    { time: "Hace 3 días", event: `Insumo 'Fertilizante Triple 15' añadido al plan de producción.` }
                ];
                activities.forEach(act => {
                    const listItem = document.createElement('li');
                    listItem.innerHTML = `<span class="activity-time">${act.time}</span> ${act.event}`;
                    activityLogContainer.appendChild(listItem);
                });
            }
            dashboardResultSection.classList.remove('dashboard__result--hidden');
            showSnackbar("Dashboard de producción actualizado y cargado.", "success");
        } catch (error) {
            console.error('Error al visualizar producción en dashboard:', error);
            showSnackbar(`Error al cargar dashboard: ${error.message}`, 'error');
            dashboardResultSection.classList.add('dashboard__result--hidden');
            dashboardResultSection.querySelector('[data-metric="total-investment"]').textContent = 'COP 0';
            dashboardResultSection.querySelector('[data-metric="maintenance-cost"]').textContent = 'COP 0';
            dashboardResultSection.querySelector('[data-metric="estimated-profit"]').textContent = 'COP 0';
            dashboardResultSection.querySelector('[data-info="production-details"]').innerHTML = '<p>Error al cargar detalles.</p>';
        }
    }

    async function updateProduction() {
        if (!validateUpdateForm(false)) {
            showSnackbar("Formulario de actualización inválido.", "warning");
            return;
        }
        const form = document.querySelector('[data-form="update"]');
        if (!form || !currentProductionId) {
            showSnackbar("No se ha seleccionado una producción para actualizar.", "error"); return;
        }

        const supplyIdsForApi = selectedSuppliesUpdate.map(item => item.id);
        const sensorIdsForApi = selectedSensorsUpdate.map(item => item.id);

        const updatedData = {
            name: form.querySelector('[data-field="name"]').value,
            responsible: form.querySelector('[data-field="responsible"]').value,
            cultivation: form.querySelector('[data-field="cultivation"]').value,
            cycle: form.querySelector('[data-field="cycle"]').value,
            sensors: sensorIdsForApi,
            supplies: supplyIdsForApi,
            end_date: form.querySelector('[data-field="end-date"]').value,
            status: form.querySelector('[data-field="status"]').value
        };
        try {
            showSnackbar("Actualizando...", "info");
            const response = await fetch(`${API_BASE_URL}/productions/${currentProductionId}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(updatedData) });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.error || `Error HTTP ${response.status}`);
            showSnackbar('Producción actualizada exitosamente');
            form.classList.add('dashboard__form--hidden');
            form.innerHTML = '';
            selectedSuppliesUpdate = [];
            selectedSensorsUpdate = [];
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

        const updatePayload = {
            ...currentProductionData,
            status: newStatus,
            sensors: Array.isArray(currentProductionData.sensors) ? currentProductionData.sensors : [],
            supplies: Array.isArray(currentProductionData.supplies) ? currentProductionData.supplies : [],
            start_date: undefined,
            end_date: currentProductionData.end_date ? new Date(currentProductionData.end_date).toISOString().split('T')[0] : undefined,
            responsible_name: undefined, cultivation_name: undefined, cycle_name: undefined, created_at: undefined, updated_at: undefined,
            id_ciclo: undefined, id_cultivo: undefined, id_insumo: undefined, id_sensor: undefined, nombre_ciclo: undefined, nombre_cultivo: undefined, nombre_insumo: undefined, nombre_sensor: undefined
        };
        delete updatePayload.start_date;

        Object.keys(updatePayload).forEach(key => updatePayload[key] === undefined && delete updatePayload[key]);

        try {
            const response = await fetch(`${API_BASE_URL}/productions/${currentProductionData.id}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(updatePayload) });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.error || `Error al cambiar estado (HTTP ${response.status})`);
            showSnackbar(`Producción ${actionText}da exitosamente.`);
            const enableForm = document.querySelector('[data-form="enable"]');
            const idInput = enableForm?.querySelector('[data-field="production-id"]');
            if (enableForm && idInput && idInput.value) {
                enableForm.dispatchEvent(new Event('submit', { bubbles: true }));
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


    function validateSingleField(input) {
        const form = input.closest('form');
        if (!form) return;
        const fieldName = input.getAttribute('data-field');
        const errorElement = form.querySelector(`[data-error="${fieldName}"]`);
        let fieldValid = true;
        let errorMessage = 'Este campo es requerido';
        if (input.type === 'date') {
            if (input.required && !input.value) { fieldValid = false; }
            if (fieldName === 'end-date') {
                const startDateInput = form.querySelector('[data-field="start-date"]');
                if (startDateInput && input.value && startDateInput.value && new Date(input.value) < new Date(startDateInput.value)) {
                    fieldValid = false; errorMessage = 'La fecha de fin debe ser posterior a la de inicio.';
                }
            }
        } else if (input.required && (!input.value || (typeof input.value === 'string' && !input.value.trim()))) {
            fieldValid = false;
        }
        if (!fieldValid) {
            if (errorElement) { errorElement.textContent = errorMessage; errorElement.style.display = 'block'; }
        } else {
            if (errorElement) { errorElement.style.display = 'none'; }
        }
        return fieldValid;
    }

    function isFormValidForSubmission(context = 'create') {
        const form = document.querySelector(`[data-form="${context}"]`);
        if (!form) return false;
        let isValid = true;
        form.querySelectorAll('[required]:not([disabled])').forEach(input => {
            const fieldName = input.getAttribute('data-field');
            let fieldValid = true;
            if (input.type === 'date') {
                if (!input.value) { fieldValid = false; }
                if (fieldName === 'end-date') {
                    const startDateInput = form.querySelector('[data-field="start-date"]');
                    if (startDateInput && input.value && startDateInput.value && new Date(input.value) < new Date(startDateInput.value)) {
                        fieldValid = false;
                    }
                }
            } else if (!input.value || (typeof input.value === 'string' && !input.value.trim())) {
                fieldValid = false;
            }
            if (!fieldValid) isValid = false;
        });
        const sensorList = context === 'create' ? selectedSensorsCreate : selectedSensorsUpdate;
        if (sensorList.length === 0 || sensorList.length > 3) {
            isValid = false;
        }
        const supplyList = context === 'create' ? selectedSuppliesCreate : selectedSuppliesUpdate;
        if (supplyList.length === 0) {
            isValid = false;
        }
        return isValid;
    }

    function checkFormValidityForSubmitButton(context = 'create') {
        const form = document.querySelector(`[data-form="${context}"]`);
        if (!form) return;
        const submitButton = form.querySelector('[data-action="create"], button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = !isFormValidForSubmission(context);
        }
    }

    function validateForm(context = 'create', showErrors = true) {
        const form = document.querySelector(`[data-form="${context}"]`);
        if (!form) return false;
        let isFormValid = true;
        form.querySelectorAll('[required]:not([disabled])').forEach(input => {
            const fieldValid = validateSingleField(input);
            if (!fieldValid) isFormValid = false;
        });
        const sensorList = context === 'create' ? selectedSensorsCreate : selectedSensorsUpdate;
        const sensorErrorElement = form.querySelector('[data-error="sensors"]');
        if (sensorList.length === 0) {
            if (showErrors && sensorErrorElement) { sensorErrorElement.textContent = 'Debe agregar al menos un sensor (máx. 3)'; sensorErrorElement.style.display = 'block'; }
            isFormValid = false;
        } else if (sensorList.length > 3) {
            if (showErrors && sensorErrorElement) { sensorErrorElement.textContent = 'Solo puede agregar un máximo de 3 sensores.'; sensorErrorElement.style.display = 'block'; }
            isFormValid = false;
        } else {
            if (sensorErrorElement) { sensorErrorElement.style.display = 'none'; }
        }
        const supplyList = context === 'create' ? selectedSuppliesCreate : selectedSuppliesUpdate;
        const supplyErrorElement = form.querySelector('[data-error="supplies"]');
        if (supplyList.length === 0) {
            if (showErrors && supplyErrorElement) { supplyErrorElement.textContent = 'Debe agregar al menos un insumo'; supplyErrorElement.style.display = 'block'; }
            isFormValid = false;
        } else {
            if (supplyErrorElement) { supplyErrorElement.style.display = 'none'; }
        }
        if (isFormValid) calculateEstimation(context); else clearEstimation(context);
        checkFormValidityForSubmitButton(context);
        return isFormValid;
    }

    const validateCreateForm = (showErrors = true) => validateForm('create', showErrors);
    const validateUpdateForm = (showErrors = true) => validateForm('update', showErrors);

    async function populateExistingUpdateForm(formElement, productionData) {
        formElement.innerHTML = '';
        selectedSuppliesUpdate = [];
        selectedSensorsUpdate = [];
        formElement.innerHTML = `
            <div class="dashboard__form-group">
                <label class="dashboard__label">ID Producción</label>
                <input class="dashboard__input" type="text" value="prod-${productionData.id}" readonly>
            </div>
            <div class="dashboard__form-group">
                <label class="dashboard__label">Nombre</label>
                <input class="dashboard__input" type="text" data-field="name" required>
                <span class="dashboard__error" data-error="name"></span>
            </div>
            <div class="dashboard__form-group">
                <label class="dashboard__label">Responsable</label>
                <select class="dashboard__select" data-field="responsible" required></select>
                <span class="dashboard__error" data-error="responsible"></span>
                </div>

            <div class="dashboard__form-group">
                <label class="dashboard__label">Cultivo</label>
                <select class="dashboard__select" data-field="cultivation" required></select>
                <span class="dashboard__error" data-error="cultivation"></span>
                </div>
            <div class="dashboard__form-group">
                <label class="dashboard__label">Ciclo</label>
                <select class="dashboard__select" data-field="cycle" required></select>
                <span class="dashboard__error" data-error="cycle"></span>
                </div>

            <div class="dashboard__form-group">
                <label class="dashboard__label">Fecha Inicio</label>
                <input class="dashboard__input" type="date" data-field="start-date" disabled> <span class="dashboard__error" data-error="start-date"></span>
            </div>
            <div class="dashboard__form-group">
                <label class="dashboard__label">Fecha Fin Est.</label>
                <input class="dashboard__input" type="date" data-field="end-date" required>
                <span class="dashboard__error" data-error="end-date"></span>
            </div>

            <div class="dashboard__form-group dashboard__form-group--full-width">
                <label class="dashboard__label">Sensores Asignados (Máx. 3)</label>
                <div class="dashboard__sensor-add-area">
                    <select class="dashboard__select" data-field="available-sensors" title="Seleccione un sensor disponible">
                        <option value="">Seleccione un sensor para agregar...</option>
                        </select>
                    <input type="number" class="dashboard__input" data-field="sensor-quantity" placeholder="Cant." min="1" max="3" value="1" title="Ingrese la cantidad (1-3)">
                    <button class="dashboard__button dashboard__button--icon" type="button"
                            onclick="window.location.href='../views/create-sensor.html?origin=produccionUpdate&prodId=${productionData.id}'" title="Crear Nuevo Sensor">
                        <i class="material-icons">add_circle</i>
                    </button>
                    <button class="dashboard__button dashboard__button--primary" type="button" data-action="add-selected-sensor-update" title="Agregar el sensor seleccionado">Agregar Sensor</button>
                </div>
                <div class="dashboard__selected-items-list" data-list="selected-sensors">
                    <p>Cargando sensores asignados...</p>
                </div>
                <span class="dashboard__error" data-error="sensors"></span>
            </div>

            <div class="dashboard__form-group dashboard__form-group--full-width">
                <label class="dashboard__label">Insumos Asignados</label>
                <div class="dashboard__supply-add-area">
                    <select class="dashboard__select" data-field="available-supplies">
                        <option value="">Seleccione insumo a agregar...</option>
                        </select>
                    <input type="number" class="dashboard__input" placeholder="Cantidad" min="1" data-field="supply-quantity">
                    <button class="dashboard__button dashboard__button--icon" type="button"
                        onclick="window.location.href='../views/create-insumo.html?origin=produccionUpdate&prodId=${productionData.id}'" title="Crear Nuevo Insumo">
                        <i class="material-icons">add_circle</i>
                    </button>
                    <button class="dashboard__button dashboard__button--primary" type="button" data-action="add-selected-supply-update">Agregar Insumo</button>
                </div>
                <div class="dashboard__selected-items-list" data-list="selected-supplies">
                    <p>Cargando insumos asignados...</p>
                </div>
                <span class="dashboard__error" data-error="supplies"></span>
            </div>

            <div class="dashboard__form-group">
                <label class="dashboard__label">Estado</label>
                <select class="dashboard__select" data-field="status" required></select>
                <span class="dashboard__error" data-error="status"></span>
            </div>

            <div class="dashboard__form-group">
                </div>


            <div class="dashboard__form-actions dashboard__form-group--full-width">
                <button class="dashboard__button dashboard__button--secondary" type="button" data-action="cancel-update">Cancelar</button>
                <button class="dashboard__button dashboard__button--primary" type="submit" disabled>Actualizar Producción</button>
            </div>
        `;
        formElement.querySelector('[data-field="name"]').value = productionData.name || '';
        const startDateInput = formElement.querySelector('[data-field="start-date"]');
        const endDateInput = formElement.querySelector('[data-field="end-date"]');
        try { startDateInput.value = productionData.start_date ? new Date(productionData.start_date).toISOString().split('T')[0] : ''; startDateInput.disabled = true; } catch (e) { console.error("Error parsing start date:", e); }
        try { endDateInput.value = productionData.end_date ? new Date(productionData.end_date).toISOString().split('T')[0] : ''; } catch (e) { console.error("Error parsing end date:", e); }
        try {
            const dropdownsResponse = await fetch(`${API_BASE_URL}/integracion/data`, { headers: getAuthHeaders() });
            const dropdownsResult = await dropdownsResponse.json();
            if (!dropdownsResult.success) throw new Error("Error cargando datos para selects");
            const dropdownData = dropdownsResult.data;
            populateSelectExisting(formElement.querySelector('[data-field="responsible"]'), dropdownData.users || [], productionData.responsible);
            populateSelectExisting(formElement.querySelector('[data-field="cultivation"]'), dropdownData.cultivations || [], productionData.cultivation);
            populateSelectExisting(formElement.querySelector('[data-field="cycle"]'), dropdownData.cycles || [], productionData.cycle);
            populateSelectExisting(formElement.querySelector('[data-field="status"]'), [{ id: 'active', name: 'Activo' }, { id: 'inactive', name: 'Inactivo' }], productionData.status);
            const availableSensorsSelect = formElement.querySelector('[data-field="available-sensors"]');
            if (availableSensorsSelect) {
                populateSelect(availableSensorsSelect, allSensorsData || [], "Seleccione un sensor");
            }
            const availableSuppliesSelect = formElement.querySelector('[data-field="available-supplies"]');
            if (availableSuppliesSelect) {
                populateSelect(availableSuppliesSelect, allSuppliesData || [], "Seleccione insumo a agregar...");
            }
        } catch (error) { console.error("Error populating selects:", error); showSnackbar("Error al cargar opciones.", "error"); }
        selectedSensorsUpdate = [];
        const initialSensorIds = Array.isArray(productionData.sensors) ? productionData.sensors.map(String) : [];
        if (initialSensorIds.length > 0 && allSensorsData.length > 0) {
            initialSensorIds.forEach(sensorId => {
                const sensorData = allSensorsData.find(s => String(s.id) === sensorId || String(s.id_sensor) === sensorId);
                if (sensorData) {
                    selectedSensorsUpdate.push({
                        id: sensorData.id || sensorData.id_sensor,
                        name: sensorData.nombre_sensor || `Sensor ID ${sensorId}`,
                        quantity: 1
                    });
                } else {
                    console.warn(`Data for initial sensor ID ${sensorId} not found.`);
                    selectedSensorsUpdate.push({ id: sensorId, name: `Sensor ID ${sensorId} (No encontrado)`, quantity: 1 });
                }
            });
        }
        renderSelectedSensors('update');
        selectedSuppliesUpdate = [];
        const initialSupplyIds = Array.isArray(productionData.supplies) ? productionData.supplies.map(String) : [];
        if (initialSupplyIds.length > 0 && allSuppliesData.length > 0) {
            initialSupplyIds.forEach(supplyId => {
                const supplyData = allSuppliesData.find(s => String(s.id) === supplyId || String(s.id_insumo) === supplyId);
                if (supplyData) {
                    selectedSuppliesUpdate.push({
                        id: supplyData.id,
                        name: supplyData.nombre_insumo,
                        quantity: 1,
                        unit_value: supplyData.valor_unitario
                    });
                } else {
                    console.warn(`Data for initial supply ID ${supplyId} not found.`);
                    selectedSuppliesUpdate.push({ id: supplyId, name: `Insumo ID ${supplyId} (No encontrado)`, quantity: 0, unit_value: 0 });
                }
            });
        }
        renderSelectedSupplies('update');
        validateUpdateForm(false);
        checkFormValidityForSubmitButton('update');
    }

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

    async function displayProductionSensorsView(container, sensorIds) {
        if (!container) return;
        container.innerHTML = '<p>Cargando sensores...</p>';
        const ids = Array.isArray(sensorIds) ? sensorIds.map(String) : [];
        if (ids.length === 0) { container.innerHTML = '<p>No hay sensores asignados.</p>'; return; }
        try {
            if (allSensorsData.length === 0) {
                const sensorsResponse = await fetch(`http://localhost:3000/sensor/s`, { headers: getAuthHeaders() });
                if (!sensorsResponse.ok) throw new Error('Error al cargar lista de sensores para vista');
                const sensorsResult = await sensorsResponse.json();
                allSensorsData = sensorsResult.success ? sensorsResult.data : (Array.isArray(sensorsResult) ? sensorsResult : []);
                if (!Array.isArray(allSensorsData)) throw new Error('Formato inesperado de sensores');
            }
            container.innerHTML = '';
            const list = document.createElement('ul');
            list.className = 'dashboard__items-list dashboard__sensors-list-items dashboard__sensors-list-items--view';
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

    async function displayProductionSuppliesView(container, supplyIds) {
        if (!container) return;
        container.innerHTML = '<p>Cargando insumos...</p>';
        const ids = Array.isArray(supplyIds) ? supplyIds.map(String) : [];
        if (ids.length === 0) { container.innerHTML = '<p>No hay insumos asignados.</p>'; return; }
        try {
            if (allSuppliesData.length === 0) {
                const suppliesResponse = await fetch(`http://localhost:3000/api/insumos`, { headers: getAuthHeaders() });
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
                li.className = 'dashboard__selected-item';
                li.textContent = supply ? supply.nombre_insumo : `Insumo ID ${id} (No encontrado)`;
                list.appendChild(li);
            });
            container.appendChild(list);
            if (list.children.length === 0 && ids.length > 0) container.innerHTML = '<p>Detalles de insumos no encontrados.</p>';
        } catch (error) {
            console.error("Error mostrando insumos en vista:", error); container.innerHTML = '<p>Error al cargar datos de insumos.</p>';
        }
    }

    function formatDate(dateInput) {
        if (!dateInput || dateInput === '0000-00-00' || (typeof dateInput === 'string' && dateInput.startsWith('0001-'))) {
            return 'No definida';
        }
        try {
            let date;
            if (dateInput instanceof Date) { date = dateInput; } else {
                if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) { date = new Date(dateInput + 'T00:00:00Z'); } else { date = new Date(dateInput); }
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
        snackbar.className = 'snackbar';
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
            form.querySelectorAll('.dashboard__error').forEach(span => { span.textContent = ''; span.style.display = 'none'; });
            if (form.getAttribute('data-form') === 'create') {
                selectedSuppliesCreate = []; renderSelectedSupplies('create');
                selectedSensorsCreate = []; renderSelectedSensors('create');
                clearEstimation('create');
                const createBtn = form.querySelector('[data-action="create"]'); if (createBtn) createBtn.disabled = true;
                const addSensorBtn = form.querySelector('[data-action="add-selected-sensor"]'); if (addSensorBtn) addSensorBtn.disabled = false;
                const sensorSelect = form.querySelector('[data-field="available-sensors"]'); if (sensorSelect) sensorSelect.disabled = false;
                const quantityInput = form.querySelector('[data-field="sensor-quantity"]'); if (quantityInput) quantityInput.disabled = false;
            } else if (form.getAttribute('data-form') === 'update') {
                form.innerHTML = '';
                selectedSuppliesUpdate = [];
                selectedSensorsUpdate = [];
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
            if (!isNaN(unitValue) && item.quantity > 0) { totalInvestment += unitValue * item.quantity; } else { possible = false; }
        });
        if (possible) {
            investmentInput.value = `$${totalInvestment.toFixed(2)}`;
            const estimatedGoal = totalInvestment * 1.3;
            goalInput.value = `$${estimatedGoal.toFixed(2)}`;
        } else {
            investmentInput.value = 'N/A (Datos incompletos)';
            goalInput.value = 'N/A (Datos incompletos)';
        }
    }
    function clearEstimation(context) {
        const form = document.querySelector(`[data-form="${context}"]`);
        if (!form) return;
        const investmentInput = form.querySelector('[data-field="investment"]'); if (investmentInput) investmentInput.value = '';
        const goalInput = form.querySelector('[data-field="goal"]'); if (goalInput) goalInput.value = '';
    }
    function saveAsDraft() {
        showSnackbar('Borrador guardado exitosamente');
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
            const response = await fetch(`${API_BASE_URL}/productions`, { headers: getAuthHeaders() });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({error: 'Error de red'}));
                 throw new Error(errorData.error || `Error al obtener producciones: ${response.statusText}`);
            }
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
            tableBody.innerHTML = `<tr><td colspan="6" class="dashboard__table-cell dashboard__table-cell--error">Error al cargar. Verifique que ha iniciado sesión.</td></tr>`;
        }
    }

    function navigateToActionTab(tabName, productionId) {
        const targetTab = document.querySelector(`.navigation__tab[data-tab="${tabName}"]`);
        if (targetTab) {
            targetTab.click();
            setTimeout(() => {
                let inputSelector, formSelector;
                if (tabName === 'view') { inputSelector = '[data-form="view-search"] [data-field="production-id-search"]'; formSelector = '[data-form="view-search"]'; } else if (tabName === 'update') { inputSelector = '[data-form="search-update"] [data-field="production-id"]'; formSelector = '[data-form="search-update"]'; } else if (tabName === 'enable') { inputSelector = '[data-form="enable"] [data-field="production-id"]'; formSelector = '[data-form="enable"]'; } else { return; }
                const input = document.querySelector(inputSelector); const form = document.querySelector(formSelector);
                if (input && form) { input.value = `prod-${productionId}`; form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); } else { console.warn(`Elementos no encontrados para tab ${tabName}`); }
            }, 150);
        } else { console.error(`Tab ${tabName} no encontrada.`); }
    }

    async function generateReport() {
        const form = document.querySelector('[data-form="report"]'); if (!form) return;
        const startDate = form.querySelector('[data-field="start-date"]').value; const endDate = form.querySelector('[data-field="end-date"]').value;
        const format = form.querySelector('input[name="format"]:checked')?.value || 'excel'; const errorSpan = form.querySelector('[data-error="date-range"]');
        if (errorSpan) { errorSpan.textContent = ''; errorSpan.style.display = 'none'; }
        if (!startDate || !endDate) { if (errorSpan) { errorSpan.textContent = 'Seleccione ambas fechas'; errorSpan.style.display = 'block'; } showSnackbar('Seleccione un rango de fechas', 'warning'); return; }
        if (new Date(startDate) > new Date(endDate)) { if (errorSpan) { errorSpan.textContent = 'Inicio > Fin'; errorSpan.style.display = 'block'; } showSnackbar('Rango de fechas inválido', 'warning'); return; }
        showSnackbar(`Generando reporte ${format.toUpperCase()}...`, 'info');
        try { await new Promise(resolve => setTimeout(resolve, 1500)); showSnackbar(`Reporte ${format.toUpperCase()} generado`); form.reset(); } catch (error) { showSnackbar('Error al generar reporte', 'error'); }
    }

    function getSensorIcon(type) {
        if (!type) return 'sensors';
        const typeLower = type.toLowerCase();
        const icons = { 'humedad': 'opacity', 'temperatura': 'thermostat', 'nutrientes': 'eco', 'luz': 'wb_sunny', 'ph': 'science' };
        return icons[typeLower] || 'sensors';
    }

    function updateSimulatedMetrics(section) {
        const health = section.querySelector('[data-metric="health"]'); if (health) health.textContent = `${Math.floor(Math.random() * 20) + 70}%`;
        const growth = section.querySelector('[data-metric="growth"]'); if (growth) growth.textContent = `${Math.floor(Math.random() * 20) + 50}cm`;
        const yield_ = section.querySelector('[data-metric="yield"]'); if (yield_) yield_.textContent = `${Math.floor(Math.random() * 20) + 70}%`;
    }

    function createAllCharts(section, data) {
        createChart(section.querySelector('[data-chart="humidity"]'), 'Humedad (%)', data.humidity);
        createChart(section.querySelector('[data-chart="temperature"]'), 'Temperatura (°C)', data.temperature);
        createChart(section.querySelector('[data-chart="nutrients"]'), 'Nutrientes (%)', data.nutrients);
        createChart(section.querySelector('[data-chart="growth"]'), 'Crecimiento (cm)', data.growth);
    }

    function generateSensorData() {
        return {
            humidity: Array(7).fill(0).map(() => Math.floor(Math.random() * 30) + 50),
            temperature: Array(7).fill(0).map(() => Math.floor(Math.random() * 10) + 18),
            nutrients: Array(7).fill(0).map(() => Math.floor(Math.random() * 40) + 60),
            growth: Array(7).fill(0).map((_, i) => (i + 1) * (Math.random() * 2 + 3) + Math.floor(Math.random() * 5))
        };
    }

    function generateRealisticSensorData(sensorType, numPoints = 15, baseValue, variation, trend = 0, seasonalFactor = 0) {
        const data = [];
        let currentValue = baseValue;
        for (let i = 0; i < numPoints; i++) {
            let pointValue = currentValue;
            pointValue += (Math.random() - 0.5) * variation;
            currentValue += trend / numPoints;
            if (seasonalFactor !== 0) {
                pointValue += Math.sin((i / numPoints) * 2 * Math.PI * seasonalFactor) * (variation / 2);
            }
            if (sensorType === 'humidity') pointValue = Math.max(20, Math.min(100, pointValue));
            else if (sensorType === 'temperature') pointValue = Math.max(5, Math.min(40, pointValue));
            else if (sensorType === 'ph') pointValue = Math.max(4, Math.min(9, pointValue));
            else if (sensorType === 'ec') pointValue = Math.max(0.5, Math.min(3.5, pointValue));
            else if (sensorType === 'growth') pointValue = Math.max(0, pointValue);
            data.push(parseFloat(pointValue.toFixed(1)));
        }
        return data;
    }

    function getTimeLabels(numPoints) {
        return Array.from({ length: numPoints }, (_, i) => `T ${i + 1}`);
    }

    let charts = {};
    let viewCharts = {};
    function createChart(canvasElement, label, data, timeLabels, unitSuffix = '') {
        if (!canvasElement) { console.warn("Canvas element not provided for chart:", label); return; }
        const chartId = canvasElement.getAttribute('data-chart');
        if (!chartId) { console.warn("Canvas element missing data-chart attribute:", canvasElement); return; }
        if (viewCharts[chartId]) {
            viewCharts[chartId].destroy();
        }
        const ctx = canvasElement.getContext('2d');
        viewCharts[chartId] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: timeLabels || getTimeLabels(data.length),
                datasets: [{
                    label: label,
                    data: data,
                    borderColor: 'var(--color-primary, #6FC046)',
                    backgroundColor: 'rgba(111, 192, 70, 0.1)',
                    tension: 0.2,
                    fill: true,
                    pointRadius: 2,
                    pointHoverRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${context.parsed.y.toFixed(1)} ${unitSuffix}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        ticks: {
                            font: { size: 10 },
                            maxTicksLimit: 5,
                            callback: function(value) {
                                return value.toFixed(1) + ` ${unitSuffix}`;
                            }
                        }
                    },
                    x: {
                        ticks: {
                            font: { size: 10 },
                            autoSkip: true,
                            maxRotation: 0,
                            minRotation: 0,
                            maxTicksLimit: 7
                        }
                    }
                }
            }
        });
    }

    // --- Run Initialization ---
    init();
});