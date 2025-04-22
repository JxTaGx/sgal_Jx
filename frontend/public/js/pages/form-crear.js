// form-crear.js - Script unificado para todos los formularios de creación

document.addEventListener('DOMContentLoaded', function() {
    // Elementos comunes
    const form = document.querySelector('.form__content');
    const uploadArea = document.querySelector('.form__upload-area');
    const btnCrear = document.querySelector('.form__btn--crear');
    const btnVolver = document.querySelector('.form__btn--volver');
    
    // Variables para manejar archivos
    let fileInput = null;
    let selectedFile = null;

    // Inicialización del componente de subida de archivos
    function initFileUpload() {
        if (!uploadArea) return;

        // Crear input de archivo oculto
        fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        fileInput.name = 'fotografia';
        document.body.appendChild(fileInput);

        // Manejar clic en el área de carga
        uploadArea.addEventListener('click', function() {
            fileInput.click();
        });

        // Manejar cambio de archivo
        fileInput.addEventListener('change', function(e) {
            if (e.target.files && e.target.files[0]) {
                handleFileSelection(e.target.files[0]);
            }
        });

        // Manejar drag and drop
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

    // Manejar la selección de un archivo
    function handleFileSelection(file) {
        selectedFile = file;
        
        // Verificar si es una imagen
        if (!file.type.startsWith('image/')) {
            alert('Por favor, selecciona un archivo de imagen válido.');
            resetUploadArea();
            return;
        }

        // Mostrar vista previa
        showFilePreview(file);
    }

    // Mostrar vista previa del archivo
    function showFilePreview(file) {
        // Limpiar el área de carga
        uploadArea.innerHTML = '';
        
        // Crear elemento de imagen
        const img = document.createElement('img');
        img.classList.add('form__preview-image');
        img.file = file;
        
        // Leer y mostrar la imagen
        const reader = new FileReader();
        reader.onload = (function(aImg) { 
            return function(e) { 
                aImg.src = e.target.result; 
            }; 
        })(img);
        reader.readAsDataURL(file);
        
        uploadArea.appendChild(img);
        
        // Agregar información del archivo
        const fileInfo = document.createElement('p');
        fileInfo.classList.add('form__file-info');
        fileInfo.textContent = file.name;
        uploadArea.appendChild(fileInfo);
        
        // Botón para eliminar
        const removeBtn = document.createElement('button');
        removeBtn.classList.add('form__remove-file');
        removeBtn.textContent = 'Eliminar';
        removeBtn.type = 'button';
        removeBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            resetUploadArea();
        });
        uploadArea.appendChild(removeBtn);
    }

    // Resetear el área de carga
    function resetUploadArea() {
        if (uploadArea) {
            uploadArea.innerHTML = '<p class="form__upload-text">Arrastra y suelta o haz clic para subir</p>';
            selectedFile = null;
            if (fileInput) {
                fileInput.value = '';
            }
        }
    }

    // Validar campos obligatorios según el formulario
    function validateForm() {
        const formType = document.querySelector('.form').classList.contains('form--cultivo') ? 'cultivo' :
                         document.querySelector('.form').classList.contains('form--insumo') ? 'insumo' :
                         document.querySelector('.form').classList.contains('form--sensor') ? 'sensor' : 'ciclo-cultivo';

        switch(formType) {
            case 'ciclo-cultivo':
                const idCiclo = document.querySelector('[name="id-ciclo"]')?.value;
                const nombreCiclo = document.querySelector('[name="nombre-ciclo"]')?.value;
                if (!idCiclo || !nombreCiclo) {
                    alert('El ID y el nombre del ciclo son obligatorios');
                    return false;
                }
                break;
                
            case 'cultivo':
                const tipoCultivo = document.querySelector('[name="tipoCultivo"]')?.value;
                const nombreCultivo = document.querySelector('[name="nombreCultivo"]')?.value;
                const identificador = document.querySelector('[name="identificador"]')?.value;
                if (!tipoCultivo || !nombreCultivo || !identificador) {
                    alert('Por favor completa todos los campos obligatorios: Tipo de cultivo, Nombre del cultivo e ID de cultivo');
                    return false;
                }
                break;
                
            case 'insumo':
                const tipoInsumo = document.querySelector('[name="tipoSensor"]')?.value;
                const nombreInsumo = document.querySelector('[name="nombreSensor"]')?.value;
                const idInsumo = document.querySelector('[name="identificador"]')?.value;
                const unidadMedida = document.querySelector('[name="referenciaSensor"]')?.value;
                if (!tipoInsumo || !nombreInsumo || !idInsumo || !unidadMedida) {
                    alert('Por favor completa todos los campos obligatorios');
                    return false;
                }
                break;
                
            case 'sensor':
                const tipoSensor = document.querySelector('[name="tipoSensor"]')?.value;
                const nombreSensor = document.querySelector('[name="nombreSensor"]')?.value;
                const idSensor = document.querySelector('[name="identificador"]')?.value;
                const referencia = document.querySelector('[name="referenciaSensor"]')?.value;
                const unidad = document.querySelector('[name="unidadMedida"]')?.value;
                const tiempo = document.querySelector('[name="tiempoEscaneo"]')?.value;
                const estado = document.querySelector('[name="estado"]')?.value;
                if (!tipoSensor || !nombreSensor || !idSensor || !referencia || !unidad || !tiempo || !estado) {
                    alert('Por favor complete todos los campos obligatorios');
                    return false;
                }
                break;
        }
        
        return true;
    }

    // Calcular valor total para insumos
    function setupInsumoCalculations() {
        const cantidadInput = document.querySelector('[name="unidadMedida"]');
        const valorUnitarioInput = document.querySelector('[name="tiempoEscaneo"]');
        const valorTotalInput = document.querySelector('[name="valorTotal"]');
        
        if (cantidadInput && valorUnitarioInput && valorTotalInput) {
            function calcularValorTotal() {
                const cantidad = parseFloat(cantidadInput.value) || 0;
                const valorUnitario = parseFloat(valorUnitarioInput.value) || 0;
                const valorTotal = cantidad * valorUnitario;
                
                valorTotalInput.value = valorTotal.toLocaleString('es-CO', {
                    style: 'currency',
                    currency: 'COP',
                    minimumFractionDigits: 0
                });
            }
            
            cantidadInput.addEventListener('input', calcularValorTotal);
            valorUnitarioInput.addEventListener('input', calcularValorTotal);
        }
    }

    // Enviar formulario
    async function submitForm() {
        if (!validateForm()) return;
        
        const formType = document.querySelector('.form').classList.contains('form--cultivo') ? 'cultivo' :
                         document.querySelector('.form').classList.contains('form--insumo') ? 'insumo' :
                         document.querySelector('.form').classList.contains('form--sensor') ? 'sensor' : 'ciclo-cultivo';
        
        const formData = new FormData();
        const endpoint = `http://localhost:3000/${formType}`;
        const method = 'POST';
        
        // Mostrar estado de carga
        if (btnCrear) {
            btnCrear.textContent = 'Guardando...';
            btnCrear.disabled = true;
        }
        
        // Agregar datos específicos según el formulario
        switch(formType) {
            case 'ciclo-cultivo':
                formData.append('id_ciclo', document.querySelector('[name="id-ciclo"]').value);
                formData.append('nombre_ciclo', document.querySelector('[name="nombre-ciclo"]').value);
                formData.append('descripcion', document.querySelector('[name="descripcion"]').value);
                formData.append('periodo_siembra', document.querySelector('[name="periodo-siembra"]').value);
                formData.append('novedades', document.querySelector('[name="novedades"]').value);
                formData.append('estado', document.querySelector('[name="estado"]').value);
                if (selectedFile) formData.append('fotografia', selectedFile);
                break;
                
            case 'cultivo':
                formData.append('tipo_cultivo', document.querySelector('[name="tipoCultivo"]').value);
                formData.append('nombre_cultivo', document.querySelector('[name="nombreCultivo"]').value);
                formData.append('id_cultivo', document.querySelector('[name="identificador"]').value);
                formData.append('tamano', document.querySelector('[name="tamano"]').value);
                formData.append('ubicacion', document.querySelector('[name="ubicacion"]').value);
                formData.append('estado', document.querySelector('[name="estado"]').value);
                formData.append('descripcion', document.querySelector('[name="descripcion"]').value);
                if (selectedFile) formData.append('fotografia', selectedFile);
                break;
                
            case 'insumo':
                // Para insumos usamos JSON en lugar de FormData
                const insumoData = {
                    id_insumo: document.querySelector('[name="identificador"]').value,
                    tipo_insumo: document.querySelector('[name="tipoSensor"]').value,
                    nombre_insumo: document.querySelector('[name="nombreSensor"]').value,
                    descripcion: document.querySelector('[name="descripcion"]').value,
                    unidad_medida: document.querySelector('[name="referenciaSensor"]').value,
                    cantidad: parseFloat(document.querySelector('[name="unidadMedida"]').value) || 0,
                    valor_unitario: parseFloat(document.querySelector('[name="tiempoEscaneo"]').value) || 0,
                    estado: document.querySelector('[name="estado"]').value || 'Disponible'
                };
                
                try {
                    const response = await fetch(endpoint, {
                        method: method,
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(insumoData)
                    });
                    
                    const data = await response.json();
                    
                    if (!response.ok) {
                        throw new Error(data.error || 'Error al crear el insumo');
                    }
                    
                    alert('Insumo creado exitosamente');
                    window.location.href = 'listar-insumo-sebas.html';
                    return;
                } catch (error) {
                    console.error('Error:', error);
                    alert(`Error: ${error.message}`);
                    if (btnCrear) {
                        btnCrear.textContent = 'Crear Insumo';
                        btnCrear.disabled = false;
                    }
                    return;
                }
                
            case 'sensor':
                formData.append('tipo_sensor', document.querySelector('[name="tipoSensor"]').value);
                formData.append('nombre_sensor', document.querySelector('[name="nombreSensor"]').value);
                formData.append('identificador', document.querySelector('[name="identificador"]').value);
                formData.append('referencia_sensor', document.querySelector('[name="referenciaSensor"]').value);
                formData.append('unidad_medida', document.querySelector('[name="unidadMedida"]').value);
                formData.append('tiempo_escaneo', document.querySelector('[name="tiempoEscaneo"]').value);
                formData.append('estado', document.querySelector('[name="estado"]').value);
                formData.append('descripcion', document.querySelector('[name="descripcion"]').value);
                if (selectedFile) formData.append('fotografia', selectedFile);
                break;
        }
        
        // Enviar datos al servidor (excepto para insumos que ya se enviaron)
        if (formType !== 'insumo') {
            try {
                const response = await fetch(endpoint, {
                    method: method,
                    body: formData
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.error || `Error al crear ${formType}`);
                }
                
                alert(`${formType.charAt(0).toUpperCase() + formType.slice(1)} creado exitosamente`);
                window.location.href = `listar-${formType}-sebas.html`;
                
            } catch (error) {
                console.error('Error:', error);
                alert(`Error: ${error.message}`);
            } finally {
                if (btnCrear) {
                    btnCrear.textContent = formType === 'insumo' ? 'Crear Insumo' : 
                                          formType === 'sensor' ? 'Crear Sensor' :
                                          formType === 'cultivo' ? 'Crear Cultivo' : 'Crear Ciclo Cultivo';
                    btnCrear.disabled = false;
                }
            }
        }
    }

    // Manejar botón volver
    if (btnVolver) {
        btnVolver.addEventListener('click', function() {
            const formType = document.querySelector('.form').classList.contains('form--cultivo') ? 'cultivo' :
                             document.querySelector('.form').classList.contains('form--insumo') ? 'insumo' :
                             document.querySelector('.form').classList.contains('form--sensor') ? 'sensor' : 'ciclo-cultivo';
            
            window.location.href = `listar-${formType}-sebas.html`;
        });
    }

    // Manejar envío del formulario
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            submitForm();
        });
    }

    // Inicializar componentes
    initFileUpload();
    setupInsumoCalculations();
});