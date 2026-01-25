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

## [0.1.0] - 2025-01-25

### Added
- Project initialization with Next.js 14 App Router
- Full documentation structure (51 docs)
- Database schema with 3 migrations (init, RLS, RPCs)
- Domain logic for press creation and settlement computation
- 26 unit tests with Vitest
- Mock mode with demo data
- Cloudflare R2 media proxy worker scaffold
- UI components: Button, Card, Input, GameCard, CreatePressModal, SettlementLedger
- App routes: landing, dashboard, event pages (scorecard, games, settlement, feed, chat, admin)
- Zustand store setup
- TypeScript types for core entities

### Infrastructure
- Supabase integration setup
- Tailwind CSS with shadcn/ui patterns
- ESLint and Prettier configuration
