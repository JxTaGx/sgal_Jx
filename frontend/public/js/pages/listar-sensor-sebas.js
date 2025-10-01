document.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem('token');
    const searchInput = document.querySelector('.sensor__search');
    let allSensores = [];

    if (!token) {
        alert('No estás autenticado. Redirigiendo al login.');
        window.location.href = 'login.html';
        return;
    }

    fetch('http://localhost:3000/sensor/s', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => { throw new Error(err.error || 'Error al obtener los sensores.'); });
        }
        return response.json();
    })
    .then(result => {
        allSensores = result.data || [];
        renderSensores(allSensores);
    })
    .catch(error => {
        console.error('Error al listar sensores:', error);
        const tableBody = document.getElementById('sensorTableBody');
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:red;">${error.message}</td></tr>`;
    });

    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredSensores = allSensores.filter(sensor => {
            return sensor.nombre_sensor.toLowerCase().includes(searchTerm) ||
                   sensor.tipo_sensor.toLowerCase().includes(searchTerm) ||
                   sensor.referencia_sensor.toLowerCase().includes(searchTerm);
        });
        renderSensores(filteredSensores);
    });

    function renderSensores(sensores) {
        const tableBody = document.getElementById('sensorTableBody');
        tableBody.innerHTML = '';

        if (sensores.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No se encontraron sensores.</td></tr>';
            return;
        }

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
                </td>
            `;
            tableBody.appendChild(row);
        });
    }
});

function verSensor(id) {
    localStorage.setItem('idSensor', id);
    window.location.href = '../views/visualizar-sensor.html';
}