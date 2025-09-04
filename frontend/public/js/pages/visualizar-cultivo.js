/**
 * Script para la página de visualización de cultivos.
 * Carga y muestra los datos del cultivo seleccionado desde el backend.
 */
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Obtener el ID del cultivo desde localStorage
    const idCultivo = localStorage.getItem('idCultivo');

    // Si no hay ID, mostrar error y detener
    if (!idCultivo) {
        alert('No se ha especificado un ID de cultivo para visualizar.');
        window.location.href = 'listar-cultivo-sebas.html'; // Redirigir a la lista
        return;
    }

    // 2. Realizar la solicitud al backend para obtener los datos del cultivo
    try {
        // La URL debe coincidir con la definida en tu `server.js`
        const response = await fetch(`http://localhost:3000/cultivos/${idCultivo}`);
        
        // Verificar si la respuesta del servidor es exitosa
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ mensaje: 'Error desconocido del servidor.' }));
            throw new Error(errorData.mensaje || `No se pudo encontrar el cultivo (Error ${response.status})`);
        }

        // Convertir la respuesta a formato JSON
        const cultivo = await response.json();

        // 3. Rellenar la página con los datos del cultivo
        if (cultivo) {
            document.getElementById('tipo-cultivo').textContent = cultivo.tipo_cultivo || 'No especificado';
            document.getElementById('nombre-cultivo').textContent = cultivo.nombre_cultivo || 'No especificado';
            document.getElementById('ubicacion').textContent = cultivo.ubicacion || 'No especificado';
            document.getElementById('estado').textContent = cultivo.estado || 'No especificado';
            document.getElementById('tamano').textContent = cultivo.tamano || 'No especificado';
            document.getElementById('id-cultivo').textContent = cultivo.id_cultivo || 'No especificado';
            document.getElementById('descripcion').textContent = cultivo.descripcion || 'Sin descripción';

            // Simulación de tareas pendientes (puedes adaptarlo si tienes tareas reales)
            const tareasList = document.getElementById('tareas-pendientes');
            tareasList.innerHTML = `
                <li>Revisar niveles de humedad del suelo.</li>
                <li>Aplicar fertilizante (Próxima semana).</li>
                <li>Monitorear plagas en hojas inferiores.</li>
            `;
        } else {
            throw new Error('La respuesta del servidor no contenía datos válidos.');
        }

    } catch (error) {
        console.error('Error al cargar los datos del cultivo:', error);
        // Mostrar un mensaje de error más amigable en la página
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.innerHTML = `<p style="color: red; text-align: center;">Error al cargar el cultivo: ${error.message}</p>`;
        }
    }
});