# Security Policy

## Supported versions

Only the latest release receives security fixes.

## Reporting a vulnerability

**Do not open a public issue for security vulnerabilities.**

Report privately via [GitHub's private vulnerability reporting](https://github.com/JCombee/flash-for-wards-app/security/advisories/new), or email jerke1988@gmail.com.

Include: what the vulnerability is, how to reproduce it, and what an attacker could achieve. You'll get an acknowledgement within 7 days. This is a hobby project maintained in spare time — fix timelines depend on severity and are best-effort.

## Threat model

Flash For Wards is a local desktop app. It:

- reads LCU credentials from the running League client process,
- talks to the League client over HTTPS on `127.0.0.1` with `rejectUnauthorized: false` (the LCU uses a self-signed certificate; this is required and only applies to the loopback connection),
- stores rune pages and settings in a local SQLite file at `~/.flash-for-wards/data.db`,
- makes no other network requests, and ships no telemetry.

Things worth reporting: renderer code able to reach Node APIs (context isolation / preload escape), LCU credentials leaking outside the process, arbitrary file write via the DB path or import flows, or dependency vulnerabilities with a realistic path to exploitation here.

Not in scope: the LCU's self-signed certificate being unverified (unavoidable, loopback-only), or attacks that require an attacker to already have code execution on the machine.
