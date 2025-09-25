/**
 * Script para la página de visualización de cultivos.
 * Carga y muestra los datos del cultivo seleccionado desde el backend.
 */
document.addEventListener('DOMContentLoaded', async () => {
    const idCultivo = localStorage.getItem('idCultivo');
    const token = localStorage.getItem('token');

    if (!token) {
        alert('Acceso denegado. Por favor, inicie sesión.');
        window.location.href = 'login.html';
        return;
    }

    if (!idCultivo) {
        alert('No se ha especificado un ID de cultivo para visualizar.');
        window.location.href = 'listar-cultivo-sebas.html';
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/cultivo/${idCultivo}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Error desconocido del servidor.' }));
            throw new Error(errorData.error || `No se pudo encontrar el cultivo (Error ${response.status})`);
        }

        const result = await response.json();
        const cultivo = result.data;

        if (cultivo) {
            document.getElementById('tipo-cultivo').textContent = cultivo.tipo_cultivo || 'No especificado';
            document.getElementById('nombre-cultivo').textContent = cultivo.nombre_cultivo || 'No especificado';
            document.getElementById('ubicacion').textContent = cultivo.ubicacion || 'No especificado';
            document.getElementById('estado').textContent = cultivo.estado || 'No especificado';
            document.getElementById('tamano').textContent = cultivo.tamano || 'No especificado';
            document.getElementById('id-cultivo').textContent = cultivo.id_cultivo || 'No especificado';
            document.getElementById('descripcion').textContent = cultivo.descripcion || 'Sin descripción';

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
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.innerHTML = `<p style="color: red; text-align: center;">Error al cargar el cultivo: ${error.message}</p>`;
        } else {
            alert(`Error al cargar el cultivo: ${error.message}`);
        }
    }
});