document.addEventListener("DOMContentLoaded", async () => {
    const form = document.querySelector(".cultivo-form");
    const idCicloInput = form.querySelector('#idCiclo');
    const nombreCicloInput = form.querySelector('#nombreCiclo');
    const periodoSiembraInput = form.querySelector('#periodoSiembra');
    const novedadesInput = form.querySelector('#novedades');
    const descripcionInput = form.querySelector('#descripcion');
    const estadoInput = form.querySelector('#estado'); // <-- Nueva variable para el estado

    const idCiclo = localStorage.getItem('idCicloCultivo');
    const token = localStorage.getItem('token');

    if (!token) {
        alert('Acceso denegado. Por favor, inicie sesión.');
        window.location.href = 'login.html';
        return;
    }

    if (!idCiclo) {
        alert("No se encontró el ID del ciclo para editar.");
        window.location.href = 'listar-ciclo-cultivo-sebas.html';
        return;
    }

    try {
        const res = await fetch(`http://localhost:3000/ciclo-cultivo/${idCiclo}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'No se pudieron cargar los datos del ciclo.');
        }
        
        const result = await res.json();
        const ciclo = result.data;

        if (ciclo) {
            idCicloInput.value = ciclo.id_ciclo;
            nombreCicloInput.value = ciclo.nombre_ciclo;
            periodoSiembraInput.value = ciclo.periodo_siembra;
            novedadesInput.value = ciclo.novedades || '';
            descripcionInput.value = ciclo.descripcion || '';
            estadoInput.value = ciclo.estado || 'pendiente'; // <-- Asigna el valor del estado
        } else {
             throw new Error('La respuesta del servidor no contenía datos del ciclo.');
        }
    } catch (error) {
        alert("Error al cargar los datos del ciclo: " + error.message);
        console.error(error);
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        if (!nombreCicloInput.value.trim() || !periodoSiembraInput.value.trim()) {
            alert("Nombre del ciclo y periodo de siembra son obligatorios.");
            return;
        }

        const datosActualizados = {
            nombre_ciclo: nombreCicloInput.value,
            periodo_siembra: periodoSiembraInput.value,
            novedades: novedadesInput.value,
            descripcion: descripcionInput.value,
            estado: estadoInput.value, // <-- Envía el nuevo valor del estado
        };

        try {
            const respuesta = await fetch(`http://localhost:3000/ciclo-cultivo/${idCiclo}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(datosActualizados),
            });

            if (respuesta.ok) {
                alert("Ciclo actualizado correctamente.");
                // Limpia el ID de localStorage y redirige a la lista
                localStorage.removeItem('idCicloCultivo');
                window.location.href = "listar-ciclo-cultivo-sebas.html";
            } else {
                const errorData = await respuesta.json();
                alert("Error al actualizar el ciclo: " + (errorData.error || respuesta.statusText));
            }
        } catch (error) {
            alert("Error al enviar la solicitud: " + error.message);
            console.error(error);
        }
    });
});