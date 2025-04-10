document.addEventListener("DOMContentLoaded", function () {
    const inputsNumeros = document.querySelectorAll(".verification__input");
    const verificarButton = document.querySelector(".verification__button--verify");
    
    // Crear el elemento para mostrar mensajes (errores y éxito)
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
    
    // Agregar listeners a cada campo de entrada para solo permitir números
    inputsNumeros.forEach((input, index) => {
        input.addEventListener("keydown", function (e) {
            if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && 
                (e.keyCode < 96 || e.keyCode > 105) &&
                e.keyCode !== 8 && e.keyCode !== 9 && e.keyCode !== 37 && e.keyCode !== 39) {
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
            // Mostrar mensaje de éxito
            mostrarMensaje("Verificación exitosa", true);
            
            // Redirigir al home después de un breve retraso
            setTimeout(() => {
                window.location.href = "home.html"; // Cambia esta URL a la ruta de tu página de inicio
            }, 2000); // 2 segundos de espera para que el usuario vea el mensaje
            
            console.log("Código enviado:", codigo);
        }
    });
    
    function mostrarError(mensaje) {
        mostrarMensaje(mensaje, false);
    }
    
    function mostrarMensaje(mensaje, esExito) {
        const mensajeElement = document.getElementById("mensaje");
        mensajeElement.textContent = mensaje;
        
        // Establecer estilo según tipo de mensaje
        if (esExito) {
            mensajeElement.style.color = "#008000";
            mensajeElement.style.backgroundColor = "#eeffee";
        } else {
            mensajeElement.style.color = "#FDC300";
            mensajeElement.style.backgroundColor = "#ffeeee";
        }
        
        mensajeElement.style.display = "block";
        
        // Solo desaparece automáticamente los mensajes de error
        if (!esExito) {
            setTimeout(() => {
                mensajeElement.style.display = "none";
            }, 4000);
        }
    }
});