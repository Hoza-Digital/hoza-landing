import { getDatabase } from "./database";

export const ENQUIRY_STATUSES = ["new", "reviewing", "contacted", "archived"] as const;

export type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number];

export type NewEnquiry = {
  name: string;
  company: string;
  email: string;
  whatsapp: string;
  country: string;
  service: string;
  description: string;
  budget: string;
  timeline: string;
};

export type Enquiry = NewEnquiry & {
  id: number;
  status: EnquiryStatus;
  createdAt: string;
};

export type EnquiryStats = {
  total: number;
  fresh: number;
  recent: number;
  services: number;
};

type EnquiryRow = NewEnquiry & {
  id: number;
  status: EnquiryStatus;
  created_at: string;
};

type StatsRow = {
  total: number;
  fresh: number;
  recent: number;
  services: number;
};

export function createEnquiry(enquiry: NewEnquiry) {
  const result = getDatabase()
    .prepare(`
      INSERT INTO enquiries (
        name, company, email, whatsapp, country, service,
        description, budget, timeline, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?)
    `)
    .run(
      enquiry.name,
      enquiry.company,
      enquiry.email,
      enquiry.whatsapp,
      enquiry.country,
      enquiry.service,
      enquiry.description,
      enquiry.budget,
      enquiry.timeline,
      new Date().toISOString(),
    );

  return Number(result.lastInsertRowid);
}

export function listEnquiries(): Enquiry[] {
  const rows = getDatabase()
    .prepare(`
      SELECT id, name, company, email, whatsapp, country, service,
             description, budget, timeline, status, created_at
      FROM enquiries
      ORDER BY created_at DESC
      LIMIT 500
    `)
    .all() as unknown as EnquiryRow[];

  return rows.map(({ created_at: createdAt, ...row }) => ({ ...row, createdAt }));
}

export function getEnquiryStats(): EnquiryStats {
  const row = getDatabase()
    .prepare(`
      SELECT
        COUNT(*) AS total,
        COALESCE(SUM(status = 'new'), 0) AS fresh,
        COALESCE(SUM(created_at >= datetime('now', '-30 days')), 0) AS recent,
        COUNT(DISTINCT service) AS services
      FROM enquiries
    `)
    .get() as unknown as StatsRow;

  return {
    total: Number(row.total),
    fresh: Number(row.fresh),
    recent: Number(row.recent),
    services: Number(row.services),
  };
}

export function updateEnquiryStatus(id: number, status: EnquiryStatus) {
  getDatabase()
    .prepare("UPDATE enquiries SET status = ? WHERE id = ?")
    .run(status, id);
}
