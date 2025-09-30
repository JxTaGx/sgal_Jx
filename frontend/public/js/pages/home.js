document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    const headers = { 'Authorization': `Bearer ${token}` };

    // --- CULTIVOS ---
    try {
        const cultivosRes = await fetch('http://localhost:3000/cultivo/s', { headers });
        const cultivosData = await cultivosRes.json();
        const cultivosInfo = document.getElementById('cultivos-data');

        if (cultivosData.success && cultivosData.data.length > 0) {
            const activos = cultivosData.data.filter(c => c.estado === 'Activo');
            const inactivos = cultivosData.data.length - activos.length;

            const ctx = document.getElementById('cultivosChart').getContext('2d');
            new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Activos', 'Inactivos'],
                    datasets: [{
                        data: [activos.length, inactivos],
                        backgroundColor: ['#4BBD17', '#C5C5C5'],
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'top', labels: { boxWidth: 12 } },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `${context.label}: ${context.raw}`;
                                }
                            }
                        }
                    }
                }
            });

            cultivosInfo.innerHTML = `
                <p><strong>Total:</strong> ${cultivosData.data.length} cultivos</p>
                <p class="interactive-info"><strong>Recientes:</strong> ${activos.slice(0, 2).map(c => c.nombre_cultivo).join(', ')}...</p>
            `;
        } else {
            cultivosInfo.innerHTML = '<p>No hay datos de cultivos disponibles.</p>';
        }
    } catch (error) {
        console.error('Error al cargar cultivos:', error);
        document.getElementById('cultivos-data').innerHTML = '<p class="error-text">No se pudieron cargar los cultivos.</p>';
    }

    // --- SENSORES ---
    try {
        const sensoresRes = await fetch('http://localhost:3000/sensor/s', { headers });
        const sensoresData = await sensoresRes.json();
        const sensoresInfo = document.getElementById('sensores-data');

        if (sensoresData.success && sensoresData.data.length > 0) {
            const tipos = sensoresData.data.reduce((acc, sensor) => {
                acc[sensor.tipo_sensor] = (acc[sensor.tipo_sensor] || 0) + 1;
                return acc;
            }, {});

            const ctx = document.getElementById('sensoresChart').getContext('2d');
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: Object.keys(tipos),
                    datasets: [{
                        label: 'Cantidad de Sensores',
                        data: Object.values(tipos),
                        backgroundColor: '#8B9DD6',
                        borderRadius: 4,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
                }
            });

            const totalSensores = sensoresData.data.length;
            const activos = sensoresData.data.filter(s => s.estado === 'Activo').length;
            sensoresInfo.innerHTML = `
                <p><strong>Total:</strong> ${totalSensores} sensores</p>
                <p class="interactive-info"><strong>Activos:</strong> ${activos} de ${totalSensores}</p>
            `;

        } else {
            sensoresInfo.innerHTML = '<p>No hay datos de sensores disponibles.</p>';
        }
    } catch (error) {
        console.error('Error al cargar sensores:', error);
        document.getElementById('sensores-data').innerHTML = '<p class="error-text">No se pudieron cargar los sensores.</p>';
    }

    // --- INSUMOS ---
    try {
        const insumosRes = await fetch('http://localhost:3000/insumo', { headers });
        const insumosData = await insumosRes.json();
        const insumosInfo = document.getElementById('insumos-data');

        if (insumosData.success && insumosData.data.length > 0) {
            const disponibles = insumosData.data.filter(i => i.estado === 'Disponible');
            const agotados = insumosData.data.length - disponibles.length;

            const ctx = document.getElementById('insumosChart').getContext('2d');
            new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: ['Disponibles', 'Agotados'],
                    datasets: [{
                        data: [disponibles.length, agotados],
                        backgroundColor: ['#A5D88B', '#FDCE2E'],
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'top', labels: { boxWidth: 12 } } }
                }
            });

            const valorTotal = disponibles.reduce((acc, i) => acc + (i.cantidad * i.valor_unitario), 0);
            insumosInfo.innerHTML = `
                <p><strong>Total de insumos:</strong> ${insumosData.data.length}</p>
                <p class="interactive-info"><strong>Valor del inventario:</strong> $${Math.round(valorTotal).toLocaleString('es-CO')}</p>
            `;

        } else {
            insumosInfo.innerHTML = '<p>No hay datos de insumos disponibles.</p>';
        }
    } catch (error) {
        console.error('Error al cargar insumos:', error);
        document.getElementById('insumos-data').innerHTML = '<p class="error-text">No se pudieron cargar los insumos.</p>';
    }
});