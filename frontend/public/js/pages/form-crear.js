document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('.form__content');
    const uploadArea = document.querySelector('.form__upload-area');
    const btnCrear = document.querySelector('.form__btn--crear');
    const btnVolver = document.querySelector('#btn-volver');

    let fileInput = document.querySelector('input[type="file"][name="fotografia"]');
    let selectedFile = null;

    function initFileUpload() {
        if (!uploadArea) return;
        if (!fileInput) {
            fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*';
            fileInput.style.display = 'none';
            fileInput.name = 'fotografia';
            document.body.appendChild(fileInput);
        }

        uploadArea.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) handleFileSelection(e.target.files[0]);
        });
        ['dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, e => { e.preventDefault(); e.stopPropagation(); }, false);
        });
        uploadArea.addEventListener('drop', (e) => {
            if (e.dataTransfer.files && e.dataTransfer.files[0]) handleFileSelection(e.dataTransfer.files[0]);
        });
    }

    function handleFileSelection(file) {
        if (!file.type.startsWith('image/')) {
            alert('Por favor, selecciona un archivo de imagen.');
            return;
        }
        selectedFile = file;
        showFilePreview(file);
    }

    function showFilePreview(file) {
        if (!uploadArea) return;
        uploadArea.innerHTML = '';
        const img = document.createElement('img');
        img.classList.add('form__preview-image');
        const reader = new FileReader();
        reader.onload = (e) => { img.src = e.target.result; };
        reader.readAsDataURL(file);
        uploadArea.appendChild(img);
    }
    
    async function submitForm() {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Acceso denegado. Por favor, inicie sesión de nuevo.');
            window.location.href = 'login.html';
            return;
        }

        const formElement = document.querySelector('.form');
        const formType = formElement.classList.contains('form--cultivo') ? 'cultivo' :
                         formElement.classList.contains('form--insumo') ? 'insumo' :
                         formElement.classList.contains('form--sensor') ? 'sensor' : 'ciclo-cultivo';

        const endpoint = `http://localhost:3000/${formType}`;
        const headers = { 'Authorization': `Bearer ${token}` };
        let body;
        
        // El formulario de Insumo es el único que envía JSON
        if (formType === 'insumo') {
            headers['Content-Type'] = 'application/json';
            body = JSON.stringify({
                id_insumo: form.querySelector('[name="id_insumo"]').value,
                tipo_insumo: form.querySelector('[name="tipo_insumo"]').value,
                nombre_insumo: form.querySelector('[name="nombre_insumo"]').value,
                descripcion: form.querySelector('[name="descripcion"]').value,
                unidad_medida: form.querySelector('[name="unidad_medida"]').value,
                cantidad: parseFloat(form.querySelector('[name="cantidad"]').value) || 0,
                valor_unitario: parseFloat(form.querySelector('[name="valor_unitario"]').value) || 0,
                estado: form.querySelector('[name="estado"]').value || 'Disponible'
            });
        } else {
            // Todos los demás formularios (cultivo, sensor, ciclo) usan FormData
            // ya que pueden incluir una imagen. FormData construirá el body
            // usando los `name` corregidos del HTML.
            body = new FormData(form);
            if (selectedFile) {
                body.set('fotografia', selectedFile, selectedFile.name);
            }
        }

        if (btnCrear) {
            btnCrear.textContent = 'Guardando...';
            btnCrear.disabled = true;
        }

        try {
            const response = await fetch(endpoint, { method: 'POST', headers, body });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `Error al crear (HTTP ${response.status})`);
            }

            alert(`${formType.replace('-', ' ')} creado exitosamente`);

            const urlParams = new URLSearchParams(window.location.search);
            const origin = urlParams.get('origin');
            if (origin === 'produccion') {
                 window.location.href = '../views/integracion.html';
            } else {
                 let defaultListUrl = 'home.html';
                 if (formType === 'cultivo') defaultListUrl = 'listar-cultivo-sebas.html';
                 else if (formType === 'insumo') defaultListUrl = 'listar-insumo-sebas.html';
                 else if (formType === 'sensor') defaultListUrl = 'listar-sensor-sebas.html';
                 else if (formType === 'ciclo-cultivo') defaultListUrl = 'listar-ciclo-cultivo-sebas.html';
                 window.location.href = defaultListUrl;
            }
        } catch (error) {
            console.error('Error:', error);
            alert(`Error: ${error.message}`);
            if (btnCrear) {
                const title = formElement.querySelector('.form__title')?.textContent || `Crear`;
                btnCrear.textContent = title;
                btnCrear.disabled = false;
            }
        }
    }

    function setupVolverButton() {
        if (!btnVolver) return;
        const urlParams = new URLSearchParams(window.location.search);
        const origin = urlParams.get('origin');
        let defaultBackUrl = 'home.html';
        const formElement = document.querySelector('.form');
        if (formElement) {
            if (formElement.classList.contains('form--cultivo')) defaultBackUrl = 'listar-cultivo-sebas.html';
            else if (formElement.classList.contains('form--insumo')) defaultBackUrl = 'listar-insumo-sebas.html';
            else if (formElement.classList.contains('form--sensor')) defaultBackUrl = 'listar-sensor-sebas.html';
            else if (formElement.classList.contains('form--ciclo-cultivo')) defaultBackUrl = 'listar-ciclo-cultivo-sebas.html';
        }

        btnVolver.addEventListener('click', function() {
            if (origin === 'produccion') {
                window.location.href = '../views/integracion.html';
            } else {
                window.location.href = defaultBackUrl;
            }
        });
    }

    initFileUpload();
    setupVolverButton();
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            submitForm();
        });
    }
});