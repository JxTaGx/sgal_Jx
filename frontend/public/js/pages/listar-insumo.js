document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token'); 

    if (!token) {
        alert('No estás autenticado. Redirigiendo al login.');
        window.location.href = 'login.html';
        return;
    }

    fetch('http://localhost:3000/insumo', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => { throw new Error(err.error || 'Error al cargar los insumos.'); });
        }
        return response.json();
    })
    .then(result => {
        const cardsContainer = document.getElementById('cards');
        cardsContainer.innerHTML = '';

        const insumos = result.data || [];

        if (insumos.length === 0) {
            cardsContainer.innerHTML = '<p>No se encontraron insumos.</p>';
            return;
        }

        insumos.forEach(insumo => {
            const card = document.createElement('div');
            card.classList.add('card');
            card.innerHTML = `
                <h3 class="card__title">${insumo.nombre_insumo}</h3>
                <p class="card__info">ID: ${insumo.id_insumo}</p>
                <p class="card__info">Cantidad: ${insumo.cantidad}</p>
                <p class="card__info">Precio: $${insumo.valor_unitario}</p>
                <input type="submit" class="card__button" value="Ver detalles" onclick="visualizarInsumo(${insumo.id})">
            `;
            cardsContainer.appendChild(card);
        });
    })
    .catch(error => {
        console.error('Error al listar insumos:', error);
        document.getElementById('cards').innerHTML = `<p style="color:red;">${error.message}</p>`;
    });
});

function visualizarInsumo(id) {
    localStorage.setItem('idInsumo', id);
    window.location.href = 'visualizar-insumo.html';
}