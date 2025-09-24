document.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem('token'); // Obtener el token

    if (!token) {
        // Redirigir si no hay token, o manejar el error como prefieras
        window.location.href = 'login.html';
        return;
    }

    fetch('http://localhost:3000/sensor/s', { // Usar la ruta correcta de la API
        headers: {
            'Authorization': `Bearer ${token}` // Incluir el token en los headers
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Error al obtener los sensores. Asegúrate de haber iniciado sesión.');
        }
        return response.json();
    })
    .then(result => {
        const tableBody = document.getElementById('sensorTableBody');
        tableBody.innerHTML = ''; // Limpiar contenido

        // El controlador devuelve un objeto { success: true, data: [...] }
        const sensores = result.data || [];

        sensores.forEach(sensor => {
            const row = document.createElement('tr');
            row.classList.add('sensor__table-row');
            row.innerHTML = `
                <td>${sensor.id}</td>
                <td>${sensor.nombre_sensor}</td>
                <td>${sensor.tipo_sensor}</td>
                <td>${sensor.referencia_sensor}</td>
                <td>${sensor.estado}</td>
                <td>
                    <button onclick="verSensor(${sensor.id})" class="sensor__button sensor__button--blue">Editar</button>
                    <button class="sensor__button sensor__button--purple">Habilitar</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    })
    .catch(error => {
        console.error('Error al listar sensores:', error);
        const tableBody = document.getElementById('sensorTableBody');
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:red;">${error.message}</td></tr>`;
    });
});

function verSensor(id) {
    localStorage.setItem('idSensor', id);
    window.location.href = '../views/visualizar-sensor.html';
}