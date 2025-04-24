// integracion.js with fixes for setInitialProductionId and disabled start date

document.addEventListener('DOMContentLoaded', function() {
    // Variables globales
    let currentProductionId = null;
    let currentPage = 1;
    const productionsPerPage = 5;
    let allSuppliesData = [];
    let selectedSupplies = [];
    let filteredProductions = [];

    // URL base de la API
    const API_BASE_URL = 'http://localhost:3000/api';

    // --- NUEVO: Función para generar ID inicial ---
    async function setInitialProductionId() {
        const prodIdInput = document.querySelector('[data-form="create"] [data-field="production-id"]');
        if (!prodIdInput) return; // Asegurarse que el input exista

        try {
            const prodResponse = await fetch(`${API_BASE_URL}/productions`);
            if (!prodResponse.ok) throw new Error('Failed to fetch productions for ID generation');
            const productionsResult = await prodResponse.json();
            // Asegurarse que la respuesta tiene el formato esperado
            const productionsData = (productionsResult && Array.isArray(productionsResult.data)) ? productionsResult.data : [];
            const nextId = productionsData.length > 0 ?
                Math.max(0, ...productionsData.map(p => parseInt(p.id) || 0)) + 1 : 1;
            prodIdInput.value = `prod-${nextId}`;
        } catch(e) {
            console.error("Error fetching next production ID:", e);
            prodIdInput.value = 'prod-error'; // Indicar un error en el ID
            showSnackbar('Error al generar ID de producción.', 'error');
        }
    }
    // --- FIN NUEVO ---


    // Inicialización
    async function init() {
        setupNavigation();
        setupCreateForm();
        setupViewForm();
        setupUpdateForm(); // Asegúrate que llama a populateExistingUpdateForm correctamente
        setupEnableForm();
        setupListSection();
        setupReportForm();
        await populateDropdownsAndSupplyData(); // Esto ahora no necesita generar el ID
        await setInitialProductionId(); // <<< LLAMADA a la nueva función
        await loadProductionsList();
    }

    // Configuración de navegación entre pestañas
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
                // Resetear forms al cambiar de tab, EXCEPTO si volvemos a 'create' donde podríamos querer mantener datos?
                // La implementación actual de resetForms() limpia 'create' también.
                 if (tabName !== 'create') { // Solo resetea si no es la pestaña de crear
                     resetForms(); // Podrías ajustar resetForms para no limpiar 'create' si es necesario
                 } else {
                     // Si vuelves a la pestaña crear, podrías querer regenerar el ID o mantener el estado
                     setInitialProductionId(); // Asegura que el ID esté fresco al volver a 'create'
                 }
            });
        });
    }

    // Llenar dropdowns con datos de la base de datos
    async function populateDropdownsAndSupplyData() {
        try {
            // 1. Fetch datos para Users, Cultivations, Cycles, Sensors desde /integracion/data
            const integrationDataResponse = await fetch(`${API_BASE_URL}/integracion/data`);
            if (!integrationDataResponse.ok) throw new Error('Error al obtener datos de integración');
            const integrationDataResult = await integrationDataResponse.json();
            if (!integrationDataResult.success) throw new Error(integrationDataResult.error || 'Error en datos de integración');
            const data = integrationDataResult.data;

            // Poblar Responsables
             const responsibleSelect = document.querySelector('[data-field="responsible"]');
             if (responsibleSelect) {
                responsibleSelect.innerHTML = '<option value="">Seleccione un responsable</option>';
                 (data.users || []).forEach(user => {
                     const option = document.createElement('option');
                     option.value = user.id;
                     option.textContent = user.name;
                     responsibleSelect.appendChild(option);
                 });
             }
             // Poblar Cultivos (form crear y actualizar si existe)
             document.querySelectorAll('[data-field="cultivation"]').forEach(cultivationSelect => {
                 cultivationSelect.innerHTML = '<option value="">Seleccione un cultivo</option>';
                 (data.cultivations || []).forEach(cult => {
                     const option = document.createElement('option');
                     option.value = cult.id;
                     option.textContent = cult.name;
                     cultivationSelect.appendChild(option);
                 });
             });
              // Poblar Ciclos (form crear y actualizar si existe)
             document.querySelectorAll('[data-field="cycle"]').forEach(cycleSelect => {
                 cycleSelect.innerHTML = '<option value="">Seleccione un ciclo</option>';
                 (data.cycles || []).forEach(cycle => {
                     const option = document.createElement('option');
                     option.value = cycle.id;
                     option.textContent = cycle.name;
                     cycleSelect.appendChild(option);
                 });
             });
             // Poblar Sensores (form crear y actualizar si existe)
             document.querySelectorAll('[data-field="sensors"]').forEach(sensorsSelect => {
                 sensorsSelect.innerHTML = ''; // Multi-select
                 (data.sensors || []).forEach(sensor => {
                     const option = document.createElement('option');
                     option.value = sensor.id;
                     option.textContent = sensor.name;
                     sensorsSelect.appendChild(option);
                 });
             });

            // 2. Fetch datos COMPLETOS de Insumos desde /api/insumos
            const suppliesResponse = await fetch(`http://localhost:3000/api/insumos`); // Usa la URL directa a insumos
            if (!suppliesResponse.ok) throw new Error(`Error al obtener lista de insumos: ${suppliesResponse.statusText}`);
            const suppliesResult = await suppliesResponse.json();

            // Verifica si suppliesResult tiene la propiedad 'data' o si es directamente el array
            allSuppliesData = suppliesResult.success ? suppliesResult.data : (Array.isArray(suppliesResult) ? suppliesResult : []);
            if (!Array.isArray(allSuppliesData)) {
                 allSuppliesData = [];
                 console.warn('Formato inesperado de datos de insumos detallados:', suppliesResult);
                 throw new Error('Formato inesperado de datos de insumos detallados');
             }


            // 3. Poblar el dropdown de selección de insumos disponibles (solo en 'create')
            const availableSuppliesSelect = document.querySelector('[data-panel="create"] [data-field="available-supplies"]');
            if (availableSuppliesSelect) {
                availableSuppliesSelect.innerHTML = '<option value="">Seleccione un insumo para agregar</option>';
                allSuppliesData.forEach(supply => {
                    // Asegurarse que supply.id y supply.nombre_insumo existen
                    if (supply && supply.id && supply.nombre_insumo) {
                        const option = document.createElement('option');
                        option.value = supply.id; // Usa el ID correcto (puede ser id o id_insumo dependiendo del backend)
                        option.textContent = supply.nombre_insumo;
                        availableSuppliesSelect.appendChild(option);
                    } else {
                        console.warn("Insumo con datos incompletos encontrado:", supply);
                    }
                });
            }

            // <<< ELIMINADO: La generación de ID ahora está en setInitialProductionId() >>>

        } catch (error) {
            console.error('Error al poblar datos:', error);
            showSnackbar(`Error al cargar datos iniciales: ${error.message || 'Error desconocido'}`, 'error');
        }
    }


    // Configurar formulario de creación
    function setupCreateForm() {
        const form = document.querySelector('[data-form="create"]');
        if (!form) return;

        form.querySelector('[data-action="cancel"]')?.addEventListener('click', resetForms);
        form.querySelector('[data-action="save-draft"]')?.addEventListener('click', saveAsDraft);

        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            await createProduction();
        });

        // Listeners de validación
        form.querySelectorAll('[required]').forEach(input => {
            input.addEventListener('change', validateCreateForm);
        });
        const sensorSelect = form.querySelector('[data-field="sensors"]');
        if (sensorSelect) sensorSelect.addEventListener('change', validateCreateForm);

        // Listener para el botón "Agregar" de insumos
         const addSupplyButton = form.querySelector('[data-action="add-selected-supply"]');
         if (addSupplyButton) {
             addSupplyButton.addEventListener('click', addSelectedSupplyToList);
         }

         // Deshabilitar botón Crear inicialmente
         const createBtn = form.querySelector('[data-action="create"]');
         if (createBtn) createBtn.disabled = true;

         // Listeners para habilitar botón
         form.querySelectorAll('input[required], select[required]').forEach(el => {
            el.addEventListener('change', validateCreateForm);
            if (el.tagName === 'INPUT') {
                el.addEventListener('input', validateCreateForm); // Validar también al escribir en inputs
            }
         });
          // Validar insumos al agregar/quitar
         // (La validación se llama desde addSelectedSupplyToList y removeSelectedSupply)
    }

    // --- Funciones para manejar la lista de insumos seleccionados ---
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

        // Asegúrate de que allSuppliesData es un array y tiene elementos
        if (!Array.isArray(allSuppliesData) || allSuppliesData.length === 0) {
            showSnackbar('Error: Lista de insumos no cargada', 'error');
            console.error("allSuppliesData no está disponible o vacío", allSuppliesData);
            return;
        }

        const supplyData = allSuppliesData.find(s => s.id == supplyId || s.id_insumo == supplyId); // Considera ambos posibles nombres de ID
        if (!supplyData || !supplyData.nombre_insumo) {
             showSnackbar('Error: Datos del insumo no encontrados o incompletos', 'error');
             console.error("No se encontraron datos para el supplyId:", supplyId, "en", allSuppliesData);
             return;
        }

        selectedSupplies.push({
            id: supplyId,
            name: supplyData.nombre_insumo,
            quantity: quantity,
            unit_value: supplyData.valor_unitario // Guardar valor para cálculo
        });

        renderSelectedSupplies();
        supplySelect.value = "";
        quantityInput.value = "";
        if(errorSpan) errorSpan.style.display = 'none';
        validateCreateForm();
    }

    function removeSelectedSupply(supplyIdToRemove) {
        selectedSupplies = selectedSupplies.filter(item => item.id != supplyIdToRemove);
        renderSelectedSupplies();
        validateCreateForm();
    }

    function renderSelectedSupplies() {
        const container = document.querySelector('[data-list="selected-supplies"]');
        if (!container) return;
        container.innerHTML = '';

        if (selectedSupplies.length === 0) {
            container.innerHTML = '<p>No hay insumos agregados.</p>';
        } else {
            const list = document.createElement('ul');
            list.className = 'dashboard__supplies-list-items';
            selectedSupplies.forEach(item => {
                const listItem = document.createElement('li');
                 // Asegurarse que item.id existe antes de usarlo en el atributo
                 const itemId = item.id || `unknown-${Math.random()}`; // Fallback si id es undefined
                listItem.innerHTML = `
                    <span>${item.name || 'Nombre no disponible'} (Cantidad: ${item.quantity})</span>
                    <button type="button" class="dashboard__button--remove-supply" data-supply-id="${itemId}" title="Eliminar">&times;</button>
                `;
                const removeButton = listItem.querySelector('.dashboard__button--remove-supply');
                 if (removeButton) {
                    removeButton.addEventListener('click', (e) => {
                         // Leer el ID del atributo, que ahora tiene un fallback seguro
                         const idToRemove = e.currentTarget.getAttribute('data-supply-id');
                         if (idToRemove && !idToRemove.startsWith('unknown-')) {
                            removeSelectedSupply(idToRemove);
                         } else {
                             console.warn("Intento de eliminar insumo con ID inválido:", idToRemove);
                         }
                    });
                 } else {
                     console.warn("Botón de eliminar no encontrado para el insumo:", item);
                 }
                list.appendChild(listItem);
            });
            container.appendChild(list);
        }
    }
    // --- FIN manejo insumos seleccionados ---

    // Calcular estimación
    function calculateEstimation() {
        const investmentInput = document.querySelector('[data-field="investment"]');
        const goalInput = document.querySelector('[data-field="goal"]');
        if (!investmentInput || !goalInput) return;

         if (selectedSupplies.length === 0) {
             investmentInput.value = ''; goalInput.value = ''; return;
         }

         let totalInvestment = 0;
         let possible = true;

        selectedSupplies.forEach(item => {
             const unitValue = parseFloat(item.unit_value); // Usar el valor guardado
             if (!isNaN(unitValue)) {
                 totalInvestment += unitValue * item.quantity;
             } else { possible = false; }
         });

         if (possible) {
             investmentInput.value = `$${totalInvestment.toFixed(2)}`;
             const estimatedGoal = totalInvestment * 1.3; // Ejemplo
             goalInput.value = `$${estimatedGoal.toFixed(2)}`;
         } else {
             investmentInput.value = 'N/A (Faltan precios)';
             goalInput.value = 'N/A';
         }
    }

    // Validar formulario de creación
    function validateCreateForm() {
        const form = document.querySelector('[data-form="create"]');
        if (!form) return false;
        let isValid = true;

        form.querySelectorAll('[required]').forEach(input => {
            const fieldName = input.getAttribute('data-field');
            const errorElement = form.querySelector(`[data-error="${fieldName}"]`);
            let fieldValid = true;
            let errorMessage = 'Este campo es requerido';

             if (input.tagName === 'SELECT' && input.multiple) {
                 if (input.selectedOptions.length === 0) { fieldValid = false; }
                 if (fieldName === 'sensors') {
                      if (input.selectedOptions.length > 3) { fieldValid = false; errorMessage = 'Máximo 3 sensores'; }
                      else if (input.selectedOptions.length === 0 && input.hasAttribute('required')) { fieldValid = false; }
                 }
            } else if (input.type === 'date') {
                 if (!input.value) { fieldValid = false; }
            } else if (!input.value || !input.value.trim()) {
                 fieldValid = false;
            }
            // Validar fechas
            if (fieldName === 'end-date') {
                const startDateInput = form.querySelector('[data-field="start-date"]');
                if (startDateInput && input.value && startDateInput.value && new Date(input.value) < new Date(startDateInput.value)) {
                    fieldValid = false;
                    errorMessage = 'La fecha de fin debe ser posterior a la de inicio.';
                }
            }


             if (!fieldValid) {
                 if (errorElement) { errorElement.textContent = errorMessage; errorElement.style.display = 'block'; }
                 isValid = false;
             } else {
                 if (errorElement) { errorElement.style.display = 'none'; }
             }
        });

        // Validación de Insumos
        const supplyErrorElement = form.querySelector('[data-error="supplies"]');
        if (selectedSupplies.length === 0) {
             if (supplyErrorElement) { supplyErrorElement.textContent = 'Debe agregar al menos un insumo'; supplyErrorElement.style.display = 'block'; }
             isValid = false;
         } else {
             if (supplyErrorElement) { supplyErrorElement.style.display = 'none'; }
        }

        if (isValid) { calculateEstimation(); }
        else {
             const investmentInput = form.querySelector('[data-field="investment"]'); if(investmentInput) investmentInput.value='';
             const goalInput = form.querySelector('[data-field="goal"]'); if(goalInput) goalInput.value='';
        }

        const createButton = form.querySelector('[data-action="create"]');
        if (createButton) { createButton.disabled = !isValid; }

        return isValid;
    }


    // Crear nueva producción
    async function createProduction() {
        if (!validateCreateForm()) {
             showSnackbar("Formulario inválido. Revise los campos marcados.", "warning");
             return;
        }

        const form = document.querySelector('[data-form="create"]');
        const supplyIdsForApi = selectedSupplies.map(item => item.id);

        const newProduction = {
            name: form.querySelector('[data-field="name"]').value,
            responsible: form.querySelector('[data-field="responsible"]').value,
            cultivation: form.querySelector('[data-field="cultivation"]').value,
            cycle: form.querySelector('[data-field="cycle"]').value,
            sensors: Array.from(form.querySelector('[data-field="sensors"]').selectedOptions).map(opt => opt.value),
            supplies: supplyIdsForApi,
            startDate: form.querySelector('[data-field="start-date"]').value,
            endDate: form.querySelector('[data-field="end-date"]').value
        };

        try {
            const response = await fetch(`${API_BASE_URL}/productions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newProduction)
            });
            const result = await response.json();

            if (!response.ok || !result.success) {
                 throw new Error(result.error || result.message || `Error HTTP ${response.status}`);
            }

            showSnackbar(`Producción creada: ${result.displayId || result.id}`);
            resetForms(); // Llama al reset general que también limpia 'create' y regenera ID
            await loadProductionsList();

        } catch (error) {
            console.error('Error al crear producción:', error);
            showSnackbar(`Error al crear: ${error.message}`, 'error');
        }
    }

     // Guardar como borrador (simulado)
    function saveAsDraft() {
        showSnackbar('Borrador guardado exitosamente (simulado)');
        // Aquí podrías implementar localStorage para guardar el estado del formulario
    }


    // Configurar formulario de visualización
    function setupViewForm() {
        const form = document.querySelector('[data-form="view"]');
        if (!form) return;
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            const productionIdInput = form.querySelector('[data-field="production-id"]');
            const productionId = productionIdInput?.value?.trim();
            if (!productionId) { showSnackbar("Ingrese ID de producción a buscar", "warning"); return; }
            const idMatch = productionId.match(/(\d+)$/); // Extrae el número del ID (ej: prod-12 -> 12)
            const actualId = idMatch ? idMatch[1] : productionId; // Usa el número o el input si no coincide el formato
            await viewProduction(actualId);
        });
    }

    // Visualizar producción
    async function viewProduction(productionId) {
        const resultSection = document.querySelector('[data-panel="view"] [data-result="view"]');
        if (!resultSection) return;
        resultSection.classList.add('dashboard__result--hidden'); // Oculta anterior

        try {
            const response = await fetch(`${API_BASE_URL}/productions/${productionId}`);
            if (!response.ok) {
                 if (response.status === 404) throw new Error('Producción no encontrada');
                 throw new Error(`Error al obtener producción: ${response.statusText}`);
             }
            const result = await response.json();
            if (!result.success || !result.data) throw new Error(result.error || 'Producción no encontrada en la respuesta');

            const production = result.data;
            currentProductionId = production.id; // Guarda ID numérico

            // Llenar info básica
            const basicInfoContainer = resultSection.querySelector('[data-info="basic"]');
            if(basicInfoContainer) {
                basicInfoContainer.innerHTML = ''; // Limpiar antes
                 // Definir qué campos mostrar
                const infoItems = [
                     { label: 'ID', value: `prod-${production.id}` },
                     { label: 'Nombre', value: production.name },
                     { label: 'Responsable', value: production.responsible_name || 'N/A' }, // Usar el nombre del backend
                     { label: 'Cultivo', value: production.cultivation_name || 'N/A' }, // Usar el nombre del backend
                     { label: 'Ciclo', value: production.cycle_name || 'N/A' }, // Usar el nombre del backend
                     { label: 'Fecha Inicio', value: formatDate(production.start_date) },
                     { label: 'Fecha Fin Est.', value: formatDate(production.end_date) },
                     { label: 'Estado', value: production.status === 'active' ? 'Activo' : 'Inactivo' }
                ];
                 // Crear elementos
                infoItems.forEach(item => {
                    const infoDiv = document.createElement('div');
                    infoDiv.className = 'dashboard__info-item';
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
             const suppliesContainer = resultSection.querySelector('[data-info="supplies"]'); // Asegúrate que este div existe en tu HTML
             if (suppliesContainer) {
                 await displayProductionSuppliesView(resultSection, production.supplies || []);
             } else { console.warn("Contenedor [data-info='supplies'] no encontrado en la vista."); }

            resultSection.classList.remove('dashboard__result--hidden'); // Muestra sección

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
            growth: Array(7).fill(0).map((_, i) => i * 10 + Math.floor(Math.random() * 5)) // Simula crecimiento lineal + ruido
        };
    }
    // Helper para crear gráfico individual
    let charts = {}; // Almacenar instancias de gráficos para destruir
    function createChart(canvasElement, label, data) {
         if (!canvasElement) return;
         const chartId = canvasElement.getAttribute('data-chart'); // Usar data-chart como ID
         if (charts[chartId]) { charts[chartId].destroy(); } // Destruir gráfico anterior si existe
         const ctx = canvasElement.getContext('2d');
         const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']; // Etiquetas cortas
         charts[chartId] = new Chart(ctx, { // Guardar nueva instancia
             type: 'line',
             data: {
                 labels: days.slice(0, data.length),
                 datasets: [{
                     label: label,
                     data: data,
                     borderColor: 'var(--color-primary)',
                     backgroundColor: 'rgba(111, 192, 70, 0.1)',
                     tension: 0.4,
                     fill: true
                 }]
             },
             options: {
                 responsive: true,
                 maintainAspectRatio: false,
                 plugins: { legend: { display: false } },
                 scales: {
                    y: { beginAtZero: false },
                    x: { ticks: { autoSkip: true, maxTicksLimit: 7 } } // Mejorar legibilidad en ejes X
                 }
             }
         });
     }

    // Mostrar Sensores en la vista (basado en IDs)
    async function displayProductionSensorsView(resultSection, sensorIds) {
        const container = resultSection.querySelector('[data-info="sensors"]');
        if (!container) { console.warn("Contenedor [data-info='sensors'] no encontrado."); return;}
        container.innerHTML = '<p>Cargando sensores...</p>';
        const ids = Array.isArray(sensorIds) ? sensorIds.map(String) : []; // Asegurar array de strings
        if (ids.length === 0) { container.innerHTML = '<p>No hay sensores asignados.</p>'; return; }

        try {
             // Fetch full sensor list desde el endpoint correcto de sensores
             const sensorsResponse = await fetch(`http://localhost:3000/sensores`); // Ajusta si tu endpoint es diferente
             if (!sensorsResponse.ok) throw new Error('Error al cargar lista de sensores');
             const sensorsResult = await sensorsResponse.json(); // Asume devuelve array directamente o {success, data}
             // Asegurar que tenemos un array
             const allSensors = (sensorsResult && Array.isArray(sensorsResult.data)) ? sensorsResult.data : (Array.isArray(sensorsResult) ? sensorsResult : []);

            container.innerHTML = ''; // Limpia
            ids.forEach(id => {
                const sensor = allSensors.find(s => String(s.id) === id); // Comparar como strings
                if (sensor) {
                     const card = document.createElement('div'); card.className = 'dashboard__sensor-card';
                     const sensorStatus = sensor.estado ? sensor.estado.toLowerCase() : 'desconocido';
                     const statusColor = (sensorStatus === 'activo' || sensorStatus === 'disponible') ? 'var(--color-success)' : 'var(--color-error)';
                     card.innerHTML = `<i class="material-icons dashboard__sensor-icon">${getSensorIcon(sensor.tipo_sensor)}</i> <div class="dashboard__sensor-info"> <div class="dashboard__sensor-name">${sensor.nombre_sensor || 'Sin nombre'}</div> <div class="dashboard__sensor-meta"> <span>${sensor.tipo_sensor || 'Tipo desc.'}</span> <span style="color: ${statusColor}; text-transform: capitalize;"> ${sensorStatus} </span> </div> </div>`;
                     container.appendChild(card);
                 } else {
                     console.warn(`Sensor con ID ${id} no encontrado en la lista completa.`);
                     // Opcional: Mostrar un placeholder para IDs no encontrados
                     const card = document.createElement('div'); card.className = 'dashboard__sensor-card dashboard__sensor-card--not-found';
                     card.innerHTML = `<i class="material-icons dashboard__sensor-icon">help_outline</i> <div class="dashboard__sensor-info"> <div class="dashboard__sensor-name">Sensor ID ${id}</div> <div class="dashboard__sensor-meta"> <span>No encontrado</span> </div> </div>`;
                     container.appendChild(card);
                 }
            });
             if (container.children.length === 0 && ids.length > 0) container.innerHTML = '<p>Detalles de sensores no encontrados.</p>';
         } catch (error) {
             console.error("Error mostrando sensores:", error);
             container.innerHTML = '<p>Error al cargar datos de sensores.</p>';
         }
    }
     // Obtener icono para el tipo de sensor
    function getSensorIcon(type) {
        if (!type) return 'sensors'; // Icono por defecto si no hay tipo
        const typeLower = type.toLowerCase();
        const icons = { 'humedad': 'opacity', 'temperatura': 'thermostat', 'nutrientes': 'eco', 'luz': 'wb_sunny' };
        return icons[typeLower] || 'sensors';
    }

    // Mostrar Insumos en la vista (basado en IDs)
    async function displayProductionSuppliesView(resultSection, supplyIds) {
         const container = resultSection.querySelector('[data-info="supplies"]'); // Busca el contenedor específico
        if (!container) { console.warn("Contenedor [data-info='supplies'] no encontrado en HTML view"); return; }
        container.innerHTML = '<p>Cargando insumos...</p>';
        const ids = Array.isArray(supplyIds) ? supplyIds.map(String) : []; // Asegurar array de strings
        if (ids.length === 0) { container.innerHTML = '<p>No hay insumos asignados.</p>'; return; }

        try {
            // Usa los datos completos de insumos ya cargados
            if (allSuppliesData.length === 0) {
                const suppliesResponse = await fetch(`http://localhost:3000/api/insumos`); // Endpoint correcto
                if (!suppliesResponse.ok) throw new Error('Error al obtener lista de insumos para vista');
                const suppliesResult = await suppliesResponse.json();
                allSuppliesData = suppliesResult.success ? suppliesResult.data : (Array.isArray(suppliesResult) ? suppliesResult : []);
                 if (!Array.isArray(allSuppliesData)) throw new Error('Formato inesperado de insumos');
            }

            container.innerHTML = ''; // Limpia antes de añadir
            const list = document.createElement('ul'); list.className = 'dashboard__supplies-list-items dashboard__supplies-list-items--view'; // Clase específica para vista?
            ids.forEach(id => {
                 // Busca por id o id_insumo
                const supply = allSuppliesData.find(s => String(s.id) === id || String(s.id_insumo) === id);
                const li = document.createElement('li');
                li.textContent = supply ? supply.nombre_insumo : `Insumo ID ${id} (No encontrado)`;
                // No hay cantidad disponible aquí porque no se guarda en la tabla 'productions'
                list.appendChild(li);
            });
            container.appendChild(list);
            if (list.children.length === 0 && ids.length > 0) container.innerHTML = '<p>Detalles de insumos no encontrados.</p>';
        } catch (error) {
            console.error("Error mostrando insumos:", error);
            container.innerHTML = '<p>Error al cargar datos de insumos.</p>';
        }
    }

    // Configurar formulario de actualización
     function setupUpdateForm() {
        const searchForm = document.querySelector('[data-form="search-update"]');
        const updateFormEl = document.querySelector('[data-form="update"]'); // El formulario que se oculta/muestra

        if (!searchForm || !updateFormEl) {
             console.error("Formularios de búsqueda o actualización no encontrados.");
             return;
        }

        searchForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const productionIdInput = searchForm.querySelector('[data-field="production-id"]');
            const productionId = productionIdInput?.value?.trim();
            const errorSpan = searchForm.querySelector('[data-error="production-id"]');

             // Limpiar error anterior
             if (errorSpan) { errorSpan.textContent = ''; errorSpan.style.display = 'none'; }

            if (!productionId) {
                showSnackbar("Ingrese ID de producción a buscar", "warning");
                if (errorSpan) { errorSpan.textContent = 'Ingrese ID'; errorSpan.style.display = 'block'; }
                return;
            }

            updateFormEl.classList.add('dashboard__form--hidden'); // Oculta form anterior

            const idMatch = productionId.match(/(\d+)$/);
            const actualId = idMatch ? idMatch[1] : productionId;

            try {
                showSnackbar("Buscando producción...", "info");
                const response = await fetch(`${API_BASE_URL}/productions/${actualId}`);
                if (!response.ok) {
                     if (response.status === 404) throw new Error("Producción no encontrada.");
                     throw new Error(`Error al buscar: ${response.statusText}`);
                }
                const result = await response.json();
                if (!result.success || !result.data) throw new Error(result.error || "No se encontraron datos para la producción.");

                const production = result.data;
                currentProductionId = actualId; // Guarda ID para actualizar

                // Poblar el formulario existente
                await populateExistingUpdateForm(updateFormEl, production); // Espera a que se complete

                updateFormEl.classList.remove('dashboard__form--hidden'); // Muestra form
                showSnackbar("Datos cargados. Puede actualizar.", "success");
                // searchForm.reset(); // Opcional: limpiar búsqueda después de encontrar

            } catch (error) {
                console.error('Error buscando para actualizar:', error);
                showSnackbar(error.message, 'error');
                 if (errorSpan) { errorSpan.textContent = error.message; errorSpan.style.display = 'block'; }
                updateFormEl.classList.add('dashboard__form--hidden');
            }
        });

        // Listener para el submit del formulario de actualización
        updateFormEl.addEventListener('submit', async function(e) {
            e.preventDefault();
            await updateProduction();
        });

        // Listener para el botón cancelar del formulario de actualización
         const cancelButton = updateFormEl.querySelector('[data-action="cancel-update"]');
         if (cancelButton) {
             cancelButton.addEventListener('click', () => {
                 updateFormEl.classList.add('dashboard__form--hidden');
                 updateFormEl.reset(); // Limpiar el form al cancelar
                 currentProductionId = null; // Limpiar ID actual
                 // Opcional: limpiar el input de búsqueda también
                 // const searchInput = searchForm.querySelector('[data-field="production-id"]');
                 // if (searchInput) searchInput.value = '';
             });
         } else { console.warn("Botón Cancelar no encontrado en el form de actualización."); }
    }

    // Poblar el formulario de actualización existente
    async function populateExistingUpdateForm(formElement, productionData) {
        // Vaciar formulario antes de poblar
        formElement.reset();
        formElement.innerHTML = ''; // Limpiar completamente por si tenía elementos dinámicos

        // Re-crear la estructura base del formulario de actualización aquí
        // Esto es más robusto que intentar modificar uno existente si la estructura cambia
        formElement.innerHTML = `
            <div class="dashboard__form-group">
                <label class="dashboard__label">ID Producción</label>
                <input class="dashboard__input" type="text" value="prod-${productionData.id}" readonly>
            </div>
            <div class="dashboard__form-group">
                <label class="dashboard__label">Nombre de Producción</label>
                <input class="dashboard__input" type="text" data-field="name" required>
                <span class="dashboard__error" data-error="name"></span>
            </div>
            <div class="dashboard__form-group">
                <label class="dashboard__label">Responsable</label>
                <select class="dashboard__select" data-field="responsible" required>
                    <option value="">Cargando...</option>
                </select>
                <span class="dashboard__error" data-error="responsible"></span>
            </div>
            <div class="dashboard__form-group">
                <label class="dashboard__label">Cultivo</label>
                <select class="dashboard__select" data-field="cultivation" required>
                    <option value="">Cargando...</option>
                </select>
                <span class="dashboard__error" data-error="cultivation"></span>
            </div>
            <div class="dashboard__form-group">
                <label class="dashboard__label">Ciclo de Cultivo</label>
                <select class="dashboard__select" data-field="cycle" required>
                    <option value="">Cargando...</option>
                </select>
                <span class="dashboard__error" data-error="cycle"></span>
            </div>
            <div class="dashboard__form-group">
                <label class="dashboard__label">Sensores (Máx. 3)</label>
                <select class="dashboard__select" data-field="sensors" multiple size="3" required>
                    </select>
                <span class="dashboard__error" data-error="sensors"></span>
            </div>

             <div class="dashboard__form-group dashboard__form-group--full-width" data-info="supplies-update-view">
                 <label class="dashboard__label">Insumos Asignados (No editable)</label>
                 <div data-info="supplies">
                     <p>Cargando insumos...</p>
                 </div>
            </div>

            <div class="dashboard__form-group">
                <label class="dashboard__label">Fecha de Inicio</label>
                <input class="dashboard__input" type="date" data-field="start-date" disabled> <span class="dashboard__error" data-error="start-date"></span>
            </div>
            <div class="dashboard__form-group">
                <label class="dashboard__label">Fecha Estimada de Fin</label>
                <input class="dashboard__input" type="date" data-field="end-date" required> <span class="dashboard__error" data-error="end-date"></span>
            </div>
             <div class="dashboard__form-group">
                 <label class="dashboard__label">Estado</label>
                 <select class="dashboard__select" data-field="status" required>
                     <option value="active">Activo</option>
                     <option value="inactive">Inactivo</option>
                 </select>
                 <span class="dashboard__error" data-error="status"></span>
            </div>

            <div class="dashboard__form-actions">
                 <button class="dashboard__button dashboard__button--secondary" type="button" data-action="cancel-update">Cancelar</button>
                 <button class="dashboard__button dashboard__button--primary" type="submit">Actualizar Producción</button>
            </div>
        `;

        // Re-adjuntar listener de cancelar porque recreamos el botón
        const cancelButton = formElement.querySelector('[data-action="cancel-update"]');
        if (cancelButton) {
             cancelButton.addEventListener('click', () => {
                 formElement.classList.add('dashboard__form--hidden');
                 formElement.reset(); // Limpiar el form al cancelar
                 currentProductionId = null;
             });
        }


         // Poblar campos estándar
         formElement.querySelector('[data-field="name"]').value = productionData.name || '';
         // Formatear fechas para input type="date" (YYYY-MM-DD)
         const startDateInput = formElement.querySelector('[data-field="start-date"]');
         const endDateInput = formElement.querySelector('[data-field="end-date"]');

         if (startDateInput) {
             try {
                 startDateInput.value = productionData.start_date ? new Date(productionData.start_date).toISOString().split('T')[0] : '';
                 startDateInput.disabled = true; // <<< ASEGURAR QUE ESTÉ DESHABILITADO >>>
             } catch (e) { console.error("Error formateando fecha inicio:", e); startDateInput.value = ''; }
         }
         if (endDateInput) {
             try {
                 endDateInput.value = productionData.end_date ? new Date(productionData.end_date).toISOString().split('T')[0] : '';
             } catch (e) { console.error("Error formateando fecha fin:", e); endDateInput.value = ''; }
         }


         // Poblar Selects (Responsable, Cultivo, Ciclo, Estado)
         try {
             const dropdownsResponse = await fetch(`${API_BASE_URL}/integracion/data`);
             if (!dropdownsResponse.ok) throw new Error('Error al cargar datos para selects de actualización');
             const dropdownsResult = await dropdownsResponse.json();
             if (!dropdownsResult.success) throw new Error(dropdownsResult.error || 'Error en datos de selects');
             const dropdownData = dropdownsResult.data;

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
                     // Marcar seleccionados (productionData.sensors debe ser array de IDs como string)
                     const selectedSensorIds = Array.isArray(productionData.sensors) ? productionData.sensors.map(String) : [];
                     if (selectedSensorIds.includes(String(opt.id))) {
                         option.selected = true;
                     }
                     sensorsSelect.appendChild(option);
                 });
             } else { console.warn("Select de sensores no encontrado en el form de actualización."); }

         } catch (error) {
             console.error("Error poblando selects en form de actualización:", error);
             showSnackbar("Error al cargar opciones para actualizar", "error");
         }

         // Poblar Insumos (No editable) - Llamar a la función de visualización
         const suppliesContainer = formElement.querySelector('[data-info="supplies-update-view"] [data-info="supplies"]');
         if (suppliesContainer) {
             await displayProductionSuppliesView(formElement, productionData.supplies || []); // Reusa la función de visualización
         } else {
             console.warn("Contenedor [data-info='supplies'] para insumos no encontrado en form de actualización.");
         }
    }

    // Helper para poblar selects existentes en el form de update
     function populateSelectExisting(selectElement, options, selectedValue) {
         if (!selectElement) return;
         selectElement.innerHTML = '<option value="">Seleccione...</option>'; // Opción default
         options.forEach(opt => {
             // Asegurarse que opt tiene id y name
             if (opt && opt.id !== undefined && opt.name !== undefined) {
                 const option = document.createElement('option');
                 option.value = opt.id;
                 option.textContent = opt.name;
                 // Comparación flexible (string vs number)
                 if (String(opt.id) === String(selectedValue)) {
                     option.selected = true;
                 }
                 selectElement.appendChild(option);
             } else {
                 console.warn("Opción inválida encontrada:", opt);
             }
         });
     }


    // Actualizar producción
    async function updateProduction() {
        const form = document.querySelector('[data-form="update"]');
        if (!form || !currentProductionId) {
             showSnackbar("No se ha seleccionado una producción para actualizar.", "error");
             return;
        }

        // Validación del formulario de actualización
         let updateIsValid = true;
         form.querySelectorAll('[required]').forEach(input => {
             const fieldName = input.getAttribute('data-field');
             const errorElement = form.querySelector(`[data-error="${fieldName}"]`);
             let fieldValid = true;
             let errorMessage = 'Este campo es requerido';

              if (input.disabled) return; // No validar campos deshabilitados

             if (input.tagName === 'SELECT' && input.multiple) {
                 if (input.selectedOptions.length === 0) { fieldValid = false; }
                 if (fieldName === 'sensors') {
                     if (input.selectedOptions.length > 3) { fieldValid = false; errorMessage = 'Máximo 3 sensores'; }
                     else if (input.selectedOptions.length === 0 && input.hasAttribute('required')) { fieldValid = false; }
                 }
             } else if (input.type === 'date') {
                 if (!input.value) { fieldValid = false; }
             } else if (!input.value || !input.value.trim()) {
                 fieldValid = false;
             }

             // Validar fecha de fin vs fecha de inicio (que está disabled pero tiene valor)
             if (fieldName === 'end-date') {
                 const startDateInput = form.querySelector('[data-field="start-date"]');
                 if (startDateInput && input.value && startDateInput.value && new Date(input.value) < new Date(startDateInput.value)) {
                    fieldValid = false;
                    errorMessage = 'La fecha de fin debe ser posterior a la de inicio.';
                 }
             }

              if (!fieldValid) {
                  if (errorElement) { errorElement.textContent = errorMessage; errorElement.style.display = 'block'; }
                  updateIsValid = false;
              } else {
                  if (errorElement) { errorElement.style.display = 'none'; }
              }
         });

         if (!updateIsValid) {
             showSnackbar("Formulario inválido. Revise los campos marcados.", "warning");
             return;
         }

        try {
            const updatedData = {
                // No incluir start_date porque está deshabilitado y no debe enviarse
                name: form.querySelector('[data-field="name"]').value,
                responsible: form.querySelector('[data-field="responsible"]').value,
                cultivation: form.querySelector('[data-field="cultivation"]').value,
                cycle: form.querySelector('[data-field="cycle"]').value,
                sensors: Array.from(form.querySelector('[data-field="sensors"]').selectedOptions).map(opt => opt.value),
                // supplies: NO EDITABLE AQUÍ - el backend no debería intentar actualizarlo si no se envía
                end_date: form.querySelector('[data-field="end-date"]').value, // Enviar fecha fin editable
                status: form.querySelector('[data-field="status"]').value
            };

             showSnackbar("Actualizando...", "info");
            const response = await fetch(`${API_BASE_URL}/productions/${currentProductionId}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData) // Backend debe manejar la ausencia de 'supplies' y 'start_date'
            });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.error || `Error HTTP ${response.status}`);

            showSnackbar('Producción actualizada exitosamente');
            form.classList.add('dashboard__form--hidden'); // Oculta form
            form.reset(); // Limpia
            currentProductionId = null; // Resetea ID
            await loadProductionsList(); // Refresca lista

        } catch (error) {
            console.error('Error al actualizar producción:', error);
            showSnackbar(`Error al actualizar: ${error.message}`, 'error');
        }
    }

    // Configurar formulario de habilitar/deshabilitar
    function setupEnableForm() {
        const form = document.querySelector('[data-form="enable"]');
        const resultSection = document.querySelector('[data-result="enable"]');
        if (!form || !resultSection) return;

        form.addEventListener('submit', async function(e) {
             e.preventDefault();
             const idInput = form.querySelector('[data-field="production-id"]');
             const productionId = idInput?.value?.trim();
             const errorSpan = form.querySelector('[data-error="production-id"]');
             if(errorSpan) { errorSpan.textContent = ''; errorSpan.style.display = 'none'; } // Limpiar error

             if (!productionId) {
                 showSnackbar('Ingrese ID de producción', 'warning');
                 if (errorSpan) { errorSpan.textContent = 'Ingrese ID'; errorSpan.style.display = 'block'; }
                 return;
             }

             resultSection.classList.add('dashboard__result--hidden'); // Ocultar resultado anterior

             const idMatch = productionId.match(/(\d+)$/);
             const actualId = idMatch ? idMatch[1] : productionId;

             try {
                 showSnackbar("Buscando producción...", "info");
                const response = await fetch(`${API_BASE_URL}/productions/${actualId}`);
                 if (!response.ok) {
                      if (response.status === 404) throw new Error('Producción no encontrada');
                      throw new Error(`Error al buscar: ${response.statusText}`);
                 }
                 const result = await response.json();
                 if (!result.success || !result.data) throw new Error(result.error || 'No se encontraron datos');

                 const production = result.data;
                 currentProductionId = production.id; // Guarda ID numérico para toggle

                 const content = resultSection.querySelector('[data-content="status"]');
                 if (content) {
                      const statusText = production.status === 'active' ? 'Activo' : 'Inactivo';
                      const statusClass = production.status === 'active' ? 'active' : 'inactive';
                     content.innerHTML = `
                         <div class="dashboard__info-item">
                             <div class="dashboard__info-label">Producción</div>
                             <div class="dashboard__info-value">${production.name || 'N/A'} (ID: prod-${production.id})</div>
                         </div>
                         <div class="dashboard__info-item">
                             <div class="dashboard__info-label">Estado Actual</div>
                             <div class="dashboard__info-value">
                                 <span class="status-badge status-badge--${statusClass}">${statusText}</span>
                             </div>
                         </div>`;
                 }

                 const toggleButton = resultSection.querySelector('[data-action="toggle-status"]');
                 if (toggleButton) {
                     toggleButton.textContent = production.status === 'active' ? 'Deshabilitar' : 'Habilitar';
                     // Remover listener anterior antes de añadir uno nuevo para evitar duplicados
                     toggleButton.replaceWith(toggleButton.cloneNode(true)); // Clonar para remover listeners
                     resultSection.querySelector('[data-action="toggle-status"]').addEventListener('click', async () => await toggleProductionStatus(production)); // Adjuntar nuevo
                     toggleButton.disabled = false; // Habilitar botón
                 }
                 resultSection.classList.remove('dashboard__result--hidden');
                 // form.reset(); // Limpiar input de búsqueda después de encontrar

             } catch (error) {
                 console.error('Error buscando para habilitar/deshabilitar:', error);
                 showSnackbar(error.message, 'error');
                  if (errorSpan) { errorSpan.textContent = error.message; errorSpan.style.display = 'block'; }
                 resultSection.classList.add('dashboard__result--hidden');
                 const toggleButton = resultSection.querySelector('[data-action="toggle-status"]');
                 if (toggleButton) toggleButton.disabled = true; // Deshabilitar si hay error
             }
        });
    }


    // Cambiar estado de producción
    async function toggleProductionStatus(currentProductionData) {
        if (!currentProductionData || !currentProductionData.id) {
             showSnackbar("Error: No se pudo identificar la producción.", "error");
             return;
        }
        const currentStatus = currentProductionData.status;
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
        const actionText = newStatus === 'active' ? 'habilitar' : 'deshabilitar';

         showSnackbar(`Intentando ${actionText}...`, "info");

        // El backend necesita todos los campos que espera el PUT, excepto los que no se modifican (como supplies, start_date)
        // Pasamos solo los campos necesarios para el cambio de estado + otros obligatorios si los hubiera.
        // La forma más segura es pasar SOLO el campo 'status' si el backend lo permite,
        // o pasar todos los datos actuales EXCEPTO los no editables, cambiando solo 'status'.
         const updatePayload = {
             // Incluir todos los campos actuales para que el backend no los borre
             ...currentProductionData,
             // Sobrescribir solo el estado
             status: newStatus,
              // Asegurarse que las fechas están en formato YYYY-MM-DD si se incluyen
             start_date: currentProductionData.start_date ? new Date(currentProductionData.start_date).toISOString().split('T')[0] : undefined,
             end_date: currentProductionData.end_date ? new Date(currentProductionData.end_date).toISOString().split('T')[0] : undefined,
             // Convertir arrays a strings si el backend los espera así (basado en tu PUT original)
             sensors: Array.isArray(currentProductionData.sensors) ? currentProductionData.sensors.join(',') : currentProductionData.sensors,
             supplies: Array.isArray(currentProductionData.supplies) ? currentProductionData.supplies.join(',') : currentProductionData.supplies,
             // Remover campos que no existen en la tabla DB o que no deben actualizarse
             responsible_name: undefined,
             cultivation_name: undefined,
             cycle_name: undefined,
             created_at: undefined,
             updated_at: undefined
         };
          // Eliminar 'start_date' del payload ya que no debe actualizarse
         delete updatePayload.start_date;
         // Eliminar 'supplies' si no son editables en el backend durante el toggle
         // delete updatePayload.supplies; // Descomentar si es necesario

        try {
            const response = await fetch(`${API_BASE_URL}/productions/${currentProductionData.id}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatePayload)
            });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.error || `Error al cambiar estado (HTTP ${response.status})`);

            showSnackbar(`Producción ${actionText}da exitosamente.`);

            // Refrescar vista actual y lista
            const enableForm = document.querySelector('[data-form="enable"]');
            const idInput = enableForm?.querySelector('[data-field="production-id"]');
             // Volver a buscar para mostrar el estado actualizado
             if(enableForm && idInput && idInput.value) {
                 enableForm.dispatchEvent(new Event('submit', { bubbles: true })); // Simula submit para refrescar
             } else {
                 // Si no se puede refrescar automáticamente, al menos limpia
                 const resultSection = document.querySelector('[data-result="enable"]');
                 if (resultSection) resultSection.classList.add('dashboard__result--hidden');
             }
            await loadProductionsList(); // Refresca la tabla

        } catch (error) {
            console.error('Error al cambiar estado:', error);
            showSnackbar(`Error al ${actionText}: ${error.message}`, 'error');
        }
    }

    // Configurar sección de listado
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


    // Cargar lista de producciones
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

            // Filtrado cliente
            filteredProductions = allProductions.filter(p =>
                 (filterStatus === 'all' || p.status === filterStatus) &&
                 (!searchTerm ||
                     `prod-${p.id}`.includes(searchTerm) || // Buscar por ID formateado
                     (p.name && p.name.toLowerCase().includes(searchTerm)) ||
                     (p.cultivation_name && p.cultivation_name.toLowerCase().includes(searchTerm)) ||
                     (p.cycle_name && p.cycle_name.toLowerCase().includes(searchTerm)) ||
                     (p.responsible_name && p.responsible_name.toLowerCase().includes(searchTerm)) // Añadir búsqueda por responsable
                 )
            );

            // Paginación
            const totalProductions = filteredProductions.length;
            const totalPages = Math.ceil(totalProductions / productionsPerPage) || 1;
            currentPage = Math.max(1, Math.min(currentPage, totalPages)); // Asegurar que currentPage esté en rango
            const startIndex = (currentPage - 1) * productionsPerPage;
            const paginatedProductions = filteredProductions.slice(startIndex, startIndex + productionsPerPage);

            // Render tabla
            tableBody.innerHTML = ''; // Limpiar loading/datos anteriores
            if (paginatedProductions.length === 0) {
                 tableBody.innerHTML = '<tr><td colspan="6" class="dashboard__table-cell dashboard__table-cell--no-results">No se encontraron producciones que coincidan con los filtros.</td></tr>';
            } else {
                paginatedProductions.forEach(p => {
                     const row = document.createElement('tr'); row.className = 'dashboard__table-row';
                     const statusText = p.status === 'active' ? 'Activo' : 'Inactivo';
                     const statusClass = p.status === 'active' ? 'active' : 'inactive';
                     const toggleIcon = p.status === 'active' ? 'toggle_on' : 'toggle_off';
                     const toggleTitle = p.status === 'active' ? 'Deshabilitar' : 'Habilitar';

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

                     // Añadir listeners a los botones de acción
                     row.querySelector('.action-view').addEventListener('click', () => navigateToActionTab('view', p.id));
                     row.querySelector('.action-edit').addEventListener('click', () => navigateToActionTab('update', p.id));
                     row.querySelector('.action-toggle').addEventListener('click', () => navigateToActionTab('enable', p.id));

                     tableBody.appendChild(row);
                });
            }

            // Actualizar Paginación info y botones
            paginationInfo.textContent = `Página ${currentPage} de ${totalPages}`;
            paginationInfo.dataset.totalPages = totalPages.toString(); // Guardar total de páginas
            prevButton.disabled = currentPage === 1;
            nextButton.disabled = currentPage === totalPages;

        } catch (error) {
            console.error('Error cargando lista de producciones:', error);
            showSnackbar(`Error al cargar lista: ${error.message}`, 'error');
            tableBody.innerHTML = `<tr><td colspan="6" class="dashboard__table-cell dashboard__table-cell--error">Error al cargar las producciones. Intente de nuevo más tarde.</td></tr>`;
        }
    }

    // Helper para navegar desde la lista a otra pestaña y buscar
     function navigateToActionTab(tabName, productionId) {
         const targetTab = document.querySelector(`.navigation__tab[data-tab="${tabName}"]`);
         if (targetTab) {
            targetTab.click(); // Cambia a la pestaña deseada

             // Espera un poco para que la pestaña cambie y el formulario esté visible
             setTimeout(() => {
                 let inputSelector, formSelector;
                 // Determina los selectores correctos para cada pestaña
                 if (tabName === 'view') {
                    inputSelector = '[data-form="view"] [data-field="production-id"]';
                    formSelector = '[data-form="view"]';
                 } else if (tabName === 'update') {
                    inputSelector = '[data-form="search-update"] [data-field="production-id"]'; // Usa el form de búsqueda
                    formSelector = '[data-form="search-update"]';
                 } else if (tabName === 'enable') {
                    inputSelector = '[data-form="enable"] [data-field="production-id"]';
                    formSelector = '[data-form="enable"]';
                 } else {
                     console.warn(`Navegación no implementada para tab: ${tabName}`);
                     return;
                 }

                 const input = document.querySelector(inputSelector);
                 const form = document.querySelector(formSelector);

                 if (input && form) {
                     input.value = `prod-${productionId}`; // Pone el ID en el input
                     // Simula el evento submit en el formulario correspondiente para iniciar la búsqueda
                     form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
                 } else {
                     console.warn(`Elementos no encontrados para la acción en tab ${tabName}: input ${inputSelector}, form ${formSelector}`);
                     showSnackbar(`No se pudo iniciar la acción en la pestaña ${tabName}.`, 'warning');
                 }
             }, 150); // Un pequeño delay puede ayudar a asegurar que el DOM está listo
         } else {
             console.error(`Tab ${tabName} no encontrada.`);
             showSnackbar(`Error: No se pudo cambiar a la pestaña ${tabName}.`, 'error');
         }
     }


    // Configurar formulario de reportes
     function setupReportForm() {
        const form = document.querySelector('[data-form="report"]');
        if (form) {
             form.addEventListener('submit', async (e) => {
                 e.preventDefault();
                 await generateReport();
             });
         } else { console.warn("Formulario de reportes no encontrado."); }
    }


    // Generar reporte (simulado)
     async function generateReport() {
        const form = document.querySelector('[data-form="report"]');
        if(!form) return;
        const startDate = form.querySelector('[data-field="start-date"]').value;
        const endDate = form.querySelector('[data-field="end-date"]').value;
        const format = form.querySelector('input[name="format"]:checked')?.value || 'excel';
        const errorSpan = form.querySelector('[data-error="date-range"]');

         // Limpiar error anterior
         if (errorSpan) { errorSpan.textContent=''; errorSpan.style.display='none';}

        if (!startDate || !endDate) {
             if(errorSpan){ errorSpan.textContent='Seleccione ambas fechas'; errorSpan.style.display='block';}
             showSnackbar('Seleccione un rango de fechas válido', 'warning'); return;
        }
        if (new Date(startDate) > new Date(endDate)) {
             if(errorSpan){ errorSpan.textContent='La fecha de inicio no puede ser posterior a la fecha de fin'; errorSpan.style.display='block';}
             showSnackbar('Rango de fechas inválido', 'warning'); return;
        }

        showSnackbar(`Generando reporte ${format.toUpperCase()}...`, 'info');
        try {
            await new Promise(resolve => setTimeout(resolve, 1500)); // Simulación de generación
            showSnackbar(`Reporte ${format.toUpperCase()} generado exitosamente (simulado)`);
            form.reset(); // Limpiar formulario después de generar
        } catch (error) {
             console.error("Error simulando generación de reporte:", error);
             showSnackbar('Error al generar el reporte', 'error');
        }
    }


    // Mostrar snackbar (con mejoras)
    let snackbarTimeoutId = null; // Variable para controlar el timeout
    function showSnackbar(message, type = 'success') {
        const snackbar = document.querySelector('[data-snackbar]');
        const messageElement = snackbar?.querySelector('[data-snackbar-message]');
        const closeButton = snackbar?.querySelector('[data-action="close-snackbar"]');
        if (!snackbar || !messageElement) { console.error("Snackbar elements missing!"); return; }

        // Limpiar timeout anterior si existe
        if (snackbarTimeoutId) clearTimeout(snackbarTimeoutId);

        messageElement.textContent = message;
        // Define colores o clases CSS para tipos
        const typeClasses = { success: 'snackbar--success', error: 'snackbar--error', warning: 'snackbar--warning', info: 'snackbar--info' };
        // Remover clases anteriores y añadir la nueva
        snackbar.classList.remove(...Object.values(typeClasses));
        snackbar.classList.add(typeClasses[type] || typeClasses['info']);

        snackbar.classList.add('snackbar--visible');

        // Función para ocultar
        const hideSnackbar = () => snackbar.classList.remove('snackbar--visible');

         // Asegurarse que el listener del botón cerrar se añade solo una vez o se reemplaza
         if (closeButton) {
             // Clonar y reemplazar para limpiar listeners antiguos
             const newCloseButton = closeButton.cloneNode(true);
             closeButton.parentNode.replaceChild(newCloseButton, closeButton);
             newCloseButton.addEventListener('click', hideSnackbar);
         }

        // Auto-ocultar después de 5 segundos
        snackbarTimeoutId = setTimeout(hideSnackbar, 5000);
    }


    // Formatear fecha
    function formatDate(dateString) {
        if (!dateString || dateString === '0000-00-00' || dateString.startsWith('0001-')) return 'No definida'; // Manejar fecha inválida de DB
        try {
             // Crear fecha asumiendo que es UTC si viene como YYYY-MM-DD
             const date = new Date(dateString + 'T00:00:00Z'); // Añadir tiempo y zona UTC
             // Verificar si la fecha es válida
             if (isNaN(date.getTime())) {
                 // Intentar parsear sin la hora UTC si el formato es diferente
                 const simpleDate = new Date(dateString);
                 if (isNaN(simpleDate.getTime())) return 'Fecha inválida';
                 // Usar la fecha simple si es válida
                  const options = { year: 'numeric', month: 'long', day: 'numeric' };
                 return simpleDate.toLocaleDateString('es-ES', options);

             }
             const options = { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }; // Mostrar en UTC para consistencia
             return date.toLocaleDateString('es-ES', options);
         } catch(e) {
             console.error("Error formateando fecha:", dateString, e);
             return 'Fecha inválida';
         }
    }


    // Resetear formularios
    function resetForms() {
        // Resetear todos los forms
        document.querySelectorAll('form').forEach(form => {
             form.reset();
             // Limpiar errores específicos del form
             form.querySelectorAll('.dashboard__error').forEach(span => { span.textContent=''; span.style.display='none';});
             // Si es el form de creación, limpiar lista de insumos y estimaciones
             if (form.getAttribute('data-form') === 'create') {
                selectedSupplies = []; // Limpia array interno
                renderSelectedSupplies(); // Limpia lista UI
                const investmentInput = form.querySelector('[data-field="investment"]'); if(investmentInput) investmentInput.value='';
                const goalInput = form.querySelector('[data-field="goal"]'); if(goalInput) goalInput.value='';
                const createBtn = form.querySelector('[data-action="create"]'); if(createBtn) createBtn.disabled = true;
             }
        });
        // Ocultar secciones de resultado
        document.querySelectorAll('.dashboard__result').forEach(el => {
            el.classList.add('dashboard__result--hidden');
        });
        // Ocultar form de update explícitamente
        const updateForm = document.querySelector('[data-form="update"]');
        if (updateForm) { updateForm.classList.add('dashboard__form--hidden'); }

        // Limpiar campos de ID de producción en forms de búsqueda (no los readonly)
        document.querySelectorAll('[data-field="production-id"]:not([readonly])').forEach(input => {
            input.value = '';
        });

        // Regenerar ID inicial para el form de creación
        setInitialProductionId(); // Llama a la función que obtiene el siguiente ID

         // Limpiar variable de ID actual
         currentProductionId = null;
    }

    // Inicializar la aplicación
    init();
});