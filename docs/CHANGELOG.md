# Changelog

All notable changes to Press! will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project setup with Next.js 14 App Router
- Supabase schema with core tables (events, games, scores)
- Alligator Teeth ledger system (double-entry accounting)
- Press mechanics for match play games
- Mock mode for development without backend
- Cloudflare R2 media proxy worker
- Documentation SSOT system

### Security
- RLS policies for all tables
- Event visibility controls (private, unlisted, public)
- Server-only environment validation

## [0.1.0] - 2024-01-15

### Added
- Project initialization
- Documentation structure
- Core architecture decisions
