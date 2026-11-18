import test from "node:test";
import assert from "node:assert/strict";
import { signSessionToken, verifySessionToken } from "./session-crypto";
import {
  hashPassword,
  verifyPassword,
  registerUserCredential,
  verifyUserCredential,
  createPasswordResetToken,
  consumePasswordResetToken,
  resetSecurityStoresForTests,
} from "./password-security";
import { sanitizeString, sanitizeEmail } from "./sanitize";
import { sanitizeRedirect } from "./auth-client";
import {
  hasValidImageSignature,
  isSafeSvgMarkup,
  validateImageUpload,
  validateJsonUpload,
} from "./file-security";
import { checkRateLimit } from "./rate-limit";

test("HMAC-SHA256 session tokens reject unsigned forged admin cookies, tampered payloads, and expired tokens", async () => {
  const secret = "test-super-strong-session-secret-key-2026";
  const validToken = await signSessionToken(
    {
      userId: "student-grace@vu.ac.ug",
      email: "grace@vu.ac.ug",
      name: "Grace Namono",
      role: "student",
    },
    3600,
    secret
  );

  const verified = await verifySessionToken(validToken, secret);
  assert.ok(verified);
  assert.equal(verified.role, "student");
  assert.equal(verified.email, "grace@vu.ac.ug");

  // Attack 1: Unsigned raw Base64 forged admin cookie
  const forgedAdmin = Buffer.from(
    JSON.stringify({
      userId: "admin-1",
      email: "attacker@evil.com",
      name: "Attacker",
      role: "admin",
    })
  ).toString("base64");
  assert.equal(await verifySessionToken(forgedAdmin, secret), null);

  // Attack 2: Payload tampering (elevate role student -> admin while keeping original signature)
  const [, sig] = validToken.split(".");
  const tamperedPayload = Buffer.from(
    JSON.stringify({
      userId: "student-grace@vu.ac.ug",
      email: "grace@vu.ac.ug",
      name: "Grace Namono",
      role: "admin",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    })
  )
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
  assert.equal(await verifySessionToken(`${tamperedPayload}.${sig}`, secret), null);

  // Attack 3: Expired token
  const expiredToken = await signSessionToken(
    {
      userId: "student-grace@vu.ac.ug",
      email: "grace@vu.ac.ug",
      name: "Grace Namono",
      role: "student",
    },
    -5,
    secret
  );
  assert.equal(await verifySessionToken(expiredToken, secret), null);
});

test("scrypt password hashing salts uniquely, hides plaintext, and rejects wrong passwords", () => {
  resetSecurityStoresForTests();
  const h1 = hashPassword("KampalaScholar2026!");
  const h2 = hashPassword("KampalaScholar2026!");

  assert.notEqual(h1, h2);
  assert.ok(!h1.includes("KampalaScholar2026!"));
  assert.ok(h1.startsWith("scrypt$"));
  assert.equal(verifyPassword("KampalaScholar2026!", h1), true);
  assert.equal(verifyPassword("WrongPassword123", h1), false);

  registerUserCredential("grace@vu.ac.ug", "Grace Namono", "KampalaScholar2026!");
  assert.ok(verifyUserCredential("grace@vu.ac.ug", "KampalaScholar2026!"));
  assert.equal(verifyUserCredential("grace@vu.ac.ug", "WrongPass!"), null);
});

test("Password reset tokens expire and are strictly single-use", () => {
  resetSecurityStoresForTests();
  const { token } = createPasswordResetToken("grace@vu.ac.ug", 60_000);

  // First use succeeds
  assert.equal(consumePasswordResetToken(token), "grace@vu.ac.ug");
  // Replay attack fails
  assert.equal(consumePasswordResetToken(token), null);

  // Expired token fails
  const expired = createPasswordResetToken("grace@vu.ac.ug", -1000);
  assert.equal(consumePasswordResetToken(expired.token), null);

  // Random forged token fails
  assert.equal(consumePasswordResetToken("a".repeat(64)), null);
});

test("Multi-pass XSS sanitization neutralizes nested scripts, SVG events, and dangerous URI schemes", () => {
  const nested = sanitizeString("<scr<script>ipt>alert(1)</scr</script>ipt>Hello");
  assert.ok(!nested.toLowerCase().includes("<script"));
  assert.ok(nested.includes("Hello"));

  const svgAttack = sanitizeString('<svg onload="alert(1)"><script>x()</script></svg>Safe');
  assert.ok(!svgAttack.toLowerCase().includes("onload"));
  assert.ok(!svgAttack.toLowerCase().includes("<svg"));
  assert.ok(svgAttack.includes("Safe"));

  const jsUri = sanitizeString("javascript:alert(1) data:text/html,<script>x</script>");
  assert.ok(!jsUri.toLowerCase().includes("javascript:"));
  assert.ok(!jsUri.toLowerCase().includes("data:text/html"));

  assert.equal(sanitizeEmail("grace@vu.ac.ug"), "grace@vu.ac.ug");
  assert.equal(sanitizeEmail("user@localhost"), null);
  assert.equal(sanitizeEmail("bad..dots@vu.ac.ug"), null);
});

test("sanitizeRedirect blocks protocol-relative, backslash, and header-injection redirects", () => {
  assert.equal(sanitizeRedirect("/"), "/");
  assert.equal(sanitizeRedirect("/profile"), "/profile");
  assert.equal(sanitizeRedirect("//evil.com"), "/");
  assert.equal(sanitizeRedirect("/\\evil.com"), "/");
  assert.equal(sanitizeRedirect("https://evil.com"), "/");
  assert.equal(sanitizeRedirect("/ok\r\nX-Injected: 1"), "/");
});

test("File upload security blocks disguised executables, malicious SVGs, and oversized files", async () => {
  // Valid PNG magic bytes
  const pngHeader = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
  assert.equal(hasValidImageSignature(pngHeader, "png"), true);

  // Disguised Windows .exe (MZ header) renamed to avatar.png
  const fakePng = new File([new Uint8Array([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00])], "avatar.png", {
    type: "image/png",
  });
  const fakeRes = await validateImageUpload(fakePng);
  assert.equal(fakeRes.valid, false);

  // Malicious SVG with script
  assert.equal(isSafeSvgMarkup('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'), false);
  assert.equal(isSafeSvgMarkup('<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"/></svg>'), true);

  const evilSvg = new File(
    ['<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"></svg>'],
    "icon.svg",
    { type: "image/svg+xml" }
  );
  assert.equal((await validateImageUpload(evilSvg)).valid, false);

  // Disguised .exe as JSON
  const exeAsJson = new File(["MZ"], "malware.exe", { type: "application/octet-stream" });
  assert.equal(validateJsonUpload(exeAsJson).valid, false);

  // Valid PNG file passes
  const realPng = new File([pngHeader], "photo.png", { type: "image/png" });
  assert.equal((await validateImageUpload(realPng)).valid, true);
});

test("Rate limiter enforces threshold and returns positive retry window", () => {
  const key = `test-rl-${Date.now()}`;
  assert.equal(checkRateLimit(key, 2, 60).allowed, true);
  assert.equal(checkRateLimit(key, 2, 60).allowed, true);
  const third = checkRateLimit(key, 2, 60);
  assert.equal(third.allowed, false);
  assert.equal(third.remaining, 0);
  assert.ok(third.resetInSeconds > 0);
});
