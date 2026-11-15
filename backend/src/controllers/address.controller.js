const addressService = require('../services/address.service');
const { sendSuccess } = require('../utils/response');

class AddressController {
  async getAddresses(req, res, next) {
    try {
      const addresses = await addressService.getAddresses(req.user.id);
      return sendSuccess(res, {
        statusCode: 200,
        message: 'Addresses retrieved successfully',
        data: addresses,
      });
    } catch (error) {
      next(error);
    }
  }

  async createAddress(req, res, next) {
    try {
      const address = await addressService.createAddress(req.user.id, req.body);
      return sendSuccess(res, {
        statusCode: 201,
        message: 'Address created successfully',
        data: address,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateAddress(req, res, next) {
    try {
      const { id } = req.params;
      const address = await addressService.updateAddress(req.user.id, id, req.body);
      return sendSuccess(res, {
        statusCode: 200,
        message: 'Address updated successfully',
        data: address,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteAddress(req, res, next) {
    try {
      const { id } = req.params;
      const result = await addressService.deleteAddress(req.user.id, id);
      return sendSuccess(res, {
        statusCode: 200,
        message: 'Address deleted successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AddressController();
