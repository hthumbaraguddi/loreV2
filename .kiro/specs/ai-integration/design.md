# AI Integration - Phase 6 Design

## Overview

This design covers the generic AI provider architecture for Lore's Phase 6 AI integration. The core shift from the previous design is replacing hardcoded Claude/GPT-specific code with a **Provider_Registry**-driven approach: all provider metadata lives in one place, and every service and UI component reads from it dynamically. Adding a new provider requires only a registry entry — no code changes elsewhere.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          UI Layer                               │
├─────────────────────────────────────────────────────────────────┤
│  AskAIBlockComponent    SettingsPanelComponent                  │
│  (provider: string)          │                                  │
│         │               AIProvidersTab                          │
│         │                    │                                  │
│         │         ┌──────────┴──────────┐                       │
│         │         │  ProviderCard (×N)  │                       │
│         │         │  ProviderSelector   │                       │
│         │         └─────────────────────┘                       │
├─────────┼───────────────────────────────────────────────────────┤
│         │              Service Layer                            │
├─────────┼───────────────────────────────────────────────────────┤
│         ▼                    ▼                                  │
│     AIService          API_Key_Manager                          │
│         │                    │                                  │
│         └──────────┬─────────┘                                  │
│                    ▼                                            │
│             Provider_Registry                                   │
│          (static, single source of truth)                       │
├────────────────────────────────────────────────────────────────┤
│                       Storage Layer                             │
├────────────────────────────────────────────────────────────────┤
│         HTTP Client                LocalStorageService          │
│              │                            │                     │
│              ▼                            ▼                     │
│     Provider API Endpoints        Encrypted Key Store           │
└────────────────────────────────────────────────────────────────┘
```

**Key design decisions:**

- `Provider_Registry` is the single source of truth for all provider metadata. Neither the UI nor the services hard-code provider IDs, names, or URLs.
- `API_Key_Manager` accepts a `providerId: string` parameter everywhere — no `'claude' | 'gpt'` union types.
- `AIService` uses `providerId: string` so new providers are supported without touching service code.
- `SettingsPanelComponent` (god node, 36 edges) is updated minimally — only the AI Providers tab content changes.

---

## Components and Interfaces

### 1. Provider_Registry (`core/config/provider-registry.ts`)

A static constant — not a service, no DI overhead. Exported as a plain array and a lookup map.

```typescript
export interface ProviderDefinition {
  id: string;                  // e.g. 'anthropic', 'openai', 'google'
  displayName: string;         // e.g. 'Anthropic Claude'
  logoAsset: string;           // e.g. 'assets/providers/anthropic.svg'
  keyPlaceholder: string;      // e.g. 'sk-ant-...'
  keyPattern: RegExp;          // validation regex for key format
  getApiKeyUrl: string;        // URL opened in new tab
  apiBaseUrl: string;          // base URL for API calls
  defaultModel: string;        // default model ID
  availableModels: ModelDefinition[];
}

export interface ModelDefinition {
  id: string;
  displayName: string;
}

export const PROVIDER_REGISTRY: ProviderDefinition[] = [
  {
    id: 'anthropic',
    displayName: 'Anthropic Claude',
    logoAsset: 'assets/providers/anthropic.svg',
    keyPlaceholder: 'sk-ant-api03-...',
    keyPattern: /^sk-ant-/,
    getApiKeyUrl: 'https://console.anthropic.com/settings/keys',
    apiBaseUrl: 'https://api.anthropic.com/v1',
    defaultModel: 'claude-3-5-sonnet-20241022',
    availableModels: [
      { id: 'claude-3-5-sonnet-20241022', displayName: 'Claude 3.5 Sonnet' },
      { id: 'claude-3-opus-20240229',     displayName: 'Claude 3 Opus' },
      { id: 'claude-3-haiku-20240307',    displayName: 'Claude 3 Haiku' },
    ],
  },
  {
    id: 'openai',
    displayName: 'OpenAI GPT',
    logoAsset: 'assets/providers/openai.svg',
    keyPlaceholder: 'sk-...',
    keyPattern: /^sk-/,
    getApiKeyUrl: 'https://platform.openai.com/api-keys',
    apiBaseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4-turbo-preview',
    availableModels: [
      { id: 'gpt-4-turbo-preview', displayName: 'GPT-4 Turbo' },
      { id: 'gpt-4',               displayName: 'GPT-4' },
      { id: 'gpt-3.5-turbo',       displayName: 'GPT-3.5 Turbo' },
    ],
  },
  {
    id: 'google',
    displayName: 'Google Gemini',
    logoAsset: 'assets/providers/google.svg',
    keyPlaceholder: 'AIza...',
    keyPattern: /^AIza/,
    getApiKeyUrl: 'https://aistudio.google.com/app/apikey',
    apiBaseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    defaultModel: 'gemini-1.5-pro',
    availableModels: [
      { id: 'gemini-1.5-pro',   displayName: 'Gemini 1.5 Pro' },
      { id: 'gemini-1.5-flash', displayName: 'Gemini 1.5 Flash' },
    ],
  },
];

// Convenience lookup — O(1) access by provider ID
export const PROVIDER_MAP = new Map(
  PROVIDER_REGISTRY.map(p => [p.id, p])
);
```

**Rationale:** A static constant (not a service) keeps the registry tree-shakeable and avoids circular DI. Adding a new provider is a single array entry.

---

### 2. API_Key_Manager (`core/services/api-key-manager.service.ts`)

Generic service — all methods take `providerId: string`, never a union type.

```typescript
export interface ApiKeyManager {
  // Storage
  setKey(providerId: string, key: string): Promise<void>;
  getKey(providerId: string): Promise<string | null>;
  clearKey(providerId: string): Promise<void>;
  clearAllKeys(): Promise<void>;
  hasKey(providerId: string): boolean;

  // Validation
  validateKeyFormat(providerId: string, key: string): boolean;

  // Connection testing
  testConnection(providerId: string): Promise<ConnectionResult>;

  // Reactive state (Angular Signals)
  configuredProviderIds: Signal<string[]>;
  connectionStatus: Signal<Map<string, ConnectionStatus>>;
}

export type ConnectionStatus = 'unconfigured' | 'testing' | 'connected' | 'error';

export interface ConnectionResult {
  providerId: string;
  success: boolean;
  error?: string;
}
```

**Storage key convention:** `lore.ai.key.{providerId}` — generic, works for any provider ID.

**Validation:** Delegates to `PROVIDER_MAP.get(providerId)?.keyPattern.test(key)`.

---

### 3. AIService (`core/services/ai.service.ts`)

Provider type changes from `'claude' | 'gpt'` to `string`.

```typescript
export interface AIService {
  sendPrompt(
    providerId: string,
    prompt: string,
    options?: AIOptions
  ): Observable<AIStreamChunk>;

  testConnection(providerId: string, apiKey: string): Promise<boolean>;
  cancelRequest(requestId: string): void;
  getModels(providerId: string): ModelDefinition[];
}

export interface AIOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface AIStreamChunk {
  requestId: string;
  delta: string;       // incremental text
  isComplete: boolean;
  error?: string;
}
```

**Provider dispatch:** AIService reads `PROVIDER_MAP.get(providerId)` to get the `apiBaseUrl` and constructs the request. Each provider has a thin adapter (private method or strategy class) that maps the generic request to the provider's wire format.

```typescript
// Internal adapter interface
interface ProviderAdapter {
  buildRequest(prompt: string, options: AIOptions): unknown;
  parseStreamChunk(raw: string): string | null;
}
```

---

### 4. Settings UI — AI Providers Tab

The tab is driven entirely by `PROVIDER_REGISTRY`. No provider names appear in the template.

#### 4a. Provider Selector

A `<select>` (or listbox) populated from `PROVIDER_REGISTRY`:

```html
<select [(ngModel)]="selectedProviderId" (ngModelChange)="onProviderSelected($event)">
  <option value="">— Select a provider —</option>
  @for (provider of providerRegistry; track provider.id) {
    <option [value]="provider.id">{{ provider.displayName }}</option>
  }
</select>
```

When a provider is selected, the form below it renders dynamically:

```html
@if (selectedProvider()) {
  <div class="provider-form">
    <label>API Key</label>
    <input
      type="password"
      [(ngModel)]="apiKeyInput"
      [placeholder]="selectedProvider()!.keyPlaceholder"
    />
    <a [href]="selectedProvider()!.getApiKeyUrl" target="_blank" rel="noopener">
      Get API Key ↗
    </a>
    @if (validationError()) {
      <span class="inline-error">{{ validationError() }}</span>
    }
    <button (click)="saveProvider()">Save</button>
  </div>
}
```

#### 4b. Provider_Card

One card per configured provider. Rendered from `configuredProviderIds` signal:

```html
@for (pid of configuredProviderIds(); track pid) {
  <div class="provider-card">
    <img [src]="providerDef(pid).logoAsset" [alt]="providerDef(pid).displayName" />
    <div class="card-info">
      <span class="card-title">{{ providerDef(pid).displayName }}</span>
      <span class="connection-status" [attr.data-status]="connectionStatus().get(pid)">
        {{ statusLabel(pid) }}
      </span>
    </div>
    <div class="card-actions">
      <button (click)="testConnection(pid)">Test</button>
      <button (click)="editProvider(pid)">Edit</button>
      <button (click)="deleteProvider(pid)" class="danger">Delete</button>
    </div>
  </div>
}
```

#### 4c. Empty State

```html
@if (configuredProviderIds().length === 0) {
  <div class="empty-state">
    <span class="empty-icon">🤖</span>
    <p class="empty-title">No AI providers configured</p>
    <p class="empty-description">
      Select a provider above and enter your API key to get started.
    </p>
  </div>
}
```

#### 4d. Danger Zone

```html
<div class="danger-zone s-card">
  <span class="s-title">Danger Zone</span>
  <button class="tb-btn ghost-danger" (click)="clearAllKeys()">
    Clear All API Keys
  </button>
</div>
```

---

### 5. AskAIBlockComponent

The `provider` input changes from `'claude' | 'gpt'` to `string`. The block title and badge are derived from `PROVIDER_MAP.get(provider)?.displayName`.

```typescript
@Input() provider: string = 'anthropic';  // any registry ID
```

The slash palette entries remain `ask-claude` and `ask-gpt` as block type identifiers for backward compatibility, but the underlying component accepts any provider ID.

---

## Data Models

### AIResponseData
```typescript
interface AIResponseData {
  id: string;
  prompt: string;
  content: string;
  providerId: string;   // generic string, not union type
  model: string;
  timestamp: Date;
  tokensUsed?: number;
  error?: string;
}
```

### Block Data
```typescript
interface AskAIBlockData extends BlockData {
  type: 'ask-claude' | 'ask-gpt';   // kept for backward compat
  providerId: string;                // runtime provider, from registry
  responses: AIResponseData[];
  currentPrompt: string;
}
```

### Settings State (localStorage)
```typescript
// Generic key pattern — works for any provider
'lore.ai.key.anthropic'  → encrypted string
'lore.ai.key.openai'     → encrypted string
'lore.ai.key.google'     → encrypted string

// AI behaviour settings (Phase 7)
'lore.ai.settings' → {
  defaultProviderId: string,
  temperature: number,
  maxTokens: number,
  modelOverrides: Record<string, string>  // providerId → modelId
}
```

---

## API Integration

### Anthropic Claude
```
POST https://api.anthropic.com/v1/messages
Headers: { 'x-api-key': KEY, 'anthropic-version': '2023-06-01' }
Body:    { model, max_tokens, messages: [{role:'user', content}], stream: true }

SSE events: message_start → content_block_delta (text_delta) → message_stop
```

### OpenAI GPT
```
POST https://api.openai.com/v1/chat/completions
Headers: { 'Authorization': 'Bearer KEY' }
Body:    { model, messages: [{role:'user', content}], stream: true }

SSE events: data: {choices:[{delta:{content}}]} → data: [DONE]
```

### Google Gemini
```
POST https://generativelanguage.googleapis.com/v1beta/models/{model}:streamGenerateContent
Query:   ?key=KEY&alt=sse
Body:    { contents: [{parts:[{text}]}] }

SSE events: data: {candidates:[{content:{parts:[{text}]}}]}
```

Each provider's wire format is encapsulated in its `ProviderAdapter` — the rest of `AIService` is provider-agnostic.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Provider selection renders correct fields

*For any* provider ID in the Provider_Registry, selecting that provider in the UI SHALL render an API key input field whose placeholder matches that provider's `keyPlaceholder`, and a "Get API Key" link whose `href` matches that provider's `getApiKeyUrl`.

**Validates: Requirements US-1.2**

---

### Property 2: Valid key format accepted and persisted

*For any* provider ID in the Provider_Registry and any string that matches that provider's `keyPattern`, calling `setKey(providerId, key)` SHALL succeed, and a subsequent `getKey(providerId)` SHALL return the original key value.

**Validates: Requirements US-1.4, FR-2.1, FR-2.3**

---

### Property 3: Invalid key format rejected

*For any* provider ID in the Provider_Registry and any string that does NOT match that provider's `keyPattern`, `validateKeyFormat(providerId, key)` SHALL return `false`, and no key SHALL be written to localStorage.

**Validates: Requirements US-1.5, FR-2.4**

---

### Property 4: API keys are never stored in plaintext

*For any* provider ID and any API key string, the value written to localStorage under `lore.ai.key.{providerId}` SHALL NOT equal the plaintext key string.

**Validates: Requirements FR-2.2, NFR-1**

---

### Property 5: Encryption round-trip preserves key

*For any* API key string, `decrypt(encrypt(key))` SHALL return a value equal to the original key string.

**Validates: Requirements FR-2.3**

---

### Property 6: Configured providers list invariant

*For any* sequence of save and delete operations on providers, the Configured_Providers_List SHALL contain exactly one card per provider that currently has a stored key, with no duplicate entries.

**Validates: Requirements US-1.6, US-1.9**

---

### Property 7: Edit pre-populates with saved data

*For any* configured provider, activating the edit action SHALL result in the provider selector showing that provider as selected and the API key input being non-empty (pre-populated with the masked/existing key reference).

**Validates: Requirements US-1.7**

---

### Property 8: Delete removes card and clears storage

*For any* configured provider, activating the delete action SHALL remove that provider's card from the list AND remove the key from localStorage, such that `hasKey(providerId)` returns `false`.

**Validates: Requirements US-1.8**

---

### Property 9: Clear all removes every provider key

*For any* non-empty set of configured providers, calling `clearAllKeys()` SHALL result in `configuredProviderIds` being empty and no `lore.ai.key.*` entries remaining in localStorage.

**Validates: Requirements FR-2.6, FR-4.7**

---

## Error Handling

| Error | Trigger | Response |
|---|---|---|
| Key format invalid | Save with bad key | Inline validation error, no storage write |
| Key missing | AI block submit with no key | Toast + link to AI Providers settings |
| Connection test failed | Network/auth error | Card status → `error`, error message shown |
| Rate limit (429) | API call | Exponential backoff: 1s → 2s → 4s → 8s |
| Network error | API call | Retry button, preserve prompt input |
| Timeout | API call >30s | Cancel, show retry |
| Unknown provider ID | Runtime lookup miss | Graceful fallback, log warning |

**Exponential backoff:** `delay = Math.min(1000 * 2^attempt, 30000)` — capped at 30s.

---

## Testing Strategy

### Unit Tests (example-based)

- `Provider_Registry`: verify all three initial providers have required fields (id, displayName, logoAsset, keyPlaceholder, keyPattern, getApiKeyUrl)
- `API_Key_Manager`: empty state renders when no providers configured; danger zone button present
- `AIProvidersTab`: empty state renders when no providers configured; danger zone button present
- Connection status states: verify `testing`, `connected`, `error` states render correct UI

### Property-Based Tests

Using **fast-check** (TypeScript PBT library, well-maintained, works with Jest/Karma).

Each property test runs **minimum 100 iterations**.

Tag format: `// Feature: ai-integration, Property N: <property text>`

**Property 1** — Provider selection renders correct fields
```
// Feature: ai-integration, Property 1: provider selection renders correct fields
fc.assert(fc.property(
  fc.constantFrom(...PROVIDER_REGISTRY.map(p => p.id)),
  (providerId) => {
    // select provider in component, verify placeholder and href
  }
), { numRuns: 100 });
```

**Property 2** — Valid key accepted and persisted
```
// Feature: ai-integration, Property 2: valid key format accepted and persisted
fc.assert(fc.property(
  fc.constantFrom(...PROVIDER_REGISTRY),
  fc.string().filter(s => provider.keyPattern.test(s)),
  async (provider, key) => {
    await manager.setKey(provider.id, key);
    return (await manager.getKey(provider.id)) === key;
  }
), { numRuns: 100 });
```

**Property 3** — Invalid key rejected
```
// Feature: ai-integration, Property 3: invalid key format rejected
fc.assert(fc.property(
  fc.constantFrom(...PROVIDER_REGISTRY),
  fc.string().filter(s => !provider.keyPattern.test(s)),
  (provider, key) => {
    expect(manager.validateKeyFormat(provider.id, key)).toBe(false);
    // verify localStorage unchanged
  }
), { numRuns: 100 });
```

**Property 4** — Keys never stored in plaintext
```
// Feature: ai-integration, Property 4: API keys never stored in plaintext
fc.assert(fc.property(
  fc.constantFrom(...PROVIDER_REGISTRY.map(p => p.id)),
  fc.string({ minLength: 10 }),
  async (providerId, key) => {
    await manager.setKey(providerId, key);
    const stored = localStorage.getItem(`lore.ai.key.${providerId}`);
    return stored !== key;
  }
), { numRuns: 100 });
```

**Property 5** — Encryption round-trip
```
// Feature: ai-integration, Property 5: encryption round-trip preserves key
fc.assert(fc.property(
  fc.string({ minLength: 1 }),
  async (key) => {
    const encrypted = await encrypt(key);
    const decrypted = await decrypt(encrypted);
    return decrypted === key;
  }
), { numRuns: 100 });
```

**Property 6** — Configured providers list invariant
```
// Feature: ai-integration, Property 6: configured providers list invariant
fc.assert(fc.property(
  fc.array(fc.constantFrom(...PROVIDER_REGISTRY.map(p => p.id))),
  async (providerIds) => {
    // save all, then check list has no duplicates and length matches unique IDs
    const unique = new Set(providerIds);
    // ... verify configuredProviderIds().length === unique.size
  }
), { numRuns: 100 });
```

**Properties 7, 8, 9** — Edit/delete/clear-all follow the same pattern: generate a random set of configured providers, perform the operation, assert the post-condition.

### Integration Tests

- `testConnection()` returns a `ConnectionResult` for each registry provider (mocked HTTP)
- Full flow: select provider → enter key → save → card appears → test connection → status updates

### Accessibility

- All form inputs have associated `<label>` elements
- Provider cards have `role="listitem"` within a `role="list"` container
- Connection status uses `aria-live="polite"` for screen reader announcements
- Keyboard: `Tab` navigates all controls; `Enter`/`Space` activates buttons; `Esc` cancels edit mode

---

## File Structure

```
lore-app/src/app/
├── core/
│   ├── config/
│   │   └── provider-registry.ts          (new — static registry)
│   ├── models/
│   │   └── ai.model.ts                   (new)
│   └── services/
│       ├── ai.service.ts                 (new)
│       ├── api-key-manager.service.ts    (new — replaces per-provider methods)
│       └── settings.service.ts           (new — general settings, delegates keys to API_Key_Manager)
├── features/
│   ├── blocks/
│   │   ├── ask-ai-block/                 (update — provider: string input)
│   │   │   ├── ask-ai-block.component.ts
│   │   │   ├── ask-ai-block.component.html
│   │   │   └── ask-ai-block.component.scss
│   │   └── ask-gpt-block/               (new — thin wrapper, sets provider='openai')
│   └── settings/
│       ├── ai-providers/                 (new)
│       │   ├── ai-providers.component.ts
│       │   ├── ai-providers.component.html
│       │   └── ai-providers.component.scss
│       └── settings-panel.component.ts  (update — add AI Providers tab)
└── shared/
    └── utils/
        └── crypto.util.ts               (new)
```

---

## Implementation Order

1. `provider-registry.ts` — static data, no dependencies
2. `crypto.util.ts` — encryption utilities, no dependencies
3. `api-key-manager.service.ts` — depends on registry + crypto
4. `ai.service.ts` — depends on registry + key manager
5. `ai-providers` settings tab — depends on registry + key manager
6. Update `settings-panel.component.ts` — add tab
7. Update `ask-ai-block` component — change provider type to string
8. `ask-gpt-block` — thin wrapper
9. Update slash palette
10. Tests

---

## Success Criteria

- User can configure any registry provider in <30 seconds
- Adding a new provider requires only a `PROVIDER_REGISTRY` entry — zero other code changes
- API keys are encrypted in storage; plaintext never appears in localStorage or console
- Connection test works for all three initial providers
- AI blocks stream responses in real-time (<2s to first token)
- Response history is preserved per block
- All 9 correctness properties pass with 100+ iterations
- Zero TypeScript errors; no `'claude' | 'gpt'` union types remain in service interfaces
