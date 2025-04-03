document.addEventListener("DOMContentLoaded", function () {
    const usuarioInput = document.querySelector(".login__input--username");
    const contrasenaInput = document.querySelector(".login__input--password");
    const loginButton = document.querySelector(".login__button");
    const submitLink = document.querySelector(".login__submit-link");
    
    // Crear elemento de alerta si no existe
    function crearElementoAlerta() {
        if (!document.querySelector(".mensaje-alerta")) {
            const alertaDiv = document.createElement("div");
            alertaDiv.className = "mensaje-alerta";
            alertaDiv.style.display = "none";
            alertaDiv.style.fontSize = "14px";
            alertaDiv.style.padding = "5px 10px";
            alertaDiv.style.borderRadius = "3px";
            alertaDiv.style.position = "relative";
            alertaDiv.style.top = "10px";
            alertaDiv.style.right = "0px";
            alertaDiv.style.maxWidth = "250px";
            document.querySelector(".login__form").appendChild(alertaDiv);
        }
    }
    
    // Crear el elemento de alerta al cargar
    crearElementoAlerta();
    
    // Cambiar el color de borde en los inputs cuando hay error
    function marcarCampoError(elemento, hayError) {
        if (hayError) {
            elemento.style.borderColor = "#ff3860";
        } else {
            elemento.style.borderColor = "";
        }
    }
    
    // Validar campo específico
    function validarCampo(elemento) {
        const valor = elemento.value.trim();
        if (valor === "") {
            marcarCampoError(elemento, true);
            return false;
        } else {
            marcarCampoError(elemento, false);
            return true;
        }
    }
    
    // Validar todos los campos
    function validarFormulario() {
        let esValido = true;
        
        if (!validarCampo(usuarioInput)) {
            mostrarAlerta("Ingrese un usuario", "error");
            esValido = false;
        }
        
        if (!validarCampo(contrasenaInput)) {
            mostrarAlerta("Ingrese una contraseña", "error");
            esValido = false;
        }
        
        return esValido;
    }
    
    // Evitar números en el campo de usuario
    usuarioInput.addEventListener("keydown", function (e) {
        if (e.key >= "0" && e.key <= "9") {
            e.preventDefault();
            mostrarAlerta("No se permiten números", "error");
            marcarCampoError(usuarioInput, true);
        }
    });
    
    // Quitar alerta visual cuando el usuario empieza a escribir
    usuarioInput.addEventListener("input", function() {
        if (usuarioInput.value.trim() !== "") {
            marcarCampoError(usuarioInput, false);
        }
    });
    
    contrasenaInput.addEventListener("input", function() {
        if (contrasenaInput.value.trim() !== "") {
            marcarCampoError(contrasenaInput, false);
        }
    });
    
    // Interceptar el clic en el botón
    loginButton.addEventListener("click", function (e) {
        if (!validarFormulario()) {
            e.preventDefault();
            return false;
        }
        
        // Si la validación es exitosa, mostrar mensaje breve
        mostrarAlerta("Iniciando sesión...", "exito");
    });
    
    // También prevenir la navegación del enlace si hay error
    submitLink.addEventListener("click", function (e) {
        if (!validarFormulario()) {
            e.preventDefault();
            return false;
        }
    });
    
    function mostrarAlerta(mensaje, tipo) {
        const alertaElement = document.querySelector(".mensaje-alerta");
        alertaElement.textContent = mensaje;
        alertaElement.style.display = "block";
        
        if (tipo === "error") {
            alertaElement.style.backgroundColor = "#ff3860";
        } else {
            alertaElement.style.backgroundColor = "#23d160";
        }
        alertaElement.style.color = "white";
        
        // Auto-ocultar después de 3 segundos
        setTimeout(() => {
            alertaElement.style.display = "none";
        }, 3000);
    }
});