/**
 * Script para la página de actualización de cultivos.
 * Carga los datos del cultivo seleccionado, permite la edición y guarda los cambios.
 */
document.addEventListener('DOMContentLoaded', async () => {
    // Referencias a los elementos del formulario
    const form = document.getElementById('formulario-actualizar-cultivo');
    const nombreCultivoInput = document.getElementById('nombreCultivo');
    const tipoCultivoInput = document.getElementById('tipoCultivo');
    const tamanoInput = document.getElementById('tamano');
    const ubicacionInput = document.getElementById('ubicacion');
    const estadoInput = document.getElementById('estado');
    const descripcionInput = document.getElementById('descripcion');
    const idCultivoMostrarInput = document.getElementById('idCultivoMostrar');

    // 1. Obtener el ID del cultivo desde localStorage
    const idCultivo = localStorage.getItem('idCultivo');

    if (!idCultivo) {
        alert('Error: No se ha seleccionado un cultivo para editar.');
        window.location.href = 'listar-cultivo-sebas.html'; // Redirigir si no hay ID
        return;
    }

    // 2. Cargar los datos del cultivo desde el backend
    try {
        const response = await fetch(`http://localhost:3000/cultivos/${idCultivo}`);
        
        if (!response.ok) {
            // Si el servidor responde con un error (ej. 404 Not Found)
            const errorData = await response.json().catch(() => ({ message: 'No se pudo leer la respuesta del servidor.' }));
            throw new Error(errorData.mensaje || `Error ${response.status}: ${response.statusText}`);
        }

        const cultivo = await response.json();

        // 3. Rellenar el formulario con los datos obtenidos
        if (cultivo) {
            nombreCultivoInput.value = cultivo.nombre_cultivo || '';
            tipoCultivoInput.value = cultivo.tipo_cultivo || '';
            tamanoInput.value = cultivo.tamano || '';
            ubicacionInput.value = cultivo.ubicacion || '';
            estadoInput.value = cultivo.estado || '';
            descripcionInput.value = cultivo.descripcion || '';
            idCultivoMostrarInput.value = cultivo.id_cultivo || idCultivo; // Mostrar el ID no editable
        } else {
            throw new Error('La respuesta del servidor no contenía datos del cultivo.');
        }

    } catch (error) {
        console.error('Error al cargar los datos del cultivo:', error);
        alert(`No se pudieron cargar los datos del cultivo. Causa: ${error.message}`);
    }

    // 4. Manejar el envío del formulario para guardar los cambios
    form.addEventListener('submit', async (event) => {
        event.preventDefault(); // Evitar que la página se recargue

        // Recolectar los datos actualizados del formulario
        const datosActualizados = {
            nombre_cultivo: nombreCultivoInput.value,
            tipo_cultivo: tipoCultivoInput.value,
            tamano: tamanoInput.value,
            ubicacion: ubicacionInput.value,
            estado: estadoInput.value,
            descripcion: descripcionInput.value,
        };

        // 5. Enviar los datos actualizados al backend
        try {
            const response = await fetch(`http://localhost:3000/cultivos/${idCultivo}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(datosActualizados),
            });

            if (!response.ok) {
                 const errorData = await response.text();
                 throw new Error(errorData || `Error ${response.status}: No se pudo actualizar el cultivo.`);
            }

            alert('Cultivo actualizado correctamente.');
            window.location.href = 'listar-cultivo-sebas.html'; // Redirigir a la lista de cultivos

        } catch (error) {
            console.error('Error al guardar los cambios:', error);
            alert(`Error al guardar los cambios: ${error.message}`);
        }
    });
});