/**
 * Script para validación y funcionalidades de la página Visualizar Ciclo Cultivo
 * Implementa validaciones básicas y manejo de eventos
 */

// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', async () => {
    // Referencias a elementos existentes
    const editButtonElement = document.querySelector('.ciclo-cultivo__btn--edit'); // Changed variable name
    const disableButtonElement = document.querySelector('.ciclo-cultivo__btn--disable'); // Changed variable name
    // const backButton = document.querySelector('.ciclo-cultivo__btn--back');

    // Configurar manejadores de eventos
    setupEventListeners(editButtonElement, disableButtonElement); // Pass elements as arguments

    // Implementar funcionalidad de visualización de datos
    setupDataVisualisation();


    const id = localStorage.getItem('idCicloCultivo');

    if (!id) {
        alert('ID de ciclo no encontrado');
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/ciclo_cultivo/${id}`);
        if (!response.ok) throw new Error('No se pudo obtener el ciclo');

        const ciclo = await response.json();

        const lista = document.getElementById('detalle-ciclo');
        lista.innerHTML = `
            <li class="ciclo-cultivo__list-item"><strong>Ciclo Cultivo:</strong> ${ciclo.nombre_ciclo}</li>
            <li class="ciclo-cultivo__list-item"><strong>Fecha de siembra:</strong> ${ciclo.periodo_siembra}</li>
            <li class="ciclo-cultivo__list-item"><strong>ID:</strong> ${ciclo.id_ciclo}</li>
            <li class="ciclo-cultivo__list-item"><strong>Novedades:</strong> ${ciclo.novedades || 'No hay novedades'}</li>
            <li class="ciclo-cultivo__list-item"><strong>Descripción:</strong> ${ciclo.descripcion || 'Sin descripción'}</li>
        `;

        const tareas = ciclo.tareas?.length ?
            ciclo.tareas :
            ['No hay datos de rendimiento'];
        const rendimientoLista = document.getElementById('rendimiento-lista');
        rendimientoLista.innerHTML = tareas.map(tarea => `<li class="ciclo-cultivo__list-item">${tarea}</li>`).join('');

        // Redireccionar al editar con el ID por URL
        const botonEditar = document.getElementById('editar-btn');
        if (botonEditar) { // Check if button exists
            botonEditar.addEventListener('click', () => {
                window.location.href = `/frontend/public/views/actualizar-ciclo-cultivo.html?id=${id}`;
            });
        }


    } catch (err) {
        console.error(err);
        alert('Ciclo no encontrado');
    }
});

/**
 * Configura los listeners de eventos para los botones
 */
function setupEventListeners(editButton, disableButton) { // Accept buttons as parameters
    try {
        // Botón de editar
        if (editButton) {
            editButton.addEventListener('click', (event) => {
                // This is handled by the dynamic part now, but good to have a shell
                // window.location.href = 'editar-ciclo-cultivo.html'; // Actual redirection is dynamic
            });
        }

        // Botón de deshabilitar
        if (disableButton) {
            disableButton.addEventListener('click', (event) => {
                event.preventDefault();
                confirmDisable();
            });
        }

    } catch (error) {
        console.error('Error al configurar los eventos:', error);
        showNotification('Error al inicializar la página', 'error');
    }
}

/**
 * Confirma la acción de deshabilitar ciclo
 */
function confirmDisable() {
    try {
        if (confirm('¿Está seguro que desea deshabilitar este ciclo de cultivo?')) {
            // Simular acción de deshabilitar
            showNotification('Ciclo deshabilitado exitosamente', 'success');

            // Redireccionar después de un tiempo
            setTimeout(() => {
                window.location.href = 'listar-ciclo-cultivo-sebas.html';
            }, 2000);
        }
    } catch (error) {
        console.error('Error al deshabilitar el ciclo:', error);
        showNotification('Error al deshabilitar el ciclo: ' + error.message, 'error');
    }
}

/**
 * Configuración de funcionalidades de visualización de datos
 */
function setupDataVisualisation() {
    try {
        // Añadir indicadores visuales al rendimiento
        const rendimientoItems = document.querySelectorAll('.ciclo-cultivo__tasks .ciclo-cultivo__list-item');

        rendimientoItems.forEach(item => {
            const text = item.textContent;
            let statusColor;

            // Determinar color según el estado
            if (text.includes('Normal') || text.includes('Habitual')) {
                statusColor = 'var(--primary-700)';
            } else if (text.includes('Avanzando')) {
                statusColor = 'var(--secondary-4-900)';
            } else {
                statusColor = 'var(--secondary-2-700)';
            }

            // Crear indicador de estado
            const indicator = document.createElement('span');
            indicator.className = 'status-indicator';
            indicator.style.display = 'inline-block';
            indicator.style.width = '1.2rem';
            indicator.style.height = '1.2rem';
            indicator.style.borderRadius = '50%';
            indicator.style.backgroundColor = statusColor;
            indicator.style.marginLeft = '1rem';

            // Añadir indicador al elemento
            item.appendChild(indicator);
        });

    } catch (error) {
        console.error('Error al configurar visualización de datos:', error);
    }
}

/**
 * Muestra una notificación temporal
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo de notificación ('success' o 'error')
 */
function showNotification(message, type = 'success') {
    try {
        // Eliminar notificaciones existentes
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => {
            notification.remove();
        });

        // Crear nueva notificación
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        // Añadir estilos
        notification.style.position = 'fixed';
        notification.style.top = '2rem';
        notification.style.right = '2rem';
        notification.style.padding = '1.5rem 2rem';
        notification.style.borderRadius = '0.4rem';
        notification.style.color = 'white';
        notification.style.fontWeight = 'var(--font-medium)';
        notification.style.zIndex = '1000';
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-2rem)';
        notification.style.transition = 'opacity 0.3s, transform 0.3s';

        if (type === 'success') {
            notification.style.backgroundColor = 'var(--primary-900)';
        } else {
            notification.style.backgroundColor = '#e74c3c';
        }

        // Añadir al DOM
        document.body.appendChild(notification);

        // Mostrar con un pequeño retraso para el efecto de animación
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateY(0)';
        }, 10);

        // Eliminar después de 3 segundos
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(-2rem)';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);

    } catch (error) {
        console.error('Error al mostrar notificación:', error);
    }
}