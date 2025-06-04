document.addEventListener('DOMContentLoaded', async () => {
    const contenedor = document.getElementById('usuarios-lista');

    try {
        const response = await fetch('http://localhost:3000/user'); // Cambia si usas otra URL
        const usuarios = await response.json();

        usuarios.forEach(usuario => {
            const fila = document.createElement('tr');
            fila.classList.add('sensor__table-row');
            fila.innerHTML = `
                <td>${usuario.id}</td>
                <td>${usuario.documentType}</td>
                <td>${usuario.documentNumber}</td>
                <td>${usuario.firstName}</td>
                <td>${usuario.email}</td>
                <td>${usuario.phone}</td>
                <td>${usuario.userType}</td>
                <td>
                    <svg class="users__icon-check" width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <path d="M6 8L9 11L17 3" stroke="#313131" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M17 9V15C17 15.5304 16.7893 16.0391 16.4142 16.4142C16.0391 16.7893 15.5304 17 15 17H3C2.46957 17 1.96086 16.7893 1.58579 16.4142C1.21071 16.0391 1 15.5304 1 15V3C1 2.46957 1.21071 1.96086 1.58579 1.58579C1.96086 1.21071 2.46957 1 3 1H12" stroke="#313131" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </td>
                <td>
                    <button onclick="window.location.href='/frontend/public/views/editar-perfil.html?id=${usuario.id}'" type="submit" class="sensor__button sensor__button--blue">Editar</button>
                </td>
            `;
            contenedor.appendChild(fila);
        });

    } catch (error) {
        console.error('Error al obtener usuarios:', error);
    }
});