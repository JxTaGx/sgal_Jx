/**
 * Sistema de Gestión de Cultivos
 * Scripts para validaciones y funcionalidad
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
    ]
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
  });
  
  /**
   * Inicializar navegación por pestañas
   */
  function initTabNavigation() {
    const tabs = document.querySelectorAll('.navigation__tab');
    
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        // Remover clase activa de todas las pestañas
        tabs.forEach(t => t.classList.remove('navigation__tab--active'));
        
        // Agregar clase activa a la pestaña seleccionada
        tab.classList.add('navigation__tab--active');
        
        // Ocultar todos los paneles
        const panels = document.querySelectorAll('.panel');
        panels.forEach(panel => panel.classList.remove('panel--active'));
        
        // Mostrar el panel correspondiente
        const tabId = tab.getAttribute('data-tab');
        currentTab = tabId;
        document.getElementById(`${tabId}-panel`).classList.add('panel--active');
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
          // Simulación de envío de datos
          setTimeout(() => {
            showSnackbar('Asociación de cultivo creada exitosamente');
            this.reset();
          }, 500);
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
        
        // Simulación de actualización
        setTimeout(() => {
          showSnackbar('Asociación de cultivo actualizada exitosamente');
          updateForm.classList.add('form--hidden');
          document.getElementById('search-update-form').reset();
          document.getElementById('search-update-form').classList.remove('form--hidden');
        }, 500);
      });
      
      // Botón cancelar actualización
      const cancelUpdateBtn = document.getElementById('cancel-update');
      if (cancelUpdateBtn) {
        cancelUpdateBtn.addEventListener('click', () => {
          updateForm.classList.add('form--hidden');
          document.getElementById('search-update-form').classList.remove('form--hidden');
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
          // Simulación de cambio de estado
          const resultDiv = document.getElementById('enable-result');
          const statusElement = resultDiv.querySelector('.status-badge');
          
          if (statusElement.classList.contains('status-badge--active')) {
            statusElement.classList.remove('status-badge--active');
            statusElement.classList.add('status-badge--inactive');
            statusElement.textContent = 'Inactivo';
          } else {
            statusElement.classList.remove('status-badge--inactive');
            statusElement.classList.add('status-badge--active');
            statusElement.textContent = 'Activo';
          }
          
          showSnackbar('Estado del ciclo de cultivo actualizado exitosamente');
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
   * Inicializar lista de cultivos
   */
  function initCultivationList() {
    // Cargar datos iniciales
    renderCultivationList();
    
    // Configurar búsqueda
    const searchInput = document.getElementById('search-cultivation');
    if (searchInput) {
      searchInput.addEventListener('input', function() {
        renderCultivationList();
      });
    }
    
    // Configurar filtro de estado
    const filterStatus = document.getElementById('filter-status');
    if (filterStatus) {
      filterStatus.addEventListener('change', function() {
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
                            cultivation.id.toLowerCase().includes(searchValue);
      
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
    document.getElementById('page-info').textContent = `Página ${currentPage} de ${totalPages || 1}`;
    
    // Renderizar cultivos de la página actual
    const cultivationsToRender = filteredCultivations.slice(startIndex, endIndex);
    
    if (cultivationsToRender.length === 0) {
      const emptyRow = document.createElement('tr');
      emptyRow.innerHTML = `<td colspan="6" class="table__cell" style="text-align: center;">No hay cultivos que coincidan con los criterios de búsqueda</td>`;
      tbody.appendChild(emptyRow);
      return;
    }
    
    cultivationsToRender.forEach(cultivation => {
      const row = document.createElement('tr');
      row.className = 'table__row';
      
      row.innerHTML = `
        <td class="table__cell">${cultivation.id}</td>
        <td class="table__cell">${cultivation.name}</td>
        <td class="table__cell">${cultivation.cycle}</td>
        <td class="table__cell">${cultivation.user}</td>
        <td class="table__cell">
          <span class="status-badge status-badge--${cultivation.status}">
            ${cultivation.status === 'active' ? 'Activo' : 'Inactivo'}
          </span>
        </td>
        <td class="table__cell table__cell--actions">
          <button class="table__action" data-id="${cultivation.id}" data-action="view">
            <i class="material-icons">visibility</i>
          </button>
          <button class="table__action" data-id="${cultivation.id}" data-action="edit">
            <i class="material-icons">edit</i>
          </button>
          <button class="table__action" data-id="${cultivation.id}" data-action="toggle">
            <i class="material-icons">${cultivation.status === 'active' ? 'toggle_on' : 'toggle_off'}</i>
          </button>
        </td>
      `;
      
      // Agregar eventos a los botones de acción
      row.querySelectorAll('.table__action').forEach(button => {
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
    // Simulación de búsqueda en base de datos
    const cultivation = mockData.cultivations.find(c => c.id === id);
    
    const resultDiv = document.getElementById('view-result');
    const resultContent = resultDiv.querySelector('.result__content');
    
    if (cultivation) {
      resultContent.innerHTML = `
        <div class="result__item">
          <h4>ID:</h4>
          <p>${cultivation.id}</p>
        </div>
        <div class="result__item">
          <h4>Nombre:</h4>
          <p>${cultivation.name}</p>
        </div>
        <div class="result__item">
          <h4>Ciclo:</h4>
          <p>${cultivation.cycle}</p>
        </div>
        <div class="result__item">
          <h4>Responsable:</h4>
          <p>${cultivation.user}</p>
        </div>
        <div class="result__item">
          <h4>Estado:</h4>
          <p><span class="status-badge status-badge--${cultivation.status}">
            ${cultivation.status === 'active' ? 'Activo' : 'Inactivo'}
          </span></p>
        </div>
      `;
      
      resultDiv.classList.remove('result--hidden');
    } else {
      resultContent.innerHTML = `<p>No se encontró ningún cultivo con el ID: ${id}</p>`;
      resultDiv.classList.remove('result--hidden');
    }
  }
  
  /**
   * Obtiene y prepara un cultivo para actualización
   */
  function fetchCultivationForUpdate(id) {
    // Simulación de búsqueda en base de datos
    const cultivation = mockData.cultivations.find(c => c.id === id);
    
    if (cultivation) {
      // Ocultar formulario de búsqueda
      document.getElementById('search-update-form').classList.add('form--hidden');
      
      // Preparar formulario de actualización
      const updateForm = document.getElementById('update-form');
      
      // Generar contenido del formulario
      updateForm.innerHTML = `
        <div class="form__group">
          <label class="form__label">ID del Cultivo</label>
          <p><strong>${cultivation.id}</strong></p>
          <input type="hidden" id="update-id" value="${cultivation.id}">
        </div>
        
        <div class="form__group">
          <label class="form__label" for="update-name">Nombre del Cultivo</label>
          <input class="form__input" type="text" id="update-name" value="${cultivation.name}" required>
          <span class="form__error" id="update-name-error"></span>
        </div>
        
        <div class="form__group">
          <label class="form__label" for="update-cycle">Ciclo de Cultivo</label>
          <select class="form__select" id="update-cycle" required>
            <option value="Ciclo Primavera" ${cultivation.cycle === 'Ciclo Primavera' ? 'selected' : ''}>Ciclo Primavera</option>
            <option value="Ciclo Verano" ${cultivation.cycle === 'Ciclo Verano' ? 'selected' : ''}>Ciclo Verano</option>
            <option value="Ciclo Otoño" ${cultivation.cycle === 'Ciclo Otoño' ? 'selected' : ''}>Ciclo Otoño</option>
          </select>
        </div>
        
        <div class="form__group">
          <label class="form__label" for="update-user">Usuario Responsable</label>
          <select class="form__select" id="update-user" required>
            <option value="Juan Pérez" ${cultivation.user === 'Juan Pérez' ? 'selected' : ''}>Juan Pérez</option>
            <option value="María López" ${cultivation.user === 'María López' ? 'selected' : ''}>María López</option>
            <option value="Carlos Ramírez" ${cultivation.user === 'Carlos Ramírez' ? 'selected' : ''}>Carlos Ramírez</option>
          </select>
        </div>
        
        <div class="form__group">
          <label class="form__label">Estado</label>
          <div class="form__radio-group">
            <label class="form__radio">
              <input type="radio" name="update-status" value="active" ${cultivation.status === 'active' ? 'checked' : ''}>
              <span class="form__radio-label">Activo</span>
            </label>
            <label class="form__radio">
              <input type="radio" name="update-status" value="inactive" ${cultivation.status === 'inactive' ? 'checked' : ''}>
              <span class="form__radio-label">Inactivo</span>
            </label>
          </div>
        </div>
        
        <div class="form__actions">
          <button class="button button--primary" type="submit">Actualizar</button>
          <button class="button button--secondary" type="button" id="cancel-update">Cancelar</button>
        </div>
      `;
      
      // Mostrar formulario de actualización
      updateForm.classList.remove('form--hidden');
      
      // Volver a enlazar el evento al botón cancelar
      document.getElementById('cancel-update').addEventListener('click', () => {
        updateForm.classList.add('form--hidden');
        document.getElementById('search-update-form').classList.remove('form--hidden');
      });
      
    } else {
      showSnackbar('No se encontró ningún cultivo con el ID especificado', 'error');
    }
  }
  
  /**
   * Obtiene y muestra el estado de un sensor
   */
  function fetchSensorStatus(id) {
    // Simulación de búsqueda en base de datos
    const sensor = mockData.sensors.find(s => s.id === id);
    
    const resultDiv = document.getElementById('enable-result');
    const resultContent = resultDiv.querySelector('.result__content');
    
    if (sensor) {
      resultContent.innerHTML = `
        <div class="result__item">
          <h4>ID:</h4>
          <p>${sensor.id}</p>
        </div>
        <div class="result__item">
          <h4>Nombre:</h4>
          <p>${sensor.name}</p>
        </div>
        <div class="result__item">
          <h4>Tipo:</h4>
          <p>${sensor.type}</p>
        </div>
        <div class="result__item">
          <h4>Estado:</h4>
          <p><span class="status-badge status-badge--${sensor.status}">
            ${sensor.status === 'active' ? 'Activo' : 'Inactivo'}
          </span></p>
        </div>
      `;
      
      resultDiv.classList.remove('result--hidden');
    } else {
      resultContent.innerHTML = `<p>No se encontró ningún sensor con el ID: ${id}</p>`;
      resultDiv.classList.remove('result--hidden');
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
    element.textContent = message;
    element.classList.add('form__error--visible');
  }
  
  /**
   * Oculta un mensaje de error
   */
  function hideError(element) {
    element.textContent = '';
    element.classList.remove('form__error--visible');
  }
  
  /**
   * Inicializa el componente snackbar
   */
  function initSnackbar() {
    const snackbar = document.getElementById('snackbar');
    const closeButton = snackbar.querySelector('.snackbar__close');
    
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
    const messageElement = snackbar.querySelector('.snackbar__message');
    
    // Establecer mensaje
    messageElement.textContent = message;
    
    // Quitar clases de tipo previas
    snackbar.className = 'snackbar';
    snackbar.classList.add('snackbar--visible');
    
    // Agregar clase según el tipo
    if (type === 'error') {
      snackbar.style.backgroundColor = '#d32f2f';
    } else {
      snackbar.style.backgroundColor = '#388e3c';
    }
    
    // Ocultar después de 3 segundos
    setTimeout(() => {
      snackbar.classList.remove('snackbar--visible');
    }, 3000);
  }