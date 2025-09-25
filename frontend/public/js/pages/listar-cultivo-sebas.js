document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Acceso denegado. Por favor, inicie sesión.');
        window.location.href = 'login.html';
        return;
    }

    fetch('http://localhost:3000/cultivo/s', { // La ruta correcta es /cultivo/s según tus archivos de rutas
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => { throw new Error(err.error || 'Error al cargar cultivos'); });
        }
        return response.json();
    })
    .then(result => {
        const data = result.data || [];
        const cardsContainer = document.getElementById('cards');
        cardsContainer.innerHTML = '';

        if (data.length === 0) {
            cardsContainer.innerHTML = '<p>No se encontraron cultivos.</p>';
            return;
        }

        data.forEach(cultivo => {
            const id = cultivo.id_cultivo || cultivo.id;
            const card = document.createElement('div');
            card.classList.add('card');
            card.innerHTML = `
                <h3 class="card__title">${cultivo.nombre_cultivo}</h3>
                <p class="card__info">Tipo: ${cultivo.tipo_cultivo}</p>
                <p class="card__info">Ubicación: ${cultivo.ubicacion}</p>
                <p class="card__info">Estado: ${cultivo.estado}</p>
                <input type="submit" class="card__button" value="Ver detalles" onclick="visualizarCultivo('${id}')">
            `;
            cardsContainer.appendChild(card);
        });
    })
    .catch(error => {
        console.error('Error al listar cultivos:', error);
        const cardsContainer = document.getElementById('cards');
        cardsContainer.innerHTML = `<p style="color:red;">${error.message}</p>`;
    });
});

function visualizarCultivo(id) {
    localStorage.setItem('idCultivo', id);
    window.location.href = 'visualizar-cultivo.html';
}