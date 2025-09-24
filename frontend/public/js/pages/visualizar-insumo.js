document.addEventListener("DOMContentLoaded", async () => {
  const insumoId = localStorage.getItem("idInsumo");
  const token = localStorage.getItem('token'); 

  if (!insumoId) {
    alert("No se ha seleccionado ningún insumo.");
    window.location.href = "listar-insumo-sebas.html";
    return;
  }

  if (!token) {
      alert('No estás autenticado.');
      window.location.href = 'login.html';
      return;
  }

  try {
    const response = await fetch(`http://localhost:3000/insumo/${insumoId}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    if (!response.ok) throw new Error("No se pudo obtener el insumo");

    const result = await response.json();
    if (!result.success) throw new Error(result.error || "Error en la respuesta del servidor");
    
    const insumo = result.data;

    document.getElementById("nombre-insumo").textContent = insumo.nombre_insumo || "Sin dato";
    document.getElementById("ID-insumo").textContent = insumo.id_insumo || "Sin id";
    document.getElementById("tipo-insumo").textContent = insumo.tipo_insumo || "Sin dato";
    document.getElementById("unidad-insumo").textContent = insumo.unidad_medida || "Sin dato";
    document.getElementById("cantidad-insumo").textContent = insumo.cantidad || "Sin dato";
    document.getElementById("valoru-insumo").textContent = insumo.valor_unitario || "Sin dato";
    document.getElementById("valor-insumo").textContent = insumo.valor_total || "Sin dato";
    document.getElementById("descripcion-insumo").textContent = insumo.descripcion || "Sin descripción";
    document.getElementById("estado-insumo").textContent = insumo.estado || "Sin estado";

  } catch (error) {
    console.error("Error al obtener insumo:", error);
    alert("Hubo un error al cargar los datos del insumo.");
  }
});