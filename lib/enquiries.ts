import { callSupabaseRpc } from "./supabase";

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
  id: number | string;
  status: EnquiryStatus;
  created_at: string;
};

type StatsRow = {
  total: number;
  fresh: number;
  recent: number;
  services: number;
};

export async function createEnquiry(enquiry: NewEnquiry) {
  return await callSupabaseRpc<number>("hoza_create_enquiry", {
    p_name: enquiry.name,
    p_company: enquiry.company,
    p_email: enquiry.email,
    p_whatsapp: enquiry.whatsapp,
    p_country: enquiry.country,
    p_service: enquiry.service,
    p_description: enquiry.description,
    p_budget: enquiry.budget,
    p_timeline: enquiry.timeline,
  });
}

export async function listEnquiries(): Promise<Enquiry[]> {
  const rows = await callSupabaseRpc<EnquiryRow[]>("hoza_admin_list_enquiries");

  return rows.map(({ created_at: createdAt, id, ...row }) => ({
    ...row,
    id: Number(id),
    createdAt,
  }));
}

export async function getEnquiryStats(): Promise<EnquiryStats> {
  const row = await callSupabaseRpc<StatsRow>("hoza_admin_enquiry_stats");

  return {
    total: Number(row.total),
    fresh: Number(row.fresh),
    recent: Number(row.recent),
    services: Number(row.services),
  };
}

export async function updateEnquiryStatus(id: number, status: EnquiryStatus) {
  await callSupabaseRpc<void>("hoza_admin_update_enquiry_status", {
    p_id: id,
    p_status: status,
  });
}
