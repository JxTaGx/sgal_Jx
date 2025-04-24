/* backend/routes/cicloCultivoRoutes.js */
const express = require('express');
const cicloCultivoController = require('../controllers/cicloCultivoController');
const { upload } = require('../config/multerConfig'); // Importar la instancia de upload

const router = express.Router();

// --- Ciclo Cultivo Routes ---

// POST /ciclo-cultivo - Crear un nuevo ciclo (con carga de foto)
// Usamos upload.single('nombre_del_campo_en_el_form')
// El nombre 'fotografia' debe coincidir con el atributo 'name' del input file en tu HTML
router.post('/', upload.single('fotografia'), cicloCultivoController.createCicloCultivo);

// GET /ciclo-cultivo - Obtener todos los ciclos (renombrado de /ciclos-cultivo)
router.get('/', cicloCultivoController.getAllCiclosCultivo);

// GET /ciclo-cultivo/:id - Obtener un ciclo por ID
router.get('/:id', cicloCultivoController.getCicloCultivoById);

// PUT /ciclo-cultivo/:id - Actualizar un ciclo (con posible carga de foto)
router.put('/:id', upload.single('fotografia'), cicloCultivoController.updateCicloCultivo);

// DELETE /ciclo-cultivo/:id - Eliminar un ciclo
router.delete('/:id', cicloCultivoController.deleteCicloCultivo);

module.exports = router;