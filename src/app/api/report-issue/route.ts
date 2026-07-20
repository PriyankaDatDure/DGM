import { NextResponse } from "next/server";
import sgMail from "@sendgrid/mail";
import { getSessionUser } from "@/lib/auth/session";

const ISSUE_SUBJECT = "DGM Forecast Form — Issue Report";

interface ReportIssueRequest {
  message?: string;
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: ReportIssueRequest;
  try {
    body = (await request.json()) as ReportIssueRequest;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const message = body.message?.trim() ?? "";
  if (!message) {
    return NextResponse.json({ error: "Message is required." }, { status: 400 });
  }
  if (message.length > 5000) {
    return NextResponse.json({ error: "Message is too long." }, { status: 400 });
  }

  const apiKey = process.env.SENDGRID_API_KEY?.trim();
  const fromEmail = process.env.SENDGRID_FROM_EMAIL?.trim();
  const toEmail =
    process.env.REPORT_ISSUE_TO_EMAIL?.trim() || "priyanka.jadhav@duretechnologies.com";

  if (!apiKey || !fromEmail) {
    return NextResponse.json(
      { error: "Issue reporting email is not configured." },
      { status: 500 }
    );
  }

  const reporter = user.fullName?.trim()
    ? `${user.fullName} (${user.username})`
    : user.username;

  const textBody = [
    "A user reported an issue from the DGM Forecast Form.",
    "",
    `Reporter: ${reporter}`,
    `User ID: ${user.userId}`,
    `Role: ${user.role}`,
    `Submitted: ${new Date().toISOString()}`,
    "",
    "Message:",
    message,
  ].join("\n");

  try {
    sgMail.setApiKey(apiKey);
    await sgMail.send({
      to: toEmail,
      from: fromEmail,
      subject: ISSUE_SUBJECT,
      text: textBody,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Report issue email error:", error);
    return NextResponse.json(
      { error: "Unable to send the issue report. Please try again." },
      { status: 502 }
    );
  }
}
