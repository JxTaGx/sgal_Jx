document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("register-form");
    const btnVolver = document.getElementById('btn-volver-registro');
    const submitButton = document.querySelector('.register__button--submit');
    const token = localStorage.getItem('token');

    // --- Lógica del botón Volver ---
    if (btnVolver) {
        btnVolver.addEventListener('click', () => {
            const urlParams = new URLSearchParams(window.location.search);
            const origin = urlParams.get('origin');
            
            if (origin === 'produccion') {
                window.location.href = '../views/integracion.html';
            } else {
                window.location.href = '../views/lista-usuario.html';
            }
        });
    }

    // Si no hay formulario, no continuar
    if (!form) {
        return;
    }

    // --- Lógica de envío del formulario ---
    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        // Verificar que el usuario que está creando es un admin logueado
        if (!token) {
            alert("Acción no autorizada. Debes ser un administrador para crear usuarios.");
            window.location.href = 'login.html';
            return;
        }

        submitButton.disabled = true;
        submitButton.textContent = 'Registrando...';

        const formData = {
            documentType: form.documentType.value,
            documentNumber: form.documentNumber.value,
            userType: form.userType.value,
            firstName: form.firstName.value,
            lastName: form.lastName.value,
            phone: form.phone.value,
            email: form.email.value,
            confirmEmail: form.confirmEmail.value,
            password: form.password.value
        };
        
        // Validación simple de campos
        if (formData.email !== formData.confirmEmail) {
            alert("Los correos electrónicos no coinciden.");
            submitButton.disabled = false;
            submitButton.textContent = 'Registrarse';
            return;
        }

        try {
            const response = await fetch("http://localhost:3000/user", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}` // **AQUÍ ESTÁ LA CORRECCIÓN CLAVE**
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || `Error ${response.status}`);
            }

            alert("Usuario registrado con éxito");

            const urlParams = new URLSearchParams(window.location.search);
            const origin = urlParams.get('origin');
            if (origin === 'produccion') {
                window.location.href = '../views/integracion.html';
            } else {
                window.location.href = '../views/lista-usuario.html';
            }

        } catch (error) {
            console.error("Error:", error);
            alert(`Error al registrar: ${error.message}`);
            submitButton.disabled = false;
            submitButton.textContent = 'Registrarse';
        }
    });
});