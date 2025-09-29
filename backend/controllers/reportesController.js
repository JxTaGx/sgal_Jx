const db = require('../config/db');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

// --- Helper para dibujar tablas en PDF ---
async function generateTable(doc, table) {
    let i;
    const tableTop = doc.y;
    const { headers, rows } = table;

    // --- Dibuja la cabecera ---
    doc.font('Helvetica-Bold');
    headers.forEach((header, i) => {
        doc.text(header, 50 + i * 100, tableTop, { width: 90, align: 'left' });
    });
    doc.moveTo(50, tableTop + 20).lineTo(550, tableTop + 20).stroke();
    doc.font('Helvetica');

    // --- Dibuja las filas ---
    let y = tableTop + 25;
    rows.forEach(row => {
        row.forEach((cell, i) => {
            doc.text(String(cell || 'N/A'), 50 + i * 100, y, { width: 90, align: 'left' });
        });
        y += 20;
        if (y > 750) { // Salto de página
            doc.addPage();
            y = 50;
        }
    });
}


async function generateReport(req, res) {
    const { module, format } = req.params;

    try {
        let data, columns, title;

        switch (module) {
            case 'usuarios':
                title = 'Reporte de Usuarios';
                columns = [
                    { header: 'ID', key: 'id', width: 10 },
                    { header: 'Tipo Doc', key: 'documentType', width: 15 },
                    { header: 'Documento', key: 'documentNumber', width: 20 },
                    { header: 'Nombre', key: 'firstName', width: 25 },
                    { header: 'Apellido', key: 'lastName', width: 25 },
                    { header: 'Email', key: 'email', width: 35 },
                    { header: 'Teléfono', key: 'phone', width: 20 },
                    { header: 'Rol', key: 'userType', width: 15 },
                ];
                [data] = await db.pool.query("SELECT id, documentType, documentNumber, firstName, lastName, email, phone, userType FROM user");
                break;

            case 'sensores':
                title = 'Reporte de Sensores';
                columns = [
                    { header: 'ID', key: 'id', width: 10 },
                    { header: 'Nombre', key: 'nombre_sensor', width: 30 },
                    { header: 'Tipo', key: 'tipo_sensor', width: 25 },
                    { header: 'Identificador', key: 'identificador', width: 20 },
                    { header: 'Estado', key: 'estado', width: 15 },
                ];
                [data] = await db.pool.query("SELECT id, nombre_sensor, tipo_sensor, identificador, estado FROM sensores");
                break;

            case 'insumos':
                title = 'Reporte de Insumos';
                columns = [
                    { header: 'ID', key: 'id_insumo', width: 15 },
                    { header: 'Nombre', key: 'nombre_insumo', width: 30 },
                    { header: 'Tipo', key: 'tipo_insumo', width: 25 },
                    { header: 'Cantidad', key: 'cantidad', width: 15 },
                    { header: 'Valor Unitario', key: 'valor_unitario', width: 20 },
                    { header: 'Estado', key: 'estado', width: 15 },
                ];
                [data] = await db.pool.query("SELECT id_insumo, nombre_insumo, tipo_insumo, cantidad, valor_unitario, estado FROM insumos");
                break;
            
            case 'cultivos':
                title = 'Reporte de Cultivos';
                columns = [
                    { header: 'ID', key: 'id_cultivo', width: 15 },
                    { header: 'Nombre', key: 'nombre_cultivo', width: 30 },
                    { header: 'Tipo', key: 'tipo_cultivo', width: 25 },
                    { header: 'Ubicación', key: 'ubicacion', width: 25 },
                     { header: 'Tamaño', key: 'tamano', width: 15 },
                    { header: 'Estado', key: 'estado', width: 15 },
                ];
                [data] = await db.pool.query("SELECT id_cultivo, nombre_cultivo, tipo_cultivo, ubicacion, tamano, estado FROM cultivos");
                break;

            case 'ciclos-cultivo':
                title = 'Reporte de Ciclos de Cultivo';
                columns = [
                    { header: 'ID', key: 'id_ciclo', width: 20 },
                    { header: 'Nombre', key: 'nombre_ciclo', width: 35 },
                    { header: 'Periodo Siembra', key: 'periodo_siembra', width: 25 },
                    { header: 'Estado', key: 'estado', width: 15 },
                ];
                [data] = await db.pool.query("SELECT id_ciclo, nombre_ciclo, periodo_siembra, estado FROM ciclo_cultivo");
                break;
            
            case 'produccion':
                 title = 'Reporte de Producción';
                 columns = [
                    { header: 'ID', key: 'id', width: 10 },
                    { header: 'Nombre Producción', key: 'name', width: 35 },
                    { header: 'Responsable', key: 'responsible_name', width: 30 },
                    { header: 'Cultivo', key: 'cultivation_name', width: 25 },
                    { header: 'Ciclo', key: 'cycle_name', width: 25 },
                    { header: 'Fecha Inicio', key: 'start_date', width: 20 },
                    { header: 'Fecha Fin', key: 'end_date', width: 20 },
                    { header: 'Estado', key: 'status', width: 15 },
                 ];
                 const [productionData] = await db.pool.query(`
                    SELECT p.id, p.name, CONCAT(u.firstName, ' ', u.lastName) as responsible_name, 
                           c.nombre_cultivo as cultivation_name, cc.nombre_ciclo as cycle_name, 
                           p.start_date, p.end_date, p.status 
                    FROM productions p
                    LEFT JOIN user u ON p.responsible = u.id
                    LEFT JOIN cultivos c ON p.cultivation = c.id_cultivo
                    LEFT JOIN ciclo_cultivo cc ON p.cycle = cc.id_ciclo
                 `);
                 data = productionData.map(p => ({
                     ...p,
                     start_date: p.start_date ? new Date(p.start_date).toLocaleDateString() : 'N/A',
                     end_date: p.end_date ? new Date(p.end_date).toLocaleDateString() : 'N/A',
                 }));
                 break;

            default:
                return res.status(400).json({ success: false, error: 'Módulo no válido' });
        }

        if (format === 'excel') {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet(title);
            worksheet.columns = columns;
            worksheet.addRows(data);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=${module}.xlsx`);
            await workbook.xlsx.write(res);
            res.end();
        } else if (format === 'pdf') {
            const doc = new PDFDocument({ margin: 30, size: 'letter', layout: 'landscape' });
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=${module}.pdf`);
            doc.pipe(res);
            doc.fontSize(18).text(title, { align: 'center' });
            doc.moveDown();
            
            // Función para dibujar la tabla
            const drawTable = (tableData) => {
                const tableTop = doc.y;
                const colCount = columns.length;
                const colWidth = (doc.page.width - 60) / colCount;
                
                doc.font('Helvetica-Bold');
                columns.forEach((column, i) => {
                    doc.text(column.header, 30 + i * colWidth, tableTop, { width: colWidth, align: 'left' });
                });
                
                let y = tableTop + 20;
                doc.moveTo(30, y).lineTo(doc.page.width - 30, y).stroke();
                
                doc.font('Helvetica');
                tableData.forEach(row => {
                    y += 5;
                    let maxHeight = 0;
                    // Calcular la altura máxima de la fila
                    columns.forEach((col, i) => {
                         const cellText = String(row[col.key] || 'N/A');
                         const height = doc.heightOfString(cellText, { width: colWidth });
                         if(height > maxHeight) maxHeight = height;
                    });
                    
                    if (y + maxHeight > doc.page.height - 50) {
                        doc.addPage({ margin: 30, size: 'letter', layout: 'landscape' });
                        y = 50;
                    }

                    columns.forEach((col, i) => {
                        doc.text(String(row[col.key] || 'N/A'), 30 + i * colWidth, y, { width: colWidth, align: 'left' });
                    });
                     y += maxHeight + 5;
                    doc.moveTo(30, y).lineTo(doc.page.width - 30, y).stroke();
                });
            };

            drawTable(data);
            doc.end();
        } else {
            res.status(400).json({ success: false, error: 'Formato no válido' });
        }
    } catch (error) {
        console.error(`Error generando reporte de ${module}:`, error);
        res.status(500).json({ success: false, error: 'Error interno del servidor al generar el reporte' });
    }
}

module.exports = { generateReport };