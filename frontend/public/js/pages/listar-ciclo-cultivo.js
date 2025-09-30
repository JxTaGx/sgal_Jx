document.addEventListener('DOMContentLoaded', function () {
  const token = localStorage.getItem('token');
  const searchInput = document.querySelector('.header__search');
  let allCiclos = [];

  if (!token) {
      alert('Acceso denegado. Por favor, inicie sesión.');
      window.location.href = 'login.html';
      return;
  }

  fetch('http://localhost:3000/ciclo-cultivo', {
      headers: {
          'Authorization': `Bearer ${token}`
      }
  })
  .then(response => {
      if (!response.ok) {
          return response.json().then(err => { throw new Error(err.error || 'Error al cargar los ciclos de cultivo'); });
      }
      return response.json();
  })
  .then(result => {
      allCiclos = result.data || [];
      renderCiclos(allCiclos);
  })
  .catch(error => {
      console.error('Error al listar ciclos de cultivo:', error);
      document.getElementById('cards').innerHTML = `<p style="color:red;">${error.message}</p>`;
  });

  searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filteredCiclos = allCiclos.filter(ciclo => {
        return ciclo.nombre_ciclo.toLowerCase().includes(searchTerm) ||
               ciclo.periodo_siembra.toLowerCase().includes(searchTerm);
    });
    renderCiclos(filteredCiclos);
  });

  function renderCiclos(ciclos) {
    const cardsContainer = document.getElementById('cards');
    cardsContainer.innerHTML = '';

    if (ciclos.length === 0) {
        cardsContainer.innerHTML = '<p>No se encontraron ciclos de cultivo.</p>';
        return;
    }

    ciclos.forEach(ciclo => {
        const card = document.createElement('div');
        card.classList.add('card');
        const idCiclo = ciclo.id_ciclo;

        card.innerHTML = `
            <h3 class="card__title">${ciclo.nombre_ciclo || 'Sin nombre'}</h3>
            <p class="card__info">ID: ${idCiclo}</p>
            <p class="card__info">Estado: ${ciclo.estado || 'Sin estado'}</p>
            <p class="card__info">Periodo de siembra: ${ciclo.periodo_siembra || 'No definido'}</p>
            <button class="card__button" data-id="${idCiclo}">Ver detalles</button>
        `;

        const button = card.querySelector('.card__button');
        button.addEventListener('click', () => {
            localStorage.setItem('idCicloCultivo', idCiclo);
            window.location.href = 'visualizar-ciclo-cultivo.html';
        });

        cardsContainer.appendChild(card);
    });
  }
});