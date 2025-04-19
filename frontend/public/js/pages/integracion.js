// Reemplazar todo el contenido de integracion.js con este código:

document.addEventListener('DOMContentLoaded', function() {
    // Variables globales
    let currentProductionId = null;
    let currentPage = 1;
    const productionsPerPage = 5;
    
    // URL base de la API
    const API_BASE_URL = 'http://localhost:3000/api';
    
    // Inicialización
    async function init() {
        setupNavigation();
        setupCreateForm();
        setupViewForm();
        setupUpdateForm();
        setupEnableForm();
        setupListSection();
        setupReportForm();
        await populateDropdowns();
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

                resetForms();
            });
        });
    }

    // Llenar dropdowns con datos de la base de datos
    async function populateDropdowns() {
        try {
            const response = await fetch(`${API_BASE_URL}/integracion/data`);
            const data = await response.json();
            
            if (!data.success) {
                throw new Error('Error al obtener datos para los dropdowns');
            }
            
            // Responsables
            const responsibleSelect = document.querySelector('[data-field="responsible"]');
            responsibleSelect.innerHTML = '<option value="">Seleccione un responsable</option>';
            data.data.users.forEach(user => {
                const option = document.createElement('option');
                option.value = user.id;
                option.textContent = user.name;
                responsibleSelect.appendChild(option);
            });

            // Cultivos
            const cultivationSelect = document.querySelector('[data-field="cultivation"]');
            cultivationSelect.innerHTML = '<option value="">Seleccione un cultivo</option>';
            data.data.cultivations.forEach(cult => {
                const option = document.createElement('option');
                option.value = cult.id;
                option.textContent = cult.name;
                cultivationSelect.appendChild(option);
            });

            // Ciclos
            const cycleSelect = document.querySelector('[data-field="cycle"]');
            cycleSelect.innerHTML = '<option value="">Seleccione un ciclo</option>';
            data.data.cycles.forEach(cycle => {
                const option = document.createElement('option');
                option.value = cycle.id;
                option.textContent = cycle.name;
                cycleSelect.appendChild(option);
            });

            // Sensores
            const sensorsSelect = document.querySelector('[data-field="sensors"]');
            sensorsSelect.innerHTML = '<option value="">Seleccione sensores</option>';
            data.data.sensors.forEach(sensor => {
                const option = document.createElement('option');
                option.value = sensor.id;
                option.textContent = sensor.name;
                sensorsSelect.appendChild(option);
            });

            // Insumos
            const suppliesSelect = document.querySelector('[data-field="supplies"]');
            suppliesSelect.innerHTML = '<option value="">Seleccione insumos</option>';
            data.data.supplies.forEach(supply => {
                const option = document.createElement('option');
                option.value = supply.id;
                option.textContent = supply.name;
                suppliesSelect.appendChild(option);
            });

            // Generar ID automático para nueva producción
           // Obtener el próximo ID
        const prodResponse = await fetch(`${API_BASE_URL}/productions`);
        const productions = await prodResponse.json();
        const nextId = productions.data.length > 0 ? 
            Math.max(...productions.data.map(p => p.id)) + 1 : 1;
        
        document.querySelector('[data-field="production-id"]').value = `prod-${nextId}`;
        
    } catch (error) {
        console.error('Error al poblar dropdowns:', error);
        showSnackbar('Error al cargar datos de los dropdowns', 'error');
    }
}

    // Configurar formulario de creación
    function setupCreateForm() {
        const form = document.querySelector('[data-form="create"]');
        
        // Configurar el botón de calcular
        const calculateButton = document.createElement('button');
        calculateButton.type = 'button';
        calculateButton.className = 'dashboard__button dashboard__button--secondary';
        calculateButton.textContent = 'Calcular';
        calculateButton.addEventListener('click', calculateEstimation);
        
        // Insertar el botón después del campo de inversión
        const investmentGroup = document.querySelector('[data-field="investment"]').parentNode;
        investmentGroup.appendChild(calculateButton);
        
        // Resto del código existente...
        form.querySelector('[data-action="cancel"]').addEventListener('click', resetForms);
        form.querySelector('[data-action="save-draft"]').addEventListener('click', saveAsDraft);
        
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            await createProduction();
        });
        
        form.querySelectorAll('[required]').forEach(input => {
            input.addEventListener('change', validateCreateForm);
        });
    }

    // Calcular estimación de inversión y meta
    // Reemplazar la función calculateEstimation existente con esta nueva versión
    async function calculateEstimation() {
        const suppliesSelect = document.querySelector('[data-field="supplies"]');
        const selectedSupplies = Array.from(suppliesSelect.selectedOptions).map(opt => opt.value);
        
        if (selectedSupplies.length === 0) {
            showSnackbar('Por favor seleccione al menos un insumo', 'warning');
            return;
        }
        
        try {
            // Calcular un valor aproximado basado en la cantidad de insumos seleccionados
            const totalInvestment = selectedSupplies.length * 203000; // $150 por insumo
            
            // Mostrar la inversión calculada
            document.querySelector('[data-field="investment"]').value = `$${totalInvestment.toFixed(2)}`;
            
            // Calcular la meta como un 30% más de la inversión
            const estimatedGoal = totalInvestment * 1.3;
            document.querySelector('[data-field="goal"]').value = `$${estimatedGoal.toFixed(2)}`;
            
            // Habilitar el botón de crear producción
            document.querySelector('[data-action="create"]').disabled = false;
            
            showSnackbar('Estimación calculada correctamente', 'success');
        } catch (error) {
            console.error('Error al calcular estimación:', error);
            showSnackbar('Error al obtener datos de insumos', 'error');
        }
    }
    
    // Validar formulario de creación
    function validateCreateForm() {
        const form = document.querySelector('[data-form="create"]');
        let isValid = true;
        
        form.querySelectorAll('[required]').forEach(input => {
            const errorElement = document.querySelector(`[data-error="${input.getAttribute('data-field')}"]`);
            
            if (!input.value) {
                errorElement.textContent = 'Este campo es requerido';
                errorElement.style.display = 'block';
                isValid = false;
            } else {
                errorElement.style.display = 'none';
            }
            
            if (input.getAttribute('data-field') === 'sensors') {
                const selectedOptions = Array.from(input.selectedOptions).length;
                if (selectedOptions > 3) {
                    errorElement.textContent = 'Máximo 3 sensores permitidos';
                    errorElement.style.display = 'block';
                    isValid = false;
                }
            }
        });
        
        return isValid;
    }

    // Crear nueva producción
    async function createProduction() {
        if (!validateCreateForm()) return;
        
        const form = document.querySelector('[data-form="create"]');
        const idDisplay = form.querySelector('[data-field="production-id"]').value;
        
        const newProduction = {
            name: form.querySelector('[data-field="name"]').value,
            responsible: form.querySelector('[data-field="responsible"]').value,
            cultivation: form.querySelector('[data-field="cultivation"]').value,
            cycle: form.querySelector('[data-field="cycle"]').value,
            sensors: Array.from(form.querySelector('[data-field="sensors"]').selectedOptions).map(opt => opt.value),
            supplies: Array.from(form.querySelector('[data-field="supplies"]').selectedOptions).map(opt => opt.value),
            startDate: form.querySelector('[data-field="start-date"]').value,
            endDate: form.querySelector('[data-field="end-date"]').value
        };
        
        try {
            const response = await fetch(`${API_BASE_URL}/productions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newProduction)
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Error al crear producción');
            }
            
            showSnackbar(`Producción creada exitosamente con ID: ${result.displayId}`);
            resetForms();
            await loadProductionsList();
        } catch (error) {
            console.error('Error al crear producción:', error);
            showSnackbar(error.message || 'Error al crear producción', 'error');
        }
    }

    // Generar datos simulados de sensores (esto podría reemplazarse con datos reales de sensores)
    function generateSensorData() {
        return {
            humidity: Array(7).fill(0).map(() => Math.floor(Math.random() * 20) + 60),
            temperature: Array(7).fill(0).map(() => Math.floor(Math.random() * 10) + 20),
            nutrients: Array(7).fill(0).map(() => Math.floor(Math.random() * 20) + 40),
            growth: Array(7).fill(0).map((_, i) => i * 10 + Math.floor(Math.random() * 5))
        };
    }

    // Guardar como borrador
    function saveAsDraft() {
        showSnackbar('Borrador guardado exitosamente');
    }

    // Configurar formulario de visualización
    function setupViewForm() {
        const form = document.querySelector('[data-form="view"]');
        
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            const productionId = form.querySelector('[data-field="production-id"]').value;
            await viewProduction(productionId);
        });
    }

    // Visualizar producción
    async function viewProduction(productionId) {
        try {
            const response = await fetch(`${API_BASE_URL}/productions/${productionId}`);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al obtener producción');
            }
    
            const result = await response.json();
            
            // Verificar si realmente hay datos
            if (!result.data) {
                throw new Error('Producción no encontrada');
            }
            
            const production = result.data;
            currentProductionId = production.id; // Usar el ID real de la base de datos
    
            // Mostrar sección de resultados
            const resultSection = document.querySelector('[data-result="view"]');
            resultSection.classList.remove('dashboard__result--hidden');
            
            // Llenar información básica
            const basicInfoContainer = document.querySelector('[data-info="basic"]');
            basicInfoContainer.innerHTML = '';
            
            const basicInfo = [
                { label: 'Nombre', value: production.name },
                { label: 'Responsable', value: production.responsible_name || 'Desconocido' },
                { label: 'Cultivo', value: production.cultivation_name || 'Desconocido' },
                { label: 'Ciclo', value: production.cycle_name || 'Desconocido' },
                { label: 'Fecha de inicio', value: formatDate(production.start_date) },
                { label: 'Fecha estimada de fin', value: formatDate(production.end_date) },
                { label: 'Estado', value: production.status === 'active' ? 'Activo' : 'Inactivo' }
            ];
            
            basicInfo.forEach(info => {
                const infoItem = document.createElement('div');
                infoItem.className = 'dashboard__info-item';
                
                const label = document.createElement('div');
                label.className = 'dashboard__info-label';
                label.textContent = info.label;
                
                const value = document.createElement('div');
                value.className = 'dashboard__info-value';
                value.textContent = info.value;
                
                infoItem.appendChild(label);
                infoItem.appendChild(value);
                basicInfoContainer.appendChild(infoItem);
            });
            
            // Actualizar métricas (simuladas)
            document.querySelector('[data-metric="health"]').textContent = `${Math.floor(Math.random() * 20) + 70}%`;
            document.querySelector('[data-metric="growth"]').textContent = `${Math.floor(Math.random() * 20) + 50}cm`;
            document.querySelector('[data-metric="yield"]').textContent = `${Math.floor(Math.random() * 20) + 70}%`;
            
            // Crear gráficos con datos simulados
            createChart('humidity', 'Humedad del suelo (%)', generateSensorData().humidity);
            createChart('temperature', 'Temperatura (°C)', generateSensorData().temperature);
            createChart('nutrients', 'Niveles de nutrientes (%)', generateSensorData().nutrients);
            createChart('growth', 'Crecimiento (cm)', generateSensorData().growth);
            
            // Mostrar estado de sensores
            const sensorsContainer = document.querySelector('[data-info="sensors"]');
            sensorsContainer.innerHTML = '';
            
            if (production.sensors && production.sensors.length > 0) {
                // Obtener información de los sensores
                const sensorsResponse = await fetch(`${API_BASE_URL}/sensores`);
                const allSensors = await sensorsResponse.json();
                
                production.sensors.forEach(sensorId => {
                    const sensor = allSensors.find(s => s.id == sensorId);
                    if (!sensor) return;
                    
                    const sensorCard = document.createElement('div');
                    sensorCard.className = 'dashboard__sensor-card';
                    
                    const icon = document.createElement('i');
                    icon.className = 'material-icons dashboard__sensor-icon';
                    icon.textContent = getSensorIcon(sensor.tipo_sensor);
                    
                    const info = document.createElement('div');
                    info.className = 'dashboard__sensor-info';
                    
                    const name = document.createElement('div');
                    name.className = 'dashboard__sensor-name';
                    name.textContent = sensor.nombre_sensor;
                    
                    const meta = document.createElement('div');
                    meta.className = 'dashboard__sensor-meta';
                    
                    const type = document.createElement('span');
                    type.textContent = sensor.tipo_sensor;
                    
                    const status = document.createElement('span');
                    status.textContent = sensor.estado === 'disponible' ? 'Operativo' : 'Inactivo';
                    status.style.color = sensor.estado === 'disponible' ? 'var(--color-success)' : 'var(--color-error)';
                    
                    meta.appendChild(type);
                    meta.appendChild(status);
                    info.appendChild(name);
                    info.appendChild(meta);
                    sensorCard.appendChild(icon);
                    sensorCard.appendChild(info);
                    sensorsContainer.appendChild(sensorCard);
                });
            }
        } catch (error) {
            console.error('Error al visualizar producción:', error);
            // Solo mostrar error si realmente no se encontró
            if (error.message.includes('no encontrada') || error.message.includes('not found')) {
                showSnackbar('Producción no encontrada', 'error');
            }
        }
    }

    // Obtener icono para el tipo de sensor
    function getSensorIcon(type) {
        const icons = {
            'humedad': 'opacity',
            'temperatura': 'thermostat',
            'nutrientes': 'eco',
            'luz': 'wb_sunny'
        };
        return icons[type] || 'sensors';
    }

    // Crear gráfico
    function createChart(chartId, label, data) {
        const ctx = document.querySelector(`[data-chart="${chartId}"]`).getContext('2d');
        
        if (ctx.chart) {
            ctx.chart.destroy();
        }
        
        const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
        
        ctx.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: days,
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
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false
                    }
                }
            }
        });
    }

    // Configurar formulario de actualización
    function setupUpdateForm() {
        const searchForm = document.querySelector('[data-form="search-update"]');
        const updateForm = document.querySelector('[data-form="update"]');
        
        searchForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const productionId = searchForm.querySelector('[data-field="production-id"]').value;
            
            try {
                const response = await fetch(`${API_BASE_URL}/productions/${productionId}`);
                const result = await response.json();
                
                if (!result.success || !result.data) {
                    throw new Error('No se encontró la producción');
                }
                
                const production = result.data;
                currentProductionId = productionId;
                updateForm.classList.remove('dashboard__form--hidden');
                
                // Llenar formulario con datos existentes
                updateForm.innerHTML = '';
    
                // Obtener datos para los dropdowns
                const dropdownsResponse = await fetch(`${API_BASE_URL}/integracion/data`);
                const dropdownsData = await dropdownsResponse.json();
    
                const fields = [
                    { label: 'Nombre de Producción', type: 'text', name: 'name', value: production.name, required: true },
                    { label: 'Responsable', type: 'select', name: 'responsible', options: dropdownsData.data.users, selected: production.responsible, required: true },
                    { label: 'Cultivo', type: 'select', name: 'cultivation', options: dropdownsData.data.cultivations, selected: production.cultivation, required: true },
                    { label: 'Ciclo', type: 'select', name: 'cycle', options: dropdownsData.data.cycles, selected: production.cycle, required: true },
                    { label: 'Sensores', type: 'select-multiple', name: 'sensors', options: dropdownsData.data.sensors, selected: production.sensors, required: true },
                    { label: 'Insumos', type: 'select-multiple', name: 'supplies', options: dropdownsData.data.supplies, selected: production.supplies, required: true },
                    { label: 'Fecha de Inicio', type: 'date', name: 'start-date', value: production.start_date, required: true },
                    { label: 'Fecha Estimada de Fin', type: 'date', name: 'end-date', value: production.end_date, required: true },
                    { label: 'Estado', type: 'select', name: 'status', options: [
                        {id: 'active', name: 'Activo'}, 
                        {id: 'inactive', name: 'Inactivo'}
                    ], selected: production.status, required: true }
                ];
    
                // Función auxiliar para crear campos del formulario
                fields.forEach(field => {
                    const group = document.createElement('div');
                    group.className = 'dashboard__form-group';
                    
                    const label = document.createElement('label');
                    label.className = 'dashboard__label';
                    label.textContent = field.label;
                    
                    group.appendChild(label);
                    
                    if (field.type === 'select') {
                        const select = document.createElement('select');
                        select.className = 'dashboard__select';
                        select.setAttribute('data-field', field.name);
                        if (field.required) select.required = true;
                        
                        field.options.forEach(option => {
                            const optElement = document.createElement('option');
                            optElement.value = option.id;
                            optElement.textContent = option.name;
                            if (option.id == field.selected) optElement.selected = true;
                            select.appendChild(optElement);
                        });
                        
                        group.appendChild(select);
                    } else if (field.type === 'select-multiple') {
                        const select = document.createElement('select');
                        select.className = 'dashboard__select';
                        select.multiple = true;
                        select.size = 3;
                        select.setAttribute('data-field', field.name);
                        if (field.required) select.required = true;
                        
                        field.options.forEach(option => {
                            const optElement = document.createElement('option');
                            optElement.value = option.id;
                            optElement.textContent = option.name;
                            if (field.selected && field.selected.includes(option.id.toString())) {
                                optElement.selected = true;
                            }
                            select.appendChild(optElement);
                        });
                        
                        group.appendChild(select);
                    } else {
                        const input = document.createElement('input');
                        input.className = 'dashboard__input';
                        input.type = field.type;
                        input.setAttribute('data-field', field.name);
                        input.value = field.value;
                        if (field.required) input.required = true;
                        
                        group.appendChild(input);
                    }
                    
                    updateForm.insertBefore(group, updateForm.querySelector('.dashboard__form-actions'));
                });
    
                // Botones de acciones
                const actions = document.createElement('div');
                actions.className = 'dashboard__form-actions';
                
                const submitButton = document.createElement('button');
                submitButton.className = 'dashboard__button dashboard__button--primary';
                submitButton.type = 'submit';
                submitButton.textContent = 'Actualizar';
                
                const cancelButton = document.createElement('button');
                cancelButton.className = 'dashboard__button dashboard__button--secondary';
                cancelButton.type = 'button';
                cancelButton.textContent = 'Cancelar';
                cancelButton.setAttribute('data-action', 'cancel-update');
                
                actions.appendChild(submitButton);
                actions.appendChild(cancelButton);
                updateForm.appendChild(actions);
                
                // Evento para cancelar
                cancelButton.addEventListener('click', function() {
                    updateForm.classList.add('dashboard__form--hidden');
                });
            } catch (error) {
                console.error('Error al buscar producción:', error);
                showSnackbar('No se encontró la producción', 'error');
            }
        });
        
        updateForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await updateProduction();
        });
    }

    // Actualizar producción
    async function updateProduction() {
        const form = document.querySelector('[data-form="update"]');
        
        try {
            const updatedData = {
                name: form.querySelector('[data-field="name"]').value,
                responsible: form.querySelector('[data-field="responsible"]').value,
                cultivation: form.querySelector('[data-field="cultivation"]').value,
                cycle: form.querySelector('[data-field="cycle"]').value,
                sensors: Array.from(form.querySelector('[data-field="sensors"]').selectedOptions).map(opt => opt.value),
                supplies: Array.from(form.querySelector('[data-field="supplies"]').selectedOptions).map(opt => opt.value),
                start_date: form.querySelector('[data-field="start-date"]').value,
                end_date: form.querySelector('[data-field="end-date"]').value,
                status: form.querySelector('[data-field="status"]').value || 'active'
            };
            
            const response = await fetch(`${API_BASE_URL}/productions/${currentProductionId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedData)
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Error al actualizar producción');
            }
            
            showSnackbar('Producción actualizada exitosamente');
            form.classList.add('dashboard__form--hidden');
            await loadProductionsList();
        } catch (error) {
            console.error('Error al actualizar producción:', error);
            showSnackbar(error.message || 'Error al actualizar la producción', 'error');
        }
    }

    // Configurar formulario de habilitar/deshabilitar
    function setupEnableForm() {
        const form = document.querySelector('[data-form="enable"]');
        
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            const productionId = form.querySelector('[data-field="production-id"]').value.trim();
            
            if (!productionId) {
                showSnackbar('Ingrese un ID de producción', 'error');
                return;
            }
    
            try {
                const response = await fetch(`${API_BASE_URL}/productions/${productionId}`);
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Error al buscar producción');
                }
    
                const result = await response.json();
                
                if (!result.data) {
                    throw new Error('Producción no encontrada');
                }
    
                const production = result.data;
                currentProductionId = production.id;
    
                const resultSection = document.querySelector('[data-result="enable"]');
                resultSection.classList.remove('dashboard__result--hidden');
    
                const content = document.querySelector('[data-content="status"]');
                content.innerHTML = `
                    <div class="dashboard__info-item">
                        <div class="dashboard__info-label">Producción</div>
                        <div class="dashboard__info-value">${production.name} (ID: ${production.id})</div>
                    </div>
                    <div class="dashboard__info-item">
                        <div class="dashboard__info-label">Estado actual</div>
                        <div class="dashboard__info-value">
                            <span class="status-badge status-badge--${production.status === 'active' ? 'active' : 'inactive'}">
                                ${production.status === 'active' ? 'Activo' : 'Inactivo'}
                            </span>
                        </div>
                    </div>
                `;
    
                // Configurar botón para cambiar estado
                const toggleButton = document.querySelector('[data-action="toggle-status"]');
                toggleButton.onclick = async function() {
                    try {
                        const newStatus = production.status === 'active' ? 'inactive' : 'active';
                        const updateResponse = await fetch(`${API_BASE_URL}/productions/${production.id}`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ 
                                status: newStatus,
                                // Mantener todos los demás campos igual
                                name: production.name,
                                responsible: production.responsible,
                                cultivation: production.cultivation,
                                cycle: production.cycle,
                                sensors: production.sensors,
                                supplies: production.supplies,
                                start_date: production.start_date,
                                end_date: production.end_date
                            })
                        });
    
                        if (!updateResponse.ok) {
                            const errorData = await updateResponse.json();
                            throw new Error(errorData.error || 'Error al actualizar estado');
                        }
    
                        showSnackbar(`Estado cambiado a ${newStatus === 'active' ? 'Activo' : 'Inactivo'} correctamente`);
                        
                        // Actualizar la vista
                        form.dispatchEvent(new Event('submit'));
                    } catch (error) {
                        console.error('Error al cambiar estado:', error);
                        showSnackbar(error.message || 'Error al cambiar estado', 'error');
                    }
                };
            } catch (error) {
                console.error('Error:', error);
                showSnackbar(error.message.includes('no encontrada') ? 
                    'Producción no encontrada' : 'Error al buscar producción', 'error');
            }
        });
    }

    // Configurar sección de listado
    function setupListSection() {
        // Búsqueda
        const searchInput = document.querySelector('[data-field="search"]');
        searchInput.addEventListener('input', function() {
            currentPage = 1;
            loadProductionsList();
        });
        
        // Filtro por estado
        const filterSelect = document.querySelector('[data-field="filter-status"]');
        filterSelect.addEventListener('change', function() {
            currentPage = 1;
            loadProductionsList();
        });
        
        // Paginación
        document.querySelector('[data-action="prev-page"]').addEventListener('click', function() {
            if (currentPage > 1) {
                currentPage--;
                loadProductionsList();
            }
        });
        
        document.querySelector('[data-action="next-page"]').addEventListener('click', function() {
            // Verificamos el total de páginas después de cargar los datos
            const totalPages = Math.ceil(filteredProductions.length / productionsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                loadProductionsList();
            }
        });
    }

    // Variable para almacenar producciones filtradas
    let filteredProductions = [];
    
    // Cargar lista de producciones
    async function loadProductionsList() {
        try {
            const response = await fetch(`${API_BASE_URL}/productions`);
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error('Error al obtener producciones');
            }
            
            // Aplicar filtros
            const searchTerm = document.querySelector('[data-field="search"]').value.toLowerCase();
            const filterStatus = document.querySelector('[data-field="filter-status"]').value;
            
            filteredProductions = result.data.filter(production => {
                if (filterStatus !== 'all' && production.status !== filterStatus) {
                    return false;
                }
                
                if (searchTerm) {
                    const productionName = production.name.toLowerCase();
                    const cultivationName = production.cultivation_name ? production.cultivation_name.toLowerCase() : '';
                    const cycleName = production.cycle_name ? production.cycle_name.toLowerCase() : '';
                    
                    return productionName.includes(searchTerm) || 
                           cultivationName.includes(searchTerm) || 
                           cycleName.includes(searchTerm);
                }
                
                return true;
            });
            
            // Paginación
            const startIndex = (currentPage - 1) * productionsPerPage;
            const paginatedProductions = filteredProductions.slice(startIndex, startIndex + productionsPerPage);
            
            const tableBody = document.querySelector('[data-list="productions"]');
            tableBody.innerHTML = '';
            
            if (paginatedProductions.length === 0) {
                const row = document.createElement('tr');
                row.className = 'dashboard__table-row';
                
                const cell = document.createElement('td');
                cell.className = 'dashboard__table-cell';
                cell.colSpan = 6;
                cell.textContent = 'No se encontraron producciones';
                cell.style.textAlign = 'center';
                
                row.appendChild(cell);
                tableBody.appendChild(row);
                return;
            }
            
            // En la creación de filas de la tabla, modifica:
        paginatedProductions.forEach(production => {
            const row = document.createElement('tr');
            row.className = 'dashboard__table-row';
            
            // ID (mostrar como prod-X)
            const idCell = document.createElement('td');
            idCell.className = 'dashboard__table-cell';
            idCell.textContent = `prod-${production.id}`;
            row.appendChild(idCell);
                
                // Nombre
                const nameCell = document.createElement('td');
                nameCell.className = 'dashboard__table-cell';
                nameCell.textContent = production.name;
                row.appendChild(nameCell);
                
                // Cultivo
                const cultCell = document.createElement('td');
                cultCell.className = 'dashboard__table-cell';
                cultCell.textContent = production.cultivation_name || 'Desconocido';
                row.appendChild(cultCell);
                
                // Ciclo
                const cycleCell = document.createElement('td');
                cycleCell.className = 'dashboard__table-cell';
                cycleCell.textContent = production.cycle_name || 'Desconocido';
                row.appendChild(cycleCell);
                
                // Estado
                const statusCell = document.createElement('td');
                statusCell.className = 'dashboard__table-cell';
                const statusBadge = document.createElement('span');
                statusBadge.className = `status-badge status-badge--${production.status === 'active' ? 'active' : 'inactive'}`;
                statusBadge.textContent = production.status === 'active' ? 'Activo' : 'Inactivo';
                statusCell.appendChild(statusBadge);
                row.appendChild(statusCell);
                
                // Acciones
                const actionsCell = document.createElement('td');
                actionsCell.className = 'dashboard__table-cell dashboard__table-cell--actions';
                
                const viewButton = document.createElement('button');
                viewButton.className = 'dashboard__button dashboard__button--icon';
                viewButton.innerHTML = '<i class="material-icons">visibility</i>';
                viewButton.title = 'Ver detalles';
                viewButton.addEventListener('click', () => {
                    document.querySelector('[data-tab="view"]').click();
                    document.querySelector('[data-form="view"] [data-field="production-id"]').value = production.id;
                    document.querySelector('[data-form="view"]').dispatchEvent(new Event('submit'));
                });
                
                const editButton = document.createElement('button');
                editButton.className = 'dashboard__button dashboard__button--icon';
                editButton.innerHTML = '<i class="material-icons">edit</i>';
                editButton.title = 'Editar';
                editButton.addEventListener('click', () => {
                    document.querySelector('[data-tab="update"]').click();
                    document.querySelector('[data-form="search-update"] [data-field="production-id"]').value = production.id;
                    document.querySelector('[data-form="search-update"]').dispatchEvent(new Event('submit'));
                });
                
                actionsCell.appendChild(viewButton);
                actionsCell.appendChild(editButton);
                row.appendChild(actionsCell);
                
                tableBody.appendChild(row);
            });
            
            // Actualizar información de paginación
            const totalPages = Math.ceil(filteredProductions.length / productionsPerPage);
            document.querySelector('[data-info="page"]').textContent = `Página ${currentPage} de ${totalPages}`;
            
            // Habilitar/deshabilitar botones de paginación
            document.querySelector('[data-action="prev-page"]').disabled = currentPage === 1;
            document.querySelector('[data-action="next-page"]').disabled = currentPage === totalPages || totalPages === 0;
        } catch (error) {
            console.error('Error al cargar producciones:', error);
            showSnackbar('Error al cargar producciones', 'error');
        }
    }

    // Configurar formulario de reportes
    function setupReportForm() {
        const form = document.querySelector('[data-form="report"]');
        
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            await generateReport();
        });
    }

    // Generar reporte
    async function generateReport() {
        const startDate = document.querySelector('[data-form="report"] [data-field="start-date"]').value;
        const endDate = document.querySelector('[data-form="report"] [data-field="end-date"]').value;
        const format = document.querySelector('[data-form="report"] input[name="format"]:checked').value;
        
        if (!startDate || !endDate) {
            showSnackbar('Seleccione un rango de fechas válido', 'error');
            return;
        }
        
        try {
            // Filtrar producciones en el rango de fechas
            const response = await fetch(`${API_BASE_URL}/productions`);
            const result = await response.json();
            
            if (!result.success) {
                throw new Error('Error al obtener producciones');
            }
            
            const filtered = result.data.filter(production => {
                return production.start_date >= startDate && production.end_date <= endDate;
            });
            
            if (filtered.length === 0) {
                showSnackbar('No hay producciones en el rango seleccionado', 'warning');
                return;
            }
            
            // Simular generación de reporte
            setTimeout(() => {
                showSnackbar(`Reporte generado en formato ${format.toUpperCase()}`);
                console.log('Reporte generado con datos:', filtered);
            }, 1500);
        } catch (error) {
            console.error('Error al generar reporte:', error);
            showSnackbar('Error al generar reporte', 'error');
        }
    }

    // Mostrar snackbar (notificación)
    function showSnackbar(message, type = 'success') {
        const snackbar = document.querySelector('[data-snackbar]');
        const messageElement = document.querySelector('[data-snackbar-message]');
        
        messageElement.textContent = message;
        
        const colors = {
            'success': 'var(--color-success)',
            'error': 'var(--color-error)',
            'warning': 'var(--color-warning)',
            'info': 'var(--color-info)'
        };
        
        snackbar.style.backgroundColor = colors[type] || colors['success'];
        snackbar.classList.add('snackbar--visible');
        
        setTimeout(() => {
            snackbar.classList.remove('snackbar--visible');
        }, 3000);
    }

    // Formatear fecha
    function formatDate(dateString) {
        if (!dateString) return 'No definida';
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('es-ES', options);
    }

    // Resetear formularios
    function resetForms() {
        const createForm = document.querySelector('[data-form="create"]');
        if (createForm) {
            createForm.reset();
            document.querySelector('[data-field="production-id"]').value = `prod-${filteredProductions.length + 1}`;
            document.querySelector('[data-action="create"]').disabled = true;
        }
        
        document.querySelectorAll('.dashboard__result--hidden').forEach(el => {
            el.classList.add('dashboard__result--hidden');
        });
        
        const updateForm = document.querySelector('[data-form="update"]');
        if (updateForm) {
            updateForm.classList.add('dashboard__form--hidden');
        }
        
        document.querySelectorAll('[data-field="production-id"]').forEach(input => {
            if (!input.readOnly) input.value = '';
        });
    }

    // Inicializar la aplicación
    init();
});