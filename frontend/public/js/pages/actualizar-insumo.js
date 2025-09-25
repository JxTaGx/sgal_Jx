document.addEventListener("DOMContentLoaded", () => {
    const idInsumo = localStorage.getItem("idInsumo");
    const token = localStorage.getItem("token");

    if (!idInsumo) {
      alert("No se ha encontrado un insumo para editar.");
      window.location.href = "listar-insumo-sebas.html";
      return; 
    }
    if (!token) {
        alert("No estás autenticado.");
        window.location.href = "login.html";
        return;
    }

    const form = document.getElementById("form-actualizar-insumo");

    const cargarDatosInsumo = async () => {
        try {
            const response = await fetch(`http://localhost:3000/insumo/${idInsumo}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || "Error al obtener el insumo");
            }

            const { data } = await response.json();

            document.getElementById("nombre-insumo").value = data.nombre_insumo || "";
            document.getElementById("tipo-insumo").value = data.tipo_insumo || "";
            document.getElementById("unidad-insumo").value = data.unidad_medida || "";
            document.getElementById("cantidad-insumo").value = data.cantidad || "";
            document.getElementById("valoru-insumo").value = data.valor_unitario || "";
            document.getElementById("valor-total").value = data.valor_total || "";
            document.getElementById("descripcion-insumo").value = data.descripcion || "";
            document.getElementById("estado-insumo").value = data.estado || "Activo";
        } catch (error) {
            console.error(error);
            alert(`No se pudo cargar la información del insumo: ${error.message}`);
        }
    };
    
    cargarDatosInsumo();

    const actualizarValorTotal = () => {
      const cantidad = parseFloat(document.getElementById("cantidad-insumo").value) || 0;
      const valorU = parseFloat(document.getElementById("valoru-insumo").value) || 0;
      document.getElementById("valor-total").value = (cantidad * valorU).toFixed(2);
    };

    document.getElementById("cantidad-insumo").addEventListener("input", actualizarValorTotal);
    document.getElementById("valoru-insumo").addEventListener("input", actualizarValorTotal);

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const updatedInsumo = {
        nombre_insumo: form.nombre_insumo.value,
        tipo_insumo: form.tipo_insumo.value,
        unidad_medida: form.unidad_medida.value,
        cantidad: parseFloat(form.cantidad.value),
        valor_unitario: parseFloat(form.valor_unitario.value),
        descripcion: form.descripcion.value,
        estado: form.estado.value
      };

      try {
        const response = await fetch(`http://localhost:3000/insumo/${idInsumo}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(updatedInsumo)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Error al actualizar insumo");
        }

        alert("Insumo actualizado correctamente.");
        window.location.href = "listar-insumo-sebas.html";
      } catch (error) {
        console.error(error);
        alert(`No se pudo actualizar el insumo: ${error.message}`);
      }
    });
});