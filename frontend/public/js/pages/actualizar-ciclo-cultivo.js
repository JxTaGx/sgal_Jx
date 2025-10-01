document.addEventListener("DOMContentLoaded", async () => {
    const form = document.querySelector(".cultivo-form");
    const idCicloInput = form.querySelector('#idCiclo');
    const nombreCicloInput = form.querySelector('#nombreCiclo');
    const periodoSiembraInput = form.querySelector('#periodoSiembra');
    const novedadesInput = form.querySelector('#novedades');
    const descripcionInput = form.querySelector('#descripcion');
    const estadoInput = form.querySelector('#estado');
    const imagePlaceholder = document.getElementById('image-placeholder');


    const idCiclo = localStorage.getItem('idCicloCultivo');
    const token = localStorage.getItem('token');

    // --- VALIDACIONES ---
    // Función para validar que los campos no estén vacíos
    const validateForm = () => {
        let isValid = true;
        [nombreCicloInput, periodoSiembraInput, novedadesInput, descripcionInput, estadoInput].forEach(input => {
            if (!input.value.trim()) {
                isValid = false;
            }
        });
        return isValid;
    };
    // --- FIN DE VALIDACIONES ---

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
            estadoInput.value = ciclo.estado || 'pendiente';

            if (ciclo.ruta_fotografia) {
                imagePlaceholder.innerHTML = `<img src="http://localhost:3000${ciclo.ruta_fotografia}" alt="Imagen del Ciclo de Cultivo" style="max-width: 100%; height: auto;">`;
            } else {
                imagePlaceholder.innerHTML = '<p>No hay imagen disponible</p>';
            }

        } else {
             throw new Error('La respuesta del servidor no contenía datos del ciclo.');
        }
    } catch (error) {
        alert("Error al cargar los datos del ciclo: " + error.message);
        console.error(error);
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        // Validar el formulario antes de enviar
        if (!validateForm()) {
            alert('Por favor, complete todos los campos antes de guardar.');
            return;
        }

        const datosActualizados = {
            nombre_ciclo: nombreCicloInput.value,
            periodo_siembra: periodoSiembraInput.value,
            novedades: novedadesInput.value,
            descripcion: descripcionInput.value,
            estado: estadoInput.value,
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