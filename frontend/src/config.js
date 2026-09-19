/**
 * CityGraph Frontend Configuration
 * Centralized API endpoint and feature flags.
 * Uses VITE_API_URL from environment with safe fallback.
 */

export const API_BASE = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');

// Gated demo login: enabled in local dev or when explicitly enabled in production
export const ENABLE_DEMO_LOGIN =
  import.meta.env.VITE_ENABLE_DEMO_LOGIN === 'true' ||
  (import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEMO_LOGIN !== 'false');
