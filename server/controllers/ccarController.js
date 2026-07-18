const { getPool } = require('../config/db');
const path = require('path');
const fs = require('fs');

// Create new CCAR
exports.createCcar = async (req, res) => {
  const {
    bu, requested_by, subject, subject_other, product_termination,
    product_termination_ref, ccr_no, customer_written_doc, customer_code,
    customer_name, product_code, product_name, batch_no, lot_no,
    do_no, item, quantity, quantity_unit, found_problem,
    containment_action, containment_action_detail, compensation, problem_detail
  } = req.body;

  if (!bu || !requested_by || !subject) {
    return res.status(400).json({ message: 'Missing required headers fields.' });
  }

  try {
    const pool = await getPool();
    
    // Generate unique CCAR No e.g., CCAR-2026-0001
    const currentYear = new Date().getFullYear();
    const [[{ count }]] = await pool.query(
      'SELECT COUNT(*) as count FROM ccar_records WHERE ccar_no LIKE ?',
      [`CCAR-${currentYear}-%`]
    );
    const nextNumber = String(count + 1).padStart(4, '0');
    const ccarNo = `CCAR-${currentYear}-${nextNumber}`;

    const [result] = await pool.query(
      `INSERT INTO ccar_records (
        ccar_no, bu, requested_by, subject, subject_other, product_termination,
        product_termination_ref, ccr_no, customer_written_doc, customer_code,
        customer_name, product_code, product_name, batch_no, lot_no,
        do_no, item, quantity, quantity_unit, found_problem,
        containment_action, containment_action_detail, compensation, problem_detail,
        status, current_step, requester_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', '1.1', ?)`,
      [
        ccarNo, bu, requested_by, subject, subject_other, product_termination,
        product_termination_ref, ccr_no, customer_written_doc, customer_code,
        customer_name, product_code, product_name, batch_no, lot_no,
        do_no, item, quantity || 0, quantity_unit, found_problem || '[]',
        containment_action, containment_action_detail, compensation, problem_detail,
        req.user.id
      ]
    );

    res.status(201).json({
      message: 'CCAR created successfully.',
      ccarId: result.insertId,
      ccarNo
    });
  } catch (err) {
    console.error('Create CCAR error:', err);
    res.status(500).json({ message: 'Database error occurred.' });
  }
};

// Get CCAR list
exports.getCcarList = async (req, res) => {
  try {
    const pool = await getPool();
    let query = `
      SELECT c.*, u.name as requester_name 
      FROM ccar_records c
      JOIN users u ON c.requester_id = u.id
      ORDER BY c.created_at DESC
    `;
    
    // For standard users, we could filter. But for dashboard clarity, return all.
    const [records] = await pool.query(query);
    res.json(records);
  } catch (err) {
    console.error('Get CCAR list error:', err);
    res.status(500).json({ message: 'Database error occurred.' });
  }
};

// Get CCAR details by ID
exports.getCcarById = async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await getPool();
    const [records] = await pool.query(
      `SELECT c.*, u.name as requester_name, u.role as requester_role, u.department as requester_dept
       FROM ccar_records c
       JOIN users u ON c.requester_id = u.id
       WHERE c.id = ?`,
      [id]
    );

    if (records.length === 0) {
      return res.status(404).json({ message: 'CCAR not found.' });
    }

    const ccar = records[0];

    // Fetch step history with actor names
    const [steps] = await pool.query(
      `SELECT s.*, u.name as actor_name, u.role as actor_role, u.department as actor_dept
       FROM ccar_steps s
       JOIN users u ON s.actor_id = u.id
       WHERE s.ccar_id = ?
       ORDER BY s.created_at ASC`,
      [id]
    );

    // Fetch files attached to this record
    const [files] = await pool.query(
      `SELECT a.*, u.name as uploader_name 
       FROM attachments a
       JOIN users u ON a.uploaded_by = u.id
       WHERE a.record_type = 'CCAR' AND a.record_id = ?`,
      [id]
    );

    res.json({
      ...ccar,
      steps,
      attachments: files
    });
  } catch (err) {
    console.error('Get CCAR by ID error:', err);
    res.status(500).json({ message: 'Database error occurred.' });
  }
};

// Update step workflow
exports.updateCcarStep = async (req, res) => {
  const { id } = req.params;
  const { step, result, reason, data_json } = req.body;

  if (!step || !result) {
    return res.status(400).json({ message: 'Missing step or result.' });
  }

  try {
    const pool = await getPool();
    
    // Check CCAR existence and current state
    const [records] = await pool.query('SELECT * FROM ccar_records WHERE id = ?', [id]);
    if (records.length === 0) {
      return res.status(404).json({ message: 'CCAR not found.' });
    }

    const ccar = records[0];

    // Determine next step and overall status
    let nextStep = ccar.current_step;
    let overallStatus = ccar.status;

    const resLower = result.toLowerCase();

    if (step === '1.1') {
      if (resLower === 'correct') {
        nextStep = '1.2';
      } else {
        nextStep = 'Closed';
        overallStatus = 'Rejected';
      }
    } 
    else if (step === '1.2') {
      if (resLower === 'approve') {
        const sub = ccar.subject.toLowerCase();
        if (sub.includes('quality') || sub.includes('shade')) {
          nextStep = '1.3';
        } else {
          nextStep = '2'; // Skip sample confirm if packaging/delivery
        }
      } else {
        nextStep = 'Closed';
        overallStatus = 'Rejected';
      }
    } 
    else if (step === '1.3') {
      nextStep = '2';
    } 
    else if (step === '2') {
      if (resLower === 'correct') {
        nextStep = '2.1';
      } else {
        nextStep = 'Closed';
        overallStatus = 'Rejected';
      }
    } 
    else if (step === '2.1') {
      if (resLower === 'approve') {
        nextStep = '2.2';
      } else {
        nextStep = 'Closed';
        overallStatus = 'Rejected';
      }
    } 
    else if (step === '2.2') {
      nextStep = '2.3';
    } 
    else if (step === '2.3') {
      nextStep = '3.1';
      overallStatus = 'In Progress';
    } 
    else if (step === '3.1') {
      nextStep = '3.2';
    } 
    else if (step === '3.2') {
      if (resLower === 'approve') {
        nextStep = '3.3';
      } else {
        nextStep = '3.1'; // Send back to answer
      }
    } 
    else if (step === '3.3') {
      if (resLower === 'submit' || resLower === 'approve') {
        nextStep = '3.4';
      } else {
        nextStep = '3.1'; // Send back
      }
    } 
    else if (step === '3.4') {
      if (resLower === 'approve') {
        nextStep = '4';
      } else {
        nextStep = '3.1'; // Send back
      }
    } 
    else if (step === '4') {
      nextStep = '5';
    } 
    else if (step === '5') {
      nextStep = '7.1';
    } 
    else if (step === '7.1') {
      if (resLower === 'approve') {
        // Parse step 3.1 data to check if expanded prevention was checked
        const [step31] = await pool.query(
          "SELECT data_json FROM ccar_steps WHERE ccar_id = ? AND step = '3.1' ORDER BY id DESC LIMIT 1",
          [id]
        );
        let needExpanded = false;
        if (step31.length > 0 && step31[0].data_json) {
          try {
            const dataObj = JSON.parse(step31[0].data_json);
            needExpanded = dataObj.needExpandedPrevention === 'Need' || dataObj.needExpandedPrevention === true;
          } catch (e) {
            console.error('Error parsing step 3.1 JSON:', e);
          }
        }

        if (needExpanded) {
          nextStep = '7.2';
        } else {
          nextStep = 'Closed';
          overallStatus = 'Closed';
        }
      } else {
        nextStep = '4'; // Reject back to feedback
      }
    } 
    else if (step === '7.2') {
      nextStep = '7.3';
    } 
    else if (step === '7.3') {
      if (resLower === 'approve') {
        nextStep = 'Closed';
        overallStatus = 'Closed';
      } else {
        nextStep = '7.2'; // Redo follow up
      }
    }

    // Insert record in ccar_steps
    await pool.query(
      `INSERT INTO ccar_steps (ccar_id, step, actor_id, result, reason, data_json)
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
         VALUES ('CCAR', ?, ?, ?, ?, ?, ?)`,
        [id, step, fileName, filePath, fileType, req.user.id]
      );
    }

    // Update ccar record
    await pool.query(
      'UPDATE ccar_records SET current_step = ?, status = ? WHERE id = ?',
      [nextStep, overallStatus, id]
    );

    res.json({
      message: 'Step updated successfully.',
      currentStep: nextStep,
      status: overallStatus
    });
  } catch (err) {
    console.error('Update step error:', err);
    res.status(500).json({ message: 'Database error occurred.' });
  }
};
