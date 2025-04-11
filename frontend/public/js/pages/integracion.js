/**
 * Sistema de Gestión de Cultivos
 * Scripts para validaciones y funcionalidad - Versión completa adaptada al Dashboard
 */

// Datos de muestra para la aplicación
const mockData = {
  cultivations: [
      { id: 'CULT-001', name: 'Tomate Orgánico', cycle: 'Ciclo Primavera', user: 'Manuel Valencia', status: 'active' },
      { id: 'CULT-002', name: 'Lechuga Hidropónica', cycle: 'Ciclo Verano', user: 'Esteban Patiño', status: 'active' },
      { id: 'CULT-003', name: 'Pimientos', cycle: 'Ciclo Otoño', user: 'Sebastian Tarara', status: 'inactive' }
  ],
  sensors: [
      { id: 'SENS-001', name: 'Sensor Humedad A1', type: 'Humedad', status: 'active' },
      { id: 'SENS-002', name: 'Sensor Temperatura B2', type: 'Temperatura', status: 'active' },
      { id: 'SENS-003', name: 'Sensor pH C3', type: 'pH', status: 'inactive' }
  ],
  supplies: [
      { id: 'SUPP-001', name: 'Fertilizante A', type: 'Fertilizante' },
      { id: 'SUPP-002', name: 'Fertilizante B', type: 'Fertilizante' },
      { id: 'SUPP-003', name: 'Plaguicida Natural', type: 'Plaguicida' }
  ],
  users: [
      { id: 'USER-001', name: 'Manuel Valencia', role: 'Agricultor' },
      { id: 'USER-002', name: 'Esteban Patiño', role: 'Técnico' },
      { id: 'USER-003', name: 'Sebastian Gallego', role: 'Supervisor' }
  ]
};

const mockSensorData = {
  'SENS-001': {
      type: 'Humedad',
      readings: [65, 68, 70, 72, 68, 65, 63],
      dates: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
      status: 'active',
      lastReading: '2 min ago',
      optimalRange: '60-75%'
  },
  'SENS-002': {
      type: 'Temperatura',
      readings: [22, 23, 24, 25, 24, 23, 22],
      dates: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
      status: 'active',
      lastReading: '5 min ago',
      optimalRange: '20-28°C'
  },
  'SENS-003': {
      type: 'pH',
      readings: [6.5, 6.7, 6.8, 6.9, 6.8, 6.7, 6.6],
      dates: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
      status: 'inactive',
      lastReading: '1 hora ago',
      optimalRange: '6.0-7.0'
  }
};

const mockGrowthData = {
  labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6'],
  values: [10, 15, 22, 30, 45, 63]
};

const mockNutrientsData = {
  nitrogen: 45,
  phosphorus: 30,
  potassium: 60,
  calcium: 25
};

// Variables globales
let currentTab = 'create';
let currentPage = 1;
const itemsPerPage = 5;

// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', () => {
  initTabNavigation();
  initForms();
  initCultivationList();
  initSnackbar();
  populateSelects();
});

/**
* Inicializar navegación por pestañas - Adaptado al nuevo diseño
*/
function initTabNavigation() {
  const tabs = document.querySelectorAll('.navigation__tab');
  
  tabs.forEach(tab => {
      tab.addEventListener('click', () => {
          // Remover clase activa de todas las pestañas
          tabs.forEach(t => t.classList.remove('navigation__tab--active'));
          
          // Agregar clase activa a la pestaña seleccionada
          tab.classList.add('navigation__tab--active');
          
          // Ocultar todas las secciones del dashboard
          const sections = document.querySelectorAll('.dashboard__section');
          sections.forEach(section => section.classList.remove('dashboard__section--active'));
          
          // Mostrar la sección correspondiente
          const tabId = tab.getAttribute('data-tab');
          document.getElementById(`${tabId}-panel`).classList.add('dashboard__section--active');
          currentTab = tabId;
      });
  });
}

/**
* Inicializar formularios y sus validaciones
*/
function initForms() {
  // Formulario: Crear Asociación
  const createForm = document.getElementById('create-form');
  if (createForm) {
      createForm.addEventListener('submit', function(e) {
          e.preventDefault();
          
          if (validateCreateForm()) {
              // Crear nuevo cultivo
              const newCultivation = {
                  id: generateId('CULT'),
                  name: document.getElementById('cultivation-name').value,
                  cycle: document.getElementById('cycle-select').options[document.getElementById('cycle-select').selectedIndex].text,
                  user: document.getElementById('user-select').options[document.getElementById('user-select').selectedIndex].text,
                  status: 'active',
                  sensors: Array.from(document.getElementById('sensor-select').selectedOptions).map(option => option.text),
                  supplies: Array.from(document.getElementById('supply-select').selectedOptions).map(option => option.text)
              };
              
              // Agregar a los datos
              mockData.cultivations.push(newCultivation);
              
              // Mostrar mensaje y resetear
              showSnackbar('Asociación de cultivo creada exitosamente');
              this.reset();
              
              // Actualizar lista si estamos en esa pestaña
              if (currentTab === 'list') {
                  renderCultivationList();
              }
          }
      });
  }

  function renderCharts(cultivationId) {
    // Datos de ejemplo - en una aplicación real estos vendrían de una API
    const cultivation = mockData.cultivations.find(c => c.id === cultivationId);
    
    // Obtener datos de sensores asociados
    const sensorsData = cultivation.sensors.map(sensorName => {
        const sensorId = Object.keys(mockSensorData).find(id => 
            mockSensorData[id].type === sensorName.split(' ')[1]);
        return mockSensorData[sensorId];
    });
    
    // Gráfico de Humedad
    const humidityCtx = document.getElementById('humidity-chart').getContext('2d');
    new Chart(humidityCtx, {
        type: 'line',
        data: {
            labels: sensorsData[0].dates,
            datasets: [{
                label: 'Humedad %',
                data: sensorsData[0].readings,
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    suggestedMin: 50,
                    suggestedMax: 80
                }
            }
        }
    });
    
    // Gráfico de Temperatura
    const tempCtx = document.getElementById('temperature-chart').getContext('2d');
    new Chart(tempCtx, {
        type: 'line',
        data: {
            labels: sensorsData[1].dates,
            datasets: [{
                label: 'Temperatura °C',
                data: sensorsData[1].readings,
                borderColor: 'rgba(255, 99, 132, 1)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            }
        }
    });
    
    // Gráfico de Nutrientes
    const nutrientsCtx = document.getElementById('nutrients-chart').getContext('2d');
    new Chart(nutrientsCtx, {
        type: 'doughnut',
        data: {
            labels: ['Nitrógeno', 'Fósforo', 'Potasio', 'Calcio'],
            datasets: [{
                data: [
                    mockNutrientsData.nitrogen,
                    mockNutrientsData.phosphorus,
                    mockNutrientsData.potassium,
                    mockNutrientsData.calcium
                ],
                backgroundColor: [
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(255, 206, 86, 0.7)',
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(153, 102, 255, 0.7)'
                ],
                borderColor: [
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
    
    // Gráfico de Crecimiento
    const growthCtx = document.getElementById('growth-chart').getContext('2d');
    new Chart(growthCtx, {
        type: 'bar',
        data: {
            labels: mockGrowthData.labels,
            datasets: [{
                label: 'Altura (cm)',
                data: mockGrowthData.values,
                backgroundColor: 'rgba(75, 192, 192, 0.7)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

function renderSensorStatus(sensors) {
    const sensorsContainer = document.getElementById('sensors-info');
    sensorsContainer.innerHTML = '';
    
    sensors.forEach(sensorName => {
        const sensorType = sensorName.split(' ')[1];
        const sensor = Object.values(mockSensorData).find(s => s.type === sensorType);
        
        if (sensor) {
            const sensorCard = document.createElement('div');
            sensorCard.className = 'dashboard__sensor-card';
            
            sensorCard.innerHTML = `
                <div class="dashboard__sensor-icon">
                    <i class="material-icons">${sensorType === 'Temperatura' ? 'device_thermostat' : 
                      sensorType === 'Humedad' ? 'water_drop' : 'science'}</i>
                </div>
                <div class="dashboard__sensor-info">
                    <div class="dashboard__sensor-name">${sensorName}</div>
                    <div class="dashboard__sensor-meta">
                        <span>Estado: <span class="status-badge status-badge--${sensor.status}">
                            ${sensor.status === 'active' ? 'Activo' : 'Inactivo'}
                        </span></span>
                        <span>Última lectura: ${sensor.lastReading}</span>
                    </div>
                    <div class="dashboard__sensor-meta">
                        <span>Rango óptimo: ${sensor.optimalRange}</span>
                    </div>
                </div>
            `;
            
            sensorsContainer.appendChild(sensorCard);
        }
    });
}
  
  // Formulario: Visualizar Asociación
  const viewForm = document.getElementById('view-form');
  if (viewForm) {
      viewForm.addEventListener('submit', function(e) {
          e.preventDefault();
          
          if (validateIdField('cultivation-id', 'cultivation-id-error')) {
              const cultivationId = document.getElementById('cultivation-id').value;
              fetchCultivationDetails(cultivationId);
          }
      });
  }
  
  // Formulario: Buscar para Actualizar
  const searchUpdateForm = document.getElementById('search-update-form');
  if (searchUpdateForm) {
      searchUpdateForm.addEventListener('submit', function(e) {
          e.preventDefault();
          
          if (validateIdField('update-cultivation-id', 'update-cultivation-id-error')) {
              const cultivationId = document.getElementById('update-cultivation-id').value;
              fetchCultivationForUpdate(cultivationId);
          }
      });
  }
  
  // Formulario: Actualizar Asociación
  const updateForm = document.getElementById('update-form');
  if (updateForm) {
      updateForm.addEventListener('submit', function(e) {
          e.preventDefault();
          
          // Obtener ID del cultivo a actualizar
          const cultivationId = document.getElementById('update-id').value;
          const cultivationIndex = mockData.cultivations.findIndex(c => c.id === cultivationId);
          
          if (cultivationIndex !== -1) {
              // Actualizar datos
              mockData.cultivations[cultivationIndex] = {
                  ...mockData.cultivations[cultivationIndex],
                  name: document.getElementById('update-name').value,
                  cycle: document.querySelector('#update-cycle option:checked').text,
                  user: document.querySelector('#update-user option:checked').text,
                  status: document.querySelector('input[name="update-status"]:checked').value
              };
              
              // Mostrar mensaje
              showSnackbar('Asociación de cultivo actualizada exitosamente');
              
              // Resetear formularios
              updateForm.classList.add('dashboard__form--hidden');
              document.getElementById('search-update-form').reset();
              document.getElementById('search-update-form').classList.remove('dashboard__form--hidden');
              
              // Actualizar lista si estamos en esa pestaña
              if (currentTab === 'list') {
                  renderCultivationList();
              }
          }
      });
      
      // Botón cancelar actualización
      const cancelUpdateBtn = document.getElementById('cancel-update');
      if (cancelUpdateBtn) {
          cancelUpdateBtn.addEventListener('click', () => {
              updateForm.classList.add('dashboard__form--hidden');
              document.getElementById('search-update-form').classList.remove('dashboard__form--hidden');
          });
      }
  }
  
  // Formulario: Habilitar/Deshabilitar
  const enableForm = document.getElementById('enable-form');
  if (enableForm) {
      enableForm.addEventListener('submit', function(e) {
          e.preventDefault();
          
          if (validateIdField('sensor-id', 'sensor-id-error')) {
              const sensorId = document.getElementById('sensor-id').value;
              fetchSensorStatus(sensorId);
          }
      });
      
      // Botón para cambiar estado
      const toggleStatusBtn = document.getElementById('toggle-status');
      if (toggleStatusBtn) {
          toggleStatusBtn.addEventListener('click', function() {
              const sensorId = document.getElementById('sensor-id').value;
              const sensorIndex = mockData.sensors.findIndex(s => s.id === sensorId);
              
              if (sensorIndex !== -1) {
                  // Cambiar estado
                  mockData.sensors[sensorIndex].status = 
                      mockData.sensors[sensorIndex].status === 'active' ? 'inactive' : 'active';
                  
                  // Actualizar vista
                  fetchSensorStatus(sensorId);
                  
                  // Mostrar mensaje
                  showSnackbar('Estado del sensor actualizado exitosamente');
              }
          });
      }
  }
  
  // Formulario: Generar Reporte
  const reportForm = document.getElementById('report-form');
  if (reportForm) {
      reportForm.addEventListener('submit', function(e) {
          e.preventDefault();
          
          if (validateDateRange()) {
              const format = document.querySelector('input[name="format"]:checked').value;
              
              // Simulación de generación de reporte
              setTimeout(() => {
                  showSnackbar(`Reporte generado en formato ${format.toUpperCase()} y listo para descargar`);
                  
                  // Simulación de descarga
                  const link = document.createElement('a');
                  link.href = '#';
                  link.download = `reporte_cultivos_${new Date().toISOString().slice(0, 10)}.${format}`;
                  link.click();
              }, 800);
          }
      });
  }
}

/**
* Poblar selects con datos de prueba
*/
function populateSelects() {
  // Sensor Select
  const sensorSelect = document.getElementById('sensor-select');
  if (sensorSelect) {
      mockData.sensors.forEach(sensor => {
          const option = document.createElement('option');
          option.value = sensor.id;
          option.textContent = `${sensor.name} (${sensor.type})`;
          sensorSelect.appendChild(option);
      });
  }
  
  // Supply Select
  const supplySelect = document.getElementById('supply-select');
  if (supplySelect) {
      mockData.supplies.forEach(supply => {
          const option = document.createElement('option');
          option.value = supply.id;
          option.textContent = supply.name;
          supplySelect.appendChild(option);
      });
  }
  
  // User Select
  const userSelect = document.getElementById('user-select');
  if (userSelect) {
      mockData.users.forEach(user => {
          const option = document.createElement('option');
          option.value = user.id;
          option.textContent = user.name;
          userSelect.appendChild(option);
      });
  }
}

/**
* Generar ID único
*/
function generateId(prefix) {
  const randomNum = Math.floor(100 + Math.random() * 900); // Número entre 100-999
  return `${prefix}-${randomNum}`;
}

/**
* Inicializar lista de cultivos
*/
function initCultivationList() {
  // Cargar datos iniciales
  renderCultivationList();
  
  // Configurar búsqueda
  const searchInput = document.getElementById('search-cultivation');
  if (searchInput) {
      searchInput.addEventListener('input', function() {
          currentPage = 1; // Resetear a primera página al buscar
          renderCultivationList();
      });
  }
  
  // Configurar filtro de estado
  const filterStatus = document.getElementById('filter-status');
  if (filterStatus) {
      filterStatus.addEventListener('change', function() {
          currentPage = 1; // Resetear a primera página al filtrar
          renderCultivationList();
      });
  }
  
  // Configurar paginación
  const prevPageBtn = document.getElementById('prev-page');
  const nextPageBtn = document.getElementById('next-page');
  
  if (prevPageBtn && nextPageBtn) {
      prevPageBtn.addEventListener('click', function() {
          if (currentPage > 1) {
              currentPage--;
              renderCultivationList();
          }
      });
      
      nextPageBtn.addEventListener('click', function() {
          const totalPages = Math.ceil(getFilteredCultivations().length / itemsPerPage);
          if (currentPage < totalPages) {
              currentPage++;
              renderCultivationList();
          }
      });
  }
}

/**
* Obtiene los cultivos filtrados por búsqueda y estado
*/
function getFilteredCultivations() {
  const searchValue = document.getElementById('search-cultivation')?.value.toLowerCase() || '';
  const statusFilter = document.getElementById('filter-status')?.value || 'all';
  
  return mockData.cultivations.filter(cultivation => {
      const matchesSearch = cultivation.name.toLowerCase().includes(searchValue) ||
                          cultivation.id.toLowerCase().includes(searchValue) ||
                          cultivation.user.toLowerCase().includes(searchValue) ||
                          cultivation.cycle.toLowerCase().includes(searchValue);
      
      const matchesStatus = statusFilter === 'all' || cultivation.status === statusFilter;
      
      return matchesSearch && matchesStatus;
  });
}

/**
* Renderiza la lista de cultivos con paginación
*/
function renderCultivationList() {
  const tbody = document.getElementById('cultivation-list');
  if (!tbody) return;
  
  // Limpiar tabla
  tbody.innerHTML = '';
  
  // Obtener cultivos filtrados
  const filteredCultivations = getFilteredCultivations();
  
  // Calcular paginación
  const totalPages = Math.ceil(filteredCultivations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  
  // Actualizar información de página
  const pageInfo = document.getElementById('page-info');
  if (pageInfo) {
      pageInfo.textContent = `Página ${currentPage} de ${totalPages || 1}`;
  }
  
  // Deshabilitar/habilitar botones de paginación
  const prevPageBtn = document.getElementById('prev-page');
  const nextPageBtn = document.getElementById('next-page');
  
  if (prevPageBtn) prevPageBtn.disabled = currentPage <= 1;
  if (nextPageBtn) nextPageBtn.disabled = currentPage >= totalPages;
  
  // Renderizar cultivos de la página actual
  const cultivationsToRender = filteredCultivations.slice(startIndex, endIndex);
  
  if (cultivationsToRender.length === 0) {
      const emptyRow = document.createElement('tr');
      emptyRow.className = 'dashboard__table-row';
      emptyRow.innerHTML = `<td colspan="6" class="dashboard__table-cell" style="text-align: center;">No hay cultivos que coincidan con los criterios de búsqueda</td>`;
      tbody.appendChild(emptyRow);
      return;
  }
  
  cultivationsToRender.forEach(cultivation => {
      const row = document.createElement('tr');
      row.className = 'dashboard__table-row';
      
      row.innerHTML = `
          <td class="dashboard__table-cell">${cultivation.id}</td>
          <td class="dashboard__table-cell">${cultivation.name}</td>
          <td class="dashboard__table-cell">${cultivation.cycle}</td>
          <td class="dashboard__table-cell">${cultivation.user}</td>
          <td class="dashboard__table-cell">
              <span class="status-badge status-badge--${cultivation.status}">
                  ${cultivation.status === 'active' ? 'Activo' : 'Inactivo'}
              </span>
          </td>
          <td class="dashboard__table-cell dashboard__table-cell--actions">
              <button class="dashboard__table-action" data-id="${cultivation.id}" data-action="view" title="Ver detalles">
                  <i class="material-icons">visibility</i>
              </button>
              <button class="dashboard__table-action" data-id="${cultivation.id}" data-action="edit" title="Editar">
                  <i class="material-icons">edit</i>
              </button>
              <button class="dashboard__table-action" data-id="${cultivation.id}" data-action="toggle" title="${cultivation.status === 'active' ? 'Desactivar' : 'Activar'}">
                  <i class="material-icons">${cultivation.status === 'active' ? 'toggle_on' : 'toggle_off'}</i>
              </button>
          </td>
      `;
      
      // Agregar eventos a los botones de acción
      row.querySelectorAll('.dashboard__table-action').forEach(button => {
          button.addEventListener('click', handleTableAction);
      });
      
      tbody.appendChild(row);
  });
}

/**
* Maneja las acciones de la tabla
*/
function handleTableAction(e) {
  const button = e.currentTarget;
  const id = button.getAttribute('data-id');
  const action = button.getAttribute('data-action');
  
  switch (action) {
      case 'view':
          // Cambiar a la pestaña de visualización
          document.querySelector('.navigation__tab[data-tab="view"]').click();
          document.getElementById('cultivation-id').value = id;
          document.getElementById('view-form').dispatchEvent(new Event('submit'));
          break;
          
      case 'edit':
          // Cambiar a la pestaña de actualización
          document.querySelector('.navigation__tab[data-tab="update"]').click();
          document.getElementById('update-cultivation-id').value = id;
          document.getElementById('search-update-form').dispatchEvent(new Event('submit'));
          break;
          
      case 'toggle':
          // Cambiar estado directamente
          toggleCultivationStatus(id);
          break;
  }
}

/**
* Cambia el estado de un cultivo
*/
function toggleCultivationStatus(id) {
  // Encontrar el cultivo
  const cultivationIndex = mockData.cultivations.findIndex(c => c.id === id);
  
  if (cultivationIndex !== -1) {
      // Cambiar estado
      mockData.cultivations[cultivationIndex].status = 
          mockData.cultivations[cultivationIndex].status === 'active' ? 'inactive' : 'active';
      
      // Actualizar vista
      renderCultivationList();
      
      // Mostrar mensaje
      showSnackbar('Estado del cultivo actualizado exitosamente');
  }
}

/**
* Obtiene y muestra los detalles de un cultivo
*/
function fetchCultivationDetails(id) {
  const cultivation = mockData.cultivations.find(c => c.id === id);
  const resultDiv = document.getElementById('view-result');
  const basicInfo = document.getElementById('basic-info');
  
  if (cultivation) {
      // Información básica
      basicInfo.innerHTML = `
          <div class="dashboard__info-item">
              <div class="dashboard__info-label">ID</div>
              <div class="dashboard__info-value">${cultivation.id}</div>
          </div>
          <div class="dashboard__info-item">
              <div class="dashboard__info-label">Nombre</div>
              <div class="dashboard__info-value">${cultivation.name}</div>
          </div>
          <div class="dashboard__info-item">
              <div class="dashboard__info-label">Ciclo</div>
              <div class="dashboard__info-value">${cultivation.cycle}</div>
          </div>
          <div class="dashboard__info-item">
              <div class="dashboard__info-label">Responsable</div>
              <div class="dashboard__info-value">${cultivation.user}</div>
          </div>
          <div class="dashboard__info-item">
              <div class="dashboard__info-label">Estado</div>
              <div class="dashboard__info-value">
                  <span class="status-badge status-badge--${cultivation.status}">
                      ${cultivation.status === 'active' ? 'Activo' : 'Inactivo'}
                  </span>
              </div>
          </div>
          <div class="dashboard__info-item">
              <div class="dashboard__info-label">Fecha de Creación</div>
              <div class="dashboard__info-value">${new Date().toLocaleDateString()}</div>
          </div>
      `;
      
      // Actualizar métricas
      document.getElementById('health-metric').textContent = `${Math.floor(Math.random() * 20) + 80}%`;
      document.getElementById('growth-metric').textContent = `${Math.floor(Math.random() * 20) + 60}cm`;
      document.getElementById('yield-metric').textContent = `${Math.floor(Math.random() * 15) + 70}%`;
      
      // Renderizar gráficos
      renderCharts(id);
      
      // Mostrar estado de sensores
      if (cultivation.sensors && cultivation.sensors.length > 0) {
          renderSensorStatus(cultivation.sensors);
      }
      
      resultDiv.classList.remove('dashboard__result--hidden');
  } else {
      basicInfo.innerHTML = `<p class="dashboard__result-message">No se encontró ningún cultivo con el ID: ${id}</p>`;
      resultDiv.classList.remove('dashboard__result--hidden');
  }
}

/**
* Obtiene y prepara un cultivo para actualización
*/
function fetchCultivationForUpdate(id) {
  // Buscar en los datos
  const cultivation = mockData.cultivations.find(c => c.id === id);
  
  if (cultivation) {
      // Ocultar formulario de búsqueda
      document.getElementById('search-update-form').classList.add('dashboard__form--hidden');
      
      // Preparar formulario de actualización
      const updateForm = document.getElementById('update-form');
      
      // Generar contenido del formulario
      updateForm.innerHTML = `
          <div class="dashboard__form-group">
              <label class="dashboard__label">ID del Cultivo</label>
              <p class="dashboard__form-value"><strong>${cultivation.id}</strong></p>
              <input type="hidden" id="update-id" value="${cultivation.id}">
          </div>
          
          <div class="dashboard__form-group">
              <label class="dashboard__label" for="update-name">Nombre del Cultivo</label>
              <input class="dashboard__input" type="text" id="update-name" value="${cultivation.name}" required>
              <span class="dashboard__error" id="update-name-error"></span>
          </div>
          
          <div class="dashboard__form-group">
              <label class="dashboard__label" for="update-cycle">Ciclo de Cultivo</label>
              <select class="dashboard__select" id="update-cycle" required>
                  <option value="1" ${cultivation.cycle.includes('Primavera') ? 'selected' : ''}>Ciclo Primavera</option>
                  <option value="2" ${cultivation.cycle.includes('Verano') ? 'selected' : ''}>Ciclo Verano</option>
                  <option value="3" ${cultivation.cycle.includes('Otoño') ? 'selected' : ''}>Ciclo Otoño</option>
              </select>
          </div>
          
          <div class="dashboard__form-group">
              <label class="dashboard__label" for="update-user">Usuario Responsable</label>
              <select class="dashboard__select" id="update-user" required>
                  ${mockData.users.map(user => 
                      `<option value="${user.id}" ${cultivation.user === user.name ? 'selected' : ''}>${user.name}</option>`
                  ).join('')}
              </select>
          </div>
          
          <div class="dashboard__form-group">
              <label class="dashboard__label">Estado</label>
              <div class="dashboard__radio-group">
                  <label class="dashboard__radio">
                      <input type="radio" name="update-status" value="active" ${cultivation.status === 'active' ? 'checked' : ''}>
                      <span class="dashboard__radio-label">Activo</span>
                  </label>
                  <label class="dashboard__radio">
                      <input type="radio" name="update-status" value="inactive" ${cultivation.status === 'inactive' ? 'checked' : ''}>
                      <span class="dashboard__radio-label">Inactivo</span>
                  </label>
              </div>
          </div>
          
          <div class="dashboard__form-actions">
              <button class="dashboard__button dashboard__button--primary" type="submit">Actualizar</button>
              <button class="dashboard__button dashboard__button--secondary" type="button" id="cancel-update">Cancelar</button>
          </div>
      `;
      
      // Mostrar formulario de actualización
      updateForm.classList.remove('dashboard__form--hidden');
      
      // Volver a enlazar el evento al botón cancelar
      document.getElementById('cancel-update').addEventListener('click', () => {
          updateForm.classList.add('dashboard__form--hidden');
          document.getElementById('search-update-form').classList.remove('dashboard__form--hidden');
      });
      
  } else {
      showSnackbar('No se encontró ningún cultivo con el ID especificado', 'error');
  }
}

/**
* Obtiene y muestra el estado de un sensor
*/
function fetchSensorStatus(id) {
  // Buscar en los datos
  const sensor = mockData.sensors.find(s => s.id === id);
  
  const resultDiv = document.getElementById('enable-result');
  const resultContent = resultDiv.querySelector('.dashboard__result-content');
  
  if (sensor) {
      resultContent.innerHTML = `
          <div class="dashboard__result-item">
              <h4 class="dashboard__result-label">ID:</h4>
              <p class="dashboard__result-value">${sensor.id}</p>
          </div>
          <div class="dashboard__result-item">
              <h4 class="dashboard__result-label">Nombre:</h4>
              <p class="dashboard__result-value">${sensor.name}</p>
          </div>
          <div class="dashboard__result-item">
              <h4 class="dashboard__result-label">Tipo:</h4>
              <p class="dashboard__result-value">${sensor.type}</p>
          </div>
          <div class="dashboard__result-item">
              <h4 class="dashboard__result-label">Estado:</h4>
              <p class="dashboard__result-value"><span class="status-badge status-badge--${sensor.status}">
                  ${sensor.status === 'active' ? 'Activo' : 'Inactivo'}
              </span></p>
          </div>
      `;
      
      resultDiv.classList.remove('dashboard__result--hidden');
  } else {
      resultContent.innerHTML = `<p class="dashboard__result-message">No se encontró ningún sensor con el ID: ${id}</p>`;
      resultDiv.classList.remove('dashboard__result--hidden');
  }
}

/**
* Valida el formulario de creación de asociación
*/
function validateCreateForm() {
  let isValid = true;
  
  // Validar nombre del cultivo
  const cultivationName = document.getElementById('cultivation-name');
  const cultivationNameError = document.getElementById('cultivation-name-error');
  
  if (!validateRequired(cultivationName.value)) {
      showError(cultivationNameError, 'El nombre del cultivo es obligatorio');
      isValid = false;
  } else {
      hideError(cultivationNameError);
  }
  
  // Validar sensores
  const sensorSelect = document.getElementById('sensor-select');
  const sensorSelectError = document.getElementById('sensor-select-error');
  
  if (!validateMultiSelect(sensorSelect)) {
      showError(sensorSelectError, 'Debe seleccionar al menos un sensor');
      isValid = false;
  } else {
      hideError(sensorSelectError);
  }
  
  // Validar insumos
  const supplySelect = document.getElementById('supply-select');
  const supplySelectError = document.getElementById('supply-select-error');
  
  if (!validateMultiSelect(supplySelect)) {
      showError(supplySelectError, 'Debe seleccionar al menos un insumo');
      isValid = false;
  } else {
      hideError(supplySelectError);
  }
  
  // Validar ciclo
  const cycleSelect = document.getElementById('cycle-select');
  const cycleSelectError = document.getElementById('cycle-select-error');
  
  if (!validateRequired(cycleSelect.value)) {
      showError(cycleSelectError, 'Debe seleccionar un ciclo de cultivo');
      isValid = false;
  } else {
      hideError(cycleSelectError);
  }
  
  // Validar usuario
  const userSelect = document.getElementById('user-select');
  const userSelectError = document.getElementById('user-select-error');
  
  if (!validateRequired(userSelect.value)) {
      showError(userSelectError, 'Debe seleccionar un usuario responsable');
      isValid = false;
  } else {
      hideError(userSelectError);
  }
  
  return isValid;
}

/**
* Valida un campo de ID
*/
function validateIdField(fieldId, errorId) {
  const field = document.getElementById(fieldId);
  const errorElement = document.getElementById(errorId);
  
  if (!validateRequired(field.value)) {
      showError(errorElement, 'El ID es obligatorio');
      return false;
  } else if (!validateIdFormat(field.value)) {
      showError(errorElement, 'El formato del ID no es válido');
      return false;
  } else {
      hideError(errorElement);
      return true;
  }
}

/**
* Valida el rango de fechas para reportes
*/
function validateDateRange() {
  const startDate = document.getElementById('start-date').value;
  const endDate = document.getElementById('end-date').value;
  const errorElement = document.getElementById('date-range-error');
  
  if (!startDate) {
      showError(errorElement, 'La fecha de inicio es obligatoria');
      return false;
  }
  
  if (!endDate) {
      showError(errorElement, 'La fecha de fin es obligatoria');
      return false;
  }
  
  if (new Date(startDate) > new Date(endDate)) {
      showError(errorElement, 'La fecha de inicio no puede ser posterior a la fecha de fin');
      return false;
  }
  
  hideError(errorElement);
  return true;
}

/**
* Valida que un valor sea requerido
*/
function validateRequired(value) {
  return value.trim() !== '';
}

/**
* Valida el formato de un ID
*/
function validateIdFormat(value) {
  // Permitir cualquier formato para esta demo
  return true;
}

/**
* Valida que se haya seleccionado al menos una opción en un select múltiple
*/
function validateMultiSelect(selectElement) {
  return selectElement.selectedOptions.length > 0;
}

/**
* Muestra un mensaje de error en un elemento
*/
function showError(element, message) {
  if (!element) return;
  element.textContent = message;
  element.classList.add('dashboard__error--visible');
}

/**
* Oculta un mensaje de error
*/
function hideError(element) {
  if (!element) return;
  element.textContent = '';
  element.classList.remove('dashboard__error--visible');
}

/**
* Inicializa el componente snackbar
*/
function initSnackbar() {
  const snackbar = document.getElementById('snackbar');
  const closeButton = snackbar?.querySelector('.snackbar__close');
  
  if (closeButton) {
      closeButton.addEventListener('click', function() {
          snackbar.classList.remove('snackbar--visible');
      });
  }
}

/**
* Muestra un mensaje en el snackbar
*/
function showSnackbar(message, type = 'success') {
  const snackbar = document.getElementById('snackbar');
  const messageElement = snackbar?.querySelector('.snackbar__message');
  
  if (!snackbar || !messageElement) return;
  
  // Establecer mensaje
  messageElement.textContent = message;
  
  // Quitar clases de tipo previas
  snackbar.className = 'snackbar';
  snackbar.classList.add('snackbar--visible');
  
  // Agregar clase según el tipo
  if (type === 'error') {
      snackbar.style.backgroundColor = '#d32f2f';
  } else if (type === 'warning') {
      snackbar.style.backgroundColor = '#ffa000';
  } else {
      snackbar.style.backgroundColor = '#388e3c';
  }
  
  // Ocultar después de 3 segundos
  setTimeout(() => {
      snackbar.classList.remove('snackbar--visible');
  }, 3000);
}
// Función para renderizar gráficos
function renderCharts() {
  // Datos de ejemplo (simulados)
  const humidityData = {
      labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
      values: [65, 68, 70, 72, 68, 65, 63]
  };

  const temperatureData = {
      labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
      values: [22, 23, 24, 25, 24, 23, 22]
  };

  const nutrientsData = {
      labels: ['Nitrógeno', 'Fósforo', 'Potasio', 'Calcio'],
      values: [45, 30, 60, 25]
  };

  const growthData = {
      labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6'],
      values: [10, 15, 22, 30, 45, 63]
  };

  // Gráfico de Humedad
  new Chart(
      document.getElementById('humidity-chart'),
      {
          type: 'line',
          data: {
              labels: humidityData.labels,
              datasets: [{
                  label: 'Humedad %',
                  data: humidityData.values,
                  borderColor: 'rgb(75, 192, 192)',
                  tension: 0.1,
                  fill: true
              }]
          }
      }
  );

  // Gráfico de Temperatura
  new Chart(
      document.getElementById('temperature-chart'),
      {
          type: 'line',
          data: {
              labels: temperatureData.labels,
              datasets: [{
                  label: 'Temperatura °C',
                  data: temperatureData.values,
                  borderColor: 'rgb(255, 99, 132)',
                  tension: 0.1
              }]
          }
      }
  );

  // Gráfico de Nutrientes
  new Chart(
      document.getElementById('nutrients-chart'),
      {
          type: 'doughnut',
          data: {
              labels: nutrientsData.labels,
              datasets: [{
                  data: nutrientsData.values,
                  backgroundColor: [
                      'rgb(54, 162, 235)',
                      'rgb(255, 205, 86)',
                      'rgb(75, 192, 192)',
                      'rgb(153, 102, 255)'
                  ]
              }]
          }
      }
  );

  // Gráfico de Crecimiento
  new Chart(
      document.getElementById('growth-chart'),
      {
          type: 'bar',
          data: {
              labels: growthData.labels,
              datasets: [{
                  label: 'Altura (cm)',
                  data: growthData.values,
                  backgroundColor: 'rgba(75, 192, 192, 0.6)'
              }]
          }
      }
  );
}

// Modifica la función fetchCultivationDetails para mostrar los gráficos
function fetchCultivationDetails(id) {
  const cultivation = mockData.cultivations.find(c => c.id === id);
  const resultDiv = document.getElementById('view-result');
  
  if (cultivation) {
      resultDiv.classList.remove('dashboard__result--hidden');
      renderCharts(); // <- Esto muestra los gráficos
  } else {
      alert('Cultivo no encontrado');
  }
}