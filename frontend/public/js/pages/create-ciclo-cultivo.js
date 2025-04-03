// Este script debe estar en el archivo /JS/CICLO CULTIVO JS/create-ciclo-cultivo.js

document.addEventListener('DOMContentLoaded', function() {
  const form = document.querySelector('.ciclo-cultivo__form');
  
  form.addEventListener('submit', function(event) {
      event.preventDefault();
      
      // Validar campos obligatorios
      const idCiclo = document.getElementById('id-ciclo').value;
      const nombreCiclo = document.getElementById('nombre-ciclo').value;
      
      if (!idCiclo || !nombreCiclo) {
          alert('El ID y el nombre del ciclo son obligatorios');
          return;
      }
      
      // Crear objeto FormData para enviar datos incluyendo la imagen
      const formData = new FormData();
      formData.append('id_ciclo', idCiclo);
      formData.append('nombre_ciclo', nombreCiclo);
      formData.append('descripcion', document.getElementById('descripcion').value);
      
      // Verificar si hay un archivo seleccionado para subir
      const fotografiaInput = document.getElementById('fotografia');
      if (fotografiaInput.files.length > 0) {
          formData.append('fotografia', fotografiaInput.files[0]);
      }
      
      formData.append('periodo_siembra', document.getElementById('periodo-siembra').value);
      formData.append('novedades', document.getElementById('novedades').value);
      formData.append('estado', document.getElementById('estado').value);
      
      // Enviar solicitud al servidor
      fetch('http://localhost:3000/ciclo-cultivo', {
          method: 'POST',
          body: formData
          // No incluir Content-Type header cuando se envía FormData
      })
      .then(response => {
          if (!response.ok) {
              return response.json().then(data => {
                  throw new Error(data.error || 'Error al crear ciclo de cultivo');
              });
          }
          return response.json();
      })
      .then(data => {
          alert('Ciclo de cultivo creado exitosamente');
          // Redirigir a la página de listado
          window.location.href = 'listar-ciclo-cultivo-sebas.html';
      })
      .catch(error => {
          console.error('Error:', error);
          alert('Error: ' + error.message);
      });
  });
  
  // Mostrar vista previa de la imagen seleccionada (opcional)
  const fotografiaInput = document.getElementById('fotografia');
  if (fotografiaInput) {
      fotografiaInput.addEventListener('change', function(event) {
          const uploadArea = document.querySelector('.ciclo-cultivo__upload-area');
          
          // Eliminar vista previa anterior si existe
          const prevPreview = uploadArea.querySelector('.preview-image');
          if (prevPreview) {
              prevPreview.remove();
          }
          
          if (this.files && this.files[0]) {
              const reader = new FileReader();
              
              reader.onload = function(e) {
                  // Crear elemento de vista previa
                  const img = document.createElement('img');
                  img.src = e.target.result;
                  img.classList.add('preview-image');
                  img.style.maxWidth = '100%';
                  img.style.maxHeight = '150px';
                  img.style.marginTop = '10px';
                  
                  // Agregar al área de carga
                  uploadArea.appendChild(img);
                  
                  // Cambiar texto
                  const uploadText = uploadArea.querySelector('.ciclo-cultivo__upload-text');
                  uploadText.textContent = 'Cambiar imagen';
              };
              
              reader.readAsDataURL(this.files[0]);
          }
      });
  }
});