document.addEventListener("DOMContentLoaded", function () {
    const inputsNumeros = document.querySelectorAll(".verification__input");
    const newPasswordInput = document.getElementById("newPassword");
    const confirmPasswordInput = document.getElementById("confirmPassword");
    const verificarButton = document.querySelector(".verification__button--verify");
    
    const mensajeDiv = document.createElement("div");
    mensajeDiv.id = "mensaje";
    mensajeDiv.style.display = "none";
    mensajeDiv.style.padding = "10px";
    mensajeDiv.style.borderRadius = "5px";
    mensajeDiv.style.marginTop = "10px";
    mensajeDiv.style.textAlign = "center";
    mensajeDiv.style.position = "relative";
    mensajeDiv.style.zIndex = "3";
    document.querySelector(".verification__form-container").appendChild(mensajeDiv);
    
    inputsNumeros.forEach((input, index) => {
        input.addEventListener("keydown", function (e) {
            if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && 
                (e.keyCode < 96 || e.keyCode > 105) &&
                e.keyCode !== 8 && e.keyCode !== 9 && e.keyCode !== 37 && e.keyCode !== 39) {
                e.preventDefault();
                mostrarError("Solo se permiten números.");
            }
        });
        
        input.addEventListener("input", function() {
            if (this.value.length === 1 && index < inputsNumeros.length - 1) {
                inputsNumeros[index + 1].focus();
            }
        });
    });
    
    verificarButton.addEventListener("click", async function () {
        let codigo = "";
        inputsNumeros.forEach(input => {
            codigo += input.value.trim();
        });

        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        const storedCode = localStorage.getItem('recoveryCode');
        const email = localStorage.getItem('recoveryEmail');

        if (codigo.length !== 6) {
            mostrarError("El código debe tener 6 dígitos.");
            return;
        }
        if (codigo !== storedCode) {
            mostrarError("El código de verificación es incorrecto.");
            return;
        }
        if (newPassword.length < 8) {
            mostrarError("La nueva contraseña debe tener al menos 8 caracteres.");
            return;
        }
        if (newPassword !== confirmPassword) {
            mostrarError("Las contraseñas no coinciden.");
            return;
        }

        try {
            const response = await fetch("http://localhost:3000/auth/reset-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, newPassword })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "No se pudo cambiar la contraseña.");
            }

            mostrarMensaje("Contraseña actualizada con éxito.", true);
            
            // Limpiar localStorage y redirigir
            localStorage.removeItem('recoveryEmail');
            localStorage.removeItem('recoveryCode');
            setTimeout(() => {
                window.location.href = "completerecover.html";
            }, 2000);

        } catch (error) {
            console.error("Error al resetear contraseña:", error);
            mostrarError(`Error: ${error.message}`);
        }
    });
    
    function mostrarError(mensaje) {
        mostrarMensaje(mensaje, false);
    }
    
    function mostrarMensaje(mensaje, esExito) {
        mensajeDiv.textContent = mensaje;
        
        if (esExito) {
            mensajeDiv.style.color = "#008000";
            mensajeDiv.style.backgroundColor = "#eeffee";
        } else {
            mensajeDiv.style.color = "#FDC300";
            mensajeDiv.style.backgroundColor = "#ffeeee";
        }
        
        mensajeDiv.style.display = "block";
        
        if (!esExito) {
            setTimeout(() => {
                mensajeDiv.style.display = "none";
            }, 4000);
        }
    }
});