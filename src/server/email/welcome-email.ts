import "server-only";
import { copy } from "@/lib/copy";
import { sendMail } from "./mailer";

// Email clients strip CSS variables, so these are the values the semantic roles
// in src/styles/tokens.css resolve to. Each key names the token it mirrors.
// When tokens.css changes, update these to match.
const color = {
  primary: "#0044e3", // --color-primary
  onPrimary: "#ffffff", // --color-on-primary
  surface: "#f9f9f9", // --color-surface
  onSurface: "#1b1b1d", // --color-on-surface
  onSurfaceVariant: "#43474f", // --color-on-surface-variant
  surfaceContainerLowest: "#ffffff", // --color-surface-container-lowest
  surfaceContainerLow: "#edeeee", // --color-surface-container-low
  outlineVariant: "#d8dade", // --color-outline-variant
} as const;

// --font-family-base
const fontFamily = "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

interface TypeStyle {
  size: number;
  lineHeight: number;
  weight: number;
  letterSpacing: number;
}

// --typography-<role>-* in src/styles/tokens.css
const typography = {
  titleLarge: { size: 22, lineHeight: 33, weight: 500, letterSpacing: -1 },
  headlineSmall: { size: 24, lineHeight: 36, weight: 500, letterSpacing: -0.75 },
  bodyLarge: { size: 16, lineHeight: 24, weight: 500, letterSpacing: -0.95 },
  bodySmall: { size: 12, lineHeight: 18, weight: 500, letterSpacing: -0.4 },
} as const satisfies Record<string, TypeStyle>;

function typeStyle(style: TypeStyle, textColor: string): string {
  return [
    `font-family:${fontFamily}`,
    `font-size:${style.size}px`,
    `line-height:${style.lineHeight}px`,
    `font-weight:${style.weight}`,
    `letter-spacing:${style.letterSpacing}px`,
    `color:${textColor}`,
  ].join(";");
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export interface WelcomeEmail {
  subject: string;
  text: string;
  html: string;
}

export function buildWelcomeEmail(name: string): WelcomeEmail {
  const { subject, greeting, heading, intro, features, footer } = copy.welcomeEmail;
  const safeName = escapeHtml(name);

  const text = [
    greeting(name),
    "",
    heading,
    "",
    intro,
    "",
    ...features.map((feature) => `- ${feature}`),
    "",
    footer,
  ].join("\n");

  const featureRows = features
    .map(
      (feature) => `
                <tr>
                  <td style="vertical-align:top;padding:0 12px 10px 0;width:8px;">
                    <div style="width:8px;height:8px;margin-top:8px;border-radius:2px;background-color:${color.primary};"></div>
                  </td>
                  <td style="padding:0 0 10px 0;${typeStyle(typography.bodyLarge, color.onSurface)};">${escapeHtml(feature)}</td>
                </tr>`
    )
    .join("");

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(subject)}</title>
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@500;600&display=swap" rel="stylesheet" />
  </head>
  <body style="margin:0;padding:0;background-color:${color.surface};">
    <div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(intro)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${color.surface};">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:${color.surfaceContainerLowest};border:1px solid ${color.outlineVariant};border-radius:16px;overflow:hidden;">
            <tr>
              <td style="background-color:${color.primary};padding:24px 32px;">
                <span style="${typeStyle(typography.titleLarge, color.onPrimary)};">Spotter</span>
              </td>
            </tr>
            <tr>
              <td style="padding:36px 32px 0 32px;">
                <p style="margin:0 0 16px 0;${typeStyle(typography.bodyLarge, color.onSurfaceVariant)};">${greeting(safeName)}</p>
                <h1 style="margin:0 0 12px 0;${typeStyle(typography.headlineSmall, color.onSurface)};">${escapeHtml(heading)}</h1>
                <p style="margin:0 0 24px 0;${typeStyle(typography.bodyLarge, color.onSurfaceVariant)};">${escapeHtml(intro)}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 26px 32px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  ${featureRows}
                </table>
              </td>
            </tr>
            <tr>
              <td style="background-color:${color.surfaceContainerLow};border-top:1px solid ${color.outlineVariant};padding:20px 32px;">
                <p style="margin:0;${typeStyle(typography.bodySmall, color.onSurfaceVariant)};">${escapeHtml(footer)}</p>
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

export async function sendWelcomeEmail(input: { to: string; name: string }): Promise<void> {
  const email = buildWelcomeEmail(input.name);

  await sendMail({
    to: input.to,
    subject: email.subject,
    text: email.text,
    html: email.html,
  });
}
