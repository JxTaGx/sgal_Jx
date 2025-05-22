document.addEventListener('DOMContentLoaded', function() {
    fetch('http://localhost:3000/cultivos')
        .then(response => response.json())
        .then(data => {
            const cardsContainer = document.getElementById('cards');
            cardsContainer.innerHTML = '';

            data.forEach(cultivo => {
                console.log(cultivo); 

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
        });
});

function visualizarCultivo(id) {
    localStorage.setItem('idCultivo', id);
    window.location.href = 'visualizar-cultivo.html';
}

function editarCultivo(id) {
    localStorage.setItem('idCultivo', id);
    window.location.href = 'actualizar-cultivo.html';
}