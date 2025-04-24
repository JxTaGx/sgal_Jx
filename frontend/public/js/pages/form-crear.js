// form-crear.js (Updated with Conditional Back Button Logic)

document.addEventListener('DOMContentLoaded', function() {
    // --- Elements ---
    const form = document.querySelector('.form__content');
    const uploadArea = document.querySelector('.form__upload-area');
    const btnCrear = document.querySelector('.form__btn--crear');
    const btnVolver = document.querySelector('#btn-volver'); // Use ID selector

    // --- File Upload Variables ---
    let fileInput = null;
    let selectedFile = null;

    // --- File Upload Initialization ---
    function initFileUpload() {
        if (!uploadArea) return;

        // Create hidden file input if it doesn't exist
        if (!document.querySelector('input[type="file"][name="fotografia"]')) {
            fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*'; // Accept only image files
            fileInput.style.display = 'none';
            fileInput.name = 'fotografia'; // Ensure the name matches what the backend expects
            document.body.appendChild(fileInput);
        } else {
            fileInput = document.querySelector('input[type="file"][name="fotografia"]');
        }


        // Click handler for upload area
        uploadArea.addEventListener('click', function() {
            fileInput.click();
        });

        // File input change handler
        fileInput.addEventListener('change', function(e) {
            if (e.target.files && e.target.files[0]) {
                handleFileSelection(e.target.files[0]);
            }
        });

        // Drag and Drop handlers
        uploadArea.addEventListener('dragover', function(e) {
            e.preventDefault();
            uploadArea.classList.add('form__upload-area--dragover');
        });
        uploadArea.addEventListener('dragleave', function() {
            uploadArea.classList.remove('form__upload-area--dragover');
        });
        uploadArea.addEventListener('drop', function(e) {
            e.preventDefault();
            uploadArea.classList.remove('form__upload-area--dragover');
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFileSelection(e.dataTransfer.files[0]);
            }
        });
    }

    // --- File Handling ---
    function handleFileSelection(file) {
        if (!file.type.startsWith('image/')) {
            alert('Por favor, selecciona un archivo de imagen válido (jpg, png, gif, etc.).');
            resetUploadArea();
            return;
        }
         // Optional: Check file size
         const maxSize = 5 * 1024 * 1024; // 5MB limit
         if (file.size > maxSize) {
             alert(`El archivo es demasiado grande (${(file.size / 1024 / 1024).toFixed(1)}MB). El límite es 5MB.`);
             resetUploadArea();
             return;
         }
        selectedFile = file;
        showFilePreview(file);
    }

    function showFilePreview(file) {
        if (!uploadArea) return;
        uploadArea.innerHTML = ''; // Clear previous content

        const img = document.createElement('img');
        img.classList.add('form__preview-image');
        img.file = file;

        const reader = new FileReader();
        reader.onload = (e) => { img.src = e.target.result; };
        reader.readAsDataURL(file);
        uploadArea.appendChild(img);

        const fileInfo = document.createElement('p');
        fileInfo.classList.add('form__file-info');
        fileInfo.textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
        uploadArea.appendChild(fileInfo);

        const removeBtn = document.createElement('button');
        removeBtn.classList.add('form__remove-file');
        removeBtn.textContent = 'Eliminar';
        removeBtn.type = 'button';
        removeBtn.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent triggering upload area click
            resetUploadArea();
        });
        uploadArea.appendChild(removeBtn);
    }

    function resetUploadArea() {
        if (uploadArea) {
            uploadArea.innerHTML = '<p class="form__upload-text">Arrastra y suelta o haz clic para subir</p>';
        }
        selectedFile = null;
        if (fileInput) {
            fileInput.value = ''; // Reset file input value
        }
    }

    // --- Form Validation ---
    function validateForm() {
        let isValid = true;
        const formElement = document.querySelector('.form');
        const formType = formElement.classList.contains('form--cultivo') ? 'cultivo' :
                         formElement.classList.contains('form--insumo') ? 'insumo' :
                         formElement.classList.contains('form--sensor') ? 'sensor' : 'ciclo-cultivo'; // Default or ciclo

        // Basic required field check (can be enhanced)
        form.querySelectorAll('input[required], select[required], textarea[required]').forEach(input => {
            if (!input.value || (input.type === 'select-one' && input.value === '')) {
                 alert(`El campo "${input.previousElementSibling?.textContent || input.name || 'requerido'}" es obligatorio.`);
                 input.focus(); // Focus on the first invalid field
                 isValid = false;
                 return; // Stop checking further fields once one is invalid
            }
        });
        if (!isValid) return false;

        // Specific validation (add more as needed)
        switch(formType) {
            case 'ciclo-cultivo':
                // Add any specific validation for ciclo-cultivo
                break;
            case 'cultivo':
                // Add any specific validation for cultivo
                break;
            case 'insumo':
                const cantidad = parseFloat(document.querySelector('[name="unidadMedida"]')?.value);
                const valorUnitario = parseFloat(document.querySelector('[name="tiempoEscaneo"]')?.value);
                if (isNaN(cantidad) || cantidad < 0) {
                    alert('La cantidad del insumo debe ser un número válido y no negativo.'); isValid = false;
                }
                if (isNaN(valorUnitario) || valorUnitario < 0) {
                    alert('El valor unitario del insumo debe ser un número válido y no negativo.'); isValid = false;
                }
                break;
            case 'sensor':
                // Add any specific validation for sensor
                break;
        }
        return isValid;
    }

    // --- Insumo Calculations ---
    function setupInsumoCalculations() {
        const formElement = document.querySelector('.form');
        if (!formElement || !formElement.classList.contains('form--insumo')) return; // Only run for insumo form

        const cantidadInput = document.querySelector('[name="unidadMedida"]'); // Corresponds to Cantidad
        const valorUnitarioInput = document.querySelector('[name="tiempoEscaneo"]'); // Corresponds to Valor unitario
        const valorTotalInput = document.querySelector('[name="valorTotal"]'); // Corresponds to Valor total

        if (cantidadInput && valorUnitarioInput && valorTotalInput) {
            valorTotalInput.readOnly = true; // Make total value field read-only

            function calcularValorTotal() {
                const cantidad = parseFloat(cantidadInput.value) || 0;
                const valorUnitario = parseFloat(valorUnitarioInput.value) || 0;
                const valorTotal = cantidad * valorUnitario;

                // Format as currency (optional, based on your needs)
                valorTotalInput.value = valorTotal.toFixed(2); // Simple number format
                // Or currency:
                // valorTotalInput.value = valorTotal.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 2 });
            }

            cantidadInput.addEventListener('input', calcularValorTotal);
            valorUnitarioInput.addEventListener('input', calcularValorTotal);
            calcularValorTotal(); // Calculate on load
        }
    }

    // --- Form Submission ---
    async function submitForm() {
        if (!validateForm()) return;

        const formElement = document.querySelector('.form');
        const formType = formElement.classList.contains('form--cultivo') ? 'cultivo' :
                         formElement.classList.contains('form--insumo') ? 'insumo' :
                         formElement.classList.contains('form--sensor') ? 'sensor' : 'ciclo-cultivo'; // Default or ciclo

        const endpoint = `http://localhost:3000/${formType}`; // Adjust URL if needed
        const method = 'POST';
        let body;
        let headers = {};
        const successMessage = `${formType.charAt(0).toUpperCase() + formType.slice(1)} creado exitosamente`;
        const failureMessage = `Error al crear ${formType}`;

        // Prepare body and headers based on form type
        if (formType === 'insumo') {
            // Insumo uses JSON
            headers['Content-Type'] = 'application/json';
            body = JSON.stringify({
                id_insumo: form.querySelector('[name="identificador"]').value,
                tipo_insumo: form.querySelector('[name="tipoSensor"]').value,
                nombre_insumo: form.querySelector('[name="nombreSensor"]').value,
                descripcion: form.querySelector('[name="descripcion"]').value,
                unidad_medida: form.querySelector('[name="referenciaSensor"]').value, // Maps to Unidad Medida input
                cantidad: parseFloat(form.querySelector('[name="unidadMedida"]').value) || 0, // Maps to Cantidad input
                valor_unitario: parseFloat(form.querySelector('[name="tiempoEscaneo"]').value) || 0, // Maps to Valor Unitario input
                estado: form.querySelector('[name="estado"]').value || 'Disponible'
            });
        } else {
            // Other forms use FormData (for file upload)
            body = new FormData(form); // Collect form data
             // Ensure field names match backend expectations for FormData
             // Example for cultivo (adjust names if they differ):
             if (formType === 'cultivo') {
                 body.set('tipo_cultivo', form.querySelector('[name="tipoCultivo"]').value);
                 body.set('nombre_cultivo', form.querySelector('[name="nombreCultivo"]').value);
                 body.set('id_cultivo', form.querySelector('[name="identificador"]').value);
                 body.set('tamano', form.querySelector('[name="tamano"]').value);
                 body.set('ubicacion', form.querySelector('[name="ubicacion"]').value);
                 body.set('estado', form.querySelector('[name="Estado"]').value); // Check name attribute of select
                 body.set('descripcion', form.querySelector('[name="descripcion"]').value);
                 if (selectedFile) { body.set('fotografia', selectedFile, selectedFile.name); } else { body.delete('fotografia');}
             } else if (formType === 'ciclo-cultivo') {
                 body.set('id_ciclo', form.querySelector('[name="id-ciclo"]').value);
                 body.set('nombre_ciclo', form.querySelector('[name="nombre-ciclo"]').value);
                 body.set('descripcion', form.querySelector('[name="descripcion"]').value);
                 body.set('periodo_siembra', form.querySelector('[name="periodo-siembra"]').value);
                 body.set('novedades', form.querySelector('[name="novedades"]').value);
                 body.set('estado', form.querySelector('[name="estado"]').value);
                 if (selectedFile) { body.set('fotografia', selectedFile, selectedFile.name); } else { body.delete('fotografia');}
             } else if (formType === 'sensor') {
                 body.set('tipo_sensor', form.querySelector('[name="tipoSensor"]').value);
                 body.set('nombre_sensor', form.querySelector('[name="nombreSensor"]').value);
                 body.set('identificador', form.querySelector('[name="identificador"]').value);
                 body.set('referencia_sensor', form.querySelector('[name="referenciaSensor"]').value);
                 body.set('unidad_medida', form.querySelector('[name="unidadMedida"]').value);
                 body.set('tiempo_escaneo', form.querySelector('[name="tiempoEscaneo"]').value);
                 body.set('estado', form.querySelector('[name="Estado"]').value); // Check name attribute of select
                 body.set('descripcion', form.querySelector('[name="descripcion"]').value);
                 if (selectedFile) { body.set('fotografia', selectedFile, selectedFile.name); } else { body.delete('fotografia');}
             }
             // FormData sets headers automatically, no need for Content-Type here
        }

        // UI feedback: disable button
        if (btnCrear) { btnCrear.textContent = 'Guardando...'; btnCrear.disabled = true; }

        // Send data
        try {
            const response = await fetch(endpoint, { method, headers, body });
            const data = await response.json(); // Always try to parse JSON

            if (!response.ok) {
                // Use error message from backend if available, otherwise generic message
                throw new Error(data.error || data.message || `${failureMessage} (HTTP ${response.status})`);
            }

            alert(successMessage);

            // --- Redirect after success ---
            const urlParams = new URLSearchParams(window.location.search);
            const origin = urlParams.get('origin');
            if (origin === 'produccion') {
                 // If created from production, go back there
                 window.location.href = '../views/integracion.html#create';
             } else {
                 // Otherwise, go to the default list page
                 let defaultListUrl = 'home.html'; // Fallback
                 if (formType === 'cultivo') defaultListUrl = 'listar-cultivo-sebas.html';
                 else if (formType === 'insumo') defaultListUrl = 'listar-insumo-sebas.html';
                 else if (formType === 'sensor') defaultListUrl = 'listar-sensor-sebas.html';
                 else if (formType === 'ciclo-cultivo') defaultListUrl = 'listar-ciclo-cultivo-sebas.html';
                 window.location.href = defaultListUrl;
             }
             // Optionally reset form: form.reset(); resetUploadArea();

        } catch (error) {
            console.error('Error:', error);
            alert(`Error: ${error.message}`);
            // Restore button on failure
            if (btnCrear) {
                btnCrear.textContent = formElement.querySelector('.form__title').textContent || 'Crear'; // Get title text
                btnCrear.disabled = false;
            }
        }
    }

    // --- Conditional Back Button Logic ---
    function setupVolverButton() {
        if (!btnVolver) {
            console.warn("Botón Volver (#btn-volver) no encontrado en esta página.");
            return;
        }

        const urlParams = new URLSearchParams(window.location.search);
        const origin = urlParams.get('origin');

        // Determine the default back URL based on the form type
        let defaultBackUrl = 'home.html'; // Fallback default
        const formElement = document.querySelector('.form');
        if (formElement) {
            if (formElement.classList.contains('form--cultivo')) defaultBackUrl = 'listar-cultivo-sebas.html';
            else if (formElement.classList.contains('form--insumo')) defaultBackUrl = 'listar-insumo-sebas.html';
            else if (formElement.classList.contains('form--sensor')) defaultBackUrl = 'listar-sensor-sebas.html';
            else defaultBackUrl = 'listar-ciclo-cultivo-sebas.html'; // Assume ciclo-cultivo otherwise
        }

        // Attach the correct event listener
        btnVolver.addEventListener('click', function() {
            if (origin === 'produccion') {
                window.location.href = '../views/integracion.html#create'; // Adjust path if needed
            } else {
                window.location.href = defaultBackUrl;
            }
        });
        console.log(`Botón Volver configurado para ir a: ${origin === 'produccion' ? '../views/integracion.html#create' : defaultBackUrl}`);
    }


    // --- Initialize Components ---
    initFileUpload();
    setupInsumoCalculations();
    setupVolverButton(); // Setup the back button logic

    // --- Handle Form Submission ---
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            submitForm(); // Use the existing submit function
        });
    }
});