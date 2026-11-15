const prisma = require('../config/prisma');
const ApiError = require('../utils/apiError');

class AddressService {
  async getAddresses(userId) {
    return prisma.address.findMany({
      where: { userId },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async createAddress(userId, data) {
    const existingCount = await prisma.address.count({ where: { userId } });
    const isFirst = existingCount === 0;
    const shouldBeDefault = isFirst || data.isDefault === true;

    return prisma.$transaction(async (tx) => {
      if (shouldBeDefault && !isFirst) {
        await tx.address.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.address.create({
        data: {
          ...data,
          userId,
          isDefault: shouldBeDefault,
        },
      });
    });
  }

  async updateAddress(userId, addressId, data) {
    const existing = await prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!existing) {
      throw ApiError.notFound('Address not found');
    }

    return prisma.$transaction(async (tx) => {
      if (data.isDefault === true) {
        await tx.address.updateMany({
          where: { userId, isDefault: true, id: { not: addressId } },
          data: { isDefault: false },
        });
      }

      return tx.address.update({
        where: { id: addressId },
        data,
      });
    });
  }

  async deleteAddress(userId, addressId) {
    const existing = await prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!existing) {
      throw ApiError.notFound('Address not found');
    }

    return prisma.$transaction(async (tx) => {
      await tx.address.delete({
        where: { id: addressId },
      });

      // If the deleted address was the default, make the most recently created one default
      if (existing.isDefault) {
        const nextAddress = await tx.address.findFirst({
          where: { userId },
          orderBy: { createdAt: 'desc' },
        });

        if (nextAddress) {
          await tx.address.update({
            where: { id: nextAddress.id },
            data: { isDefault: true },
          });
        }
      }

      return { id: addressId, deleted: true };
    });
  }
}

module.exports = new AddressService();
