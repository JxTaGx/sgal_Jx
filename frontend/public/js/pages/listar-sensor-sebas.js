document.addEventListener('DOMContentLoaded', function () {
    fetch('http://localhost:3000/sensores')
        .then(response => response.json())
        .then(data => {
            const tableBody = document.getElementById('sensorTableBody');
            tableBody.innerHTML = ''; // Limpiar contenido

            data.forEach(sensor => {
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
        });
});

function verSensor(id) {
    localStorage.setItem('idSensor', id);
    window.location.href = '../views/visualizar-sensor.html';
}