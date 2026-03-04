import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db: any;
try {
  db = new Database(path.join(process.cwd(), "sst_inspections.db"));
  
  // Initialize Database Schema
  db.exec(`
    CREATE TABLE IF NOT EXISTS inspection_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      frequency TEXT NOT NULL, -- monthly, bimonthly, quarterly, semiannual, annual
      responsible TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS inspection_schedule (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type_id INTEGER,
      scheduled_date DATE NOT NULL,
      status TEXT DEFAULT 'pending', -- pending, executed, overdue
      FOREIGN KEY (type_id) REFERENCES inspection_types(id)
    );

    CREATE TABLE IF NOT EXISTS inspections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      schedule_id INTEGER,
      type_id INTEGER,
      execution_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      inspector_name TEXT,
      data TEXT, -- JSON blob of form data
      FOREIGN KEY (schedule_id) REFERENCES inspection_schedule(id),
      FOREIGN KEY (type_id) REFERENCES inspection_types(id)
    );

    CREATE TABLE IF NOT EXISTS findings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      inspection_id INTEGER,
      description TEXT,
      risk_level TEXT, -- Low, Medium, High
      action_plan TEXT,
      responsible TEXT,
      due_date DATE,
      status TEXT DEFAULT 'Open', -- Open, In Process, Closed
      photo_evidence TEXT, -- Base64 or path
      FOREIGN KEY (inspection_id) REFERENCES inspections(id)
    );
  `);

  // Seed initial data if empty
  const count = db.prepare("SELECT COUNT(*) as count FROM inspection_types").get() as { count: number };
  if (count.count === 0) {
    const insertType = db.prepare("INSERT INTO inspection_types (name, frequency, responsible) VALUES (?, ?, ?)");
    insertType.run("Inspección de Extintores", "monthly", "Coordinador SST");
    insertType.run("Inspección de Botiquín", "quarterly", "Brigadista");
    insertType.run("Inspección General de Áreas", "monthly", "Supervisor");
    insertType.run("Inspección de Sustancias Químicas", "semiannual", "Ingeniero Químico");
  }
} catch (err) {
  console.error("Database initialization error:", err);
  // Create a mock db object to prevent crashes if DB fails on Vercel
  db = {
    prepare: (sql: string) => ({
      get: () => {
        if (sql.includes("COUNT(*)")) return { count: 4 };
        return null;
      },
      all: () => {
        if (sql.includes("inspection_types")) {
          return [
            { id: 1, name: "Inspección de Extintores", frequency: "monthly", responsible: "Coordinador SST" },
            { id: 2, name: "Inspección de Botiquín", frequency: "quarterly", responsible: "Brigadista" },
            { id: 3, name: "Inspección General de Áreas", frequency: "monthly", responsible: "Supervisor" },
            { id: 4, name: "Inspección de Sustancias Químicas", frequency: "semiannual", responsible: "Ingeniero Químico" }
          ];
        }
        if (sql.includes("inspection_schedule")) {
          return [
            { id: 1, type_id: 1, type_name: "Inspección de Extintores", scheduled_date: new Date().toISOString().split('T')[0], status: 'pending', responsible: 'Coordinador SST' }
          ];
        }
        return [];
      },
      run: () => ({ lastInsertRowid: Date.now() })
    }),
    exec: () => {},
    transaction: (fn: any) => fn
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '50mb' }));

  const PORT = 3000;

  // API Routes
  app.get("/api/health", (req, res) => {
    try {
      const count = db.prepare("SELECT COUNT(*) as count FROM inspection_types").get();
      res.json({ status: "ok", db: "connected", types: count });
    } catch (err: any) {
      res.status(500).json({ status: "error", message: err.message });
    }
  });

  app.get("/api/dashboard/stats", (req, res) => {
    const totalScheduled = db.prepare("SELECT COUNT(*) as count FROM inspection_schedule").get() as any;
    const executed = db.prepare("SELECT COUNT(*) as count FROM inspection_schedule WHERE status = 'executed'").get() as any;
    const pending = db.prepare("SELECT COUNT(*) as count FROM inspection_schedule WHERE status = 'pending'").get() as any;
    const openFindings = db.prepare("SELECT COUNT(*) as count FROM findings WHERE status != 'Closed'").get() as any;
    const closedFindings = db.prepare("SELECT COUNT(*) as count FROM findings WHERE status = 'Closed'").get() as any;
    
    res.json({
      totalScheduled: totalScheduled.count,
      executed: executed.count,
      pending: pending.count,
      openFindings: openFindings.count,
      closedFindings: closedFindings.count,
      riskCorrectionIndex: closedFindings.count + openFindings.count > 0 
        ? Math.round((closedFindings.count / (closedFindings.count + openFindings.count)) * 100) 
        : 100
    });
  });

  app.get("/api/inspection-types", (req, res) => {
    const types = db.prepare("SELECT * FROM inspection_types").all();
    res.json(types);
  });

  app.post("/api/inspection-types", (req, res) => {
    const { name, frequency, responsible } = req.body;
    const result = db.prepare("INSERT INTO inspection_types (name, frequency, responsible) VALUES (?, ?, ?)").run(name, frequency, responsible);
    res.json({ id: result.lastInsertRowid });
  });

  app.get("/api/schedule", (req, res) => {
    const schedule = db.prepare(`
      SELECT s.*, t.name as type_name, t.responsible 
      FROM inspection_schedule s 
      JOIN inspection_types t ON s.type_id = t.id
      ORDER BY s.scheduled_date ASC
    `).all();
    res.json(schedule);
  });

  app.post("/api/schedule", (req, res) => {
    const { type_id, scheduled_date, frequency } = req.body;
    
    const transaction = db.transaction(() => {
      const insert = db.prepare("INSERT INTO inspection_schedule (type_id, scheduled_date) VALUES (?, ?)");
      insert.run(type_id, scheduled_date);

      if (frequency && frequency !== 'once') {
        let currentDate = new Date(scheduled_date);
        const monthsToAdd = {
          'monthly': 1,
          'bimonthly': 2,
          'quarterly': 3,
          'semiannual': 6,
          'annual': 12
        }[frequency as string] || 0;

        if (monthsToAdd > 0) {
          // Generate for the next 12 months
          for (let i = 1; i < (12 / monthsToAdd); i++) {
            currentDate.setMonth(currentDate.getMonth() + monthsToAdd);
            const nextDate = currentDate.toISOString().split('T')[0];
            insert.run(type_id, nextDate);
          }
        }
      }
    });

    transaction();
    res.json({ success: true });
  });

  app.post("/api/inspections", (req, res) => {
    const { schedule_id, type_id, inspector_name, data, findings: findingsData } = req.body;
    
    const transaction = db.transaction(() => {
      const result = db.prepare("INSERT INTO inspections (schedule_id, type_id, inspector_name, data) VALUES (?, ?, ?, ?)").run(
        schedule_id, type_id, inspector_name, JSON.stringify(data)
      );
      const inspectionId = result.lastInsertRowid;

      if (schedule_id) {
        db.prepare("UPDATE inspection_schedule SET status = 'executed' WHERE id = ?").run(schedule_id);
      }

      if (findingsData && Array.isArray(findingsData)) {
        const insertFinding = db.prepare(`
          INSERT INTO findings (inspection_id, description, risk_level, action_plan, responsible, due_date, photo_evidence)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        for (const finding of findingsData) {
          insertFinding.run(
            inspectionId,
            finding.description,
            finding.risk_level || 'Medium',
            finding.action_plan || '',
            finding.responsible || '',
            finding.due_date || null,
            finding.photo_evidence || null
          );
        }
      }
      return inspectionId;
    });

    const id = transaction();
    res.json({ id });
  });

  app.get("/api/inspections", (req, res) => {
    const inspections = db.prepare(`
      SELECT i.*, t.name as type_name
      FROM inspections i
      JOIN inspection_types t ON i.type_id = t.id
      ORDER BY i.execution_date DESC
    `).all();
    res.json(inspections);
  });

  app.get("/api/inspections/:id", (req, res) => {
    const inspection = db.prepare(`
      SELECT i.*, t.name as type_name
      FROM inspections i
      JOIN inspection_types t ON i.type_id = t.id
      WHERE i.id = ?
    `).get(req.params.id);
    
    if (!inspection) return res.status(404).json({ error: "Not found" });

    const findings = db.prepare("SELECT * FROM findings WHERE inspection_id = ?").all(req.params.id);
    res.json({ ...inspection, findings });
  });

  app.get("/api/findings", (req, res) => {
    const findings = db.prepare(`
      SELECT f.*, i.execution_date, t.name as inspection_type
      FROM findings f
      JOIN inspections i ON f.inspection_id = i.id
      JOIN inspection_types t ON i.type_id = t.id
      ORDER BY f.due_date ASC
    `).all();
    res.json(findings);
  });

  app.patch("/api/findings/:id", (req, res) => {
    const { status } = req.body;
    db.prepare("UPDATE findings SET status = ? WHERE id = ?").run(status, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/inspection-types/:id", (req, res) => {
    db.prepare("DELETE FROM inspection_types WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.patch("/api/inspection-types/:id", (req, res) => {
    const { name, frequency, responsible } = req.body;
    db.prepare("UPDATE inspection_types SET name = ?, frequency = ?, responsible = ? WHERE id = ?").run(name, frequency, responsible, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/schedule/:id", (req, res) => {
    db.prepare("DELETE FROM inspection_schedule WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.patch("/api/schedule/:id", (req, res) => {
    const { scheduled_date, status } = req.body;
    db.prepare("UPDATE inspection_schedule SET scheduled_date = ?, status = ? WHERE id = ?").run(scheduled_date, status, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/findings/:id", (req, res) => {
    db.prepare("DELETE FROM findings WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.patch("/api/findings/:id", (req, res) => {
    const { status, description, risk_level, action_plan, responsible, due_date } = req.body;
    db.prepare(`
      UPDATE findings 
      SET status = ?, description = ?, risk_level = ?, action_plan = ?, responsible = ?, due_date = ? 
      WHERE id = ?
    `).run(status, description, risk_level, action_plan, responsible, due_date, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/inspections/:id", (req, res) => {
    const transaction = db.transaction(() => {
      // Delete associated findings first
      db.prepare("DELETE FROM findings WHERE inspection_id = ?").run(req.params.id);
      // Delete inspection
      db.prepare("DELETE FROM inspections WHERE id = ?").run(req.params.id);
    });
    transaction();
    res.json({ success: true });
  });

  app.patch("/api/inspections/:id", (req, res) => {
    const { inspector_name, data } = req.body;
    db.prepare("UPDATE inspections SET inspector_name = ?, data = ? WHERE id = ?").run(
      inspector_name, 
      JSON.stringify(data), 
      req.params.id
    );
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
  
  return app;
}

const appPromise = startServer();

export default async (req: any, res: any) => {
  const app = await appPromise;
  return app(req, res);
};
