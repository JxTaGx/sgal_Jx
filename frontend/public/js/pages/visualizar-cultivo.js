document.addEventListener('DOMContentLoaded', function() {
    // Referencias a elementos de la página
    const editButton = document.querySelector('.button--edit');
    const disableButton = document.querySelector('.button--disable');
    const backButton = document.querySelector('.button--back');
    
    // Evento para el botón Deshabilitar
    if (disableButton) {
        disableButton.addEventListener('click', function(e) {
        e.preventDefault();
        confirmDisable();
        });
    }
    
    // Evento para el botón Editar (opcional, por si quieres alguna validación antes de ir a la página de edición)
    if (editButton) {
        editButton.addEventListener('click', function(e) {
        // Si necesitas alguna validación antes de ir a la página de edición, puedes añadirla aquí
        // Por ejemplo, verificar permisos del usuario o mostrar un mensaje de advertencia
        
        // Si no necesitas ninguna validación, puedes eliminar este event listener
        // y dejar que el enlace funcione normalmente
        });
    }
    
    /**
     * Confirma la deshabilitación del cultivo
     */
    function confirmDisable() {
        try {
        // Creamos el modal de confirmación
        const modal = document.createElement('div');
        modal.className = 'confirm-modal';
        modal.innerHTML = `
            <div class="modal-content">
            <h3>Confirmar deshabilitación</h3>
            <p>¿Está seguro que desea deshabilitar este cultivo?</p>
            <p>Esta acción no se puede deshacer.</p>
            <div class="modal-buttons">
                <button id="confirmYes" class="button button--disable">Sí, deshabilitar</button>
                <button id="confirmNo" class="button button--back">Cancelar</button>
            </div>
            </div>
        `;
        
        // Añadimos estilos para el modal
        const styleElement = document.createElement('style');
        styleElement.textContent = `
            .confirm-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            }
            
            .modal-content {
            background-color: white;
            padding: 30px;
            border-radius: 5px;
            max-width: 400px;
            width: 90%;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
            }
            
            .modal-content h3 {
            margin-top: 0;
            color: var(--gray-950);
            }
            
            .modal-buttons {
            display: flex;
            justify-content: space-between;
            margin-top: 20px;
            gap: 10px;
            }
            
            @media (max-width: 480px) {
            .modal-buttons {
                flex-direction: column;
            }
            
            .modal-buttons button {
                width: 100%;
                margin-top: 10px;
            }
            }
        `;
        document.head.appendChild(styleElement);
        
        // Añadimos el modal al DOM
        document.body.appendChild(modal);
        
        // Añadimos event listeners para los botones
        document.getElementById('confirmYes').addEventListener('click', function() {
          // Aquí iría el código para deshabilitar el cultivo en tu sistema
            try {
            // Simulamos una petición al servidor para deshabilitar el cultivo
            // En una aplicación real, esto sería una llamada AJAX o fetch
            
            // Mostramos una notificación de éxito
            showNotification('Cultivo deshabilitado correctamente', 'success');
            
            // Redirigimos a la lista de cultivos después de un breve retraso
            setTimeout(function() {
                window.location.href = 'listar-cultivo-sebas.html';
            }, 1500);
            
            } catch (error) {
            console.error('Error al deshabilitar el cultivo:', error);
            showNotification('Error al deshabilitar el cultivo', 'error');
            }
        });
        
        document.getElementById('confirmNo').addEventListener('click', function() {
          // Cerramos el modal
            document.body.removeChild(modal);
        });
        
        } catch (error) {
        console.error('Error al mostrar el modal de confirmación:', error);
        alert('Ha ocurrido un error. Por favor, inténtelo de nuevo.');
        }
    }
    
    /**
     * Muestra una notificación en la esquina superior derecha
     * @param {string} message - Mensaje a mostrar
     * @param {string} type - Tipo de notificación: 'success', 'error', 'warning', 'info'
     */
    function showNotification(message, type = 'info') {
        try {
        // Creamos la notificación
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        // Definimos el icono según el tipo
        let icon;
        switch (type) {
            case 'success':
            icon = '✓';
            break;
            case 'error':
            icon = '✕';
            break;
            case 'warning':
            icon = '⚠';
            break;
            default:
            icon = 'ℹ';
        }
        
        notification.innerHTML = `
            <div class="notification-content">
            <span class="notification-icon">${icon}</span>
            <span class="notification-message">${message}</span>
            </div>
        `;
        
        // Añadimos estilos para la notificación
        if (!document.getElementById('notification-styles')) {
            const styleElement = document.createElement('style');
            styleElement.id = 'notification-styles';
            styleElement.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                border-radius: 5px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                z-index: 1000;
                animation: slideIn 0.3s ease, fadeOut 0.3s ease 2.7s forwards;
            }
            
            .success {
                background-color: var(--primary-500);
                color: white;
            }
            
            .error {
                background-color: #d32f2f;
                color: white;
            }
            
            .warning {
                background-color: #ff9800;
                color: white;
            }
            
            .info {
                background-color: var(--secondary-1-500);
                color: white;
            }
            
            .notification-content {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .notification-icon {
                font-size: 18px;
                font-weight: bold;
            }
            
            .notification-message {
                font-size: 16px;
            }
            
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; visibility: hidden; }
            }
            `;
            document.head.appendChild(styleElement);
        }
        
        // Añadimos la notificación al DOM
        document.body.appendChild(notification);
        
        // Eliminamos la notificación después de 3 segundos
        setTimeout(function() {
            if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
            }
        }, 3000);
        
        } catch (error) {
        console.error('Error al mostrar la notificación:', error);
        }
    }
    });