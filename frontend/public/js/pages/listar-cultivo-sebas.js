document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    const searchInput = document.querySelector('.header__search');
    let allCultivos = [];

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
        allCultivos = result.data || [];
        renderCultivos(allCultivos);
    })
    .catch(error => {
        console.error('Error al listar cultivos:', error);
        const cardsContainer = document.getElementById('cards');
        cardsContainer.innerHTML = `<p style="color:red;">${error.message}</p>`;
    });

    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredCultivos = allCultivos.filter(cultivo => {
            return cultivo.nombre_cultivo.toLowerCase().includes(searchTerm) ||
                   cultivo.tipo_cultivo.toLowerCase().includes(searchTerm) ||
                   cultivo.ubicacion.toLowerCase().includes(searchTerm);
        });
        renderCultivos(filteredCultivos);
    });

    function renderCultivos(cultivos) {
        const cardsContainer = document.getElementById('cards');
        cardsContainer.innerHTML = '';

        if (cultivos.length === 0) {
            cardsContainer.innerHTML = '<p>No se encontraron cultivos.</p>';
            return;
        }

        cultivos.forEach(cultivo => {
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
    }
});

function visualizarCultivo(id) {
    localStorage.setItem('idCultivo', id);
    window.location.href = 'visualizar-cultivo.html';
}