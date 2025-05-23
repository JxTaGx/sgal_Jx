// Esperar a que el DOM esté completamente cargado
document.addEventListener("DOMContentLoaded", async () => {
    // Obtener referencias a elementos del formulario
    const form = document.querySelector(".cultivo-form");
    const idCicloInput = form.querySelector('#idCiclo'); // Changed to querySelector
    const nombreCicloInput = form.querySelector('#nombreCiclo'); // Changed to querySelector
    const periodoSiembraInput = form.querySelector('#periodoSiembra'); // Changed to querySelector
    const novedadesInput = form.querySelector('#novedades'); // Changed to querySelector
    const descripcionInput = form.querySelector('#descripcion'); // Changed to querySelector
    // const saveButton = form.querySelector(".cultivo-form__btn--save"); // Not strictly needed if using form submit
    // const cancelButton = form.querySelector(".cultivo-form__btn--cancel"); // Is an <a> tag

    const params = new URLSearchParams(window.location.search);
    const idCiclo = params.get("id");

    if (!idCiclo) {
        alert("No se encontró el ID del ciclo.");
        return;
    }

    // 1. Cargar los datos reales
    try {
        const res = await fetch(`http://localhost:3000/ciclo_cultivo/${idCiclo}`);
        const ciclo = await res.json();

        if (res.ok && ciclo) {
            idCicloInput.value = ciclo.id_ciclo;
            nombreCicloInput.value = ciclo.nombre_ciclo;
            periodoSiembraInput.value = ciclo.periodo_siembra;
            novedadesInput.value = ciclo.novedades || '';
            descripcionInput.value = ciclo.descripcion || '';
        } else {
             throw new Error(ciclo.message || 'No se pudieron cargar los datos del ciclo.');
        }
    } catch (error) {
        alert("Error al cargar los datos del ciclo: " + error.message);
        console.error(error);
    }

    // 2. Actualizar al enviar el formulario
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        // Basic client-side validation (can be expanded)
        if (!nombreCicloInput.value.trim() || !periodoSiembraInput.value.trim()) {
            alert("Nombre del ciclo y periodo de siembra son obligatorios.");
            return;
        }

        const datosActualizados = {
            nombre_ciclo: nombreCicloInput.value,
            periodo_siembra: periodoSiembraInput.value,
            novedades: novedadesInput.value,
            descripcion: descripcionInput.value
        };

        try {
            const respuesta = await fetch(`http://localhost:3000/ciclo_cultivo/${idCiclo}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(datosActualizados),
            });

            if (respuesta.ok) {
                alert("Ciclo actualizado correctamente.");
                // Store ID in localStorage before redirecting to visualize the updated cycle
                localStorage.setItem('idCicloCultivo', idCiclo);
                window.location.href = "visualizar-ciclo-cultivo.html";
            } else {
                const errorData = await respuesta.json();
                alert("Error al actualizar el ciclo: " + (errorData.message || respuesta.statusText));
            }
        } catch (error) {
            alert("Error al enviar la solicitud: " + error.message);
            console.error(error);
        }
    });
});