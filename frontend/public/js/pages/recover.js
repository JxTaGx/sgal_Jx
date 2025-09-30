document.addEventListener("DOMContentLoaded", function() {
    const recoverForm = document.getElementById("recover-form");

    recoverForm.addEventListener("submit", async function(e) {
        e.preventDefault();
        const email = document.getElementById("email").value.trim();

        if (!email) {
            alert("Por favor, ingrese su correo electrónico.");
            return;
        }

        try {
            const response = await fetch("http://localhost:3000/auth/forgot-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Error al solicitar la recuperación de contraseña.");
            }

            // Almacenar el correo y el código de recuperación para el siguiente paso
            localStorage.setItem('recoveryEmail', email);
            localStorage.setItem('recoveryCode', result.recoveryCode); 

            alert(result.message);
            window.location.href = 'code.html';

        } catch (error) {
            console.error("Error en la recuperación:", error);
            alert(`Error: ${error.message}`);
        }
    });
});