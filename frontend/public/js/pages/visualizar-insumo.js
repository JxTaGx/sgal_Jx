document.addEventListener("DOMContentLoaded", async () => {
  const insumoId = localStorage.getItem("idInsumo");
  const token = localStorage.getItem('token'); 

  if (!insumoId) {
    alert("No se ha seleccionado ningún insumo.");
    window.location.href = "listar-insumo-sebas.html";
    return;
  }

  if (!token) {
      alert('No estás autenticado. Por favor, inicie sesión.');
      window.location.href = 'login.html';
      return;
  }

  try {
    const response = await fetch(`http://localhost:3000/insumo/${insumoId}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "No se pudo obtener el insumo");
    }

    const result = await response.json();
    if (!result.success) {
        throw new Error(result.error || "Error en la respuesta del servidor");
    }
    
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

    // --- Lógica del Gráfico ---
    const ctx = document.getElementById('consumo-chart').getContext('2d');

    // Simular datos de consumo para los últimos 6 meses
    const labels = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio'];
    const data = {
      labels: labels,
      datasets: [{
        label: `Consumo de ${insumo.nombre_insumo || 'Insumo'} (${insumo.unidad_medida || 'unidades'})`,
        data: labels.map(() => Math.floor(Math.random() * (insumo.cantidad > 10 ? insumo.cantidad / 5 : 10)) + 5),
        fill: true,
        borderColor: '#4BBD17', // Color verde de la paleta del proyecto
        backgroundColor: 'rgba(75, 189, 23, 0.2)',
        tension: 0.1
      }]
    };

    new Chart(ctx, {
      type: 'line',
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
          },
          title: {
            display: true,
            text: 'Consumo Mensual Estimado'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: `Cantidad (${insumo.unidad_medida || 'unidades'})`
            }
          }
        }
      }
    });

  } catch (error) {
    console.error("Error al obtener insumo:", error);
    alert(`Hubo un error al cargar los datos del insumo: ${error.message}`);
  }
});