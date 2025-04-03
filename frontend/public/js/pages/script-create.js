document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('.sensor__form');
    const crearButton = document.querySelector('.sensor__button--crear');
    const uploadArea = document.querySelector('.sensor__upload-area');
    let fileInput = null;

    // Crear input de archivo oculto
    function createFileInput() {
        fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        fileInput.name = 'fotografia';
        uploadArea.appendChild(fileInput);

        // Evento para cuando se selecciona un archivo
        fileInput.addEventListener('change', function() {
            if (fileInput.files && fileInput.files[0]) {
                const fileName = fileInput.files[0].name;
                uploadArea.querySelector('.sensor__upload-text').textContent = fileName;
                uploadArea.style.backgroundColor = '#e6f7e6'; // Color verde claro para indicar éxito
            }
        });
    }

    // Crear input de archivo al cargar la página
    createFileInput();

    // Hacer click en el área para seleccionar archivo
    uploadArea.addEventListener('click', function() {
        fileInput.click();
    });

    // Permitir arrastrar y soltar
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        uploadArea.style.backgroundColor = '#f0f0f0';
    });

    uploadArea.addEventListener('dragleave', function() {
        uploadArea.style.backgroundColor = '';
    });

    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        uploadArea.style.backgroundColor = '';

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            fileInput.files = e.dataTransfer.files;
            const fileName = e.dataTransfer.files[0].name;
            uploadArea.querySelector('.sensor__upload-text').textContent = fileName;
            uploadArea.style.backgroundColor = '#e6f7e6';
        }
    });

    // Evento para el botón de crear
    crearButton.addEventListener('click', function(e) {
        e.preventDefault();
        crearSensor();
    });

    // Función para crear el sensor
    async function crearSensor() {
        try {
            // Validar campos obligatorios
            const tipoSensor = document.getElementById('tipoSensor').value;
            const nombreSensor = document.getElementById('nombreSensor').value;
            const identificador = document.getElementById('identificador').value;
            const referenciaSensor = document.getElementById('referenciaSensor').value;
            const unidadMedida = document.getElementById('unidadMedida').value;
            const tiempoEscaneo = document.getElementById('tiempoEscaneo').value;
            const estado = document.getElementById('estado').value;
            const descripcion = document.getElementById('descripcion').value;

            if (!tipoSensor || !nombreSensor || !identificador || !referenciaSensor || 
                !unidadMedida || !tiempoEscaneo || !estado) {
                alert('Por favor complete todos los campos obligatorios');
                return;
            }

            // Crear FormData para enviar los datos incluyendo la imagen
            const formData = new FormData();
            formData.append('tipo_sensor', tipoSensor);
            formData.append('nombre_sensor', nombreSensor);
            formData.append('identificador', identificador);
            formData.append('referencia_sensor', referenciaSensor);
            formData.append('unidad_medida', unidadMedida);
            formData.append('tiempo_escaneo', tiempoEscaneo);
            formData.append('estado', estado);
            formData.append('descripcion', descripcion);

            // Agregar la fotografía si se seleccionó
            if (fileInput.files && fileInput.files[0]) {
                formData.append('fotografia', fileInput.files[0]);
            }

            // Mostrar indicador de carga
            crearButton.textContent = 'Creando...';
            crearButton.disabled = true;

            // Enviar los datos al servidor
            const response = await fetch('http://localhost:3000/sensor', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Error al crear el sensor');
            }

            // Mostrar mensaje de éxito
            alert('Sensor creado exitosamente');
            
            // Redirigir a la página de listado
            window.location.href = 'listar-sensor-sebas.html';

        } catch (error) {
            console.error('Error:', error);
            alert('Error al crear el sensor: ' + error.message);
            
            // Restablecer el botón
            crearButton.textContent = 'Crear Sensor';
            crearButton.disabled = false;
        }
    }
});