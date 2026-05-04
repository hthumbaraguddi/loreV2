# Implementation Plan: AI Integration (Phase 6)

## Overview

Implement the generic AI provider architecture for Lore. The core pattern is a `Provider_Registry`-driven design: all provider metadata lives in one static constant, and every service and UI component reads from it dynamically. Adding a new provider requires only a registry entry.

## Tasks

- [x] 1. Create Provider_Registry
  - Create `src/app/core/config/provider-registry.ts` with `ProviderDefinition` and `ModelDefinition` interfaces
  - Define the `PROVIDER_REGISTRY` array with initial entries for Anthropic, OpenAI, and Google
  - Export `PROVIDER_MAP` as a `Map<string, ProviderDefinition>` for O(1) lookups
  - Each entry must include: `id`, `displayName`, `logoAsset`, `keyPlaceholder`, `keyPattern`, `getApiKeyUrl`, `apiBaseUrl`, `defaultModel`, `availableModels`
  - _Requirements: FR-2.7, US-1.1_

- [x] 2. Create crypto utilities
  - Create `src/app/shared/utils/crypto.util.ts` with `encrypt(plaintext: string): Promise<string>` and `decrypt(ciphertext: string): Promise<string>` using the Web Crypto API
  - Implement key derivation from a session-scoped value
  - Export functions individually (no class wrapper needed)
  - _Requirements: FR-2.2, FR-2.3, NFR-1_

  - [ ]* 2.1 Write property test for encryption round-trip
    - **Property 5: Encryption round-trip preserves key**
    - For any string, `decrypt(encrypt(key))` must equal the original key
    - Tag: `// Feature: ai-integration, Property 5: encryption round-trip preserves key`
    - Use `fc.string({ minLength: 1 })`, minimum 100 runs
    - **Validates: Requirements FR-2.3**

- [x] 3. Create API_Key_Manager service
  - Create `src/app/core/services/api-key-manager.service.ts`
  - Implement `setKey(providerId: string, key: string): Promise<void>` — encrypts and writes to `lore.ai.key.{providerId}`
  - Implement `getKey(providerId: string): Promise<string | null>` — reads and decrypts
  - Implement `clearKey(providerId: string): Promise<void>` and `clearAllKeys(): Promise<void>`
  - Implement `hasKey(providerId: string): boolean` using a Signal-backed set
  - Implement `validateKeyFormat(providerId: string, key: string): boolean` — delegates to `PROVIDER_MAP.get(providerId)?.keyPattern.test(key)`
  - Implement `testConnection(providerId: string): Promise<ConnectionResult>`
  - Expose `configuredProviderIds: Signal<string[]>` and `connectionStatus: Signal<Map<string, ConnectionStatus>>`
  - No `'claude' | 'gpt'` union types anywhere in this file
  - _Requirements: FR-2.1, FR-2.2, FR-2.3, FR-2.4, FR-2.5, FR-2.6_

  - [ ]* 3.1 Write property test: valid key accepted and persisted
    - **Property 2: Valid key format accepted and persisted**
    - For any provider in the registry and any string matching that provider's `keyPattern`, `setKey` then `getKey` must return the original value
    - Tag: `// Feature: ai-integration, Property 2: valid key format accepted and persisted`
    - Use `fc.constantFrom(...PROVIDER_REGISTRY)` + `fc.string().filter(...)`, minimum 100 runs
    - **Validates: Requirements US-1.4, FR-2.1, FR-2.3**

  - [ ]* 3.2 Write property test: invalid key format rejected
    - **Property 3: Invalid key format rejected**
    - For any provider and any string NOT matching that provider's `keyPattern`, `validateKeyFormat` must return `false` and nothing must be written to localStorage
    - Tag: `// Feature: ai-integration, Property 3: invalid key format rejected`
    - Use `fc.string().filter(s => !provider.keyPattern.test(s))`, minimum 100 runs
    - **Validates: Requirements US-1.5, FR-2.4**

  - [ ]* 3.3 Write property test: keys never stored in plaintext
    - **Property 4: API keys are never stored in plaintext**
    - For any provider ID and any key string, the value at `localStorage.getItem('lore.ai.key.{providerId}')` must not equal the plaintext key
    - Tag: `// Feature: ai-integration, Property 4: API keys never stored in plaintext`
    - Use `fc.string({ minLength: 10 })`, minimum 100 runs
    - **Validates: Requirements FR-2.2, NFR-1**

  - [ ]* 3.4 Write property test: configured providers list invariant
    - **Property 6: Configured providers list invariant**
    - For any sequence of save/delete operations, `configuredProviderIds()` must contain exactly one entry per provider with a stored key — no duplicates
    - Tag: `// Feature: ai-integration, Property 6: configured providers list invariant`
    - Use `fc.array(fc.constantFrom(...PROVIDER_REGISTRY.map(p => p.id)))`, minimum 100 runs
    - **Validates: Requirements US-1.6, US-1.9**

- [ ] 4. Checkpoint — core services
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Create AIService
  - Create `src/app/core/services/ai.service.ts` and `src/app/core/models/ai.model.ts`
  - Define `AIOptions`, `AIStreamChunk`, and `AIResponseData` interfaces — use `providerId: string`, not a union type
  - Implement `sendPrompt(providerId: string, prompt: string, options?: AIOptions): Observable<AIStreamChunk>`
  - Implement `cancelRequest(requestId: string): void` and `getModels(providerId: string): ModelDefinition[]`
  - Implement private `ProviderAdapter` interface with `buildRequest` and `parseStreamChunk` methods
  - Add concrete adapters for Anthropic (SSE: `content_block_delta`), OpenAI (SSE: `data: [DONE]`), and Google (SSE: `candidates`)
  - Dispatch to the correct adapter via `PROVIDER_MAP.get(providerId)` — no `if (provider === 'claude')` branches
  - _Requirements: FR-1, US-2_

- [x] 6. Create AI Providers settings tab
  - Create `src/app/features/settings/ai-providers/ai-providers.component.ts`, `.html`, `.scss`
  - Populate the provider `<select>` from `PROVIDER_REGISTRY` — no hardcoded provider names in the template
  - On provider selection, render the API key `<input type="password">` with the registry's `keyPlaceholder` and a "Get API Key" `<a>` pointing to `getApiKeyUrl` (opens in new tab)
  - On save, call `validateKeyFormat` first; display an inline error if invalid, call `setKey` if valid
  - Render a `Provider_Card` for each entry in `configuredProviderIds()` showing: logo, display name, connection status badge, Test / Edit / Delete buttons
  - Implement edit action: re-populate the provider selector and key input with existing provider data
  - Implement delete action: call `clearKey(providerId)` and remove the card
  - Render empty state (`🤖 No AI providers configured`) when `configuredProviderIds().length === 0`
  - Render a "Danger Zone" card with a "Clear All API Keys" button that calls `clearAllKeys()` after confirmation
  - All form inputs must have associated `<label>` elements; provider cards use `role="list"` / `role="listitem"`; connection status uses `aria-live="polite"`
  - _Requirements: FR-4, US-1.1–US-1.10_

  - [ ]* 6.1 Write property test: provider selection renders correct fields
    - **Property 1: Provider selection renders correct fields**
    - For any provider ID in the registry, selecting that provider must render an input whose placeholder matches `keyPlaceholder` and a link whose `href` matches `getApiKeyUrl`
    - Tag: `// Feature: ai-integration, Property 1: provider selection renders correct fields`
    - Use `fc.constantFrom(...PROVIDER_REGISTRY.map(p => p.id))`, minimum 100 runs
    - **Validates: Requirements US-1.2**

  - [ ]* 6.2 Write property test: edit pre-populates with saved data
    - **Property 7: Edit pre-populates with saved data**
    - For any configured provider, activating edit must show that provider as selected and the key input as non-empty
    - Tag: `// Feature: ai-integration, Property 7: edit pre-populates with saved data`
    - Use `fc.constantFrom(...PROVIDER_REGISTRY.map(p => p.id))`, minimum 100 runs
    - **Validates: Requirements US-1.7**

  - [ ]* 6.3 Write property test: delete removes card and clears storage
    - **Property 8: Delete removes card and clears storage**
    - For any configured provider, activating delete must remove the card AND result in `hasKey(providerId) === false`
    - Tag: `// Feature: ai-integration, Property 8: delete removes card and clears storage`
    - Use `fc.constantFrom(...PROVIDER_REGISTRY.map(p => p.id))`, minimum 100 runs
    - **Validates: Requirements US-1.8**

  - [ ]* 6.4 Write property test: clear all removes every provider key
    - **Property 9: Clear all removes every provider key**
    - For any non-empty set of configured providers, `clearAllKeys()` must result in `configuredProviderIds()` being empty and no `lore.ai.key.*` entries in localStorage
    - Tag: `// Feature: ai-integration, Property 9: clear all removes every provider key`
    - Use `fc.array(fc.constantFrom(...PROVIDER_REGISTRY.map(p => p.id)), { minLength: 1 })`, minimum 100 runs
    - **Validates: Requirements FR-2.6, FR-4.7**

- [x] 7. Update SettingsPanelComponent
  - Modify `src/app/features/settings/settings-panel.component.ts` to add the "AI Providers" tab
  - Import and declare `AIProvidersComponent` in the module/standalone imports
  - Wire the tab into the existing tab navigation — minimal changes only
  - _Requirements: FR-4.1_

- [ ] 8. Checkpoint — settings UI
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Update AskAIBlockComponent
  - Modify `src/app/features/blocks/ask-ai-block/ask-ai-block.component.ts`
  - Change `@Input() provider` type from `'claude' | 'gpt'` to `string`; default to `'anthropic'`
  - Derive block title and badge from `PROVIDER_MAP.get(provider)?.displayName`
  - Connect prompt submission to `AIService.sendPrompt(provider, prompt, options)`
  - Implement streaming response display, loading state, error state, copy-to-clipboard, and regenerate
  - Implement response history (store multiple `AIResponseData` entries, navigate between them)
  - Support `Cmd+Enter` / `Ctrl+Enter` keyboard shortcut for submission
  - _Requirements: US-2, US-3, FR-3_

- [x] 10. Create AskGPTBlockComponent
  - Create `src/app/features/blocks/ask-gpt-block/ask-gpt-block.component.ts` (and `.html`, `.scss`)
  - Thin wrapper that renders `<app-ask-ai-block [provider]="'openai'"></app-ask-ai-block>`
  - Distinct badge/icon for OpenAI branding
  - _Requirements: US-2, FR-3_

- [x] 11. Update slash palette
  - Modify `src/app/features/blocks/slash-palette/slash-palette.component.ts`
  - Ensure "Ask Claude" command creates a block with `providerId: 'anthropic'`
  - Ensure "Ask GPT" command creates a block with `providerId: 'openai'`
  - Verify icons and search/filter work for both entries
  - _Requirements: US-2_

- [x] 12. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- All 9 correctness properties from the design must be covered by property-based tests using **fast-check**
- Each property test runs a minimum of 100 iterations
- No `'claude' | 'gpt'` union types should remain in any service interface after this implementation
- Adding a fourth provider (e.g. Mistral) requires only a new entry in `PROVIDER_REGISTRY` — no other code changes
- `SettingsPanelComponent` is a god node (36 edges per graph report) — keep changes to it minimal
