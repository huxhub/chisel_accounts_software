import Vendor from '../models/Vendor.js';
import VendorEntry from '../models/VendorEntry.js';

// GET /api/vendors
export const getVendors = async (req, res) => {
  try {
    const vendors = await Vendor.findAll({
      include: [{ model: VendorEntry, order: [['date', 'DESC']] }],
      order: [['name', 'ASC']],
    });
    res.json(vendors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/vendors
export const createVendor = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ message: 'Vendor name is required' });
    }
    const existing = await Vendor.findOne({ where: { name: name.trim() } });
    if (existing) {
      return res.status(400).json({ message: 'A vendor with this name already exists' });
    }
    const vendor = await Vendor.create({ name: name.trim() });
    res.status(201).json({ ...vendor.toJSON(), VendorEntries: [] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/vendors/:id
export const deleteVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findByPk(req.params.id);
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    await vendor.destroy(); // CASCADE deletes entries
    res.json({ message: 'Vendor deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/vendors/:id/entries
export const addEntry = async (req, res) => {
  try {
    const vendor = await Vendor.findByPk(req.params.id);
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });

    const { type, itemName, amount, party, date, note } = req.body;
    if (!type || !itemName?.trim() || !amount || !party?.trim() || !date) {
      return res.status(400).json({ message: 'type, itemName, amount, party, and date are required' });
    }

    const entry = await VendorEntry.create({
      vendorId: vendor.id,
      type,
      itemName: itemName.trim(),
      amount: parseFloat(amount),
      party: party.trim(),
      date,
      note: note?.trim() || null,
    });
    res.status(201).json(entry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/vendors/:vendorId/entries/:entryId
export const deleteEntry = async (req, res) => {
  try {
    const entry = await VendorEntry.findOne({
      where: { id: req.params.entryId, vendorId: req.params.vendorId },
    });
    if (!entry) return res.status(404).json({ message: 'Entry not found' });
    await entry.destroy();
    res.json({ message: 'Entry deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
