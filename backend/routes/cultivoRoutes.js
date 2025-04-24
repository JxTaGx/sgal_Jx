/* backend/routes/cultivoRoutes.js */
const express = require('express');
const cultivoController = require('../controllers/cultivoController');
const { upload } = require('../config/multerConfig'); // Importar instancia de upload

const router = express.Router();

// --- Cultivo Routes ---

// POST /cultivo - Crear un nuevo cultivo (con carga de foto)
// El nombre del campo en upload.single() debe coincidir con el 'name' del input file
router.post('/', upload.single('fotografia'), cultivoController.createCultivo);

// GET /cultivos - Obtener todos los cultivos
router.get('/s', cultivoController.getAllCultivos); // Cambiado a /cultivos para evitar colisión

// GET /cultivo/:id - Obtener un cultivo por id_cultivo
// :id aquí representa el id_cultivo (ej: CULT-001)
router.get('/:id', cultivoController.getCultivoById);

// PUT /cultivo/:id - Actualizar un cultivo (con posible carga de foto)
// :id aquí representa el id_cultivo
router.put('/:id', upload.single('fotografia'), cultivoController.updateCultivo);

// DELETE /cultivo/:id - Eliminar un cultivo
// :id aquí representa el id_cultivo
router.delete('/:id', cultivoController.deleteCultivo);

module.exports = router;