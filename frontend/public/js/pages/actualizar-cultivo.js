/**
 * Script para la página de actualización de cultivos.
 * Carga los datos del cultivo seleccionado, permite la edición y guarda los cambios.
 */
document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('formulario-actualizar-cultivo');
    const nombreCultivoInput = document.getElementById('nombreCultivo');
    const tipoCultivoInput = document.getElementById('tipoCultivo');
    const tamanoInput = document.getElementById('tamano');
    const ubicacionInput = document.getElementById('ubicacion');
    const estadoInput = document.getElementById('estado');
    const descripcionInput = document.getElementById('descripcion');
    const idCultivoMostrarInput = document.getElementById('idCultivoMostrar');
    const imagePlaceholder = document.getElementById('image-placeholder');

    const idCultivo = localStorage.getItem('idCultivo');
    const token = localStorage.getItem('token');

    // --- VALIDACIONES ---
    // Función para prevenir números en los campos de texto
    const preventNumbers = (event) => {
        if (/[0-9]/.test(event.key)) {
            event.preventDefault();
        }
    };

    // Aplicar la validación a los campos necesarios
    nombreCultivoInput.addEventListener('keypress', preventNumbers);
    tipoCultivoInput.addEventListener('keypress', preventNumbers);
    estadoInput.addEventListener('keypress', preventNumbers);

    // Función para validar que los campos no estén vacíos
    const validateForm = () => {
        let isValid = true;
        [nombreCultivoInput, tipoCultivoInput, tamanoInput, ubicacionInput, estadoInput, descripcionInput].forEach(input => {
            if (!input.value.trim()) {
                isValid = false;
            }
        });
        return isValid;
    };
    // --- FIN DE VALIDACIONES ---

    if (!token) {
        alert('Acceso denegado. Por favor, inicie sesión.');
        window.location.href = 'login.html';
        return;
    }

    if (!idCultivo) {
        alert('Error: No se ha seleccionado un cultivo para editar.');
        window.location.href = 'listar-cultivo-sebas.html';
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/cultivo/${idCultivo}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'No se pudo leer la respuesta del servidor.' }));
            throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        const cultivo = result.data;

        if (cultivo) {
            nombreCultivoInput.value = cultivo.nombre_cultivo || '';
            tipoCultivoInput.value = cultivo.tipo_cultivo || '';
            tamanoInput.value = cultivo.tamano || '';
            ubicacionInput.value = cultivo.ubicacion || '';
            estadoInput.value = cultivo.estado || '';
            descripcionInput.value = cultivo.descripcion || '';
            idCultivoMostrarInput.value = cultivo.id_cultivo || idCultivo;

            if (cultivo.ruta_fotografia) {
                imagePlaceholder.innerHTML = `<img src="http://localhost:3000${cultivo.ruta_fotografia}" alt="Imagen del Cultivo" style="max-width: 100%; height: auto;">`;
            } else {
                imagePlaceholder.innerHTML = '<p>No hay imagen disponible</p>';
            }

        } else {
            throw new Error('La respuesta del servidor no contenía datos del cultivo.');
        }

    } catch (error) {
        console.error('Error al cargar los datos del cultivo:', error);
        alert(`No se pudieron cargar los datos del cultivo. Causa: ${error.message}`);
    }

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        // Validar el formulario antes de enviar
        if (!validateForm()) {
            alert('Por favor, complete todos los campos antes de guardar.');
            return;
        }

        const datosActualizados = {
            nombre_cultivo: nombreCultivoInput.value,
            tipo_cultivo: tipoCultivoInput.value,
            tamano: tamanoInput.value,
            ubicacion: ubicacionInput.value,
            estado: estadoInput.value,
            descripcion: descripcionInput.value,
        };

        try {
            const response = await fetch(`http://localhost:3000/cultivo/${idCultivo}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(datosActualizados),
            });

            if (!response.ok) {
                 const errorData = await response.json().catch(()=>({error: "Error al actualizar"}));
                 throw new Error(errorData.error || `Error ${response.status}: No se pudo actualizar el cultivo.`);
            }

            alert('Cultivo actualizado correctamente.');
            window.location.href = 'listar-cultivo-sebas.html';

        } catch (error) {
            console.error('Error al guardar los cambios:', error);
            alert(`Error al guardar los cambios: ${error.message}`);
        }
    });
});