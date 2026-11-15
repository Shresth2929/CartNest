const express = require('express');
const addressController = require('../controllers/address.controller');
const { authenticate } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { createAddressSchema, updateAddressSchema } = require('../validators/address.validator');

const router = express.Router();

// All address routes require authentication
router.use(authenticate);

router.get('/', addressController.getAddresses);
router.post('/', validate(createAddressSchema, 'body'), addressController.createAddress);
router.put('/:id', validate(updateAddressSchema, 'body'), addressController.updateAddress);
router.delete('/:id', addressController.deleteAddress);

module.exports = router;
