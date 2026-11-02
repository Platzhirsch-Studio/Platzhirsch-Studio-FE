// node --test tests/unit/stilfinder-pdflead-nobcc.test.mjs
// pdf-lead fix-03: keine verdeckte Kopie (BCC) an das Studio – sonst stimmt
// der Datenschutzsatz „nur für diesen Versand … speichern sie danach nicht“ nicht.
import { test } from "node:test";
import assert from "node:assert/strict";

const { deliverMail } = await import("../../src/lib/stilfinder/mail.js");

test("deliverMail: STILFINDER_MAIL_BCC landet in keinem Provider-Aufruf", async () => {
  const mail = { subject: "S", text: "t", html: "<p>h</p>" };
  const env = { STILFINDER_MAIL_FROM: "a@b.at", STILFINDER_MAIL_API_KEY: "k", STILFINDER_MAIL_BCC: "studio@example.invalid", STILFINDER_MAIL_WEBHOOK_URL: "https://hook.example.invalid/x", STILFINDER_MAIL_WEBHOOK_SECRET: "s" };
  const warn = console.warn;
  console.warn = () => {};
  try {
    for (const provider of ["resend", "postmark", "webhook"]) {
      const bodies = [];
      const fetchImpl = async (_url, init) => {
        bodies.push(init.body);
        return new Response("{}", { status: 200 });
      };
      await deliverMail({ provider, to: "kundin@example.invalid", mail, pdf: Buffer.from("%PDF-1.7"), filename: "m.pdf", env, fetchImpl });
      assert.equal(bodies.length, 1, provider);
      assert.doesNotMatch(bodies[0], /studio@example\.invalid/, `${provider}: keine Kopie an das Studio`);
      assert.doesNotMatch(bodies[0], /"bcc"|"Bcc"/i, provider);
    }
  } finally {
    console.warn = warn;
  }
});
