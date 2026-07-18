const { getPool } = require('../config/db');

// Create new NCR
exports.createNcr = async (req, res) => {
  const {
    plant, bu, issued_by_dept, product_code, product_name,
    batch_no, lot_no, defect_qty, defect_unit, defect_detail, transfer_qi
  } = req.body;

  if (!plant || !bu || !issued_by_dept || !product_name) {
    return res.status(400).json({ message: 'Missing required fields.' });
  }

  try {
    const pool = await getPool();
    
    // Generate unique NCR No e.g., NCR-2026-0001
    const currentYear = new Date().getFullYear();
    const [[{ count }]] = await pool.query(
      'SELECT COUNT(*) as count FROM ncr_records WHERE ncr_no LIKE ?',
      [`NCR-${currentYear}-%`]
    );
    const nextNumber = String(count + 1).padStart(4, '0');
    const ncrNo = `NCR-${currentYear}-${nextNumber}`;

    const [result] = await pool.query(
      `INSERT INTO ncr_records (
        ncr_no, plant, bu, issued_by_dept, product_code, product_name,
        batch_no, lot_no, defect_qty, defect_unit, defect_detail, transfer_qi,
        status, current_step, requester_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', '1', ?)`,
      [
        ncrNo, plant, bu, issued_by_dept, product_code, product_name,
        batch_no, lot_no, defect_qty || 0, defect_unit, defect_detail, transfer_qi || 'No',
        req.user.id
      ]
    );

    res.status(201).json({
      message: 'NCR created successfully.',
      ncrId: result.insertId,
      ncrNo
    });
  } catch (err) {
    console.error('Create NCR error:', err);
    res.status(500).json({ message: 'Database error occurred.' });
  }
};

// Get NCR list
exports.getNcrList = async (req, res) => {
  try {
    const pool = await getPool();
    const [records] = await pool.query(
      `SELECT n.*, u.name as requester_name 
       FROM ncr_records n
       JOIN users u ON n.requester_id = u.id
       ORDER BY n.created_at DESC`
    );
    res.json(records);
  } catch (err) {
    console.error('Get NCR list error:', err);
    res.status(500).json({ message: 'Database error occurred.' });
  }
};

// Get NCR details by ID
exports.getNcrById = async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await getPool();
    const [records] = await pool.query(
      `SELECT n.*, u.name as requester_name, u.role as requester_role, u.department as requester_dept
       FROM ncr_records n
       JOIN users u ON n.requester_id = u.id
       WHERE n.id = ?`,
      [id]
    );

    if (records.length === 0) {
      return res.status(404).json({ message: 'NCR not found.' });
    }

    const ncr = records[0];

    // Fetch step history with actor names
    const [steps] = await pool.query(
      `SELECT s.*, u.name as actor_name, u.role as actor_role, u.department as actor_dept
       FROM ncr_steps s
       JOIN users u ON s.actor_id = u.id
       WHERE s.ncr_id = ?
       ORDER BY s.created_at ASC`,
      [id]
    );

    // Fetch files attached to this record
    const [files] = await pool.query(
      `SELECT a.*, u.name as uploader_name 
       FROM attachments a
       JOIN users u ON a.uploaded_by = u.id
       WHERE a.record_type = 'NCR' AND a.record_id = ?`,
      [id]
    );

    res.json({
      ...ncr,
      steps,
      attachments: files
    });
  } catch (err) {
    console.error('Get NCR by ID error:', err);
    res.status(500).json({ message: 'Database error occurred.' });
  }
};

// Update NCR step
exports.updateNcrStep = async (req, res) => {
  const { id } = req.params;
  const { step, result, reason, data_json } = req.body;

  if (!step || !result) {
    return res.status(400).json({ message: 'Missing step or result.' });
  }

  try {
    const pool = await getPool();
    
    // Check NCR existence
    const [records] = await pool.query('SELECT * FROM ncr_records WHERE id = ?', [id]);
    if (records.length === 0) {
      return res.status(404).json({ message: 'NCR not found.' });
    }

    const ncr = records[0];

    let nextStep = ncr.current_step;
    let overallStatus = ncr.status;

    const resLower = result.toLowerCase();

    if (step === '1') {
      nextStep = ncr.transfer_qi === 'Yes' ? '2' : '3';
      overallStatus = 'In Progress';
    } 
    else if (step === '2') {
      nextStep = '3';
    } 
    else if (step === '3') {
      nextStep = '4';
    } 
    else if (step === '4') {
      if (resLower === 'reject') {
        nextStep = 'Closed';
        overallStatus = 'Rejected';
      } else {
        nextStep = '5';
      }
    } 
    else if (step === '5') {
      nextStep = '6';
    } 
    else if (step === '6') {
      if (resLower === 'reprocess') {
        nextStep = '9';
      } else if (resLower === 'reject') {
        nextStep = 'Closed';
        overallStatus = 'Rejected';
      } else {
        nextStep = '7'; // Accept as is, Scrap, Return to vendor
      }
    } 
    else if (step === '7') {
      nextStep = '8';
    } 
    else if (step === '8') {
      // Check if we came from reprocess or need reprocess
      nextStep = 'Closed';
      overallStatus = 'Closed';
    } 
    else if (step === '9') {
      nextStep = '10';
    } 
    else if (step === '10') {
      nextStep = 'Closed';
      overallStatus = 'Closed';
    }

    // Insert record in ncr_steps
    await pool.query(
      `INSERT INTO ncr_steps (ncr_id, step, actor_id, result, reason, data_json)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, step, req.user.id, result, reason || '', data_json || '{}']
    );

    // Save uploaded files if any
    if (req.file) {
      const fileName = req.file.originalname;
      const filePath = `/uploads/${req.file.filename}`;
      const fileType = req.file.mimetype;
      
      await pool.query(
        `INSERT INTO attachments (record_type, record_id, step, file_name, file_path, file_type, uploaded_by)
         VALUES ('NCR', ?, ?, ?, ?, ?, ?)`,
        [id, step, fileName, filePath, fileType, req.user.id]
      );
    }

    // Update ncr record
    await pool.query(
      'UPDATE ncr_records SET current_step = ?, status = ? WHERE id = ?',
      [nextStep, overallStatus, id]
    );

    res.json({
      message: 'NCR Step updated successfully.',
      currentStep: nextStep,
      status: overallStatus
    });
  } catch (err) {
    console.error('Update NCR step error:', err);
    res.status(500).json({ message: 'Database error occurred.' });
  }
};
