document.addEventListener('DOMContentLoaded', function () {
  fetch('http://localhost:3000/ciclo_cultivo')
      .then(response => response.json())
      .then(data => {
          const cardsContainer = document.getElementById('cards');
          cardsContainer.innerHTML = '';

          data.forEach(ciclo => {
              const card = document.createElement('div');
              card.classList.add('card');

              // Usamos id_ciclo correctamente
              const idCiclo = ciclo.id_ciclo;

              card.innerHTML = `
                  <h3 class="card__title">${ciclo.nombre_ciclo || 'Sin nombre'}</h3>
                  <p class="card__info">ID: ${idCiclo}</p>
                  <p class="card__info">Estado: ${ciclo.estado || 'Sin estado'}</p>
                  <p class="card__info">Periodo de siembra: ${ciclo.periodo_siembra}</p>
                  <button class="card__button" data-id="${idCiclo}">Ver detalles</button>
              `;

              // Agregamos evento al botón luego de insertarlo
              const button = card.querySelector('.card__button');
              button.addEventListener('click', () => {
                  localStorage.setItem('idCicloCultivo', idCiclo);
                  window.location.href = 'visualizar-ciclo-cultivo.html';
              });

              cardsContainer.appendChild(card);
          });
      })
      .catch(error => {
          console.error('Error al listar ciclos de cultivo:', error);
      });
});