document.addEventListener('DOMContentLoaded', async () => {
    const id = localStorage.getItem('idCicloCultivo');
    const token = localStorage.getItem('token');

    if (!token) {
        alert('Acceso denegado. Por favor, inicie sesión.');
        window.location.href = 'login.html';
        return;
    }

    if (!id) {
        alert('ID de ciclo no encontrado. Volviendo a la lista.');
        window.location.href = 'listar-ciclo-cultivo-sebas.html';
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/ciclo-cultivo/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'No se pudo obtener el ciclo de cultivo.');
        }

        const result = await response.json();
        const ciclo = result.data;

        if (!ciclo) {
            throw new Error("No se recibieron datos del ciclo.");
        }

        const lista = document.getElementById('detalle-ciclo');
        lista.innerHTML = `
            <li class="ciclo-cultivo__list-item"><strong>Ciclo Cultivo:</strong> ${ciclo.nombre_ciclo || 'N/A'}</li>
            <li class="ciclo-cultivo__list-item"><strong>Fecha de siembra:</strong> ${ciclo.periodo_siembra || 'N/A'}</li>
            <li class="ciclo-cultivo__list-item"><strong>ID:</strong> ${ciclo.id_ciclo || 'N/A'}</li>
            <li class="ciclo-cultivo__list-item"><strong>Novedades:</strong> ${ciclo.novedades || 'No hay novedades'}</li>
            <li class="ciclo-cultivo__list-item"><strong>Descripción:</strong> ${ciclo.descripcion || 'Sin descripción'}</li>
        `;
        
        // Simulación de tareas
        const rendimientoLista = document.getElementById('rendimiento-lista');
        rendimientoLista.innerHTML = `<li class="ciclo-cultivo__list-item">Monitoreo de crecimiento: Normal</li>`;

        const botonEditar = document.getElementById('editar-btn');
        if (botonEditar) {
            botonEditar.addEventListener('click', () => {
                // No necesitamos pasar el ID por URL si lo tenemos en localStorage
                localStorage.setItem('idCicloCultivo', ciclo.id_ciclo);
                window.location.href = `actualizar-ciclo-cultivo.html`;
            });
        }
    } catch (err) {
        console.error(err);
        alert(`Error: ${err.message}`);
        // Opcional: mostrar el error en la página
        const mainContent = document.querySelector('.ciclo-cultivo__main');
        if (mainContent) {
            mainContent.innerHTML = `<p style="color:red; text-align:center;">${err.message}</p>`;
        }
    }
});