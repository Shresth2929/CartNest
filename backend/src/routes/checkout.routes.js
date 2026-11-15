const express = require('express');
const orderController = require('../controllers/order.controller');
const { authenticate } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { checkoutSchema } = require('../validators/order.validator');

const router = express.Router();

router.post('/', authenticate, validate(checkoutSchema, 'body'), orderController.checkout);

module.exports = router;
