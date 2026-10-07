const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'eletrica_clean.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database tables
function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      whatsapp TEXT,
      cpf TEXT,
      email TEXT,
      address TEXT,
      notes TEXT,
      archived INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS vehicles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      brand TEXT NOT NULL,
      model TEXT NOT NULL,
      year TEXT NOT NULL,
      color TEXT NOT NULL,
      plate TEXT UNIQUE NOT NULL,
      mileage INTEGER NOT NULL DEFAULT 0,
      fuel_level TEXT NOT NULL DEFAULT '1/2',
      notes TEXT,
      archived INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS services_catalog (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      default_price REAL NOT NULL DEFAULT 0.0,
      estimated_time TEXT,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS work_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      os_number TEXT UNIQUE NOT NULL,
      client_id INTEGER NOT NULL,
      vehicle_id INTEGER NOT NULL,
      entry_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      mileage INTEGER NOT NULL DEFAULT 0,
      reported_problem TEXT NOT NULL,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'Aguardando avaliação',
      payment_method TEXT DEFAULT 'PIX',
      services_total REAL DEFAULT 0.0,
      parts_total REAL DEFAULT 0.0,
      discount REAL DEFAULT 0.0,
      final_total REAL DEFAULT 0.0,
      archived INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT,
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS work_order_services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      work_order_id INTEGER NOT NULL,
      service_catalog_id INTEGER,
      name TEXT NOT NULL,
      description TEXT,
      quantity INTEGER NOT NULL DEFAULT 1,
      unit_price REAL NOT NULL DEFAULT 0.0,
      discount REAL NOT NULL DEFAULT 0.0,
      total_price REAL NOT NULL DEFAULT 0.0,
      FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON DELETE CASCADE,
      FOREIGN KEY (service_catalog_id) REFERENCES services_catalog(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS work_order_parts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      work_order_id INTEGER NOT NULL,
      description TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      unit_price REAL NOT NULL DEFAULT 0.0,
      total_price REAL NOT NULL DEFAULT 0.0,
      FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS work_order_checklists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      work_order_id INTEGER UNIQUE NOT NULL,
      general_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS work_order_checklist_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      checklist_id INTEGER NOT NULL,
      category TEXT NOT NULL,
      item_key TEXT NOT NULL,
      label TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'OK',
      notes TEXT,
      FOREIGN KEY (checklist_id) REFERENCES work_order_checklists(id) ON DELETE CASCADE
    );
  `);

  // Seed default auto-electric services if services catalog is empty
  const countStmt = db.prepare('SELECT COUNT(*) as count FROM services_catalog');
  const { count } = countStmt.get();

  if (count === 0) {
    console.log('Seeding initial auto-electric service catalog...');
    const insertService = db.prepare(`
      INSERT INTO services_catalog (name, category, description, default_price, estimated_time)
      VALUES (?, ?, ?, ?, ?)
    `);

    const defaultServices = [
      ['Diagnóstico Elétrico Computadorizado', 'Diagnóstico elétrico', 'Mapeamento do sistema elétrico e injeção com scanner profissional', 150.0, '1 hora'],
      ['Teste e Recarga de Bateria', 'Bateria', 'Teste de carga, densidade de eletrólito e recarga lenta/rápida', 50.0, '45 min'],
      ['Troca de Bateria Automotiva', 'Bateria', 'Substituição de bateria com limpeza e proteção dos terminais', 60.0, '30 min'],
      ['Revisão / Reparo de Alternador', 'Alternador', 'Desmontagem, troca de escovas, regulador de voltagem e rolamentos', 280.0, '2 horas'],
      ['Revisão / Reparo de Motor de Partida', 'Motor de partida', 'Substituição de automático, bendix, escovas e teste de bancada', 250.0, '2 horas'],
      ['Regulagem e Troca de Lâmpadas', 'Iluminação', 'Troca de lâmpadas de farol, lanterna e alinhamento do foco', 40.0, '30 min'],
      ['Instalação de Kit Farol de Milha / Neblina', 'Iluminação', 'Instalação de chicote relé, chave auxiliar e projetores', 180.0, '2 horas'],
      ['Teste de Sistema de Carga e Partida', 'Sistema de carga', 'Verificação de alternador, tensão da bateria sob carga e perda de corrente', 80.0, '40 min'],
      ['Reparo de Chicote Elétrico Principal', 'Injeção eletrônica', 'Identificação de curto-circuito, isolamento e recuperação de fios avariados', 320.0, '3 horas'],
      ['Instalação de Alarme Automotivo', 'Alarmes', 'Instalação de sistema de alarme com sensor volumétrico e bloqueio', 220.0, '2h 30min'],
      ['Instalação de Trava Elétrica 4 portas', 'Instalação de acessórios', 'Kit de travas universais/específicas com integração com o alarme', 200.0, '2 horas'],
      ['Instalação de Som / Multimídia', 'Som automotivo', 'Montagem de moldura, fiação ISO, câmera de ré e teste de alto-falantes', 190.0, '2 horas'],
      ['Manutenção de Vidro Elétrico', 'Instalação de acessórios', 'Troca de roldana, cabo de aço ou motor da máquina de vidro', 160.0, '1h 30min'],
      ['Diagnóstico de Falha de Injeção', 'Injeção eletrônica', 'Leitura de códigos DTC, teste de sensores e atuadores elétricos', 140.0, '1 hora']
    ];

    const insertMany = db.transaction((services) => {
      for (const s of services) {
        insertService.run(s[0], s[1], s[2], s[3], s[4]);
      }
    });

    insertMany(defaultServices);
  }

  // Seed sample data for demonstration if clients table is empty
  const clientCount = db.prepare('SELECT COUNT(*) as count FROM clients').get().count;
  if (clientCount === 0) {
    console.log('Seeding sample clients, vehicles, and OS...');

    // Sample Client 1
    const res1 = db.prepare(`
      INSERT INTO clients (name, phone, whatsapp, cpf, email, address, notes)
      VALUES ('João da Silva', '(11) 98765-4321', '(11) 98765-4321', '123.456.789-00', 'joao.silva@email.com', 'Rua das Flores, 123 - SP', 'Cliente preferencial')
    `).run();
    const clientId1 = res1.lastInsertRowid;

    const v1 = db.prepare(`
      INSERT INTO vehicles (client_id, brand, model, year, color, plate, mileage, fuel_level, notes)
      VALUES (?, 'Chevrolet', 'Astra', '2007', 'Cinza', 'ABC1D23', 125400, '1/2', 'Veículo em bom estado')
    `).run(clientId1);
    const vehicleId1 = v1.lastInsertRowid;

    // Sample Client 2
    const res2 = db.prepare(`
      INSERT INTO clients (name, phone, whatsapp, cpf, email, address, notes)
      VALUES ('Maria Oliveira', '(11) 97123-8899', '(11) 97123-8899', '987.654.321-11', 'maria.oliveira@email.com', 'Av. Brasil, 4500 - SP', 'Contatar preferencialmente via WhatsApp')
    `).run();
    const clientId2 = res2.lastInsertRowid;

    const v2 = db.prepare(`
      INSERT INTO vehicles (client_id, brand, model, year, color, plate, mileage, fuel_level, notes)
      VALUES (?, 'Volkswagen', 'Gol G5', '2012', 'Preto', 'XYZ-9876', 98000, '3/4', 'Troca de luzes recente')
    `).run(clientId2);
    const vehicleId2 = v2.lastInsertRowid;

    // Sample Work Order 1 (In Progress / Na Oficina)
    const os1 = db.prepare(`
      INSERT INTO work_orders (os_number, client_id, vehicle_id, entry_date, mileage, reported_problem, notes, status, payment_method, services_total, parts_total, discount, final_total)
      VALUES ('OS-2026-0001', ?, ?, datetime('now', '-2 days'), 125400, 'Carro não dá partida de manhã e luz da bateria acendeu no painel', 'Checar alternador e bateria', 'Em execução', 'PIX', 280.00, 150.00, 0.00, 430.00)
    `).run(clientId1, vehicleId1);
    const osId1 = os1.lastInsertRowid;

    db.prepare(`
      INSERT INTO work_order_services (work_order_id, service_catalog_id, name, description, quantity, unit_price, discount, total_price)
      VALUES (?, 4, 'Revisão / Reparo de Alternador', 'Desmontagem, troca de escovas, regulador de voltagem e rolamentos', 1, 280.00, 0.00, 280.00)
    `).run(osId1);

    db.prepare(`
      INSERT INTO work_order_parts (work_order_id, description, quantity, unit_price, total_price)
      VALUES (?, 'Regulador de Tensão Bosch 14V', 1, 150.00, 150.00)
    `).run(osId1);

    // Checklist 1
    const chk1 = db.prepare(`
      INSERT INTO work_order_checklists (work_order_id, general_notes)
      VALUES (?, 'Pequeno risco no para-choque dianteiro direito. Demais itens OK.')
    `).run(osId1);
    const chkId1 = chk1.lastInsertRowid;

    const defaultChecklistItems = [
      // EXTERIOR
      ['exterior', 'para_choque_dianteiro', 'Para-choque dianteiro', 'Com avaria', 'Risco leve lado direito'],
      ['exterior', 'para_choque_traseiro', 'Para-choque traseiro', 'OK', ''],
      ['exterior', 'capo', 'Capô', 'OK', ''],
      ['exterior', 'teto', 'Teto', 'OK', ''],
      ['exterior', 'porta_dianteira_esquerda', 'Porta dianteira esquerda', 'OK', ''],
      ['exterior', 'porta_dianteira_direita', 'Porta dianteira direita', 'OK', ''],
      ['exterior', 'porta_traseira_esquerda', 'Porta traseira esquerda', 'OK', ''],
      ['exterior', 'porta_traseira_direita', 'Porta traseira direita', 'OK', ''],
      ['exterior', 'para_lama_dianteiro_esquerdo', 'Para-lama dianteiro esquerdo', 'OK', ''],
      ['exterior', 'para_lama_dianteiro_direito', 'Para-lama dianteiro direito', 'OK', ''],
      ['exterior', 'para_lama_traseiro_esquerdo', 'Para-lama traseiro esquerdo', 'OK', ''],
      ['exterior', 'para_lama_traseiro_direito', 'Para-lama traseiro direito', 'OK', ''],
      ['exterior', 'retrovisor_esquerdo', 'Retrovisor esquerdo', 'OK', ''],
      ['exterior', 'retrovisor_direito', 'Retrovisor direito', 'OK', ''],
      ['exterior', 'vidros', 'Vidros', 'OK', ''],
      ['exterior', 'farois', 'Faróis', 'OK', ''],
      ['exterior', 'lanternas', 'Lanternas', 'OK', ''],
      ['exterior', 'pneus', 'Pneus', 'OK', ''],
      ['exterior', 'rodas', 'Rodas', 'OK', ''],
      // INTERIOR
      ['interior', 'bancos', 'Bancos', 'OK', ''],
      ['interior', 'painel', 'Painel', 'OK', ''],
      ['interior', 'volante', 'Volante', 'OK', ''],
      ['interior', 'tapetes', 'Tapetes', 'OK', ''],
      ['interior', 'forracao', 'Forração', 'OK', ''],
      ['interior', 'radio_multimidia', 'Rádio/multimídia', 'OK', 'Pioneer USB'],
      ['interior', 'ar_condicionado', 'Ar-condicionado', 'OK', ''],
      ['interior', 'itens_pessoais', 'Itens pessoais', 'OK', 'Óculos no porta-luvas'],
      // MECANICA / ELETRICA
      ['mecanica', 'bateria', 'Bateria', 'Com avaria', 'Descarregada / fraca'],
      ['mecanica', 'luzes_painel', 'Luzes do painel', 'Com avaria', 'Luz de bateria acesa'],
      ['mecanica', 'funcionamento_veiculo', 'Funcionamento do veículo', 'OK', 'Partida pesada'],
      ['mecanica', 'nivel_combustivel', 'Nível de combustível', 'OK', '1/2 tanque'],
      ['mecanica', 'quilometragem', 'Quilometragem', 'OK', '125.400 km']
    ];

    const stmtChkItem = db.prepare(`
      INSERT INTO work_order_checklist_items (checklist_id, category, item_key, label, status, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const item of defaultChecklistItems) {
      stmtChkItem.run(chkId1, item[0], item[1], item[2], item[3], item[4]);
    }

    // Sample Work Order 2 (Concluído / Completed yesterday)
    const os2 = db.prepare(`
      INSERT INTO work_orders (os_number, client_id, vehicle_id, entry_date, mileage, reported_problem, notes, status, payment_method, services_total, parts_total, discount, final_total)
      VALUES ('OS-2026-0002', ?, ?, datetime('now', '-5 days'), 98000, 'Instalação de sensor de ré e substituição de lâmpada de farol queimada', 'Serviço finalizado e testado', 'Concluído', 'Cartão de Crédito', 220.00, 80.00, 10.00, 290.00)
    `).run(clientId2, vehicleId2);
    const osId2 = os2.lastInsertRowid;

    db.prepare(`
      INSERT INTO work_order_services (work_order_id, service_catalog_id, name, description, quantity, unit_price, discount, total_price)
      VALUES (?, 11, 'Instalação de Acessórios', 'Instalação de Kit Sensor de Ré com display sonoro', 1, 180.00, 0.00, 180.00)
    `).run(osId2);

    db.prepare(`
      INSERT INTO work_order_services (work_order_id, service_catalog_id, name, description, quantity, unit_price, discount, total_price)
      VALUES (?, 6, 'Regulagem e Troca de Lâmpadas', 'Troca de lâmpada H7 farol baixo', 1, 40.00, 0.00, 40.00)
    `).run(osId2);

    db.prepare(`
      INSERT INTO work_order_parts (work_order_id, description, quantity, unit_price, total_price)
      VALUES (?, 'Kit Sensor de Estacionamento 4 Pontos Preto', 1, 80.00, 80.00)
    `).run(osId2);

    // Checklist 2
    const chk2 = db.prepare(`
      INSERT INTO work_order_checklists (work_order_id, general_notes)
      VALUES (?, 'Veículo em excelente estado de conservação.')
    `).run(osId2);
    const chkId2 = chk2.lastInsertRowid;

    for (const item of defaultChecklistItems) {
      stmtChkItem.run(chkId2, item[0], item[1], item[2], 'OK', '');
    }
  }
}

initDb();

module.exports = db;
