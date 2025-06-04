document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if (!id) {
        alert('No se proporcionó un ID de sensor');
        return;
    }

    console.log('ID del sensor recibido:', id);

    try {
        const res = await fetch(`http://localhost:3000/sensores/${id}`); // Ensure this endpoint is correct
        if (!res.ok) {
            const errorText = await res.text();
            console.error("Error response text:", errorText);
            throw new Error(`Error al obtener datos: ${res.status} ${res.statusText}`);
        }

        const response = await res.json();
        console.log('Sensor completo:', response);

        const sensor = response.data;

        if (!sensor) {
            throw new Error('Los datos del sensor no se cargaron correctamente.');
        }


        document.getElementById('id').value = sensor.id || sensor.id_sensor || 'Sin ID'; // Use id_sensor as fallback
        document.getElementById('nombre_sensor').value = sensor.nombre_sensor || '';
        document.getElementById('identificador').value = sensor.identificador || '';
        document.getElementById('referencia_sensor').value = sensor.referencia_sensor || '';
        document.getElementById('tipo_sensor').value = sensor.tipo_sensor || '';
        document.getElementById('unidad_medida').value = sensor.unidad_medida || '';
        document.getElementById('tiempo_escaneo').value = sensor.tiempo_escaneo || '';
        document.getElementById('estado').value = sensor.estado || 'Activo';
        document.getElementById('descripcion').value = sensor.descripcion || '';

    } catch (err) {
        console.error('Error al cargar datos del sensor:', err);
        alert(`No se pudo cargar el sensor: ${err.message}`);
    }

    document.getElementById('formActualizarSensor').addEventListener('submit', async (e) => {
        e.preventDefault();

        const sensorActualizado = {
            tipo_sensor: document.getElementById('tipo_sensor').value,
            nombre_sensor: document.getElementById('nombre_sensor').value,
            identificador: document.getElementById('identificador').value,
            referencia_sensor: document.getElementById('referencia_sensor').value,
            unidad_medida: document.getElementById('unidad_medida').value,
            tiempo_escaneo: document.getElementById('tiempo_escaneo').value,
            estado: document.getElementById('estado').value,
            descripcion: document.getElementById('descripcion').value,
        };

        try {
            const res = await fetch(`http://localhost:3000/sensores/${id}`, { // Ensure this endpoint is correct
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sensorActualizado)
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || `Error al actualizar: ${res.status}`);
            }
            alert('Sensor actualizado correctamente');
            window.location.href = 'visualizar-sensor.html'; // Or back to the list
        } catch (error) {
            console.error('Error al actualizar sensor:', error);
            alert(`No se pudo actualizar el sensor: ${error.message}`);
        }
    });
});