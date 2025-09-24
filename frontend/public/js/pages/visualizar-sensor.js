document.addEventListener('DOMContentLoaded', async () => {
    const idSensor = localStorage.getItem('idSensor');
    const token = localStorage.getItem('token'); // Obtener el token

    if (!idSensor) {
        alert('ID del sensor no encontrado');
        window.location.href = 'listar-sensor-sebas.html';
        return;
    }

    if (!token) {
        alert('No estás autenticado.');
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/sensor/${idSensor}`, {
            headers: {
                'Authorization': `Bearer ${token}` // Incluir el token en los headers
            }
        });
        const result = await response.json();

        if (!result || !result.success || !result.data) {
            alert(result.error || 'Sensor no encontrado');
            return;
        }

        const sensor = result.data;

        document.getElementById('sensor-id').textContent = sensor.id || 'No especificado';
        document.getElementById('tipo-sensor').textContent = sensor.tipo_sensor || 'No especificado';
        document.getElementById('ubicacion-sensor').textContent = sensor.nombre_sensor || 'No especificado';
        document.getElementById('ultima-lectura').textContent = sensor.referencia_sensor || 'No disponible';
        document.getElementById('estado-sensor').textContent = sensor.estado || 'No especificado';

        const historial = sensor.historial || [];
        const historialList = document.getElementById('historial-lecturas');
        historialList.innerHTML = '';

        if (historial.length > 0) {
            historial.forEach(lectura => {
                const li = document.createElement('li');
                li.className = 'history__item';
                li.textContent = lectura;
                historialList.appendChild(li);
            });
        } else {
            historialList.innerHTML = '<li class="history__item">No hay historial disponible</li>';
        }

    } catch (error) {
        console.error('Error al cargar datos del sensor:', error);
        alert('Error al cargar los datos del sensor.');
    }
});

function irActualizarSensor() {
    const idSensor = localStorage.getItem('idSensor');
    if (idSensor) {
        window.location.href = `actualizar-sensor.html?id=${idSensor}`;
    } else {
        alert('ID del sensor no encontrado');
    }
}