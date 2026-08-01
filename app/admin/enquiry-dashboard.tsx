"use client";

import {
  ArrowUpRight,
  ChevronDown,
  CircleDot,
  Clock3,
  Inbox,
  Mail,
  Search,
  Sparkles,
  Tags,
} from "lucide-react";
import { useDeferredValue, useState } from "react";
import type { Enquiry, EnquiryStats, EnquiryStatus } from "@/lib/enquiries";
import { changeEnquiryStatus } from "./actions";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Jakarta",
});

const statusLabels: Record<EnquiryStatus, string> = {
  new: "New",
  reviewing: "Reviewing",
  contacted: "Contacted",
  archived: "Archived",
};

type AdminStatsProps = {
  stats: EnquiryStats;
};

type ProjectSignalsProps = {
  enquiries: Enquiry[];
};

function whatsappUrl(number: string) {
  const digits = number.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : "";
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function AdminStats({ stats }: AdminStatsProps) {
  const statCards = [
    { label: "Total enquiries", value: stats.total, note: "All captured leads", icon: Inbox },
    { label: "New signals", value: stats.fresh, note: "Waiting for review", icon: Sparkles },
    { label: "Last 30 days", value: stats.recent, note: "Recent momentum", icon: Clock3 },
    { label: "Service mix", value: stats.services, note: "Distinct interests", icon: Tags },
  ];

  return (
    <section className="admin-stats" aria-label="Enquiry summary">
      {statCards.map((card) => {
        const Icon = card.icon;
        return (
          <article key={card.label} className="admin-stat-card">
            <div><span>{card.label}</span><Icon aria-hidden="true" /></div>
            <strong>{String(card.value).padStart(2, "0")}</strong>
            <p>{card.note}</p>
          </article>
        );
      })}
    </section>
  );
}

export function ProjectSignals({ enquiries }: ProjectSignalsProps) {
  const [query, setQuery] = useState("");
  const [service, setService] = useState("all");
  const [status, setStatus] = useState("all");
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const services = Array.from(new Set(enquiries.map((enquiry) => enquiry.service))).sort();

  const visibleEnquiries = enquiries.filter((enquiry) => {
    const matchesQuery =
      !deferredQuery ||
      [enquiry.name, enquiry.company, enquiry.email, enquiry.country, enquiry.description]
        .join(" ")
        .toLowerCase()
        .includes(deferredQuery);
    const matchesService = service === "all" || enquiry.service === service;
    const matchesStatus = status === "all"
      ? enquiry.status !== "archived"
      : enquiry.status === status;
    return matchesQuery && matchesService && matchesStatus;
  });

  return (
      <section className="admin-leads-section">
        <div className="admin-section-heading">
          <div>
            <span className="eyebrow">Incoming requests</span>
            <h2>PROJECT<br />SIGNALS.</h2>
          </div>
          <p><CircleDot aria-hidden="true" /> Live data from the website enquiry form</p>
        </div>

        <div className="admin-filters">
          <label className="admin-search">
            <span className="sr-only">Search enquiries</span>
            <Search aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, company, email or brief"
            />
          </label>
          <label>
            <span className="sr-only">Filter by service</span>
            <select value={service} onChange={(event) => setService(event.target.value)}>
              <option value="all">All services</option>
              {services.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label>
            <span className="sr-only">Filter by status</span>
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="all">All statuses</option>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="admin-results-line" aria-live="polite">
          <span>{visibleEnquiries.length} of {enquiries.length} enquiries</span>
          <i />
        </div>

        {visibleEnquiries.length ? (
          <div className="admin-enquiry-grid">
            {visibleEnquiries.map((enquiry) => {
              const whatsapp = whatsappUrl(enquiry.whatsapp);
              return (
                <article className="admin-enquiry-card" key={enquiry.id}>
                  <header>
                    <div className="admin-avatar" aria-hidden="true">{initials(enquiry.name)}</div>
                    <div>
                      <span>REQUEST / {String(enquiry.id).padStart(4, "0")}</span>
                      <h3>{enquiry.name}</h3>
                      <p>{enquiry.company || "Independent project"}</p>
                    </div>
                    <span className="admin-status" data-status={enquiry.status}>
                      <i /> {statusLabels[enquiry.status]}
                    </span>
                  </header>

                  <div className="admin-enquiry-meta">
                    <div><span>Service</span><strong>{enquiry.service}</strong></div>
                    <div><span>Budget</span><strong>{enquiry.budget}</strong></div>
                    <div><span>Timeline</span><strong>{enquiry.timeline}</strong></div>
                    <div><span>Received</span><strong>{dateFormatter.format(new Date(enquiry.createdAt))} WIB</strong></div>
                  </div>

                  <div className="admin-contact-row">
                    <a href={`mailto:${enquiry.email}`}><Mail aria-hidden="true" /> {enquiry.email}</a>
                    {whatsapp ? (
                      <a href={whatsapp} target="_blank" rel="noreferrer">
                        WhatsApp <ArrowUpRight aria-hidden="true" />
                      </a>
                    ) : <span>No WhatsApp supplied</span>}
                    <span>{enquiry.country}</span>
                  </div>

                  <details className="admin-brief">
                    <summary>Open full project brief <ChevronDown aria-hidden="true" /></summary>
                    <div>
                      <span>PROJECT DESCRIPTION</span>
                      <p>{enquiry.description}</p>
                    </div>
                  </details>

                  <form
                    className="admin-status-form"
                    action={changeEnquiryStatus}
                    key={`${enquiry.id}-${enquiry.status}`}
                  >
                    <input type="hidden" name="id" value={enquiry.id} />
                    <label>
                      <span>Workflow status</span>
                      <select name="status" defaultValue={enquiry.status}>
                        {Object.entries(statusLabels).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </label>
                    <button type="submit">Update status <ArrowUpRight aria-hidden="true" /></button>
                  </form>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="admin-empty-state">
            <span>NO MATCHING SIGNALS</span>
            <h3>WAITING FOR<br />THE NEXT MOVE.</h3>
            <p>New project requests will appear here as soon as the website form is submitted.</p>
          </div>
        )}
      </section>
  );
}
