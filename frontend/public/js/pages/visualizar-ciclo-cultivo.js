/**
 * Script para validación y funcionalidades de la página Visualizar Ciclo Cultivo
 * Implementa validaciones básicas y manejo de eventos
 */

// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', () => {
    // Referencias a elementos existentes
    const editButton = document.querySelector('.ciclo-cultivo__btn--edit');
    const disableButton = document.querySelector('.ciclo-cultivo__btn--disable');
    const backButton = document.querySelector('.ciclo-cultivo__btn--back');
    
    // Configurar manejadores de eventos
    setupEventListeners();
    
    // Implementar funcionalidad de visualización de datos
    setupDataVisualisation();
});

/**
 * Configura los listeners de eventos para los botones
 */
function setupEventListeners() {
    try {
        // Referencias a elementos
        const editButton = document.querySelector('.ciclo-cultivo__btn--edit');
        const disableButton = document.querySelector('.ciclo-cultivo__btn--disable');
        
        // Botón de editar
        if (editButton) {
            editButton.addEventListener('click', (event) => {
                // Redirigir a la página de edición
                window.location.href = 'editar-ciclo-cultivo.html';
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