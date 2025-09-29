function showReportOptions(module) {
    const format = prompt("Seleccione el formato del reporte: (excel o pdf)", "excel");
    if (format && (format.toLowerCase() === 'excel' || format.toLowerCase() === 'pdf')) {
        generateReport(module, format.toLowerCase());
    } else if (format) {
        alert("Formato no válido. Por favor, escriba 'excel' o 'pdf'.");
    }
}

async function generateReport(module, format) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Acceso denegado. Por favor, inicie sesión.');
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/api/reportes/${module}/${format}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Error al generar el reporte de ${module}`);
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${module}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);

    } catch (error) {
        console.error(`Error al generar el reporte de ${module}:`, error);
        alert(`No se pudo generar el reporte: ${error.message}`);
    }
}