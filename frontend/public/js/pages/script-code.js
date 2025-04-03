document.addEventListener("DOMContentLoaded", function () {
    const inputsNumeros = document.querySelectorAll(".verification__input");
    const verificarButton = document.querySelector(".verification__button--verify");
    
    // Crear el elemento para mostrar mensajes de error (similar al script original)
    const errorDiv = document.createElement("div");
    errorDiv.id = "error-message";
    errorDiv.style.display = "none";
    errorDiv.style.color = "#ff0000";
    errorDiv.style.backgroundColor = "#ffeeee";
    errorDiv.style.padding = "10px";
    errorDiv.style.borderRadius = "5px";
    errorDiv.style.marginTop = "10px";
    errorDiv.style.textAlign = "center";
    errorDiv.style.position = "relative";
    errorDiv.style.zIndex = "3";
    document.querySelector(".verification__form-container").appendChild(errorDiv);
    
    // Agregar listeners a cada campo de entrada para solo permitir números
    inputsNumeros.forEach((input, index) => {
        input.addEventListener("keydown", function (e) {

            if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && 
                (e.keyCode < 96 || e.keyCode > 105)) {
                e.preventDefault();
                mostrarError("Solo se permiten números en este campo");
            }
        });
        
        // Mover al siguiente input después de ingresar un dígito
        input.addEventListener("input", function() {
            if (this.value.length === 1 && index < inputsNumeros.length - 1) {
                inputsNumeros[index + 1].focus();
            }
        });
    });
    
    verificarButton.addEventListener("click", function () {
        let todosLlenos = true;
        let codigo = "";
        
        inputsNumeros.forEach(input => {
            if (input.value.trim() === "") {
                todosLlenos = false;
            }
            codigo += input.value;
        });
        
        if (!todosLlenos) {
            mostrarError("Todos los campos del código deben estar llenos");
        } else {
            console.log("Código enviado:", codigo);
        }
    });
    
    function mostrarError(mensaje) {
        const errorMessage = document.getElementById("error-message");
        errorMessage.textContent = mensaje;
        errorMessage.style.display = "block";
        
        setTimeout(() => {
            errorMessage.style.display = "none";
        }, 4000);
    }
});