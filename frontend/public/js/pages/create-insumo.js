// create-insumo.js

document.addEventListener('DOMContentLoaded', function() {
  // Referencia al formulario y botones
  const form = document.querySelector('.insumo__form');
  const btnVolver = document.querySelector('.insumo__btn--volver');
  const btnCrear = document.querySelector('.insumo__btn--crear');
  
  // Campos del formulario
  const tipoInsumoInput = document.querySelector('input[name="tipoSensor"]');
  const nombreInsumoInput = document.querySelector('input[name="nombreSensor"]');
  const idInsumoInput = document.querySelector('input[name="identificador"]');
  const descripcionInput = document.querySelector('textarea[name="descripcion"]');
  const unidadMedidaInput = document.querySelector('input[name="referenciaSensor"]');
  const cantidadInput = document.querySelector('input[name="unidadMedida"]');
  const valorUnitarioInput = document.querySelector('input[name="tiempoEscaneo"]');
  const valorTotalInput = document.querySelector('input[name="valorTotal"]');
  const estadoInput = document.querySelector('input[name="estado"]');
  
  // URL base de la API
  const API_URL = 'http://localhost:3000'; // Ajusta esto según tu configuración
  
  // Calcular el valor total automáticamente cuando cambie la cantidad o el valor unitario
  function calcularValorTotal() {
      const cantidad = parseFloat(cantidadInput.value) || 0;
      const valorUnitario = parseFloat(valorUnitarioInput.value) || 0;
      const valorTotal = cantidad * valorUnitario;
      
      // Mostrar el valor total con formato de moneda
      valorTotalInput.value = valorTotal.toLocaleString('es-CO', {
          style: 'currency',
          currency: 'COP',
          minimumFractionDigits: 0
      });
  }
  
  // Añadir event listeners para calcular el valor total
  cantidadInput.addEventListener('input', calcularValorTotal);
  valorUnitarioInput.addEventListener('input', calcularValorTotal);
  
  // Botón volver
  btnVolver.addEventListener('click', function() {
      // Redirigir a la página anterior o a la lista de insumos
      window.location.href = 'insumos.html'; // Ajusta según tu estructura
  });
  
  // Manejar la creación del insumo
  form.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      // Validar campos obligatorios
      if (!tipoInsumoInput.value || !nombreInsumoInput.value || !idInsumoInput.value || !unidadMedidaInput.value) {
          alert('Por favor completa todos los campos obligatorios');
          return;
      }
      
      // Crear objeto con los datos del insumo
      const insumoData = {
          id_insumo: idInsumoInput.value,
          tipo_insumo: tipoInsumoInput.value,
          nombre_insumo: nombreInsumoInput.value,
          descripcion: descripcionInput.value,
          unidad_medida: unidadMedidaInput.value,
          cantidad: parseFloat(cantidadInput.value) || 0,
          valor_unitario: parseFloat(valorUnitarioInput.value) || 0,
          estado: estadoInput.value || 'Disponible'
      };
      
      try {
          // Enviar datos a la API
          const response = await fetch(`${API_URL}/insumo`, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify(insumoData)
          });
          
          const data = await response.json();
          
          if (!response.ok) {
              throw new Error(data.error || 'Error al crear el insumo');
          }
          
          // Mostrar mensaje de éxito
          alert('Insumo creado exitosamente');
          
          // Limpiar formulario
          form.reset();
          valorTotalInput.value = '';
          
          // Opcional: redirigir a la lista de insumos
          // window.location.href = 'insumos.html';
          
      } catch (error) {
          console.error('Error:', error);
          alert(`Error: ${error.message}`);
      }
  });
  
  // Si estamos en modo edición, cargar los datos del insumo
  const urlParams = new URLSearchParams(window.location.search);
  const insumoId = urlParams.get('id');
  
  if (insumoId) {
      // Cambiar el título y el botón
      document.querySelector('.insumo__title').textContent = 'Editar Insumo';
      btnCrear.textContent = 'Actualizar Insumo';
      
      // Cargar los datos del insumo
      cargarDatosInsumo(insumoId);
      
      // Cambiar el comportamiento del formulario para actualizar en lugar de crear
      form.removeEventListener('submit', form.onsubmit);
      form.addEventListener('submit', function(e) {
          e.preventDefault();
          actualizarInsumo(insumoId);
      });
  }
  
  // Función para cargar los datos de un insumo existente
  async function cargarDatosInsumo(id) {
      try {
          const response = await fetch(`${API_URL}/insumo/${id}`);
          
          if (!response.ok) {
              throw new Error('No se pudo cargar el insumo');
          }
          
          const insumo = await response.json();
          
          // Llenar el formulario con los datos
          tipoInsumoInput.value = insumo.tipo_insumo;
          nombreInsumoInput.value = insumo.nombre_insumo;
          idInsumoInput.value = insumo.id_insumo;
          idInsumoInput.disabled = true; // El ID no debería cambiarse en edición
          descripcionInput.value = insumo.descripcion || '';
          unidadMedidaInput.value = insumo.unidad_medida;
          cantidadInput.value = insumo.cantidad;
          valorUnitarioInput.value = insumo.valor_unitario;
          estadoInput.value = insumo.estado;
          
          // Calcular el valor total
          calcularValorTotal();
          
      } catch (error) {
          console.error('Error:', error);
          alert(`Error al cargar el insumo: ${error.message}`);
      }
  }
  
  // Función para actualizar un insumo existente
  async function actualizarInsumo(id) {
      // Validar campos obligatorios
      if (!tipoInsumoInput.value || !nombreInsumoInput.value || !unidadMedidaInput.value) {
          alert('Por favor completa todos los campos obligatorios');
          return;
      }
      
      // Crear objeto con los datos actualizados
      const insumoData = {
          tipo_insumo: tipoInsumoInput.value,
          nombre_insumo: nombreInsumoInput.value,
          descripcion: descripcionInput.value,
          unidad_medida: unidadMedidaInput.value,
          cantidad: parseFloat(cantidadInput.value) || 0,
          valor_unitario: parseFloat(valorUnitarioInput.value) || 0,
          estado: estadoInput.value || 'Disponible'
      };
      
      try {
          // Enviar datos actualizados a la API
          const response = await fetch(`${API_URL}/insumo/${id}`, {
              method: 'PUT',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify(insumoData)
          });
          
          const data = await response.json();
          
          if (!response.ok) {
              throw new Error(data.error || 'Error al actualizar el insumo');
          }
          
          // Mostrar mensaje de éxito
          alert('Insumo actualizado exitosamente');
          
          // Opcional: redirigir a la lista de insumos
          window.location.href = 'insumos.html';
          
      } catch (error) {
          console.error('Error:', error);
          alert(`Error: ${error.message}`);
      }
  }
});