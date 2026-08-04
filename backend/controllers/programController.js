import Program from '../models/Program.js';
import Transaction from '../models/Transaction.js';

// @desc    Get all programs
// @route   GET /api/programs
export const getPrograms = async (req, res) => {
  try {
    const programs = await Program.findAll({ order: [['name', 'ASC']] });
    res.json(programs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new program
// @route   POST /api/programs
export const createProgram = async (req, res) => {
  try {
    const { name, color } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Program name is required' });
    }

    const existing = await Program.findOne({ where: { name: name.trim() } });
    if (existing) {
      return res.status(400).json({ message: 'A program with this name already exists' });
    }

    const program = await Program.create({
      name: name.trim(),
      color: color || '#6366f1',
    });

    res.status(201).json(program);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a program
// @route   DELETE /api/programs/:id
export const deleteProgram = async (req, res) => {
  try {
    const program = await Program.findByPk(req.params.id);
    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }

    // Unlink transactions from this program before deleting
    await Transaction.update({ programId: null }, { where: { programId: req.params.id } });
    await program.destroy();

    res.json({ message: 'Program deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
