document.addEventListener('DOMContentLoaded', async () => {
    const contenedor = document.getElementById('usuarios-lista');
    const searchInput = document.getElementById('search-input');
    const token = localStorage.getItem('token');
    let allUsers = [];

    if (!token) {
        alert('Acceso denegado. Por favor, inicie sesión.');
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/user', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al obtener los usuarios');
        }

        const result = await response.json();
        allUsers = result.data || [];
        renderUsers(allUsers);

    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        contenedor.innerHTML = `<tr><td colspan="9" style="color:red;">Error: ${error.message}</td></tr>`;
    }

    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredUsers = allUsers.filter(user => {
            return user.firstName.toLowerCase().includes(searchTerm) ||
                   user.lastName.toLowerCase().includes(searchTerm) ||
                   user.email.toLowerCase().includes(searchTerm) ||
                   user.documentNumber.toLowerCase().includes(searchTerm);
        });
        renderUsers(filteredUsers);
    });

    function renderUsers(users) {
        contenedor.innerHTML = '';
        if (users.length === 0) {
            contenedor.innerHTML = '<tr><td colspan="9">No se encontraron usuarios.</td></tr>';
            return;
        }

        users.forEach(usuario => {
            const isActive = Math.random() > 0.5; // Simulación de estado activo/inactivo
            const fila = document.createElement('tr');
            fila.classList.add('sensor__table-row');
            fila.innerHTML = `
                <td>${usuario.id}</td>
                <td>${usuario.documentType}</td>
                <td>${usuario.documentNumber}</td>
                <td>${usuario.firstName} ${usuario.lastName || ''}</td>
                <td>${usuario.email}</td>
                <td>${usuario.phone}</td>
                <td>${usuario.userType}</td>
                <td>
                    <svg class="users__icon-check" width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <path d="M6 8L9 11L17 3" stroke="${isActive ? '#313131' : '#CCCCCC'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M17 9V15C17 15.5304 16.7893 16.0391 16.4142 16.4142C16.0391 16.7893 15.5304 17 15 17H3C2.46957 17 1.96086 16.7893 1.58579 16.4142C1.21071 16.0391 1 15.5304 1 15V3C1 2.46957 1.21071 1.96086 1.58579 1.58579C1.96086 1.21071 2.46957 1 3 1H12" stroke="${isActive ? '#313131' : '#CCCCCC'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </td>
                <td>
                    <button onclick="window.location.href='/frontend/public/views/editar-perfil.html?id=${usuario.id}'" type="button" class="sensor__button sensor__button--blue">Editar</button>
                </td>
            `;
            contenedor.appendChild(fila);
        });
    }
});