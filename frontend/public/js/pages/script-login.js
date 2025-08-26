document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.getElementById("login-form");
    const emailInput = document.querySelector(".login__input--username");
    const passwordInput = document.querySelector(".login__input--password");
    const errorMessageDiv = document.querySelector(".error-message");

    loginForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        errorMessageDiv.style.display = 'none'; // Ocultar errores previos

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        if (email === "" || password === "") {
            showError("Por favor, ingrese correo y contraseña.");
            return;
        }

        try {
            const response = await fetch("http://localhost:3000/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, password })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || `Error ${response.status}`);
            }

            // Guardar el token y la información del usuario en localStorage
            localStorage.setItem('token', result.token);
            localStorage.setItem('user', JSON.stringify(result.user));

            // Redirigir a la página de inicio
            window.location.href = 'home.html';

        } catch (error) {
            console.error("Error de login:", error);
            showError(error.message);
        }
    });

    function showError(message) {
        errorMessageDiv.textContent = message;
        errorMessageDiv.style.display = 'block';
    }
});