"use client";

import { Check, Loader2, X } from "lucide-react";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";

type FormState = "idle" | "submitting" | "success" | "error";

const initialForm = {
  name: "",
  company: "",
  email: "",
  whatsapp: "",
  country: "",
  service: "",
  description: "",
  budget: "",
  timeline: "",
};

type FormKey = keyof typeof initialForm;
type FormErrors = Partial<Record<FormKey, string>>;

const validateForm = (form: typeof initialForm): FormErrors => {
  const errors: FormErrors = {};
  if (form.name.trim().length < 2) errors.name = "Please enter your name.";
  if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) errors.email = "Please enter a valid email address.";
  if (form.country.trim().length < 2) errors.country = "Please enter your country.";
  if (!form.service) errors.service = "Please choose a service.";
  if (!form.budget) errors.budget = "Please choose a budget range.";
  if (!form.timeline) errors.timeline = "Please choose a launch timeline.";
  if (form.description.trim().length < 20) errors.description = "Please add at least 20 characters about the project.";
  return errors;
};

export function EnquiryModal() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<FormState>("idle");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const successCloseRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const closeDialog = useCallback(() => {
    setOpen(false);
    window.setTimeout(() => previousFocusRef.current?.focus(), 0);
  }, []);

  useEffect(() => {
    const openDialog = () => {
      previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setOpen(true);
      setStatus("idle");
      setMessage("");
      setErrors({});
      window.setTimeout(() => firstFieldRef.current?.focus(), 80);
    };
    window.addEventListener("hoza:open-enquiry", openDialog);
    return () => window.removeEventListener("hoza:open-enquiry", openDialog);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("dialog-open", open);
    const background = document.querySelectorAll<HTMLElement>(".skip-link, header, main, footer, .floating-whatsapp, .mobile-contact-bar");
    background.forEach((element) => { element.inert = open; });
    const onKey = (event: KeyboardEvent) => {
      if (!open) return;
      if (event.key === "Escape") closeDialog();
      if (event.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>("button:not([disabled]), a, input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])");
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.classList.remove("dialog-open");
      background.forEach((element) => { element.inert = false; });
      document.removeEventListener("keydown", onKey);
    };
  }, [closeDialog, open]);

  useEffect(() => {
    if (status === "success") window.requestAnimationFrame(() => successCloseRef.current?.focus());
  }, [status]);

  const update = (key: FormKey, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const focusField = (key: FormKey) => {
    window.requestAnimationFrame(() => dialogRef.current?.querySelector<HTMLElement>(`[name="${key}"]`)?.focus());
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    const clientErrors = validateForm(form);
    const firstInvalid = Object.keys(clientErrors)[0] as FormKey | undefined;
    if (firstInvalid) {
      setErrors(clientErrors);
      setStatus("idle");
      focusField(firstInvalid);
      return;
    }

    setStatus("submitting");
    try {
      const response = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json() as { message?: string; errors?: FormErrors };
      if (!response.ok) {
        setStatus("error");
        setMessage(data.message ?? "Unable to send your request.");
        if (data.errors) {
          setErrors(data.errors);
          const firstServerError = Object.keys(data.errors)[0] as FormKey | undefined;
          if (firstServerError) focusField(firstServerError);
        }
        return;
      }
      setStatus("success");
      setForm(initialForm);
      setErrors({});
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to send your request.");
    }
  };

  if (!open) return null;

  return (
    <div className="dialog-shell" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) closeDialog(); }}>
      <div className="enquiry-dialog" role="dialog" aria-modal="true" aria-labelledby="enquiry-title" ref={dialogRef}>
        <div className="dialog-header">
          <div><span className="eyebrow">Project enquiry</span><h2 id="enquiry-title">START MOVING.</h2></div>
          <button className="dialog-close" type="button" onClick={closeDialog} aria-label="Close project enquiry"><X /></button>
        </div>

        {status === "success" ? (
          <div className="success-state" aria-live="polite">
            <div className="success-icon"><Check /></div>
            <span>SYSTEM / CONFIRMED</span>
            <h3>PROJECT REQUEST<br />RECEIVED</h3>
            <p>HOZA WILL BE IN CONTACT SHORTLY</p>
            <button ref={successCloseRef} className="button button-primary" type="button" onClick={closeDialog}>Close <span>↗</span></button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate>
            <div className="form-grid">
              <label><span>Name *</span><input ref={firstFieldRef} name="name" required maxLength={100} autoComplete="name" value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Your name" aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "name-error" : undefined} />{errors.name && <small id="name-error" className="field-error">{errors.name}</small>}</label>
              <label><span>Company</span><input name="company" maxLength={120} autoComplete="organization" value={form.company} onChange={(e) => update("company", e.target.value)} placeholder="Company or project" /></label>
              <label><span>Email *</span><input name="email" type="email" required maxLength={254} autoComplete="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="name@company.com" aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "email-error" : undefined} />{errors.email && <small id="email-error" className="field-error">{errors.email}</small>}</label>
              <label><span>WhatsApp number</span><input name="whatsapp" type="tel" maxLength={40} autoComplete="tel" value={form.whatsapp} onChange={(e) => update("whatsapp", e.target.value)} placeholder="+62 / +65 ..." /></label>
              <label><span>Country *</span><input name="country" required maxLength={80} autoComplete="country-name" value={form.country} onChange={(e) => update("country", e.target.value)} placeholder="Indonesia, Singapore..." aria-invalid={Boolean(errors.country)} aria-describedby={errors.country ? "country-error" : undefined} />{errors.country && <small id="country-error" className="field-error">{errors.country}</small>}</label>
              <label><span>Service required *</span><select name="service" required value={form.service} onChange={(e) => update("service", e.target.value)} aria-invalid={Boolean(errors.service)} aria-describedby={errors.service ? "service-error" : undefined}><option value="">Select a service</option><option>Website</option><option>Landing Page</option><option>Web Application</option><option>Mobile Application</option><option>Automation</option><option>Custom Software</option><option>Not sure yet</option></select>{errors.service && <small id="service-error" className="field-error">{errors.service}</small>}</label>
              <label><span>Estimated budget *</span><select name="budget" required value={form.budget} onChange={(e) => update("budget", e.target.value)} aria-invalid={Boolean(errors.budget)} aria-describedby={errors.budget ? "budget-error" : undefined}><option value="">Select a range</option><option>Under USD 3,000</option><option>USD 3,000–7,500</option><option>USD 7,500–15,000</option><option>USD 15,000–30,000</option><option>USD 30,000+</option><option>Need guidance</option></select>{errors.budget && <small id="budget-error" className="field-error">{errors.budget}</small>}</label>
              <label><span>Preferred launch timeline *</span><select name="timeline" required value={form.timeline} onChange={(e) => update("timeline", e.target.value)} aria-invalid={Boolean(errors.timeline)} aria-describedby={errors.timeline ? "timeline-error" : undefined}><option value="">Select a timeline</option><option>As soon as responsibly possible</option><option>Within 1 month</option><option>1–3 months</option><option>3–6 months</option><option>Flexible / exploring</option></select>{errors.timeline && <small id="timeline-error" className="field-error">{errors.timeline}</small>}</label>
              <label className="form-wide"><span>Project description *</span><textarea name="description" required minLength={20} maxLength={4000} rows={5} value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="What are you building, improving or automating? What should success look like?" aria-invalid={Boolean(errors.description)} aria-describedby={errors.description ? "description-error" : undefined} />{errors.description && <small id="description-error" className="field-error">{errors.description}</small>}</label>
            </div>
            <div className="form-footer">
              <p>By sending this request, you agree that Hoza may contact you about the project. No mailing lists. No spam.</p>
              <button className="button button-primary submit-button" type="submit" disabled={status === "submitting"}>
                {status === "submitting" ? <><Loader2 className="spin" /> Transmitting</> : <>Send Project Request <span>↗</span></>}
              </button>
            </div>
            {status === "error" && <p className="form-error" role="alert">SYSTEM ERROR / {message}</p>}
          </form>
        )}
      </div>
    </div>
  );
}
