import { NextResponse } from "next/server";
import { z } from "zod";
import { createEnquiry } from "@/lib/enquiries";

const enquirySchema = z.object({
  name: z.string().trim().min(2, "Please enter your name.").max(100),
  company: z.string().trim().max(120).optional().default(""),
  email: z.string().trim().email("Please enter a valid email address."),
  whatsapp: z.string().trim().max(40).optional().default(""),
  country: z.string().trim().min(2, "Please enter your country.").max(80),
  service: z.string().trim().min(2, "Please choose a service.").max(80),
  description: z.string().trim().min(20, "Please add a little more detail about the project.").max(4000),
  budget: z.string().trim().min(2, "Please choose a budget range.").max(80),
  timeline: z.string().trim().min(2, "Please choose a launch timeline.").max(100),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = enquirySchema.safeParse(body);

    if (!parsed.success) {
      const errors = Object.fromEntries(
        Object.entries(parsed.error.flatten().fieldErrors)
          .filter(([, messages]) => messages?.length)
          .map(([field, messages]) => [field, messages?.[0]]),
      );
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message ?? "Please check the form and try again.", errors },
        { status: 400 },
      );
    }

    const enquiryId = createEnquiry(parsed.data);
    const webhook = process.env.CRM_WEBHOOK_URL;
    if (webhook) {
      const response = await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enquiryId,
          source: "hoza-website",
          receivedAt: new Date().toISOString(),
          ...parsed.data,
        }),
        signal: AbortSignal.timeout(8000),
      });

      if (!response.ok) {
        console.error("CRM webhook rejected enquiry", response.status);
      }
    } else {
      console.info("Hoza enquiry stored", { enquiryId });
    }

    return NextResponse.json({ ok: true, enquiryId }, { status: 201 });
  } catch (error) {
    console.error("Enquiry route error", error);
    return NextResponse.json({ message: "The request could not be processed right now." }, { status: 500 });
  }
}
