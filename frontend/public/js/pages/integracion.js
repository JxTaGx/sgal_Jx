// integracion.js

document.addEventListener('DOMContentLoaded', function() {
    // Datos simulados
    const simulatedData = {
        users: [
            { id: 'user-1', name: 'Juan Pérez' },
            { id: 'user-2', name: 'María García' },
            { id: 'user-3', name: 'Carlos López' }
        ],
        cultivations: [
            { id: 'cult-1', name: 'Maíz' },
            { id: 'cult-2', name: 'Trigo' },
            { id: 'cult-3', name: 'Soja' },
            { id: 'cult-4', name: 'Girasol' }
        ],
        cycles: [
            { id: 'cycle-1', name: 'Primavera-Verano' },
            { id: 'cycle-2', name: 'Otoño-Invierno' },
            { id: 'cycle-3', name: 'Anual' }
        ],
        sensors: [
            { id: 'sensor-1', name: 'Humedad del suelo', type: 'humedad' },
            { id: 'sensor-2', name: 'Temperatura ambiente', type: 'temperatura' },
            { id: 'sensor-3', name: 'Nivel de nutrientes', type: 'nutrientes' },
            { id: 'sensor-4', name: 'Luminosidad', type: 'luz' }
        ],
        supplies: [
            { id: 'supply-1', name: 'Fertilizante NPK', cost: 150 },
            { id: 'supply-2', name: 'Herbicida', cost: 80 },
            { id: 'supply-3', name: 'Pesticida', cost: 120 },
            { id: 'supply-4', name: 'Semillas premium', cost: 200 }
        ],
        productions: [
            {
                id: 'prod-1',
                name: 'Maíz Primavera 2023',
                responsible: 'user-1',
                cultivation: 'cult-1',
                cycle: 'cycle-1',
                sensors: ['sensor-1', 'sensor-2'],
                supplies: ['supply-1', 'supply-2'],
                startDate: '2023-09-01',
                endDate: '2023-12-15',
                status: 'active',
                metrics: {
                    health: 85,
                    growth: 63,
                    yield: 78
                },
                sensorData: {
                    humidity: [65, 68, 72, 70, 67, 69, 71],
                    temperature: [22, 24, 25, 23, 24, 26, 25],
                    nutrients: [45, 50, 48, 52, 47, 49, 51],
                    growth: [10, 20, 30, 40, 50, 60, 70]
                }
            },
            {
                id: 'prod-2',
                name: 'Trigo Otoño 2023',
                responsible: 'user-2',
                cultivation: 'cult-2',
                cycle: 'cycle-2',
                sensors: ['sensor-1', 'sensor-3'],
                supplies: ['supply-1', 'supply-3'],
                startDate: '2023-03-15',
                endDate: '2023-07-30',
                status: 'inactive',
                metrics: {
                    health: 72,
                    growth: 45,
                    yield: 65
                },
                sensorData: {
                    humidity: [70, 72, 75, 73, 71, 74, 72],
                    temperature: [18, 19, 20, 19, 18, 20, 19],
                    nutrients: [55, 58, 60, 57, 59, 61, 58],
                    growth: [15, 25, 35, 45, 55, 65, 75]
                }
            }
        ]
    };

    // Variables globales
    let currentProductionId = null;
    let currentPage = 1;
    const productionsPerPage = 5;

    // Inicialización
    function init() {
        setupNavigation();
        setupCreateForm();
        setupViewForm();
        setupUpdateForm();
        setupEnableForm();
        setupListSection();
        setupReportForm();
        populateDropdowns();
        loadProductionsList();
    }

    // Configuración de navegación entre pestañas
    function setupNavigation() {
        const tabs = document.querySelectorAll('.navigation__tab');
        const sections = document.querySelectorAll('.dashboard__section');

        tabs.forEach(tab => {
            tab.addEventListener('click', function() {
                const tabName = this.getAttribute('data-tab');
                
                // Actualizar pestañas activas
                tabs.forEach(t => t.classList.remove('navigation__tab--active'));
                this.classList.add('navigation__tab--active');
                
                // Mostrar sección correspondiente
                sections.forEach(section => {
                    section.classList.remove('dashboard__section--active');
                    if (section.getAttribute('data-panel') === tabName) {
                        section.classList.add('dashboard__section--active');
                    }
                });

                // Resetear formularios al cambiar de pestaña
                resetForms();
            });
        });
    }

    // Llenar dropdowns con datos simulados
    function populateDropdowns() {
        // Responsables
        const responsibleSelect = document.querySelector('[data-field="responsible"]');
        simulatedData.users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = user.name;
            responsibleSelect.appendChild(option);
        });

        // Cultivos
        const cultivationSelect = document.querySelector('[data-field="cultivation"]');
        simulatedData.cultivations.forEach(cult => {
            const option = document.createElement('option');
            option.value = cult.id;
            option.textContent = cult.name;
            cultivationSelect.appendChild(option);
        });

        // Ciclos
        const cycleSelect = document.querySelector('[data-field="cycle"]');
        simulatedData.cycles.forEach(cycle => {
            const option = document.createElement('option');
            option.value = cycle.id;
            option.textContent = cycle.name;
            cycleSelect.appendChild(option);
        });

        // Sensores
        const sensorsSelect = document.querySelector('[data-field="sensors"]');
        simulatedData.sensors.forEach(sensor => {
            const option = document.createElement('option');
            option.value = sensor.id;
            option.textContent = `${sensor.name} (${sensor.type})`;
            sensorsSelect.appendChild(option);
        });

        // Insumos
        const suppliesSelect = document.querySelector('[data-field="supplies"]');
        simulatedData.supplies.forEach(supply => {
            const option = document.createElement('option');
            option.value = supply.id;
            option.textContent = `${supply.name} - $${supply.cost}`;
            suppliesSelect.appendChild(option);
        });
    }

    // Configurar formulario de creación
    function setupCreateForm() {
        const form = document.querySelector('[data-form="create"]');
        const productionIdInput = document.querySelector('[data-field="production-id"]');
        
        // Generar ID automático
        productionIdInput.value = `prod-${simulatedData.productions.length + 1}`;
        
        // Evento para calcular inversión y meta
        const calculateButton = document.createElement('button');
        calculateButton.type = 'button';
        calculateButton.className = 'dashboard__button dashboard__button--secondary';
        calculateButton.textContent = 'Calcular';
        calculateButton.addEventListener('click', calculateEstimation);
        
        const investmentGroup = document.querySelector('[data-field="investment"]').parentNode;
        investmentGroup.appendChild(calculateButton);
        
        // Eventos de los botones
        form.querySelector('[data-action="cancel"]').addEventListener('click', resetForms);
        form.querySelector('[data-action="save-draft"]').addEventListener('click', saveAsDraft);
        
        // Evento de envío del formulario
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            createProduction();
        });
        
        // Validación en tiempo real
        form.querySelectorAll('[required]').forEach(input => {
            input.addEventListener('change', validateCreateForm);
        });
    }

    // Calcular estimación de inversión y meta
    function calculateEstimation() {
        const suppliesSelect = document.querySelector('[data-field="supplies"]');
        const selectedSupplies = Array.from(suppliesSelect.selectedOptions).map(opt => opt.value);
        
        const totalInvestment = selectedSupplies.reduce((total, supplyId) => {
            const supply = simulatedData.supplies.find(s => s.id === supplyId);
            return total + (supply ? supply.cost : 0);
        }, 0);
        
        document.querySelector('[data-field="investment"]').value = `$${totalInvestment}`;
        
        // Meta estimada basada en cultivo y ciclo
        const cultivationId = document.querySelector('[data-field="cultivation"]').value;
        const cycleId = document.querySelector('[data-field="cycle"]').value;
        
        if (cultivationId && cycleId) {
            const cultivation = simulatedData.cultivations.find(c => c.id === cultivationId);
            const cycle = simulatedData.cycles.find(c => c.id === cycleId);
            
            if (cultivation && cycle) {
                // Simulación de cálculo de meta
                const baseYield = cultivation.name === 'Maíz' ? 100 : 80;
                const cycleFactor = cycle.name.includes('Primavera') ? 1.2 : 0.9;
                const estimatedYield = Math.round(baseYield * cycleFactor);
                
                document.querySelector('[data-field="goal"]').value = `${estimatedYield} toneladas`;
                
                // Habilitar botón de crear
                document.querySelector('[data-action="create"]').disabled = false;
            }
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
            
            // Validación especial para sensores (máximo 3)
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
    function createProduction() {
        if (!validateCreateForm()) return;
        
        const form = document.querySelector('[data-form="create"]');
        const id = form.querySelector('[data-field="production-id"]').value;
        
        const newProduction = {
            id: id,
            name: form.querySelector('[data-field="name"]').value,
            responsible: form.querySelector('[data-field="responsible"]').value,
            cultivation: form.querySelector('[data-field="cultivation"]').value,
            cycle: form.querySelector('[data-field="cycle"]').value,
            sensors: Array.from(form.querySelector('[data-field="sensors"]').selectedOptions).map(opt => opt.value),
            supplies: Array.from(form.querySelector('[data-field="supplies"]').selectedOptions).map(opt => opt.value),
            startDate: form.querySelector('[data-field="start-date"]').value,
            endDate: form.querySelector('[data-field="end-date"]').value,
            status: 'active',
            metrics: {
                health: Math.floor(Math.random() * 20) + 70, // 70-90%
                growth: Math.floor(Math.random() * 20) + 50, // 50-70cm
                yield: Math.floor(Math.random() * 20) + 70  // 70-90%
            },
            sensorData: generateSensorData()
        };
        
        simulatedData.productions.push(newProduction);
        showSnackbar('Producción creada exitosamente');
        resetForms();
        loadProductionsList();
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

    // Guardar como borrador
    function saveAsDraft() {
        showSnackbar('Borrador guardado exitosamente');
    }

    // Configurar formulario de visualización
    function setupViewForm() {
        const form = document.querySelector('[data-form="view"]');
        
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const productionId = form.querySelector('[data-field="production-id"]').value;
            viewProduction(productionId);
        });
    }

    // Visualizar producción
    function viewProduction(productionId) {
        const production = simulatedData.productions.find(p => p.id === productionId);
        
        if (!production) {
            showSnackbar('No se encontró la producción', 'error');
            return;
        }
        
        currentProductionId = productionId;
        
        // Mostrar sección de resultados
        const resultSection = document.querySelector('[data-result="view"]');
        resultSection.classList.remove('dashboard__result--hidden');
        
        // Llenar información básica
        const basicInfoContainer = document.querySelector('[data-info="basic"]');
        basicInfoContainer.innerHTML = '';
        
        const responsible = simulatedData.users.find(u => u.id === production.responsible)?.name || 'Desconocido';
        const cultivation = simulatedData.cultivations.find(c => c.id === production.cultivation)?.name || 'Desconocido';
        const cycle = simulatedData.cycles.find(c => c.id === production.cycle)?.name || 'Desconocido';
        
        const basicInfo = [
            { label: 'Nombre', value: production.name },
            { label: 'Responsable', value: responsible },
            { label: 'Cultivo', value: cultivation },
            { label: 'Ciclo', value: cycle },
            { label: 'Fecha de inicio', value: formatDate(production.startDate) },
            { label: 'Fecha estimada de fin', value: formatDate(production.endDate) },
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
        
        // Actualizar métricas
        document.querySelector('[data-metric="health"]').textContent = `${production.metrics.health}%`;
        document.querySelector('[data-metric="growth"]').textContent = `${production.metrics.growth}cm`;
        document.querySelector('[data-metric="yield"]').textContent = `${production.metrics.yield}%`;
        
        // Crear gráficos
        createChart('humidity', 'Humedad del suelo (%)', production.sensorData.humidity);
        createChart('temperature', 'Temperatura (°C)', production.sensorData.temperature);
        createChart('nutrients', 'Niveles de nutrientes (%)', production.sensorData.nutrients);
        createChart('growth', 'Crecimiento (cm)', production.sensorData.growth);
        
        // Mostrar estado de sensores
        const sensorsContainer = document.querySelector('[data-info="sensors"]');
        sensorsContainer.innerHTML = '';
        
        production.sensors.forEach(sensorId => {
            const sensor = simulatedData.sensors.find(s => s.id === sensorId);
            if (!sensor) return;
            
            const sensorCard = document.createElement('div');
            sensorCard.className = 'dashboard__sensor-card';
            
            const icon = document.createElement('i');
            icon.className = 'material-icons dashboard__sensor-icon';
            icon.textContent = getSensorIcon(sensor.type);
            
            const info = document.createElement('div');
            info.className = 'dashboard__sensor-info';
            
            const name = document.createElement('div');
            name.className = 'dashboard__sensor-name';
            name.textContent = sensor.name;
            
            const meta = document.createElement('div');
            meta.className = 'dashboard__sensor-meta';
            
            const type = document.createElement('span');
            type.textContent = sensor.type;
            
            const status = document.createElement('span');
            status.textContent = 'Operativo';
            status.style.color = 'var(--color-success)';
            
            meta.appendChild(type);
            meta.appendChild(status);
            info.appendChild(name);
            info.appendChild(meta);
            sensorCard.appendChild(icon);
            sensorCard.appendChild(info);
            sensorsContainer.appendChild(sensorCard);
        });
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
        
        // Destruir gráfico existente si hay uno
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
        
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const productionId = searchForm.querySelector('[data-field="production-id"]').value;
            const production = simulatedData.productions.find(p => p.id === productionId);
            
            if (!production) {
                showSnackbar('No se encontró la producción', 'error');
                return;
            }
            
            currentProductionId = productionId;
            updateForm.classList.remove('dashboard__form--hidden');
            
            // Llenar formulario con datos existentes
            updateForm.innerHTML = '';
            
            const fields = [
                { label: 'Nombre de Producción', type: 'text', name: 'name', value: production.name, required: true },
                { label: 'Fecha Estimada de Fin', type: 'date', name: 'end-date', value: production.endDate, required: true }
            ];
            
            fields.forEach(field => {
                const group = document.createElement('div');
                group.className = 'dashboard__form-group';
                
                const label = document.createElement('label');
                label.className = 'dashboard__label';
                label.textContent = field.label;
                
                const input = document.createElement('input');
                input.className = 'dashboard__input';
                input.type = field.type;
                input.setAttribute('data-field', field.name);
                input.value = field.value;
                if (field.required) input.required = true;
                
                group.appendChild(label);
                group.appendChild(input);
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
        });
        
        updateForm.addEventListener('submit', function(e) {
            e.preventDefault();
            updateProduction();
        });
    }

    // Actualizar producción
    function updateProduction() {
        const form = document.querySelector('[data-form="update"]');
        const production = simulatedData.productions.find(p => p.id === currentProductionId);
        
        if (!production) {
            showSnackbar('Error al actualizar la producción', 'error');
            return;
        }
        
        production.name = form.querySelector('[data-field="name"]').value;
        production.endDate = form.querySelector('[data-field="end-date"]').value;
        
        showSnackbar('Producción actualizada exitosamente');
        form.classList.add('dashboard__form--hidden');
        viewProduction(currentProductionId); // Actualizar vista
        loadProductionsList(); // Actualizar lista
    }

    // Configurar formulario de habilitar/deshabilitar
    function setupEnableForm() {
        const form = document.querySelector('[data-form="enable"]');
        
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const productionId = form.querySelector('[data-field="production-id"]').value;
            const production = simulatedData.productions.find(p => p.id === productionId);
            
            if (!production) {
                showSnackbar('No se encontró la producción', 'error');
                return;
            }
            
            currentProductionId = productionId;
            
            const resultSection = document.querySelector('[data-result="enable"]');
            resultSection.classList.remove('dashboard__result--hidden');
            
            const content = document.querySelector('[data-content="status"]');
            content.innerHTML = `
                <div class="dashboard__info-item">
                    <div class="dashboard__info-label">Producción</div>
                    <div class="dashboard__info-value">${production.name}</div>
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
            toggleButton.onclick = function() {
                production.status = production.status === 'active' ? 'inactive' : 'active';
                showSnackbar(`Estado cambiado a ${production.status === 'active' ? 'Activo' : 'Inactivo'}`);
                setupEnableForm(); // Recargar
            };
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
            const totalPages = Math.ceil(filteredProductions().length / productionsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                loadProductionsList();
            }
        });
    }

    // Filtrar producciones según búsqueda y filtro
    function filteredProductions() {
        const searchTerm = document.querySelector('[data-field="search"]').value.toLowerCase();
        const filterStatus = document.querySelector('[data-field="filter-status"]').value;
        
        return simulatedData.productions.filter(production => {
            // Filtrar por estado
            if (filterStatus !== 'all' && production.status !== filterStatus) {
                return false;
            }
            
            // Filtrar por término de búsqueda
            if (searchTerm) {
                const productionName = production.name.toLowerCase();
                const cultivation = simulatedData.cultivations.find(c => c.id === production.cultivation)?.name.toLowerCase() || '';
                const cycle = simulatedData.cycles.find(c => c.id === production.cycle)?.name.toLowerCase() || '';
                
                return productionName.includes(searchTerm) || 
                       cultivation.includes(searchTerm) || 
                       cycle.includes(searchTerm);
            }
            
            return true;
        });
    }

    // Cargar lista de producciones
    function loadProductionsList() {
        const filtered = filteredProductions();
        const startIndex = (currentPage - 1) * productionsPerPage;
        const paginatedProductions = filtered.slice(startIndex, startIndex + productionsPerPage);
        
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
        
        paginatedProductions.forEach(production => {
            const row = document.createElement('tr');
            row.className = 'dashboard__table-row';
            
            // Obtener datos relacionados
            const cultivation = simulatedData.cultivations.find(c => c.id === production.cultivation)?.name || 'Desconocido';
            const cycle = simulatedData.cycles.find(c => c.id === production.cycle)?.name || 'Desconocido';
            
            // ID
            const idCell = document.createElement('td');
            idCell.className = 'dashboard__table-cell';
            idCell.textContent = production.id;
            row.appendChild(idCell);
            
            // Nombre
            const nameCell = document.createElement('td');
            nameCell.className = 'dashboard__table-cell';
            nameCell.textContent = production.name;
            row.appendChild(nameCell);
            
            // Cultivo
            const cultCell = document.createElement('td');
            cultCell.className = 'dashboard__table-cell';
            cultCell.textContent = cultivation;
            row.appendChild(cultCell);
            
            // Ciclo
            const cycleCell = document.createElement('td');
            cycleCell.className = 'dashboard__table-cell';
            cycleCell.textContent = cycle;
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
                // Cambiar a pestaña de visualización
                document.querySelector('[data-tab="view"]').click();
                // Buscar la producción
                document.querySelector('[data-form="view"] [data-field="production-id"]').value = production.id;
                document.querySelector('[data-form="view"]').dispatchEvent(new Event('submit'));
            });
            
            const editButton = document.createElement('button');
            editButton.className = 'dashboard__button dashboard__button--icon';
            editButton.innerHTML = '<i class="material-icons">edit</i>';
            editButton.title = 'Editar';
            editButton.addEventListener('click', () => {
                // Cambiar a pestaña de actualización
                document.querySelector('[data-tab="update"]').click();
                // Buscar la producción
                document.querySelector('[data-form="search-update"] [data-field="production-id"]').value = production.id;
                document.querySelector('[data-form="search-update"]').dispatchEvent(new Event('submit'));
            });
            
            actionsCell.appendChild(viewButton);
            actionsCell.appendChild(editButton);
            row.appendChild(actionsCell);
            
            tableBody.appendChild(row);
        });
        
        // Actualizar información de paginación
        const totalPages = Math.ceil(filtered.length / productionsPerPage);
        document.querySelector('[data-info="page"]').textContent = `Página ${currentPage} de ${totalPages}`;
        
        // Habilitar/deshabilitar botones de paginación
        document.querySelector('[data-action="prev-page"]').disabled = currentPage === 1;
        document.querySelector('[data-action="next-page"]').disabled = currentPage === totalPages;
    }

    // Configurar formulario de reportes
    function setupReportForm() {
        const form = document.querySelector('[data-form="report"]');
        
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            generateReport();
        });
    }

    // Generar reporte
    function generateReport() {
        const startDate = document.querySelector('[data-form="report"] [data-field="start-date"]').value;
        const endDate = document.querySelector('[data-form="report"] [data-field="end-date"]').value;
        const format = document.querySelector('[data-form="report"] input[name="format"]:checked').value;
        
        if (!startDate || !endDate) {
            showSnackbar('Seleccione un rango de fechas válido', 'error');
            return;
        }
        
        // Filtrar producciones en el rango de fechas
        const filtered = simulatedData.productions.filter(production => {
            return production.startDate >= startDate && production.endDate <= endDate;
        });
        
        if (filtered.length === 0) {
            showSnackbar('No hay producciones en el rango seleccionado', 'warning');
            return;
        }
        
        // Simular generación de reporte
        setTimeout(() => {
            showSnackbar(`Reporte generado en formato ${format.toUpperCase()}`, 'success');
            
            // Simular descarga (solo en entorno real esto funcionaría)
            if (format === 'excel') {
                console.log('Descargando reporte en Excel...');
            } else {
                console.log('Descargando reporte en PDF...');
            }
        }, 1500);
    }

    // Mostrar snackbar (notificación)
    function showSnackbar(message, type = 'success') {
        const snackbar = document.querySelector('[data-snackbar]');
        const messageElement = document.querySelector('[data-snackbar-message]');
        
        messageElement.textContent = message;
        
        // Establecer color según tipo
        const colors = {
            'success': 'var(--color-success)',
            'error': 'var(--color-error)',
            'warning': 'var(--color-warning)',
            'info': 'var(--color-info)'
        };
        
        snackbar.style.backgroundColor = colors[type] || colors['success'];
        
        snackbar.classList.add('snackbar--visible');
        
        // Ocultar después de 3 segundos
        setTimeout(() => {
            snackbar.classList.remove('snackbar--visible');
        }, 3000);
    }

    // Cerrar snackbar
    document.querySelector('[data-action="close-snackbar"]').addEventListener('click', function() {
        document.querySelector('[data-snackbar]').classList.remove('snackbar--visible');
    });

    // Formatear fecha
    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('es-ES', options);
    }

    // Resetear formularios
    function resetForms() {
        // Resetear formulario de creación
        const createForm = document.querySelector('[data-form="create"]');
        if (createForm) {
            createForm.reset();
            document.querySelector('[data-field="production-id"]').value = `prod-${simulatedData.productions.length + 1}`;
            document.querySelector('[data-action="create"]').disabled = true;
        }
        
        // Ocultar resultados de visualización
        document.querySelectorAll('.dashboard__result--hidden').forEach(el => {
            el.classList.add('dashboard__result--hidden');
        });
        
        // Ocultar formulario de actualización
        const updateForm = document.querySelector('[data-form="update"]');
        if (updateForm) {
            updateForm.classList.add('dashboard__form--hidden');
        }
        
        // Resetear campos de búsqueda
        document.querySelectorAll('[data-field="production-id"]').forEach(input => {
            if (!input.readOnly) input.value = '';
        });
    }

    // Inicializar la aplicación
    init();
});