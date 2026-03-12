-- Adoption inquiries table for in-site form submissions (D1: catsd1_db)
CREATE TABLE IF NOT EXISTS adoption_inquiries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  contact TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL,
  source_version TEXT
);
