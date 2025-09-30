const { body, validationResult } = require('express-validator');

// Middleware que revisa los resultados de las validaciones y responde si hay errores.
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // Devuelve el primer error encontrado para que el mensaje sea más claro
        return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }
    next();
};

// --- REGLAS DE VALIDACIÓN PARA CADA MÓDULO ---

// Reglas originales para CREAR un usuario (requiere contraseña)
const userValidationRules = () => [
    body('documentType').isIn(['TI', 'CC', 'CE', 'PPT', 'PEP']).withMessage('Tipo de documento inválido.'),
    body('documentNumber').isNumeric().withMessage('El documento solo debe contener números.').isLength({ min: 5, max: 20 }).withMessage('El número de documento debe tener entre 5 y 20 caracteres.'),
    body('userType').isIn(['SADMIN', 'ADMIN', 'PAP', 'VTE']).withMessage('Tipo de usuario inválido.'),
    body('firstName').isString().trim().notEmpty().withMessage('El nombre es requerido.'),
    body('lastName').isString().trim().notEmpty().withMessage('El apellido es requerido.'),
    body('phone').isNumeric().withMessage('El teléfono solo debe contener números.').isLength({ min: 7, max: 20 }).withMessage('El teléfono debe tener entre 7 y 20 dígitos.'),
    body('password').isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres.'),
    body('email').isEmail().normalizeEmail().withMessage('Debe ser un correo electrónico válido.'),
    body('confirmEmail').custom((value, { req }) => {
        if (value !== req.body.email) {
            throw new Error('Los correos electrónicos no coinciden.');
        }
        return true;
    }),
];

// NUEVAS REGLAS para ACTUALIZAR un usuario (NO requiere contraseña)
const userUpdateValidationRules = () => [
    body('documentType').isIn(['TI', 'CC', 'CE', 'PPT', 'PEP']).withMessage('Tipo de documento inválido.'),
    body('documentNumber').isNumeric().withMessage('El documento solo debe contener números.').isLength({ min: 5, max: 20 }).withMessage('El número de documento debe tener entre 5 y 20 caracteres.'),
    body('userType').isIn(['SADMIN', 'ADMIN', 'PAP', 'VTE']).withMessage('Tipo de usuario inválido.'),
    body('firstName').isString().trim().notEmpty().withMessage('El nombre es requerido.'),
    body('lastName').isString().trim().notEmpty().withMessage('El apellido es requerido.'),
    body('phone').isNumeric().withMessage('El teléfono solo debe contener números.').isLength({ min: 7, max: 20 }).withMessage('El teléfono debe tener entre 7 y 20 dígitos.'),
    body('email').isEmail().normalizeEmail().withMessage('Debe ser un correo electrónico válido.'),
];


// El resto de las reglas se mantienen igual
const sensorValidationRules = () => [
    body('nombre_sensor').isString().trim().notEmpty().withMessage('El nombre del sensor es requerido.'),
    body('identificador').isString().trim().notEmpty().withMessage('El identificador es requerido.'),
    body('tipo_sensor').isString().trim().notEmpty().withMessage('El tipo de sensor es requerido.'),
    body('unidad_medida').isString().trim().notEmpty().withMessage('La unidad de medida es requerida.'),
    body('tiempo_escaneo').isNumeric().withMessage('El tiempo de escaneo debe ser un número.'),
    body('estado').isIn(['Activo', 'Inactivo']).withMessage('El estado debe ser "Activo" o "Inactivo".'),
];

const insumoValidationRules = () => [
    body('nombre_insumo').trim().notEmpty().withMessage('El nombre es obligatorio.'),
    body('tipo_insumo').trim().notEmpty().withMessage('El tipo es obligatorio.'),
    body('unidad_medida').trim().notEmpty().withMessage('La unidad de medida es obligatoria.'),
    body('cantidad').isFloat({ gt: 0 }).withMessage('La cantidad debe ser un número mayor que cero.'),
    body('valor_unitario').isFloat({ gt: 0 }).withMessage('El valor unitario debe ser un número mayor que cero.'),
    body('estado').isIn(['Activo', 'Inactivo', 'Disponible', 'Agotado']).withMessage('El estado no es válido.')
];

const cultivoValidationRules = () => [
    body('nombre_cultivo').isString().trim().notEmpty().withMessage('El nombre del cultivo es requerido.'),
    body('tipo_cultivo').isString().trim().notEmpty().withMessage('El tipo de cultivo es requerido.'),
    body('tamano').optional({ checkFalsy: true }).isString(),
    body('ubicacion').optional({ checkFalsy: true }).isString(),
    body('estado').isIn(['Activo', 'Inactivo']).withMessage('El estado debe ser "Activo" o "Inactivo".'),
];

const cicloCultivoValidationRules = () => [
    body('nombre_ciclo').isString().trim().notEmpty().withMessage('El nombre del ciclo es requerido.'),
    body('periodo_siembra').isString().trim().notEmpty().withMessage('El periodo de siembra es requerido.'),
    body('estado').isIn(['activo', 'inactivo', 'pendiente']).withMessage('Estado inválido.'),
];

const productionValidationRules = () => [
    body('name').trim().notEmpty().withMessage('El nombre de la producción es obligatorio.').isLength({ min: 3, max: 100 }),
    body('responsible').isInt({ gt: 0 }).withMessage('Debe seleccionar un responsable válido.'),
    body('cultivation').isString().notEmpty().withMessage('Debe seleccionar un cultivo válido.'),
    body('cycle').isString().notEmpty().withMessage('Debe seleccionar un ciclo de cultivo válido.'),
    body('sensors').isArray({ min: 1 }).withMessage('Debe asignar al menos un sensor.'),
    body('supplies').isArray({ min: 1 }).withMessage('Debe asignar al menos un insumo.'),
    body('startDate').isISO8601().withMessage('La fecha de inicio es inválida.').custom(value => {
        if (new Date(value) < new Date(new Date().toDateString())) throw new Error('La fecha de inicio no puede ser en el pasado.');
        return true;
    }),
    body('endDate').isISO8601().withMessage('La fecha de fin es inválida.').custom((value, { req }) => {
        if (new Date(value) < new Date(req.body.startDate)) throw new Error('La fecha de fin no puede ser anterior a la de inicio.');
        return true;
    }),
];

module.exports = {
    handleValidationErrors,
    userValidationRules,
    userUpdateValidationRules,
    sensorValidationRules,
    insumoValidationRules,
    cultivoValidationRules,
    cicloCultivoValidationRules,
    productionValidationRules,
};