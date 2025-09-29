const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
};

const userValidationRules = () => {
    return [
        body('documentType').isIn(['TI', 'CC', 'CE', 'PPT', 'PEP']).withMessage('Tipo de documento inválido.'),
        body('documentNumber').isString().isLength({ min: 5, max: 20 }).withMessage('El número de documento debe tener entre 5 y 20 caracteres.'),
        body('userType').isIn(['SADMIN', 'ADMIN', 'PAP', 'VTE']).withMessage('Tipo de usuario inválido.'),
        body('firstName').isString().isLength({ min: 2, max: 100 }).withMessage('El nombre es requerido.'),
        body('lastName').isString().isLength({ min: 2, max: 100 }).withMessage('El apellido es requerido.'),
        body('phone').isString().isLength({ min: 7, max: 20 }).withMessage('El teléfono debe tener entre 7 y 20 dígitos.'),
        body('password').isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres.'),
        body('email').isEmail().withMessage('Debe ser un correo electrónico válido.'),
        body('confirmEmail').custom((value, { req }) => {
            if (value !== req.body.email) {
                throw new Error('Los correos electrónicos no coinciden.');
            }
            return true;
        }),
    ];
};

const sensorValidationRules = () => {
    return [
        body('tipo_sensor').isString().notEmpty().withMessage('El tipo de sensor es requerido.'),
        body('nombre_sensor').isString().notEmpty().withMessage('El nombre del sensor es requerido.'),
        body('identificador').isString().notEmpty().withMessage('El identificador es requerido.'),
        body('referencia_sensor').isString().notEmpty().withMessage('La referencia es requerida.'),
        body('unidad_medida').isString().notEmpty().withMessage('La unidad de medida es requerida.'),
        body('tiempo_escaneo').isString().notEmpty().withMessage('El tiempo de escaneo es requerido.'),
        body('estado').isIn(['Activo', 'Inactivo']).withMessage('Estado inválido.'),
        body('descripcion').optional().isString(),
    ];
};

// Puedes agregar más reglas para 'insumo', 'cultivo', 'ciclo_cultivo' aquí...

module.exports = {
    handleValidationErrors,
    userValidationRules,
    sensorValidationRules,
};