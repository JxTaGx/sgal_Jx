document.addEventListener('DOMContentLoaded', function() {
    fetch('http://localhost:3000/insumos') // Ajusta esta URL si tu endpoint es diferente
        .then(response => response.json())
        .then(data => {
            const cardsContainer = document.getElementById('cards');
            cardsContainer.innerHTML = '';

            data.forEach(insumo => {
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
        });
});

function visualizarInsumo(id) {
    localStorage.setItem('idInsumo', id);
    window.location.href = 'visualizar-insumo.html';
}