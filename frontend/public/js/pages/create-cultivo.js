// Archivo: create-cultivo.js

document.addEventListener('DOMContentLoaded', function() {
  const cultivoForm = document.querySelector('.cultivo__form');
  const uploadArea = document.querySelector('.cultivo__upload-area');
  let selectedFile = null;

  // Configurar el área de subida de archivos
  uploadArea.addEventListener('click', function() {
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/*';
      fileInput.style.display = 'none';
      
      fileInput.addEventListener('change', function(e) {
          if (e.target.files.length > 0) {
              selectedFile = e.target.files[0];
              displayFilePreview(selectedFile);
          }
      });
      
      document.body.appendChild(fileInput);
      fileInput.click();
      document.body.removeChild(fileInput);
  });

  // Soportar arrastrar y soltar archivos
  uploadArea.addEventListener('dragover', function(e) {
      e.preventDefault();
      uploadArea.classList.add('cultivo__upload-area--dragover');
  });

  uploadArea.addEventListener('dragleave', function() {
      uploadArea.classList.remove('cultivo__upload-area--dragover');
  });

  uploadArea.addEventListener('drop', function(e) {
      e.preventDefault();
      uploadArea.classList.remove('cultivo__upload-area--dragover');
      
      if (e.dataTransfer.files.length > 0) {
          selectedFile = e.dataTransfer.files[0];
          displayFilePreview(selectedFile);
      }
  });

  // Mostrar vista previa del archivo seleccionado
  function displayFilePreview(file) {
      // Limpiar el área de carga
      uploadArea.innerHTML = '';
      
      // Si es una imagen, mostrar vista previa
      if (file.type.startsWith('image/')) {
          const img = document.createElement('img');
          img.classList.add('cultivo__preview-image');
          img.file = file;
          
          const reader = new FileReader();
          reader.onload = (function(aImg) { 
              return function(e) { 
                  aImg.src = e.target.result; 
              }; 
          })(img);
          reader.readAsDataURL(file);
          
          uploadArea.appendChild(img);
          
          // Agregar nombre del archivo y un botón para eliminar
          const fileInfo = document.createElement('p');
          fileInfo.classList.add('cultivo__file-info');
          fileInfo.textContent = file.name;
          uploadArea.appendChild(fileInfo);
          
          const removeBtn = document.createElement('button');
          removeBtn.classList.add('cultivo__remove-file');
          removeBtn.textContent = 'Eliminar';
          removeBtn.type = 'button';
          removeBtn.addEventListener('click', function(e) {
              e.stopPropagation(); // Evitar que se abra el selector de archivos de nuevo
              resetUploadArea();
          });
          uploadArea.appendChild(removeBtn);
      } else {
          // Si no es una imagen, mostrar mensaje de error
          resetUploadArea();
          alert('Por favor, selecciona un archivo de imagen válido.');
      }
  }

  // Restablecer el área de carga a su estado original
  function resetUploadArea() {
      uploadArea.innerHTML = '<p class="cultivo__upload-text">Arrastra y suelta o haz clic para subir</p>';
      selectedFile = null;
  }

  // Manejar el envío del formulario
  cultivoForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Crear objeto FormData para enviar los datos incluyendo el archivo
      const formData = new FormData();
      
      // Obtener todos los valores del formulario
      const tipoCultivo = document.getElementById('tipoCultivo').value;
      const nombreCultivo = document.getElementById('nombreCultivo').value;
      const identificador = document.getElementById('identificador').value;
      const tamano = document.getElementById('tamano').value;
      const ubicacion = document.getElementById('ubicacion').value;
      const estado = document.getElementById('estado').value;
      const descripcion = document.getElementById('descripcion').value;
      
      // Validar campos obligatorios
      if (!tipoCultivo || !nombreCultivo || !identificador) {
          alert('Por favor completa todos los campos obligatorios: Tipo de cultivo, Nombre del cultivo e ID de cultivo');
          return;
      }
      
      // Agregar los datos al FormData
      formData.append('tipo_cultivo', tipoCultivo);
      formData.append('nombre_cultivo', nombreCultivo);
      formData.append('id_cultivo', identificador);
      formData.append('tamano', tamano);
      formData.append('ubicacion', ubicacion);
      formData.append('estado', estado);
      formData.append('descripcion', descripcion);
      
      // Agregar la fotografía si existe
      if (selectedFile) {
          formData.append('fotografia', selectedFile);
      }
      
      // Mostrar indicador de carga
      const loadingIndicator = document.createElement('div');
      loadingIndicator.classList.add('cultivo__loading');
      loadingIndicator.innerHTML = '<p>Guardando cultivo...</p>';
      document.body.appendChild(loadingIndicator);
      
      // Enviar los datos al servidor
      fetch('http://localhost:3000/cultivo', {
          method: 'POST',
          body: formData,
      })
      .then(response => {
          if (!response.ok) {
              return response.json().then(err => Promise.reject(err));
          }
          return response.json();
      })
      .then(data => {
          // Quitar indicador de carga
          document.body.removeChild(loadingIndicator);
          
          // Mostrar mensaje de éxito
          alert('Cultivo creado exitosamente');
          
          // Redirigir a la página de lista de cultivos
          window.location.href = 'listar-cultivo-sebas.html';
      })
      .catch(error => {
          // Quitar indicador de carga
          document.body.removeChild(loadingIndicator);
          
          // Mostrar mensaje de error
          console.error('Error al crear cultivo:', error);
          alert(`Error al crear cultivo: ${error.message || 'Error desconocido'}`);
      });
  });
});