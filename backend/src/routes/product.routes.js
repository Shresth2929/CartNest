const express = require('express');
const productController = require('../controllers/product.controller');
const validate = require('../middleware/validate.middleware');
const { productQuerySchema } = require('../validators/product.validator');

const router = express.Router();

router.get('/', validate(productQuerySchema, 'query'), productController.getProducts);
router.get('/:slug', productController.getProductBySlug);

module.exports = router;
