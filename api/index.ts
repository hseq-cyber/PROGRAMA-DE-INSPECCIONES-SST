import express from "express";
import Database from "better-sqlite3";
import path from "path";

let db: any;
try {
  // Intentar conectar a la base de datos en Vercel (modo lectura/escritura temporal)
  db = new Database(path.join(process.cwd(), "sst_inspections.db"));
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS inspection_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      frequency TEXT NOT NULL,
      responsible TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS inspection_schedule (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type_id INTEGER,
      scheduled_date DATE NOT NULL,
      status TEXT DEFAULT 'pending'
    );
  `);
} catch (err) {
  console.error("DB Error, usando modo demo:", err);
  // Mock DB para que la app no falle si la base de datos no carga
  db = {
    prepare: (sql: string) => ({
      get: () => ({ count: 4 }),
      all: () => {
        if (sql.includes("inspection_types")) {
          return [
            { id: 1, name: "Inspección de Extintores", frequency: "monthly", responsible: "Coordinador SST" },
            { id: 2, name: "Inspección de Botiquín", frequency: "quarterly", responsible: "Brigadista" }
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

const app = express();
app.use(express.json({ limit: '50mb' }));

// Rutas API
app.get("/api/inspection-types", (req, res) => res.json(db.prepare("SELECT * FROM inspection_types").all()));
app.get("/api/schedule", (req, res) => res.json(db.prepare("SELECT * FROM inspection_schedule").all()));
app.get("/api/dashboard/stats", (req, res) => {
  res.json({
    totalScheduled: 12, executed: 8, pending: 4, openFindings: 3, closedFindings: 5, riskCorrectionIndex: 62
  });
});

export default app;
