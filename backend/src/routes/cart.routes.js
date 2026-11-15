const express = require('express');
const cartController = require('../controllers/cart.controller');
const { authenticate } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { addToCartSchema, updateCartItemSchema } = require('../validators/cart.validator');

const router = express.Router();

// Cart is scoped to authenticated customer
router.use(authenticate);

router.get('/', cartController.getCart);
router.post('/items', validate(addToCartSchema, 'body'), cartController.addItem);
router.put('/items/:itemId', validate(updateCartItemSchema, 'body'), cartController.updateItem);
router.delete('/items/:itemId', cartController.removeItem);
router.delete('/', cartController.clearCart);

module.exports = router;
