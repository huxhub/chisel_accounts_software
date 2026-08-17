import { sequelize } from './db.js';
import Ledger from '../models/Ledger.js';
import Voucher from '../models/Voucher.js';

export const migrateOldVendorsToLedgers = async () => {
  try {
    // Check if Vendors table exists
    const [tables] = await sequelize.query(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
       WHERE LOWER(TABLE_SCHEMA) = LOWER(?) AND LOWER(TABLE_NAME) = LOWER('Vendors')`,
      { replacements: [process.env.DB_NAME || 'chisel_accounts_management'] }
    );

    if (tables.length === 0) return;

    const [oldVendors] = await sequelize.query('SELECT * FROM `Vendors`');
    for (const v of oldVendors) {
      const [existingLedger] = await Ledger.findOrCreate({
        where: { name: v.name, type: 'vendor' },
        defaults: {
          name: v.name,
          type: 'vendor',
          openingBalance: 0,
          openingType: 'credit',
        },
      });

      // Migrate VendorEntries for this Vendor
      const [oldEntries] = await sequelize.query(
        'SELECT * FROM `VendorEntries` WHERE `vendorId` = ?',
        { replacements: [v.id] }
      );

      for (const entry of oldEntries) {
        const voucherType = entry.type === 'sale' ? 'sale' : 'purchase';
        const exists = await Voucher.findOne({
          where: {
            ledgerId: existingLedger.id,
            type: voucherType,
            itemName: entry.itemName,
            amount: entry.amount,
            date: entry.date,
          },
        });

        if (!exists) {
          await Voucher.create({
            ledgerId: existingLedger.id,
            type: voucherType,
            date: entry.date,
            itemName: entry.itemName,
            amount: entry.amount,
            note: entry.party ? `Party: ${entry.party}${entry.note ? ` | ${entry.note}` : ''}` : entry.note,
          });
        }
      }
    }
  } catch (err) {
    console.warn('[Ledger Migration Warning]:', err.message);
  }
};
