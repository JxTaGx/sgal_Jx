// Original integracion.js structure with modifications ONLY for the new supplies section

document.addEventListener('DOMContentLoaded', function() {
    // Variables globales
    let currentProductionId = null;
    let currentPage = 1;
    const productionsPerPage = 5;
    let allSuppliesData = []; // <<< NUEVO: Para guardar datos completos de insumos
    let selectedSupplies = []; // <<< NUEVO: Para guardar insumos seleccionados {id, name, quantity}
    let filteredProductions = []; // <<< ORIGINAL: Mantenida para la lógica de lista existente

    // URL base de la API
    const API_BASE_URL = 'http://localhost:3000/api'; // <<< ORIGINAL

    // Inicialización
    async function init() {
        setupNavigation();
        setupCreateForm();
        setupViewForm();
        setupUpdateForm();
        setupEnableForm();
        setupListSection();
        setupReportForm();
        await populateDropdownsAndSupplyData(); // <<< MODIFICADO: Nombre cambiado para claridad
        await loadProductionsList();
    }

    // Configuración de navegación entre pestañas (Sin cambios respecto al original)
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

                // Llamar a resetForms aquí como en el original, asegurándonos que maneje el nuevo estado de 'create'
                resetForms();
            });
        });
    }

    // Llenar dropdowns con datos de la base de datos
    // MODIFICADO: para separar la carga de insumos y usar endpoints correctos
    async function populateDropdownsAndSupplyData() {
        try {
            // 1. Fetch datos para Users, Cultivations, Cycles, Sensors desde /integracion/data
            const integrationDataResponse = await fetch(`${API_BASE_URL}/integracion/data`);
            if (!integrationDataResponse.ok) throw new Error('Error al obtener datos de integración');
            const integrationDataResult = await integrationDataResponse.json();
            if (!integrationDataResult.success) throw new Error(integrationDataResult.error || 'Error en datos de integración');
            const data = integrationDataResult.data;

            // Responsables (Usa datos de /integracion/data)
            const responsibleSelect = document.querySelector('[data-field="responsible"]');
            if (responsibleSelect) {
                responsibleSelect.innerHTML = '<option value="">Seleccione un responsable</option>';
                 // Usa data.users que tiene {id, name}
                (data.users || []).forEach(user => {
                    const option = document.createElement('option');
                    option.value = user.id;
                    option.textContent = user.name; // Ya viene formateado desde el backend
                    responsibleSelect.appendChild(option);
                });
            }

            // Cultivos (Usa datos de /integracion/data)
            const cultivationSelect = document.querySelector('[data-field="cultivation"]');
             if (cultivationSelect) {
                cultivationSelect.innerHTML = '<option value="">Seleccione un cultivo</option>';
                 // Usa data.cultivations que tiene {id, name}
                (data.cultivations || []).forEach(cult => {
                    const option = document.createElement('option');
                    option.value = cult.id; // ID ya es id_cultivo mapeado por backend
                    option.textContent = cult.name; // Ya es nombre_cultivo mapeado por backend
                    cultivationSelect.appendChild(option);
                });
            }

            // Ciclos (Usa datos de /integracion/data)
            const cycleSelect = document.querySelector('[data-field="cycle"]');
            if (cycleSelect) {
                cycleSelect.innerHTML = '<option value="">Seleccione un ciclo</option>';
                 // Usa data.cycles que tiene {id, name}
                (data.cycles || []).forEach(cycle => {
                    const option = document.createElement('option');
                    option.value = cycle.id; // ID ya es id_ciclo mapeado por backend
                    option.textContent = cycle.name; // Ya es nombre_ciclo mapeado por backend
                    cycleSelect.appendChild(option);
                });
            }

            // Sensores (Usa datos de /integracion/data - multi-select original)
            const sensorsSelect = document.querySelector('[data-field="sensors"]');
             if (sensorsSelect) {
                sensorsSelect.innerHTML = ''; // El multi-select original no tenía opción default
                // Usa data.sensors que tiene {id, name} (name concatenado por backend)
                (data.sensors || []).forEach(sensor => {
                    const option = document.createElement('option');
                    option.value = sensor.id;
                    option.textContent = sensor.name;
                    sensorsSelect.appendChild(option);
                });
            }

            // 2. Fetch datos COMPLETOS de Insumos desde /api/insumos
            const suppliesResponse = await fetch(`${API_BASE_URL}/insumos`); // Endpoint que devuelve detalles completos
            if (!suppliesResponse.ok) throw new Error('Error al obtener lista de insumos detallada');
            const suppliesResult = await suppliesResponse.json();
            allSuppliesData = suppliesResult.success ? suppliesResult.data : (Array.isArray(suppliesResult) ? suppliesResult : []); // Almacena datos completos {id, nombre_insumo, valor_unitario, ...}
            if (!Array.isArray(allSuppliesData)) {
                 allSuppliesData = []; // Asegura que sea un array
                 throw new Error('Formato inesperado de datos de insumos detallados');
             }

            // 3. Poblar el NUEVO dropdown de selección de insumos disponibles
            const availableSuppliesSelect = document.querySelector('[data-panel="create"] [data-field="available-supplies"]');
            if (availableSuppliesSelect) {
                availableSuppliesSelect.innerHTML = '<option value="">Seleccione un insumo para agregar</option>';
                allSuppliesData.forEach(supply => {
                    const option = document.createElement('option');
                    option.value = supply.id; // ID del insumo
                    option.textContent = supply.nombre_insumo; // Nombre real del insumo
                    availableSuppliesSelect.appendChild(option);
                });
            }

             // Generar ID automático para nueva producción (Lógica original)
             // Esta lógica podría ser imprecisa si se basa en filteredProductions que es para la lista. Es mejor llamar al API.
             try {
                const prodResponse = await fetch(`${API_BASE_URL}/productions`);
                const productionsResult = await prodResponse.json();
                const productionsData = Array.isArray(productionsResult.data) ? productionsResult.data : [];
                const nextId = productionsData.length > 0 ?
                    Math.max(0, ...productionsData.map(p => parseInt(p.id) || 0)) + 1 : 1;
                 const prodIdInput = document.querySelector('[data-field="production-id"]');
                 if (prodIdInput) prodIdInput.value = `prod-${nextId}`;
             } catch(e) {
                 console.error("Error fetching next production ID:", e);
                 const prodIdInput = document.querySelector('[data-field="production-id"]');
                 if (prodIdInput) prodIdInput.value = 'prod-error';
             }


        } catch (error) {
            console.error('Error al poblar datos:', error);
            showSnackbar(`Error al cargar datos iniciales: ${error.message || 'Error desconocido'}`, 'error');
        }
    }


    // Configurar formulario de creación
    function setupCreateForm() {
        const form = document.querySelector('[data-form="create"]');
        if (!form) return;

        // Calcular Estimación: Mantener el botón original si existía, o añadir uno si no
        // const calculateButton = form.querySelector('[data-action="calculate"]'); // Buscar si existe
        // if (calculateButton) {
        //     calculateButton.addEventListener('click', calculateEstimation);
        // } else {
        //      // Si no existe el botón, tal vez la estimación es automática en validateCreateForm
        // }

        form.querySelector('[data-action="cancel"]')?.addEventListener('click', resetForms); // Usa resetForms general
        form.querySelector('[data-action="save-draft"]')?.addEventListener('click', saveAsDraft);

        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            await createProduction();
        });

        // Listeners de validación (original)
        form.querySelectorAll('[required]').forEach(input => {
            input.addEventListener('change', validateCreateForm);
            // input.addEventListener('input', validateCreateForm); // Puede ser muy agresivo para selects
        });
         // Validar sensores en change (original)
         const sensorSelect = form.querySelector('[data-field="sensors"]');
         if (sensorSelect) sensorSelect.addEventListener('change', validateCreateForm);

         // <<< NUEVO: Listener para el botón "Agregar" de insumos >>>
         const addSupplyButton = form.querySelector('[data-action="add-selected-supply"]');
         if (addSupplyButton) {
             addSupplyButton.addEventListener('click', addSelectedSupplyToList);
         }

        // <<< COMENTADO/ELIMINADO: Listeners para la lógica antigua de insumos >>>
        // const oldAddSupplyButton = form.querySelector('[data-action="add-supply"]');
        // if (oldAddSupplyButton) {
        //     oldAddSupplyButton.addEventListener('click', function() {
        //         // Lógica antigua que mostraba [data-supply-quantity]... ya no necesaria
        //         // const quantityContainer = document.querySelector('[data-supply-quantity]');
        //         // quantityContainer.style.display = 'grid';
        //     });
        // }
        // const oldConfirmSupplyButton = form.querySelector('[data-action="confirm-supply"]');
        // if (oldConfirmSupplyButton) {
        //     // Listener antiguo... ya no necesario
        // }

         // Deshabilitar botón Crear inicialmente (original)
         const createBtn = form.querySelector('[data-action="create"]');
         if (createBtn) createBtn.disabled = true;

         // Listeners para habilitar botón (originales, pero validarán con la nueva lógica de insumos)
         form.querySelectorAll('input[required], select[required]').forEach(el => {
            el.addEventListener('change', validateCreateForm);
            el.addEventListener('input', validateCreateForm); // Mantener input para texto?
         });
    }

    // --- NUEVO: Funciones para manejar la lista de insumos seleccionados ---
    function addSelectedSupplyToList() {
        const form = document.querySelector('[data-form="create"]');
        const supplySelect = form.querySelector('[data-field="available-supplies"]');
        const quantityInput = form.querySelector('[data-field="supply-quantity"]');
        const errorSpan = form.querySelector('[data-error="supplies"]');

        const supplyId = supplySelect.value;
        const quantity = parseInt(quantityInput.value);

        if (!supplyId) { showSnackbar('Seleccione un insumo', 'warning'); return; }
        if (isNaN(quantity) || quantity <= 0) { showSnackbar('Ingrese una cantidad válida', 'warning'); return; }
        if (selectedSupplies.some(item => item.id == supplyId)) { showSnackbar('Insumo ya agregado', 'warning'); return; }

        const supplyData = allSuppliesData.find(s => s.id == supplyId); // Busca en los datos completos
        if (!supplyData) { showSnackbar('Error: Datos del insumo no encontrados', 'error'); return; }

        selectedSupplies.push({
            id: supplyId,
            name: supplyData.nombre_insumo, // Nombre correcto
            quantity: quantity
        });

        renderSelectedSupplies(); // Actualiza la lista en la UI
        supplySelect.value = "";
        quantityInput.value = "";
        if(errorSpan) errorSpan.style.display = 'none';
        validateCreateForm(); // Revalida el formulario
    }

    function removeSelectedSupply(supplyIdToRemove) {
        selectedSupplies = selectedSupplies.filter(item => item.id != supplyIdToRemove);
        renderSelectedSupplies();
        validateCreateForm();
    }

    function renderSelectedSupplies() {
        const container = document.querySelector('[data-list="selected-supplies"]');
        if (!container) return;
        container.innerHTML = ''; // Limpia

        if (selectedSupplies.length === 0) {
            container.innerHTML = '<p>No hay insumos agregados.</p>';
        } else {
            const list = document.createElement('ul');
            list.className = 'dashboard__supplies-list-items'; // Usa una clase para estilizar si quieres
            selectedSupplies.forEach(item => {
                const listItem = document.createElement('li');
                listItem.innerHTML = `
                    <span>${item.name} (Cantidad: ${item.quantity})</span>
                    <button type="button" class="dashboard__button--remove-supply" data-supply-id="${item.id}" title="Eliminar">&times;</button>
                `;
                listItem.querySelector('.dashboard__button--remove-supply').addEventListener('click', (e) => {
                    removeSelectedSupply(e.currentTarget.getAttribute('data-supply-id'));
                });
                list.appendChild(listItem);
            });
            container.appendChild(list);
        }
    }
    // --- FIN NUEVO ---

    // Calcular estimación
    // MODIFICADO: para usar la nueva lista selectedSupplies y datos de allSuppliesData
    function calculateEstimation() {
        const investmentInput = document.querySelector('[data-field="investment"]');
        const goalInput = document.querySelector('[data-field="goal"]');
        if (!investmentInput || !goalInput) return; // Salir si no existen los campos

         if (selectedSupplies.length === 0) {
             investmentInput.value = '';
             goalInput.value = '';
             return; // Nada que calcular
         }

         let totalInvestment = 0;
         let possible = true;

        selectedSupplies.forEach(item => {
             const supplyData = allSuppliesData.find(s => s.id == item.id); // Usar datos completos
             if (supplyData && supplyData.valor_unitario != null) {
                 const unitValue = parseFloat(supplyData.valor_unitario);
                 if (!isNaN(unitValue)) {
                     totalInvestment += unitValue * item.quantity;
                 } else { possible = false; }
             } else {
                 possible = false; // Falta el precio
             }
         });

         if (possible) {
             investmentInput.value = `$${totalInvestment.toFixed(2)}`;
             const estimatedGoal = totalInvestment * 1.3; // Ejemplo de cálculo de meta
             goalInput.value = `$${estimatedGoal.toFixed(2)}`;
         } else {
             investmentInput.value = 'N/A (Faltan precios)';
             goalInput.value = 'N/A';
         }

         // Habilitar el botón de crear producción (si la estimación se calcula manualmente con botón)
         // Si es automático en validate, no se necesita aquí.
         // document.querySelector('[data-action="create"]').disabled = !possible;
    }

    // Validar formulario de creación
    // MODIFICADO: para validar la nueva lista de insumos
    function validateCreateForm() {
        const form = document.querySelector('[data-form="create"]');
        if (!form) return false;
        let isValid = true;

        // Validación de campos required (original)
        form.querySelectorAll('[required]').forEach(input => {
            const errorElement = form.querySelector(`[data-error="${input.getAttribute('data-field')}"]`);
            let fieldValid = true;
            let errorMessage = 'Este campo es requerido';

             if (input.tagName === 'SELECT' && input.multiple) {
                if (input.selectedOptions.length === 0) { fieldValid = false; }
                if (input.getAttribute('data-field') === 'sensors') { // Validación específica sensores (original)
                     if (input.selectedOptions.length > 3) { fieldValid = false; errorMessage = 'Máximo 3 sensores'; }
                     else if (input.selectedOptions.length === 0) { fieldValid = false; } // Si es requerido, 0 es inválido
                 }
            } else if (!input.value || !input.value.trim()) {
                 if(input.type === 'date' && !input.value) { fieldValid = false; }
                 else if (input.type !== 'date' && (!input.value || !input.value.trim())) { fieldValid = false; }
            }

             if (!fieldValid) {
                 if (errorElement) { errorElement.textContent = errorMessage; errorElement.style.display = 'block'; }
                 isValid = false;
             } else {
                 if (errorElement) { errorElement.style.display = 'none'; }
             }
        });

        // <<< NUEVO: Validación de Insumos >>>
        const supplyErrorElement = form.querySelector('[data-error="supplies"]');
        if (selectedSupplies.length === 0) {
            if (supplyErrorElement) {
                supplyErrorElement.textContent = 'Debe agregar al menos un insumo';
                supplyErrorElement.style.display = 'block';
            }
            isValid = false;
        } else {
            if (supplyErrorElement) {
                supplyErrorElement.style.display = 'none';
            }
        }
        // <<< FIN NUEVO >>>

        // Calcular estimación automáticamente si el formulario es válido hasta ahora
        if (isValid) {
            calculateEstimation(); // Llama a la función modificada
        } else {
             // Limpia estimaciones si el formulario se vuelve inválido
             const investmentInput = document.querySelector('[data-field="investment"]');
             const goalInput = document.querySelector('[data-field="goal"]');
             if (investmentInput) investmentInput.value = '';
             if (goalInput) goalInput.value = '';
        }


        // Habilitar/Deshabilitar botón Crear (original)
        const createButton = form.querySelector('[data-action="create"]');
        if (createButton) {
            createButton.disabled = !isValid;
        }

        return isValid;
    }


    // Crear nueva producción
    // MODIFICADO: para enviar IDs de insumos desde selectedSupplies
    async function createProduction() {
        if (!validateCreateForm()) {
             showSnackbar("Formulario inválido.", "warning");
             return;
        }

        const form = document.querySelector('[data-form="create"]');

        // <<< NUEVO: Obtener IDs de insumos de la lista interna >>>
        const supplyIdsForApi = selectedSupplies.map(item => item.id);

        const newProduction = {
            name: form.querySelector('[data-field="name"]').value,
            responsible: form.querySelector('[data-field="responsible"]').value,
            cultivation: form.querySelector('[data-field="cultivation"]').value,
            cycle: form.querySelector('[data-field="cycle"]').value,
            sensors: Array.from(form.querySelector('[data-field="sensors"]').selectedOptions).map(opt => opt.value),
            supplies: supplyIdsForApi, // <<< USA LA NUEVA LISTA DE IDs >>>
            startDate: form.querySelector('[data-field="start-date"]').value,
            endDate: form.querySelector('[data-field="end-date"]').value
        };

        try {
            // Llamada API (original)
            const response = await fetch(`${API_BASE_URL}/productions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newProduction)
            });
            const result = await response.json();

            if (!response.ok || !result.success) { // Asume que backend devuelve {success: true/false}
                 throw new Error(result.error || result.message || 'Error al crear producción');
            }

            showSnackbar(`Producción creada: ${result.displayId || result.id}`);
            resetForms(); // Llama al reset general
            await loadProductionsList();

        } catch (error) {
            console.error('Error al crear producción:', error);
            showSnackbar(`Error: ${error.message}`, 'error');
        }
    }

    // Generar datos simulados de sensores (original)
    function generateSensorData() {
        return {
            humidity: Array(7).fill(0).map(() => Math.floor(Math.random() * 20) + 60),
            temperature: Array(7).fill(0).map(() => Math.floor(Math.random() * 10) + 20),
            nutrients: Array(7).fill(0).map(() => Math.floor(Math.random() * 20) + 40),
            growth: Array(7).fill(0).map((_, i) => i * 10 + Math.floor(Math.random() * 5))
        };
    }

    // Guardar como borrador (original)
    function saveAsDraft() {
        showSnackbar('Borrador guardado exitosamente (simulado)');
    }

    // Configurar formulario de visualización (original - sin cambios aquí)
    function setupViewForm() {
        const form = document.querySelector('[data-form="view"]');
        if (!form) return;
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            const productionIdInput = form.querySelector('[data-field="production-id"]');
            const productionId = productionIdInput?.value?.trim();
            if (!productionId) { showSnackbar("Ingrese ID", "warning"); return; }
            const idMatch = productionId.match(/(\d+)$/);
            const actualId = idMatch ? idMatch[1] : productionId;
            await viewProduction(actualId);
        });
    }

    // Visualizar producción (original - sin cambios aquí, asume que el backend devuelve todo)
    async function viewProduction(productionId) {
        const resultSection = document.querySelector('[data-result="view"]');
        if (!resultSection) return;
        resultSection.classList.add('dashboard__result--hidden'); // Oculta anterior

        try {
            const response = await fetch(`${API_BASE_URL}/productions/${productionId}`);
            if (!response.ok) {
                 if (response.status === 404) throw new Error('Producción no encontrada');
                 throw new Error('Error al obtener producción');
             }
            const result = await response.json();
            if (!result.success || !result.data) throw new Error(result.error || 'Producción no encontrada');

            const production = result.data;
            currentProductionId = production.id; // Guarda ID real

            // Llenar info básica (original)
            const basicInfoContainer = resultSection.querySelector('[data-info="basic"]');
            if(basicInfoContainer) {
                basicInfoContainer.innerHTML = '';
                const info = [
                    { label: 'ID', value: `prod-${production.id}`}, { label: 'Nombre', value: production.name },
                    { label: 'Responsable', value: production.responsible_name || 'N/A' }, { label: 'Cultivo', value: production.cultivation_name || 'N/A' },
                    { label: 'Ciclo', value: production.cycle_name || 'N/A' }, { label: 'Inicio', value: formatDate(production.start_date) },
                    { label: 'Fin Est.', value: formatDate(production.end_date) }, { label: 'Estado', value: production.status === 'active' ? 'Activo' : 'Inactivo' }
                ];
                info.forEach(i => {
                     const item = document.createElement('div'); item.className = 'dashboard__info-item';
                     item.innerHTML = `<div class="dashboard__info-label">${i.label}</div><div class="dashboard__info-value">${i.value || 'N/A'}</div>`;
                     basicInfoContainer.appendChild(item);
                });
            }

            // Métricas simuladas (original)
             updateSimulatedMetrics(resultSection);

            // Gráficos simulados (original)
             createAllCharts(resultSection, generateSensorData());

            // Mostrar Sensores (original - adaptado para mostrar nombres)
             await displayProductionSensorsView(resultSection, production.sensors || []);

            // <<< NUEVO: Mostrar Insumos (solo nombres, sin cantidad porque no se guarda) >>>
            await displayProductionSuppliesView(resultSection, production.supplies || []);

            resultSection.classList.remove('dashboard__result--hidden'); // Muestra sección

        } catch (error) {
            console.error('Error al visualizar:', error);
            showSnackbar(error.message, 'error');
            resultSection.classList.add('dashboard__result--hidden');
        }
    }
     // Helper para métricas simuladas (original)
     function updateSimulatedMetrics(section) {
         const health = section.querySelector('[data-metric="health"]'); if (health) health.textContent = `${Math.floor(Math.random()*20)+70}%`;
         const growth = section.querySelector('[data-metric="growth"]'); if (growth) growth.textContent = `${Math.floor(Math.random()*20)+50}cm`;
         const yield_ = section.querySelector('[data-metric="yield"]'); if (yield_) yield_.textContent = `${Math.floor(Math.random()*20)+70}%`;
     }
     // Helper para crear todos los gráficos (original)
     function createAllCharts(section, data) {
         createChart(section.querySelector('[data-chart="humidity"]'), 'Humedad (%)', data.humidity);
         createChart(section.querySelector('[data-chart="temperature"]'), 'Temperatura (°C)', data.temperature);
         createChart(section.querySelector('[data-chart="nutrients"]'), 'Nutrientes (%)', data.nutrients);
         createChart(section.querySelector('[data-chart="growth"]'), 'Crecimiento (cm)', data.growth);
     }

    // Mostrar Sensores en la vista (basado en la versión anterior)
    async function displayProductionSensorsView(resultSection, sensorIds) {
        const container = resultSection.querySelector('[data-info="sensors"]');
        if (!container) return;
        container.innerHTML = '<p>Cargando sensores...</p>';
        const ids = Array.isArray(sensorIds) ? sensorIds : [];
        if (ids.length === 0) { container.innerHTML = '<p>No hay sensores.</p>'; return; }

        try {
             // Fetch full sensor list - reutilizar datos si ya están cargados? No en esta versión simple.
             const sensorsResponse = await fetch(`${API_BASE_URL}/sensores`); // Asume GET /api/sensores existe
             if (!sensorsResponse.ok) throw new Error('Error al cargar lista de sensores');
             const sensorsResult = await sensorsResponse.json(); // Asume devuelve array directamente o {success, data}
             const allSensors = sensorsResult.success ? sensorsResult.data : (Array.isArray(sensorsResult)? sensorsResult : []);

            container.innerHTML = ''; // Limpia
            ids.forEach(id => {
                const sensor = allSensors.find(s => s.id == id);
                if (sensor) {
                     const card = document.createElement('div'); card.className = 'dashboard__sensor-card';
                     card.innerHTML = `<i class="material-icons dashboard__sensor-icon">${getSensorIcon(sensor.tipo_sensor)}</i> <div class="dashboard__sensor-info"> <div class="dashboard__sensor-name">${sensor.nombre_sensor || ''}</div> <div class="dashboard__sensor-meta"> <span>${sensor.tipo_sensor || ''}</span> <span style="color: ${sensor.estado === 'activo' || sensor.estado === 'disponible' ? 'var(--color-success)' : 'var(--color-error)'};"> ${sensor.estado || ''} </span> </div> </div>`;
                     container.appendChild(card);
                 } else { /* Opcional: Mostrar ID no encontrado */ }
            });
             if (container.children.length === 0) container.innerHTML = '<p>Detalles no encontrados.</p>';
         } catch (error) {
             console.error("Error mostrando sensores:", error);
             container.innerHTML = '<p>Error al cargar sensores.</p>';
         }
    }

    // <<< NUEVO: Mostrar Insumos en la vista (basado en IDs) >>>
    async function displayProductionSuppliesView(resultSection, supplyIds) {
         // Asume que tienes un <div data-info="supplies"></div> en tu HTML de visualización
        const container = resultSection.querySelector('[data-info="supplies"]');
        if (!container) { console.warn("Contenedor [data-info='supplies'] no encontrado en HTML view"); return; }
        container.innerHTML = '<p>Cargando insumos...</p>';
        const ids = Array.isArray(supplyIds) ? supplyIds : [];
        if (ids.length === 0) { container.innerHTML = '<p>No hay insumos.</p>'; return; }

        try {
            // Usa los datos completos de insumos ya cargados si existen
            if (allSuppliesData.length === 0) {
                const suppliesResponse = await fetch(`${API_BASE_URL}/insumos`);
                if (!suppliesResponse.ok) throw new Error('Error al obtener lista de insumos');
                const suppliesResult = await suppliesResponse.json();
                allSuppliesData = suppliesResult.success ? suppliesResult.data : (Array.isArray(suppliesResult) ? suppliesResult : []);
                 if (!Array.isArray(allSuppliesData)) throw new Error('Formato inesperado de insumos');
            }

            container.innerHTML = '';
            const list = document.createElement('ul'); list.className = 'dashboard__supplies-list-items'; // Reusa estilo
            ids.forEach(id => {
                const supply = allSuppliesData.find(s => s.id == id);
                const li = document.createElement('li');
                li.textContent = supply ? supply.nombre_insumo : `Insumo ID ${id} (No encontrado)`;
                // No hay cantidad disponible aquí porque no se guarda
                list.appendChild(li);
            });
            container.appendChild(list);
            if (list.children.length === 0) container.innerHTML = '<p>Detalles no encontrados.</p>';
        } catch (error) {
            console.error("Error mostrando insumos:", error);
            container.innerHTML = '<p>Error al cargar insumos.</p>';
        }
    }


    // Obtener icono para el tipo de sensor (original)
    function getSensorIcon(type) {
        const icons = { 'humedad': 'opacity', 'temperatura': 'thermostat', 'nutrientes': 'eco', 'luz': 'wb_sunny' };
        return icons[type?.toLowerCase()] || 'sensors'; // Más seguro con optional chaining
    }

    // Crear gráfico (original)
    function createChart(canvasElement, label, data) {
         if (!canvasElement) return;
         const ctx = canvasElement.getContext('2d');
         if (canvasElement.chartInstance) { canvasElement.chartInstance.destroy(); } // Usa una propiedad custom para guardar la instancia
         const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
         canvasElement.chartInstance = new Chart(ctx, {
             type: 'line',
             data: { labels: days.slice(0, data.length), datasets: [{ label: label, data: data, borderColor: 'var(--color-primary)', backgroundColor: 'rgba(111, 192, 70, 0.1)', tension: 0.4, fill: true }] },
             options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: false } } }
         });
     }

    // Configurar formulario de actualización (original - sin cambios aquí)
     function setupUpdateForm() {
        const searchForm = document.querySelector('[data-form="search-update"]');
        const updateFormEl = document.querySelector('[data-form="update"]'); // El formulario que se oculta/muestra

        if (!searchForm || !updateFormEl) return;

        searchForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const productionIdInput = searchForm.querySelector('[data-field="production-id"]');
            const productionId = productionIdInput?.value?.trim();
            if (!productionId) { showSnackbar("Ingrese ID", "warning"); return; }

            updateFormEl.classList.add('dashboard__form--hidden'); // Oculta form anterior
            searchForm.reset(); // Limpia búsqueda

            const idMatch = productionId.match(/(\d+)$/);
            const actualId = idMatch ? idMatch[1] : productionId;

            try {
                const response = await fetch(`${API_BASE_URL}/productions/${actualId}`);
                if (!response.ok) { if (response.status === 404) throw new Error("No encontrado"); throw new Error("Error"); }
                const result = await response.json();
                if (!result.success || !result.data) throw new Error("No encontrado");

                const production = result.data;
                currentProductionId = actualId; // Guarda ID para actualizar

                // Poblar el formulario existente (lógica original)
                 populateExistingUpdateForm(updateFormEl, production); // Necesita esta función helper

                updateFormEl.classList.remove('dashboard__form--hidden'); // Muestra form
            } catch (error) {
                console.error('Error buscando para actualizar:', error);
                showSnackbar(error.message, 'error');
                updateFormEl.classList.add('dashboard__form--hidden');
            }
        });

        // Listener para el submit del formulario de actualización (original)
        updateFormEl.addEventListener('submit', async function(e) {
            e.preventDefault();
            await updateProduction();
        });

        // Listener para el botón cancelar del formulario de actualización (original)
         const cancelButton = updateFormEl.querySelector('[data-action="cancel-update"]');
         if (cancelButton) {
             cancelButton.addEventListener('click', () => {
                 updateFormEl.classList.add('dashboard__form--hidden');
                 // No limpiar el form aquí, se limpia al buscar de nuevo
             });
         }
    }

     // Helper para poblar el formulario de actualización existente (basado en el original)
     async function populateExistingUpdateForm(formElement, productionData) {
         // Necesitamos los datos de los dropdowns aquí también
         try {
             const dropdownsResponse = await fetch(`${API_BASE_URL}/integracion/data`);
             if (!dropdownsResponse.ok) throw new Error('Error al cargar datos para formulario de actualización');
             const dropdownsResult = await dropdownsResponse.json();
             if (!dropdownsResult.success) throw new Error('Error al cargar datos para formulario de actualización');
             const dropdownData = dropdownsResult.data;

             // Poblar campos estándar
             formElement.querySelector('[data-field="name"]').value = productionData.name || '';
             formElement.querySelector('[data-field="start-date"]').value = productionData.start_date ? new Date(productionData.start_date).toISOString().split('T')[0] : '';
             formElement.querySelector('[data-field="end-date"]').value = productionData.end_date ? new Date(productionData.end_date).toISOString().split('T')[0] : '';

             // Poblar selects
             populateSelectExisting(formElement.querySelector('[data-field="responsible"]'), dropdownData.users || [], productionData.responsible);
             populateSelectExisting(formElement.querySelector('[data-field="cultivation"]'), dropdownData.cultivations || [], productionData.cultivation);
             populateSelectExisting(formElement.querySelector('[data-field="cycle"]'), dropdownData.cycles || [], productionData.cycle);
             populateSelectExisting(formElement.querySelector('[data-field="status"]'), [{id: 'active', name: 'Activo'}, {id: 'inactive', name: 'Inactivo'}], productionData.status);

              // Poblar multi-select de sensores
             const sensorsSelect = formElement.querySelector('[data-field="sensors"]');
             if (sensorsSelect) {
                 sensorsSelect.innerHTML = ''; // Limpiar antes
                 (dropdownData.sensors || []).forEach(opt => {
                     const option = document.createElement('option');
                     option.value = opt.id;
                     option.textContent = opt.name;
                     // Marcar seleccionados (productionData.sensors debe ser un array de IDs)
                     if (Array.isArray(productionData.sensors) && productionData.sensors.map(String).includes(String(opt.id))) {
                         option.selected = true;
                     }
                     sensorsSelect.appendChild(option);
                 });
             }

             // Poblar (o mostrar info) de Insumos - No editable en esta versión
             const suppliesContainer = formElement.querySelector('[data-info="supplies-update-view"]'); // Busca el contenedor si existe
             if (suppliesContainer) {
                 suppliesContainer.innerHTML = '<label class="dashboard__label">Insumos (No editable)</label>';
                 await displayProductionSuppliesView(formElement, productionData.supplies || []); // Reusa la función de visualización
             } else {
                 // Si no existe el contenedor, añadirlo dinámicamente (más complejo) o ignorar
             }


         } catch (error) {
             console.error("Error poblando form de actualización:", error);
             showSnackbar("Error al cargar datos para actualizar", "error");
         }
     }
     // Helper para poblar selects existentes en el form de update
     function populateSelectExisting(selectElement, options, selectedValue) {
         if (!selectElement) return;
         selectElement.innerHTML = '<option value="">Seleccione...</option>'; // Opción default
         options.forEach(opt => {
             const option = document.createElement('option');
             option.value = opt.id;
             option.textContent = opt.name;
             if (opt.id == selectedValue) { // Comparación flexible por si acaso
                 option.selected = true;
             }
             selectElement.appendChild(option);
         });
     }


    // Actualizar producción (original - adaptado mínimamente)
    async function updateProduction() {
        const form = document.querySelector('[data-form="update"]');
        if (!form || !currentProductionId) { showSnackbar("Error interno", "error"); return; }

        // Validación simple (mejorar si es necesario)
         let updateIsValid = true;
         form.querySelectorAll('[required]').forEach(input => { /* ... validación básica ... */ if(!input.value && !input.multiple || input.multiple && input.selectedOptions.length === 0) updateIsValid = false; });
         if (!updateIsValid) { showSnackbar("Complete campos requeridos", "warning"); return; }

        try {
            const updatedData = {
                name: form.querySelector('[data-field="name"]').value,
                responsible: form.querySelector('[data-field="responsible"]').value,
                cultivation: form.querySelector('[data-field="cultivation"]').value,
                cycle: form.querySelector('[data-field="cycle"]').value,
                sensors: Array.from(form.querySelector('[data-field="sensors"]').selectedOptions).map(opt => opt.value),
                // supplies: NO EDITABLE AQUÍ - backend necesita saber qué hacer si no se envía
                start_date: form.querySelector('[data-field="start-date"]').value,
                end_date: form.querySelector('[data-field="end-date"]').value,
                status: form.querySelector('[data-field="status"]').value
            };

            const response = await fetch(`${API_BASE_URL}/productions/${currentProductionId}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData) // Backend debe manejar la ausencia de 'supplies' si no es editable
            });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.error || 'Error al actualizar');

            showSnackbar('Producción actualizada');
            form.classList.add('dashboard__form--hidden'); // Oculta form
            await loadProductionsList(); // Refresca lista

        } catch (error) {
            console.error('Error al actualizar:', error);
            showSnackbar(`Error: ${error.message}`, 'error');
        }
    }

    // Configurar formulario de habilitar/deshabilitar (original - sin cambios aquí)
    function setupEnableForm() {
        const form = document.querySelector('[data-form="enable"]');
        const resultSection = document.querySelector('[data-result="enable"]');
        if (!form || !resultSection) return;

        form.addEventListener('submit', async function(e) {
             e.preventDefault();
             const idInput = form.querySelector('[data-field="production-id"]');
             const productionId = idInput?.value?.trim();
             if (!productionId) { showSnackbar('Ingrese ID', 'warning'); return; }

             resultSection.classList.add('dashboard__result--hidden');
             form.reset();

             const idMatch = productionId.match(/(\d+)$/);
             const actualId = idMatch ? idMatch[1] : productionId;

             try {
                const response = await fetch(`${API_BASE_URL}/productions/${actualId}`);
                 if (!response.ok) { if (response.status === 404) throw new Error('No encontrado'); throw new Error('Error'); }
                 const result = await response.json();
                 if (!result.success || !result.data) throw new Error('No encontrado');

                 const production = result.data;
                 currentProductionId = production.id; // Guarda ID para toggle

                 const content = resultSection.querySelector('[data-content="status"]');
                 if (content) {
                     content.innerHTML = `<div class="dashboard__info-item"><div class="dashboard__info-label">Producción</div><div class="dashboard__info-value">${production.name} (ID: prod-${production.id})</div></div><div class="dashboard__info-item"><div class="dashboard__info-label">Estado</div><div class="dashboard__info-value"><span class="status-badge status-badge--${production.status === 'active' ? 'active' : 'inactive'}">${production.status === 'active' ? 'Activo' : 'Inactivo'}</span></div></div>`;
                 }

                 const toggleButton = resultSection.querySelector('[data-action="toggle-status"]');
                 if (toggleButton) {
                     toggleButton.textContent = production.status === 'active' ? 'Deshabilitar' : 'Habilitar';
                     toggleButton.onclick = async () => await toggleProductionStatus(production); // Pasa datos actuales
                 }
                 resultSection.classList.remove('dashboard__result--hidden');
             } catch (error) {
                 console.error('Error en habilitar:', error);
                 showSnackbar(error.message, 'error');
                 resultSection.classList.add('dashboard__result--hidden');
             }
        });
    }


    // Action to toggle production status (original - adaptado mínimamente)
    async function toggleProductionStatus(currentProductionData) {
        if (!currentProductionData || !currentProductionData.id) { showSnackbar("Error interno", "error"); return; }
        const newStatus = currentProductionData.status === 'active' ? 'inactive' : 'active';

        // Payload necesita todos los campos que el backend espera en el PUT
        const updatePayload = { ...currentProductionData, status: newStatus };
         // Asegúrate que sensors y supplies se envían como espera el backend (string o array)
         // El backend actual parece esperar strings, pero recibe arrays de la consulta GET.
         // Asumiremos que el backend puede manejar el array que viene de currentProductionData.
         // Si falla, habría que convertir a string:
         // sensors: Array.isArray(currentProductionData.sensors) ? currentProductionData.sensors.join(',') : currentProductionData.sensors,
         // supplies: Array.isArray(currentProductionData.supplies) ? currentProductionData.supplies.join(',') : currentProductionData.supplies,


        try {
            const response = await fetch(`${API_BASE_URL}/productions/${currentProductionData.id}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatePayload)
            });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.error || 'Error al cambiar estado');

            showSnackbar(`Estado cambiado a ${newStatus}`);

            // Refrescar vista actual y lista
            const enableForm = document.querySelector('[data-form="enable"]');
            const idInput = enableForm?.querySelector('[data-field="production-id"]');
            if(enableForm && idInput) { idInput.value = `prod-${currentProductionData.id}`; enableForm.dispatchEvent(new Event('submit')); }
            await loadProductionsList();

        } catch (error) {
            console.error('Error al cambiar estado:', error);
            showSnackbar(`Error: ${error.message}`, 'error');
        }
    }


    // Configurar sección de listado (original - sin cambios aquí)
     function setupListSection() {
        const searchInput = document.querySelector('[data-panel="list"] [data-field="search"]');
        const filterSelect = document.querySelector('[data-panel="list"] [data-field="filter-status"]');
        const prevButton = document.querySelector('[data-panel="list"] [data-action="prev-page"]');
        const nextButton = document.querySelector('[data-panel="list"] [data-action="next-page"]');

        let searchTimeout;
        searchInput?.addEventListener('input', () => { clearTimeout(searchTimeout); searchTimeout = setTimeout(() => { currentPage = 1; loadProductionsList(); }, 300); });
        filterSelect?.addEventListener('change', () => { currentPage = 1; loadProductionsList(); });
        prevButton?.addEventListener('click', () => { if (currentPage > 1) { currentPage--; loadProductionsList(); } });
        nextButton?.addEventListener('click', () => { const totalPages = parseInt(document.querySelector('[data-panel="list"] [data-info="page"]').dataset.totalPages || '1'); if (currentPage < totalPages) { currentPage++; loadProductionsList(); } });
    }


    // Cargar lista de producciones (original - sin cambios aquí)
     async function loadProductionsList() {
        const listSection = document.querySelector('[data-panel="list"]');
        const tableBody = listSection?.querySelector('[data-list="productions"]');
        const paginationInfo = listSection?.querySelector('[data-info="page"]');
        const prevButton = listSection?.querySelector('[data-action="prev-page"]');
        const nextButton = listSection?.querySelector('[data-action="next-page"]');
        if (!tableBody || !paginationInfo || !prevButton || !nextButton) return;

        const searchTerm = listSection.querySelector('[data-field="search"]').value.toLowerCase();
        const filterStatus = listSection.querySelector('[data-field="filter-status"]').value;

        tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Cargando...</td></tr>'; // Loading...
        paginationInfo.textContent = 'Página - de -'; paginationInfo.dataset.totalPages = '1';
        prevButton.disabled = true; nextButton.disabled = true;

        try {
            const response = await fetch(`${API_BASE_URL}/productions`);
            if (!response.ok) throw new Error('Error al obtener producciones');
            const result = await response.json();
            if (!result.success) throw new Error(result.error || 'Error');
            const allProductions = Array.isArray(result.data) ? result.data : [];

            // Filtrado cliente (original)
            filteredProductions = allProductions.filter(p =>
                (filterStatus === 'all' || p.status === filterStatus) &&
                (!searchTerm || (p.name && p.name.toLowerCase().includes(searchTerm)) || (`prod-${p.id}`.includes(searchTerm)) || (p.cultivation_name && p.cultivation_name.toLowerCase().includes(searchTerm)) || (p.cycle_name && p.cycle_name.toLowerCase().includes(searchTerm))) );

            // Paginación (original)
            const totalProductions = filteredProductions.length;
            const totalPages = Math.ceil(totalProductions / productionsPerPage) || 1;
            if (currentPage > totalPages) currentPage = totalPages;
            const startIndex = (currentPage - 1) * productionsPerPage;
            const paginatedProductions = filteredProductions.slice(startIndex, startIndex + productionsPerPage);

            // Render tabla (original)
            tableBody.innerHTML = '';
            if (paginatedProductions.length === 0) { tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No se encontraron producciones.</td></tr>';
            } else {
                paginatedProductions.forEach(p => {
                     const row = document.createElement('tr'); row.className = 'dashboard__table-row';
                     row.innerHTML = `<td class="dashboard__table-cell">prod-${p.id}</td> <td class="dashboard__table-cell">${p.name||''}</td> <td class="dashboard__table-cell">${p.cultivation_name||''}</td> <td class="dashboard__table-cell">${p.cycle_name||''}</td> <td class="dashboard__table-cell"><span class="status-badge status-badge--${p.status === 'active' ? 'active' : 'inactive'}">${p.status === 'active' ? 'Activo' : 'Inactivo'}</span></td> <td class="dashboard__table-cell dashboard__table-cell--actions"> <button class="dashboard__button dashboard__button--icon action-view" title="Ver"><i class="material-icons">visibility</i></button> <button class="dashboard__button dashboard__button--icon action-edit" title="Editar"><i class="material-icons">edit</i></button> <button class="dashboard__button dashboard__button--icon action-toggle" title="Habilitar/Deshabilitar"><i class="material-icons">${p.status === 'active' ? 'toggle_on' : 'toggle_off'}</i></button> </td>`;
                     row.querySelector('.action-view').addEventListener('click', () => navigateToActionTab('view', p.id));
                     row.querySelector('.action-edit').addEventListener('click', () => navigateToActionTab('update', p.id));
                     row.querySelector('.action-toggle').addEventListener('click', () => navigateToActionTab('enable', p.id));
                     tableBody.appendChild(row);
                });
            }

            // Paginación info (original)
            paginationInfo.textContent = `Página ${currentPage} de ${totalPages}`; paginationInfo.dataset.totalPages = totalPages.toString();
            prevButton.disabled = currentPage === 1; nextButton.disabled = currentPage === totalPages;

        } catch (error) {
            console.error('Error cargando producciones:', error);
            showSnackbar(`Error al cargar lista: ${error.message}`, 'error');
            tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Error al cargar.</td></tr>`;
        }
    }
      // Helper para navegar desde la lista (original)
     function navigateToActionTab(tabName, productionId) {
         const targetTab = document.querySelector(`.navigation__tab[data-tab="${tabName}"]`);
         if (targetTab) targetTab.click();

         setTimeout(() => {
             let inputSelector, formSelector;
             if (tabName === 'view') { inputSelector = '[data-form="view"] [data-field="production-id"]'; formSelector = '[data-form="view"]'; }
             else if (tabName === 'update') { inputSelector = '[data-form="search-update"] [data-field="production-id"]'; formSelector = '[data-form="search-update"]'; }
             else if (tabName === 'enable') { inputSelector = '[data-form="enable"] [data-field="production-id"]'; formSelector = '[data-form="enable"]'; }
             else { return; }

             const input = document.querySelector(inputSelector); const form = document.querySelector(formSelector);
             if (input && form) { input.value = `prod-${productionId}`; form.dispatchEvent(new Event('submit', { bubbles: true })); }
             else { console.warn(`Elementos no encontrados para tab ${tabName}`); }
         }, 100);
     }


    // Configurar formulario de reportes (original - sin cambios aquí)
     function setupReportForm() {
        const form = document.querySelector('[data-form="report"]');
        if (form) form.addEventListener('submit', async (e) => { e.preventDefault(); await generateReport(); });
    }


    // Generar reporte (original - sin cambios aquí)
     async function generateReport() {
        const form = document.querySelector('[data-form="report"]');
        const startDate = form.querySelector('[data-field="start-date"]').value;
        const endDate = form.querySelector('[data-field="end-date"]').value;
        const format = form.querySelector('input[name="format"]:checked')?.value || 'excel';
        const errorSpan = form.querySelector('[data-error="date-range"]');

        if (!startDate || !endDate) { if(errorSpan){ errorSpan.textContent='Seleccione fechas'; errorSpan.style.display='block';} showSnackbar('Fechas inválidas', 'warning'); return; }
        if (new Date(startDate) > new Date(endDate)) { if(errorSpan){ errorSpan.textContent='Inicio > Fin'; errorSpan.style.display='block';} showSnackbar('Fechas inválidas', 'warning'); return; }
        if (errorSpan) errorSpan.style.display = 'none';

        showSnackbar(`Generando reporte ${format.toUpperCase()}...`, 'info');
        try {
            await new Promise(resolve => setTimeout(resolve, 1500)); // Simulación
            showSnackbar(`Reporte ${format.toUpperCase()} generado (simulado)`);
        } catch (error) { showSnackbar('Error al generar reporte', 'error'); }
    }


    // Mostrar snackbar (original - sin cambios aquí)
    function showSnackbar(message, type = 'success') {
        const snackbar = document.querySelector('[data-snackbar]');
        const messageElement = snackbar?.querySelector('[data-snackbar-message]');
        const closeButton = snackbar?.querySelector('[data-action="close-snackbar"]');
        if (!snackbar || !messageElement) return;
        if (snackbar.timeoutId) clearTimeout(snackbar.timeoutId); // Clear previous timeout
        messageElement.textContent = message;
        const colors = { success: 'var(--color-success)', error: 'var(--color-error)', warning: 'var(--color-warning)', info: 'var(--color-info)' };
        snackbar.style.backgroundColor = colors[type] || colors['info'];
        snackbar.classList.add('snackbar--visible');
        const newHandler = () => snackbar.classList.remove('snackbar--visible'); // Handler to remove class
        if(closeButton) { closeButton.removeEventListener('click', snackbar.handler); closeButton.addEventListener('click', newHandler); snackbar.handler = newHandler; } // Re-attach listener
        snackbar.timeoutId = setTimeout(newHandler, 5000); // Auto-hide after 5s
    }


    // Formatear fecha (original - sin cambios aquí)
    function formatDate(dateString) {
        if (!dateString || dateString === '0000-00-00') return 'No definida';
        try {
             const date = new Date(dateString);
             if (isNaN(date.getTime())) return 'Fecha inválida';
             const options = { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }; // Use UTC to avoid timezone shifts from YYYY-MM-DD string
             return date.toLocaleDateString('es-ES', options);
         } catch(e) { return 'Fecha inválida'; }
    }


    // Resetear formularios (original - MODIFICADO para limpiar nueva lista de insumos)
    function resetForms() {
        // Resetear todos los forms excepto 'create' (original)
        document.querySelectorAll('form').forEach(form => {
            if (form.getAttribute('data-form') !== 'create') {
                 form.reset();
                 // Limpiar errores específicos del form
                 form.querySelectorAll('.dashboard__error').forEach(span => { span.textContent=''; span.style.display='none';});
            }
        });
         // Ocultar secciones de resultado (original)
        document.querySelectorAll('.dashboard__result').forEach(el => {
            // No ocultar si es el resultado del form 'create'? No aplica aquí.
            el.classList.add('dashboard__result--hidden');
        });
         // Ocultar form de update (original)
        const updateForm = document.querySelector('[data-form="update"]');
        if (updateForm) { updateForm.classList.add('dashboard__form--hidden'); }

        // Limpiar campos de ID de producción en forms de búsqueda (original)
        document.querySelectorAll('[data-field="production-id"]').forEach(input => {
            if (!input.readOnly) input.value = '';
        });

        // <<< NUEVO: Limpiar estado específico del form 'create' >>>
        const createForm = document.querySelector('[data-form="create"]');
        if (createForm) {
            createForm.reset(); // Resetea inputs normales
            selectedSupplies = []; // Limpia array interno
            renderSelectedSupplies(); // Limpia lista UI
            // Limpia errores del form create
             createForm.querySelectorAll('.dashboard__error').forEach(span => { span.textContent=''; span.style.display='none';});
             // Limpia estimaciones
             const investmentInput = createForm.querySelector('[data-field="investment"]'); if(investmentInput) investmentInput.value='';
             const goalInput = createForm.querySelector('[data-field="goal"]'); if(goalInput) goalInput.value='';
             // Deshabilita botón crear
             const createBtn = createForm.querySelector('[data-action="create"]'); if(createBtn) createBtn.disabled = true;
             // Regenera ID inicial
             setInitialProductionId(); // Llama a la función que obtiene el siguiente ID
        }
    }

    // Inicializar la aplicación (original)
    init();
});