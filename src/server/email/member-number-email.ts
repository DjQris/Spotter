import "server-only";
import { copy } from "@/lib/copy";
import { sendMail } from "./mailer";

const color = {
  primary: "#0044e3",
  onPrimary: "#ffffff",
  surface: "#f9f9f9",
  onSurface: "#1b1b1d",
  onSurfaceVariant: "#43474f",
  surfaceContainerLowest: "#ffffff",
  surfaceContainerLow: "#edeeee",
  outlineVariant: "#d8dade",
} as const;

const fontFamily =
  "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export interface MemberNumberEmail {
  subject: string;
  text: string;
  html: string;
}

export function buildMemberNumberEmail(
  memberNumber: string
): MemberNumberEmail {
  const { subject, greeting, heading, intro, footer } = copy.memberNumberEmail;

  const text = [
    greeting,
    "",
    heading,
    "",
    intro,
    "",
    memberNumber,
    "",
    footer,
  ].join("\n");

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin:0;padding:0;background-color:${color.surface};">
    <div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(intro)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${color.surface};">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:${color.surfaceContainerLowest};border:1px solid ${color.outlineVariant};border-radius:16px;overflow:hidden;">
            <tr>
              <td style="background-color:${color.primary};padding:24px 32px;">
                <span style="font-family:${fontFamily};font-size:22px;line-height:33px;font-weight:500;color:${color.onPrimary};">Spotter</span>
              </td>
            </tr>
            <tr>
              <td style="padding:36px 32px 0 32px;">
                <p style="margin:0 0 16px 0;font-family:${fontFamily};font-size:16px;line-height:24px;font-weight:500;color:${color.onSurfaceVariant};">${escapeHtml(greeting)}</p>
                <h1 style="margin:0 0 12px 0;font-family:${fontFamily};font-size:24px;line-height:36px;font-weight:500;color:${color.onSurface};">${escapeHtml(heading)}</h1>
                <p style="margin:0 0 24px 0;font-family:${fontFamily};font-size:16px;line-height:24px;font-weight:500;color:${color.onSurfaceVariant};">${escapeHtml(intro)}</p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:0 32px 26px 32px;">
                <div style="display:inline-block;background-color:${color.surfaceContainerLow};border:1px solid ${color.outlineVariant};border-radius:12px;padding:16px 28px;font-family:${fontFamily};font-size:36px;line-height:44px;font-weight:600;letter-spacing:10px;color:${color.onSurface};">${escapeHtml(memberNumber)}</div>
              </td>
            </tr>
            <tr>
              <td style="background-color:${color.surfaceContainerLow};border-top:1px solid ${color.outlineVariant};padding:20px 32px;">
                <p style="margin:0;font-family:${fontFamily};font-size:12px;line-height:18px;font-weight:500;color:${color.onSurfaceVariant};">${escapeHtml(footer)}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, text, html };
}

export async function sendMemberNumberEmail(input: {
  to: string;
  memberNumber: string;
}): Promise<void> {
  const email = buildMemberNumberEmail(input.memberNumber);

  await sendMail({
    to: input.to,
    subject: email.subject,
    text: email.text,
    html: email.html,
  });
}
