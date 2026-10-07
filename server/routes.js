const express = require('express');
const router = express.Router();
const db = require('./database');

// Helper to generate OS number e.g. OS-2026-0003
function generateOSNumber() {
  const year = new Date().getFullYear();
  const countRow = db.prepare('SELECT COUNT(*) as count FROM work_orders').get();
  const nextNum = (countRow.count + 1).toString().padStart(4, '0');
  return `OS-${year}-${nextNum}`;
}

// Default inspection items template for new checklists
const DEFAULT_CHECKLIST_TEMPLATE = [
  // Exterior
  { category: 'exterior', item_key: 'para_choque_dianteiro', label: 'Para-choque dianteiro' },
  { category: 'exterior', item_key: 'para_choque_traseiro', label: 'Para-choque traseiro' },
  { category: 'exterior', item_key: 'capo', label: 'Capô' },
  { category: 'exterior', item_key: 'teto', label: 'Teto' },
  { category: 'exterior', item_key: 'porta_dianteira_esquerda', label: 'Porta dianteira esquerda' },
  { category: 'exterior', item_key: 'porta_dianteira_direita', label: 'Porta dianteira direita' },
  { category: 'exterior', item_key: 'porta_traseira_esquerda', label: 'Porta traseira esquerda' },
  { category: 'exterior', item_key: 'porta_traseira_direita', label: 'Porta traseira direita' },
  { category: 'exterior', item_key: 'para_lama_dianteiro_esquerdo', label: 'Para-lama dianteiro esquerdo' },
  { category: 'exterior', item_key: 'para_lama_dianteiro_direito', label: 'Para-lama dianteiro direito' },
  { category: 'exterior', item_key: 'para_lama_traseiro_esquerdo', label: 'Para-lama traseiro esquerdo' },
  { category: 'exterior', item_key: 'para_lama_traseiro_direito', label: 'Para-lama traseiro direito' },
  { category: 'exterior', item_key: 'retrovisor_esquerdo', label: 'Retrovisor esquerdo' },
  { category: 'exterior', item_key: 'retrovisor_direito', label: 'Retrovisor direito' },
  { category: 'exterior', item_key: 'vidros', label: 'Vidros' },
  { category: 'exterior', item_key: 'farois', label: 'Faróis' },
  { category: 'exterior', item_key: 'lanternas', label: 'Lanternas' },
  { category: 'exterior', item_key: 'pneus', label: 'Pneus' },
  { category: 'exterior', item_key: 'rodas', label: 'Rodas' },
  // Interior
  { category: 'interior', item_key: 'bancos', label: 'Bancos' },
  { category: 'interior', item_key: 'painel', label: 'Painel' },
  { category: 'interior', item_key: 'volante', label: 'Volante' },
  { category: 'interior', item_key: 'tapetes', label: 'Tapetes' },
  { category: 'interior', item_key: 'forracao', label: 'Forração' },
  { category: 'interior', item_key: 'radio_multimidia', label: 'Rádio/multimídia' },
  { category: 'interior', item_key: 'ar_condicionado', label: 'Ar-condicionado' },
  { category: 'interior', item_key: 'itens_pessoais', label: 'Itens pessoais' },
  // Mecânica / Elétrica
  { category: 'mecanica', item_key: 'bateria', label: 'Bateria' },
  { category: 'mecanica', item_key: 'luzes_painel', label: 'Luzes do painel' },
  { category: 'mecanica', item_key: 'funcionamento_veiculo', label: 'Funcionamento do veículo' },
  { category: 'mecanica', item_key: 'nivel_combustivel', label: 'Nível de combustível' },
  { category: 'mecanica', item_key: 'quilometragem', label: 'Quilometragem' }
];

/* -------------------------------------------------------------------------- */
/*                                 DASHBOARD                                  */
/* -------------------------------------------------------------------------- */
router.get('/dashboard/metrics', (req, res) => {
  try {
    const totalOpen = db.prepare("SELECT COUNT(*) as count FROM work_orders WHERE status NOT IN ('Entregue', 'Cancelado') AND archived = 0").get().count;
    const awaitingApproval = db.prepare("SELECT COUNT(*) as count FROM work_orders WHERE status = 'Aguardando aprovação' AND archived = 0").get().count;
    const inProgress = db.prepare("SELECT COUNT(*) as count FROM work_orders WHERE status = 'Em execução' AND archived = 0").get().count;
    const completed = db.prepare("SELECT COUNT(*) as count FROM work_orders WHERE status = 'Concluído' AND archived = 0").get().count;
    const inShopVehicles = db.prepare("SELECT COUNT(*) as count FROM work_orders WHERE status NOT IN ('Entregue', 'Cancelado') AND archived = 0").get().count;

    // Daily revenue (today's completed/delivered OS)
    const todayRevenue = db.prepare(`
      SELECT COALESCE(SUM(final_total), 0) as total
      FROM work_orders
      WHERE status IN ('Concluído', 'Entregue')
        AND date(created_at) = date('now')
        AND archived = 0
    `).get().total;

    // Monthly revenue (this month's completed/delivered OS)
    const monthRevenue = db.prepare(`
      SELECT COALESCE(SUM(final_total), 0) as total
      FROM work_orders
      WHERE status IN ('Concluído', 'Entregue')
        AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')
        AND archived = 0
    `).get().total;

    // Recent OS list with Client & Vehicle info
    const recentWorkOrders = db.prepare(`
      SELECT wo.*, c.name as client_name, c.phone as client_phone,
             v.brand as vehicle_brand, v.model as vehicle_model, v.plate as vehicle_plate
      FROM work_orders wo
      JOIN clients c ON wo.client_id = c.id
      JOIN vehicles v ON wo.vehicle_id = v.id
      WHERE wo.archived = 0
      ORDER BY wo.created_at DESC
      LIMIT 6
    `).all();

    res.json({
      totalOpen,
      awaitingApproval,
      inProgress,
      completed,
      inShopVehicles,
      todayRevenue,
      monthRevenue,
      recentWorkOrders
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* -------------------------------------------------------------------------- */
/*                                  CLIENTS                                   */
/* -------------------------------------------------------------------------- */
router.get('/clients', (req, res) => {
  try {
    const search = req.query.search ? `%${req.query.search}%` : null;
    let query = 'SELECT * FROM clients WHERE archived = 0';
    let params = [];

    if (search) {
      query += ' AND (name LIKE ? OR phone LIKE ? OR cpf LIKE ?)';
      params = [search, search, search];
    }

    query += ' ORDER BY name ASC';
    const clients = db.prepare(query).all(...params);

    // Attach total spent & vehicles count for each client
    const stmtSpent = db.prepare(`
      SELECT COALESCE(SUM(final_total), 0) as total_spent
      FROM work_orders
      WHERE client_id = ? AND status IN ('Concluído', 'Entregue') AND archived = 0
    `);

    const stmtVehicles = db.prepare(`
      SELECT COUNT(*) as vehicle_count
      FROM vehicles
      WHERE client_id = ? AND archived = 0
    `);

    const result = clients.map(client => ({
      ...client,
      total_spent: stmtSpent.get(client.id).total_spent,
      vehicle_count: stmtVehicles.get(client.id).vehicle_count
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/clients/:id', (req, res) => {
  try {
    const client = db.prepare('SELECT * FROM clients WHERE id = ? AND archived = 0').get(req.params.id);
    if (!client) return res.status(404).json({ error: 'Cliente não encontrado' });

    // Client vehicles
    const vehicles = db.prepare('SELECT * FROM vehicles WHERE client_id = ? AND archived = 0 ORDER BY model ASC').all(client.id);

    // Client work orders
    const workOrders = db.prepare(`
      SELECT wo.*, v.brand as vehicle_brand, v.model as vehicle_model, v.plate as vehicle_plate
      FROM work_orders wo
      JOIN vehicles v ON wo.vehicle_id = v.id
      WHERE wo.client_id = ? AND wo.archived = 0
      ORDER BY wo.created_at DESC
    `).all(client.id);

    // Total spent
    const totalSpent = db.prepare(`
      SELECT COALESCE(SUM(final_total), 0) as total
      FROM work_orders
      WHERE client_id = ? AND status IN ('Concluído', 'Entregue') AND archived = 0
    `).get(client.id).total;

    res.json({
      client,
      vehicles,
      workOrders,
      totalSpent
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/clients', (req, res) => {
  try {
    const { name, phone, whatsapp, cpf, email, address, notes } = req.body;
    if (!name || !phone) return res.status(400).json({ error: 'Nome e telefone são obrigatórios' });

    const stmt = db.prepare(`
      INSERT INTO clients (name, phone, whatsapp, cpf, email, address, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(name, phone, whatsapp || phone, cpf || null, email || null, address || null, notes || null);
    const newClient = db.prepare('SELECT * FROM clients WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(newClient);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/clients/:id', (req, res) => {
  try {
    const { name, phone, whatsapp, cpf, email, address, notes } = req.body;
    const stmt = db.prepare(`
      UPDATE clients
      SET name = ?, phone = ?, whatsapp = ?, cpf = ?, email = ?, address = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND archived = 0
    `);
    const info = stmt.run(name, phone, whatsapp, cpf, email, address, notes, req.params.id);
    if (info.changes === 0) return res.status(404).json({ error: 'Cliente não encontrado' });
    const updated = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/clients/:id', (req, res) => {
  try {
    const stmt = db.prepare('UPDATE clients SET archived = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    stmt.run(req.params.id);
    res.json({ message: 'Cliente arquivado com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* -------------------------------------------------------------------------- */
/*                                  VEHICLES                                  */
/* -------------------------------------------------------------------------- */
router.get('/vehicles', (req, res) => {
  try {
    const search = req.query.search ? `%${req.query.search}%` : null;
    let query = `
      SELECT v.*, c.name as client_name, c.phone as client_phone,
        EXISTS(
          SELECT 1 FROM work_orders wo
          WHERE wo.vehicle_id = v.id AND wo.status NOT IN ('Entregue', 'Cancelado') AND wo.archived = 0
        ) as is_in_workshop
      FROM vehicles v
      JOIN clients c ON v.client_id = c.id
      WHERE v.archived = 0
    `;
    let params = [];

    if (search) {
      query += ' AND (v.plate LIKE ? OR v.model LIKE ? OR v.brand LIKE ? OR c.name LIKE ?)';
      params = [search, search, search, search];
    }

    query += ' ORDER BY v.created_at DESC';
    const vehicles = db.prepare(query).all(...params);
    res.json(vehicles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/vehicles/:id', (req, res) => {
  try {
    const vehicle = db.prepare(`
      SELECT v.*, c.name as client_name, c.phone as client_phone, c.cpf as client_cpf
      FROM vehicles v
      JOIN clients c ON v.client_id = c.id
      WHERE v.id = ? AND v.archived = 0
    `).get(req.params.id);

    if (!vehicle) return res.status(404).json({ error: 'Veículo não encontrado' });

    // Check if in workshop
    const openOS = db.prepare(`
      SELECT * FROM work_orders
      WHERE vehicle_id = ? AND status NOT IN ('Entregue', 'Cancelado') AND archived = 0
      ORDER BY created_at DESC LIMIT 1
    `).get(vehicle.id);

    // Vehicle OS history
    const history = db.prepare(`
      SELECT * FROM work_orders
      WHERE vehicle_id = ? AND archived = 0
      ORDER BY created_at DESC
    `).all(vehicle.id);

    res.json({
      vehicle,
      inWorkshop: !!openOS,
      currentOS: openOS || null,
      history
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/vehicles', (req, res) => {
  try {
    const { client_id, brand, model, year, color, plate, mileage, fuel_level, notes } = req.body;
    if (!client_id || !brand || !model || !plate) {
      return res.status(400).json({ error: 'Cliente, marca, modelo e placa são obrigatórios' });
    }

    const cleanPlate = plate.toUpperCase().trim();

    // Check unique plate among non-archived vehicles
    const existing = db.prepare('SELECT id FROM vehicles WHERE UPPER(plate) = ? AND archived = 0').get(cleanPlate);
    if (existing) {
      return res.status(400).json({ error: 'Já existe um veículo cadastrado com esta placa' });
    }

    const stmt = db.prepare(`
      INSERT INTO vehicles (client_id, brand, model, year, color, plate, mileage, fuel_level, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(client_id, brand, model, year || '', color || '', cleanPlate, mileage || 0, fuel_level || '1/2', notes || null);
    const newVehicle = db.prepare(`
      SELECT v.*, c.name as client_name
      FROM vehicles v
      JOIN clients c ON v.client_id = c.id
      WHERE v.id = ?
    `).get(info.lastInsertRowid);
    res.status(201).json(newVehicle);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/vehicles/:id', (req, res) => {
  try {
    const { client_id, brand, model, year, color, plate, mileage, fuel_level, notes } = req.body;
    const cleanPlate = plate.toUpperCase().trim();

    // Check unique plate excluding current vehicle
    const existing = db.prepare('SELECT id FROM vehicles WHERE UPPER(plate) = ? AND id != ? AND archived = 0').get(cleanPlate, req.params.id);
    if (existing) {
      return res.status(400).json({ error: 'Outro veículo já possui esta placa' });
    }

    const stmt = db.prepare(`
      UPDATE vehicles
      SET client_id = ?, brand = ?, model = ?, year = ?, color = ?, plate = ?, mileage = ?, fuel_level = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND archived = 0
    `);
    const info = stmt.run(client_id, brand, model, year, color, cleanPlate, mileage, fuel_level, notes, req.params.id);
    if (info.changes === 0) return res.status(404).json({ error: 'Veículo não encontrado' });

    const updated = db.prepare(`
      SELECT v.*, c.name as client_name
      FROM vehicles v
      JOIN clients c ON v.client_id = c.id
      WHERE v.id = ?
    `).get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/vehicles/:id', (req, res) => {
  try {
    db.prepare('UPDATE vehicles SET archived = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(req.params.id);
    res.json({ message: 'Veículo arquivado com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* -------------------------------------------------------------------------- */
/*                              SERVICES CATALOG                              */
/* -------------------------------------------------------------------------- */
router.get('/services', (req, res) => {
  try {
    const { search, category, activeOnly } = req.query;
    let query = 'SELECT * FROM services_catalog WHERE 1=1';
    let params = [];

    if (activeOnly === 'true') {
      query += ' AND active = 1';
    }

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    if (search) {
      query += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY category ASC, name ASC';
    const services = db.prepare(query).all(...params);
    res.json(services);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/services', (req, res) => {
  try {
    const { name, category, description, default_price, estimated_time } = req.body;
    if (!name || !category) return res.status(400).json({ error: 'Nome e categoria são obrigatórios' });

    const stmt = db.prepare(`
      INSERT INTO services_catalog (name, category, description, default_price, estimated_time)
      VALUES (?, ?, ?, ?, ?)
    `);
    const info = stmt.run(name, category, description || '', default_price || 0.0, estimated_time || '');
    const newService = db.prepare('SELECT * FROM services_catalog WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(newService);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/services/:id', (req, res) => {
  try {
    const { name, category, description, default_price, estimated_time, active } = req.body;
    const stmt = db.prepare(`
      UPDATE services_catalog
      SET name = ?, category = ?, description = ?, default_price = ?, estimated_time = ?, active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(name, category, description, default_price, estimated_time, active !== undefined ? active : 1, req.params.id);
    const updated = db.prepare('SELECT * FROM services_catalog WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/services/:id/toggle', (req, res) => {
  try {
    const service = db.prepare('SELECT active FROM services_catalog WHERE id = ?').get(req.params.id);
    if (!service) return res.status(404).json({ error: 'Serviço não encontrado' });
    const newActive = service.active ? 0 : 1;
    db.prepare('UPDATE services_catalog SET active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newActive, req.params.id);
    res.json({ active: newActive });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* -------------------------------------------------------------------------- */
/*                                WORK ORDERS                                 */
/* -------------------------------------------------------------------------- */
router.get('/work-orders', (req, res) => {
  try {
    const { search, status, client_id, vehicle_id } = req.query;
    let query = `
      SELECT wo.*,
             c.name as client_name, c.phone as client_phone,
             v.brand as vehicle_brand, v.model as vehicle_model, v.plate as vehicle_plate, v.color as vehicle_color
      FROM work_orders wo
      JOIN clients c ON wo.client_id = c.id
      JOIN vehicles v ON wo.vehicle_id = v.id
      WHERE wo.archived = 0
    `;
    let params = [];

    if (status) {
      query += ' AND wo.status = ?';
      params.push(status);
    }

    if (client_id) {
      query += ' AND wo.client_id = ?';
      params.push(client_id);
    }

    if (vehicle_id) {
      query += ' AND wo.vehicle_id = ?';
      params.push(vehicle_id);
    }

    if (search) {
      query += ' AND (wo.os_number LIKE ? OR c.name LIKE ? OR v.plate LIKE ? OR v.model LIKE ? OR wo.reported_problem LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s, s, s);
    }

    query += ' ORDER BY wo.created_at DESC';
    const workOrders = db.prepare(query).all(...params);
    res.json(workOrders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/work-orders/:id', (req, res) => {
  try {
    const workOrder = db.prepare(`
      SELECT wo.*,
             c.name as client_name, c.phone as client_phone, c.cpf as client_cpf, c.email as client_email, c.address as client_address,
             v.brand as vehicle_brand, v.model as vehicle_model, v.year as vehicle_year, v.color as vehicle_color, v.plate as vehicle_plate, v.fuel_level as vehicle_fuel
      FROM work_orders wo
      JOIN clients c ON wo.client_id = c.id
      JOIN vehicles v ON wo.vehicle_id = v.id
      WHERE wo.id = ? AND wo.archived = 0
    `).get(req.params.id);

    if (!workOrder) return res.status(404).json({ error: 'Ordem de serviço não encontrada' });

    // Fetch services
    const services = db.prepare('SELECT * FROM work_order_services WHERE work_order_id = ?').all(workOrder.id);

    // Fetch parts
    const parts = db.prepare('SELECT * FROM work_order_parts WHERE work_order_id = ?').all(workOrder.id);

    // Fetch checklist
    let checklist = db.prepare('SELECT * FROM work_order_checklists WHERE work_order_id = ?').get(workOrder.id);
    let checklistItems = [];

    if (checklist) {
      checklistItems = db.prepare('SELECT * FROM work_order_checklist_items WHERE checklist_id = ?').all(checklist.id);
    }

    res.json({
      ...workOrder,
      services,
      parts,
      checklist,
      checklistItems
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new Work Order
router.post('/work-orders', (req, res) => {
  try {
    const { client_id, vehicle_id, mileage, reported_problem, notes, status, payment_method, services, parts, checklist } = req.body;

    if (!client_id || !vehicle_id || !reported_problem) {
      return res.status(400).json({ error: 'Cliente, veículo e problema relatado são obrigatórios' });
    }

    const os_number = generateOSNumber();

    // Transaction for atomic insertion
    const createTx = db.transaction(() => {
      // 1. Insert Work Order
      const stmtWO = db.prepare(`
        INSERT INTO work_orders (os_number, client_id, vehicle_id, mileage, reported_problem, notes, status, payment_method)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const infoWO = stmtWO.run(
        os_number,
        client_id,
        vehicle_id,
        mileage || 0,
        reported_problem,
        notes || null,
        status || 'Aguardando avaliação',
        payment_method || 'PIX'
      );
      const work_order_id = infoWO.lastInsertRowid;

      // Update vehicle mileage
      if (mileage > 0) {
        db.prepare('UPDATE vehicles SET mileage = ? WHERE id = ?').run(mileage, vehicle_id);
      }

      // 2. Insert Services if provided
      let services_total = 0;
      if (Array.isArray(services) && services.length > 0) {
        const stmtService = db.prepare(`
          INSERT INTO work_order_services (work_order_id, service_catalog_id, name, description, quantity, unit_price, discount, total_price)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const s of services) {
          const qty = s.quantity || 1;
          const uPrice = s.unit_price || 0;
          const disc = s.discount || 0;
          const tot = (qty * uPrice) - disc;
          services_total += tot;
          stmtService.run(work_order_id, s.service_catalog_id || null, s.name, s.description || '', qty, uPrice, disc, tot);
        }
      }

      // 3. Insert Parts if provided
      let parts_total = 0;
      if (Array.isArray(parts) && parts.length > 0) {
        const stmtPart = db.prepare(`
          INSERT INTO work_order_parts (work_order_id, description, quantity, unit_price, total_price)
          VALUES (?, ?, ?, ?, ?)
        `);
        for (const p of parts) {
          const qty = p.quantity || 1;
          const uPrice = p.unit_price || 0;
          const tot = qty * uPrice;
          parts_total += tot;
          stmtPart.run(work_order_id, p.description, qty, uPrice, tot);
        }
      }

      const discount = req.body.discount || 0;
      const final_total = services_total + parts_total - discount;

      // Update totals in WO
      db.prepare(`
        UPDATE work_orders
        SET services_total = ?, parts_total = ?, discount = ?, final_total = ?
        WHERE id = ?
      `).run(services_total, parts_total, discount, final_total, work_order_id);

      // 4. Create Checklist
      const stmtChk = db.prepare(`
        INSERT INTO work_order_checklists (work_order_id, general_notes)
        VALUES (?, ?)
      `);
      const infoChk = stmtChk.run(work_order_id, checklist?.general_notes || '');
      const checklist_id = infoChk.lastInsertRowid;

      // Insert Checklist items (use passed or defaults)
      const stmtChkItem = db.prepare(`
        INSERT INTO work_order_checklist_items (checklist_id, category, item_key, label, status, notes)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      const itemsToInsert = (checklist && Array.isArray(checklist.items) && checklist.items.length > 0)
        ? checklist.items
        : DEFAULT_CHECKLIST_TEMPLATE.map(t => ({ ...t, status: 'OK', notes: '' }));

      for (const item of itemsToInsert) {
        stmtChkItem.run(checklist_id, item.category, item.item_key, item.label, item.status || 'OK', item.notes || '');
      }

      return work_order_id;
    });

    const newWOId = createTx();
    const createdWO = db.prepare(`
      SELECT wo.*, c.name as client_name, v.model as vehicle_model, v.plate as vehicle_plate
      FROM work_orders wo
      JOIN clients c ON wo.client_id = c.id
      JOIN vehicles v ON wo.vehicle_id = v.id
      WHERE wo.id = ?
    `).get(newWOId);

    res.status(201).json(createdWO);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Work Order Header & Items
router.put('/work-orders/:id', (req, res) => {
  try {
    const { status, payment_method, mileage, reported_problem, notes, discount, services, parts } = req.body;
    const woId = req.params.id;

    const existingWO = db.prepare('SELECT * FROM work_orders WHERE id = ? AND archived = 0').get(woId);
    if (!existingWO) return res.status(404).json({ error: 'Ordem de serviço não encontrada' });

    const updateTx = db.transaction(() => {
      // If services are sent, update services table
      let services_total = existingWO.services_total;
      if (Array.isArray(services)) {
        db.prepare('DELETE FROM work_order_services WHERE work_order_id = ?').run(woId);
        services_total = 0;
        const stmtService = db.prepare(`
          INSERT INTO work_order_services (work_order_id, service_catalog_id, name, description, quantity, unit_price, discount, total_price)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const s of services) {
          const qty = s.quantity || 1;
          const uPrice = s.unit_price || 0;
          const disc = s.discount || 0;
          const tot = (qty * uPrice) - disc;
          services_total += tot;
          stmtService.run(woId, s.service_catalog_id || null, s.name, s.description || '', qty, uPrice, disc, tot);
        }
      }

      // If parts are sent, update parts table
      let parts_total = existingWO.parts_total;
      if (Array.isArray(parts)) {
        db.prepare('DELETE FROM work_order_parts WHERE work_order_id = ?').run(woId);
        parts_total = 0;
        const stmtPart = db.prepare(`
          INSERT INTO work_order_parts (work_order_id, description, quantity, unit_price, total_price)
          VALUES (?, ?, ?, ?, ?)
        `);
        for (const p of parts) {
          const qty = p.quantity || 1;
          const uPrice = p.unit_price || 0;
          const tot = qty * uPrice;
          parts_total += tot;
          stmtPart.run(woId, p.description, qty, uPrice, tot);
        }
      }

      const discVal = discount !== undefined ? discount : existingWO.discount;
      const final_total = services_total + parts_total - discVal;

      db.prepare(`
        UPDATE work_orders
        SET status = ?, payment_method = ?, mileage = ?, reported_problem = ?, notes = ?,
            services_total = ?, parts_total = ?, discount = ?, final_total = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        status || existingWO.status,
        payment_method || existingWO.payment_method,
        mileage !== undefined ? mileage : existingWO.mileage,
        reported_problem || existingWO.reported_problem,
        notes !== undefined ? notes : existingWO.notes,
        services_total,
        parts_total,
        discVal,
        final_total,
        woId
      );
    });

    updateTx();
    res.json({ message: 'Ordem de serviço atualizada com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save / Update Checklist
router.put('/work-orders/:id/checklist', (req, res) => {
  try {
    const woId = req.params.id;
    const { general_notes, items } = req.body;

    let checklist = db.prepare('SELECT id FROM work_order_checklists WHERE work_order_id = ?').get(woId);
    let checklistId;

    if (!checklist) {
      const info = db.prepare('INSERT INTO work_order_checklists (work_order_id, general_notes) VALUES (?, ?)').run(woId, general_notes || '');
      checklistId = info.lastInsertRowid;
    } else {
      checklistId = checklist.id;
      db.prepare('UPDATE work_order_checklists SET general_notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(general_notes || '', checklistId);
    }

    if (Array.isArray(items)) {
      const stmtUpsert = db.prepare(`
        INSERT INTO work_order_checklist_items (checklist_id, category, item_key, label, status, notes)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      db.prepare('DELETE FROM work_order_checklist_items WHERE checklist_id = ?').run(checklistId);
      for (const item of items) {
        stmtUpsert.run(checklistId, item.category, item.item_key, item.label, item.status || 'OK', item.notes || '');
      }
    }

    res.json({ message: 'Checklist atualizado com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Soft delete / Archive OS
router.delete('/work-orders/:id', (req, res) => {
  try {
    db.prepare('UPDATE work_orders SET archived = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(req.params.id);
    res.json({ message: 'Ordem de Serviço arquivada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* -------------------------------------------------------------------------- */
/*                           VEHICLES IN WORKSHOP                             */
/* -------------------------------------------------------------------------- */
router.get('/workshop-vehicles', (req, res) => {
  try {
    const activeOS = db.prepare(`
      SELECT wo.*,
             c.name as client_name, c.phone as client_phone,
             v.brand as vehicle_brand, v.model as vehicle_model, v.year as vehicle_year, v.color as vehicle_color, v.plate as vehicle_plate, v.mileage as vehicle_mileage,
             (SELECT name FROM work_order_services WHERE work_order_id = wo.id LIMIT 1) as primary_service
      FROM work_orders wo
      JOIN clients c ON wo.client_id = c.id
      JOIN vehicles v ON wo.vehicle_id = v.id
      WHERE wo.status NOT IN ('Entregue', 'Cancelado') AND wo.archived = 0
      ORDER BY wo.entry_date DESC
    `).all();

    res.json(activeOS);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* -------------------------------------------------------------------------- */
/*                                   HISTORY                                  */
/* -------------------------------------------------------------------------- */
router.get('/history', (req, res) => {
  try {
    const { search, client_id, vehicle_id, plate, os_number, service_name, start_date, end_date } = req.query;

    let query = `
      SELECT wo.*,
             c.name as client_name, c.phone as client_phone, c.cpf as client_cpf,
             v.brand as vehicle_brand, v.model as vehicle_model, v.plate as vehicle_plate, v.year as vehicle_year
      FROM work_orders wo
      JOIN clients c ON wo.client_id = c.id
      JOIN vehicles v ON wo.vehicle_id = v.id
      WHERE 1=1
    `;
    let params = [];

    if (search) {
      query += ` AND (
        c.name LIKE ? OR c.phone LIKE ? OR v.plate LIKE ? OR v.model LIKE ? OR wo.os_number LIKE ? OR wo.reported_problem LIKE ?
      )`;
      const s = `%${search}%`;
      params.push(s, s, s, s, s, s);
    }

    if (client_id) {
      query += ' AND wo.client_id = ?';
      params.push(client_id);
    }

    if (vehicle_id) {
      query += ' AND wo.vehicle_id = ?';
      params.push(vehicle_id);
    }

    if (plate) {
      query += ' AND v.plate LIKE ?';
      params.push(`%${plate}%`);
    }

    if (os_number) {
      query += ' AND wo.os_number LIKE ?';
      params.push(`%${os_number}%`);
    }

    if (start_date) {
      query += ' AND date(wo.entry_date) >= date(?)';
      params.push(start_date);
    }

    if (end_date) {
      query += ' AND date(wo.entry_date) <= date(?)';
      params.push(end_date);
    }

    if (service_name) {
      query += ` AND EXISTS (
        SELECT 1 FROM work_order_services wos
        WHERE wos.work_order_id = wo.id AND wos.name LIKE ?
      )`;
      params.push(`%${service_name}%`);
    }

    query += ' ORDER BY wo.created_at DESC';
    const history = db.prepare(query).all(...params);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* -------------------------------------------------------------------------- */
/*                                GLOBAL SEARCH                               */
/* -------------------------------------------------------------------------- */
router.get('/search', (req, res) => {
  try {
    const q = req.query.q ? req.query.q.trim() : '';
    if (!q) {
      return res.json({ clients: [], vehicles: [], workOrders: [] });
    }

    const pattern = `%${q}%`;

    // 1. Clients matching name, phone, or CPF
    const clients = db.prepare(`
      SELECT * FROM clients
      WHERE archived = 0 AND (name LIKE ? OR phone LIKE ? OR cpf LIKE ?)
      ORDER BY name ASC LIMIT 5
    `).all(pattern, pattern, pattern);

    // 2. Vehicles matching plate, model, or brand
    const vehicles = db.prepare(`
      SELECT v.*, c.name as client_name
      FROM vehicles v
      JOIN clients c ON v.client_id = c.id
      WHERE v.archived = 0 AND (v.plate LIKE ? OR v.model LIKE ? OR v.brand LIKE ?)
      ORDER BY v.model ASC LIMIT 5
    `).all(pattern, pattern, pattern);

    // 3. Work Orders matching OS number or reported problem
    const workOrders = db.prepare(`
      SELECT wo.*, c.name as client_name, v.model as vehicle_model, v.plate as vehicle_plate
      FROM work_orders wo
      JOIN clients c ON wo.client_id = c.id
      JOIN vehicles v ON wo.vehicle_id = v.id
      WHERE wo.archived = 0 AND (wo.os_number LIKE ? OR wo.reported_problem LIKE ? OR v.plate LIKE ? OR c.name LIKE ?)
      ORDER BY wo.created_at DESC LIMIT 5
    `).all(pattern, pattern, pattern, pattern);

    res.json({ clients, vehicles, workOrders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* -------------------------------------------------------------------------- */
/*                               BACKUP / EXPORT                              */
/* -------------------------------------------------------------------------- */
router.get('/backup', (req, res) => {
  try {
    const clients = db.prepare('SELECT * FROM clients').all();
    const vehicles = db.prepare('SELECT * FROM vehicles').all();
    const services = db.prepare('SELECT * FROM services_catalog').all();
    const workOrders = db.prepare('SELECT * FROM work_orders').all();
    const woServices = db.prepare('SELECT * FROM work_order_services').all();
    const woParts = db.prepare('SELECT * FROM work_order_parts').all();
    const woChecklists = db.prepare('SELECT * FROM work_order_checklists').all();
    const woChecklistItems = db.prepare('SELECT * FROM work_order_checklist_items').all();

    res.json({
      timestamp: new Date().toISOString(),
      shopName: 'Elétrica Clean',
      clients,
      vehicles,
      services,
      workOrders,
      woServices,
      woParts,
      woChecklists,
      woChecklistItems
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
