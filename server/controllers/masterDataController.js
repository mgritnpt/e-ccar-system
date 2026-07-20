const { getPool } = require('../config/db');

// 1. Get active master data items (for form dropdowns)
async function getActiveMasterData(req, res) {
  try {
    const pool = await getPool();
    const [rows] = await pool.query(
      'SELECT id, category, field_name, value_key, value_label, description, sort_order FROM master_data WHERE is_active = 1 ORDER BY category ASC, sort_order ASC, id ASC'
    );

    // Group by category for easy frontend usage
    const grouped = {};
    for (const item of rows) {
      if (!grouped[item.category]) {
        grouped[item.category] = [];
      }
      grouped[item.category].push(item);
    }

    res.json({
      items: rows,
      grouped
    });
  } catch (err) {
    console.error('Error fetching master data:', err);
    res.status(500).json({ error: 'Failed to fetch master data' });
  }
}

// 2. Get all master data (for admin management)
async function getAllMasterData(req, res) {
  try {
    const pool = await getPool();
    const [rows] = await pool.query(
      'SELECT id, category, field_name, value_key, value_label, description, sort_order, is_active, created_at, updated_at FROM master_data ORDER BY category ASC, sort_order ASC, id ASC'
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching all master data:', err);
    res.status(500).json({ error: 'Failed to fetch master data' });
  }
}

// 3. Create master data entry
async function createMasterData(req, res) {
  try {
    const { category, field_name, value_key, value_label, description, sort_order } = req.body;

    if (!category || !value_key || !value_label) {
      return res.status(400).json({ error: 'category, value_key, and value_label are required.' });
    }

    const pool = await getPool();
    const fieldName = field_name || category.replace(/^(ccar_|ncr_)/, '');

    const [result] = await pool.query(
      'INSERT INTO master_data (category, field_name, value_key, value_label, description, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)',
      [category, fieldName, value_key.trim(), value_label.trim(), description || '', sort_order || 0]
    );

    res.status(201).json({
      message: 'Master data created successfully',
      id: result.insertId
    });
  } catch (err) {
    console.error('Error creating master data:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Item key already exists in this category.' });
    }
    res.status(500).json({ error: 'Failed to create master data' });
  }
}

// 4. Update master data entry
async function updateMasterData(req, res) {
  try {
    const { id } = req.params;
    const { value_label, description, sort_order, is_active } = req.body;

    const pool = await getPool();
    await pool.query(
      'UPDATE master_data SET value_label = ?, description = ?, sort_order = ?, is_active = ? WHERE id = ?',
      [value_label, description || '', sort_order || 0, is_active !== undefined ? (is_active ? 1 : 0) : 1, id]
    );

    res.json({ message: 'Master data updated successfully' });
  } catch (err) {
    console.error('Error updating master data:', err);
    res.status(500).json({ error: 'Failed to update master data' });
  }
}

// 5. Delete master data entry
async function deleteMasterData(req, res) {
  try {
    const { id } = req.params;
    const pool = await getPool();
    await pool.query('DELETE FROM master_data WHERE id = ?', [id]);
    res.json({ message: 'Master data deleted successfully' });
  } catch (err) {
    console.error('Error deleting master data:', err);
    res.status(500).json({ error: 'Failed to delete master data' });
  }
}

module.exports = {
  getActiveMasterData,
  getAllMasterData,
  createMasterData,
  updateMasterData,
  deleteMasterData
};
