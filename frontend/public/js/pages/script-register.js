document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector(".register__container");

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const formData = {
            documentType: document.querySelector("select[name='documentType']").value,
            documentNumber: document.querySelector("input[name='documentNumber']").value,
            userType: document.querySelector("input[name='userType']").value,
            firstName: document.querySelector("input[name='firstName']").value,
            lastName: document.querySelector("input[name='lastName']").value,
            phone: document.querySelector("input[name='phone']").value,
            email: document.querySelector("input[name='email']").value,
            confirmEmail: document.querySelector("input[name='confirmEmail']").value, // 👀 Faltaba
            password: document.querySelector("input[name='password']").value
        };

        console.log("Enviando datos:", formData); // 🔍 Verificar datos antes de enviarlos

        try {
            const response = await fetch("http://localhost:3000/user", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                throw new Error("Error en la conexión con el servidor");
            }

            const result = await response.json();
            console.log("Respuesta del servidor:", result);
            alert("Usuario registrado con éxito");

            form.reset();
        } catch (error) {
            console.error("Error:", error);
            alert("Hubo un problema al registrar el usuario");
        }
    });
});
