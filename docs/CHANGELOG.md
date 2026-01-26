# Changelog

All notable changes to Press! will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **E1.1 Authentication** - Supabase Auth integration with email/password
  - AuthProvider context with session management
  - Login/signup pages with form validation
  - AuthHeader component with user display and logout
  - Mock mode authentication support
  - Middleware for protected routes
- **E1.2 Event Management** - Full event CRUD functionality
  - Event service layer (`src/lib/services/events.ts`)
  - CreateEventModal with form validation
  - EventForm reusable component (create/edit)
  - Event settings page with edit and delete
  - Settings tab added to event navigation
- **Dark Theme Support** - Full light/dark mode theming
  - ThemeProvider with next-themes integration
  - ThemeToggle component (sun/moon icons)
  - System preference detection with localStorage persistence
  - Enhanced dark mode color palette
- **Semantic Status Colors** - success, warning, info color tokens
  - Added to globals.css and tailwind.config.ts
  - Replaced hardcoded colors with semantic tokens
- Initial project setup with Next.js 14 App Router
- Supabase schema with core tables (events, games, scores)
- Alligator Teeth ledger system (double-entry accounting)
- Press mechanics for match play games
- Mock mode for development without backend
- Cloudflare R2 media proxy worker
- Documentation SSOT system

### Fixed
- **Dark Theme System Detection** - Theme toggle now uses `resolvedTheme` instead of `theme` to properly detect system dark mode preference
- **Docs Page Dark Mode** - Added dark mode classes to documentation page background, header, and info box
- **Landing Page Dark Mode** - Added dark mode background gradient and header with theme toggle

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
