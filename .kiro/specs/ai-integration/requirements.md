# AI Integration - Phase 6 Requirements

## Overview
Enable AI-powered features in Lore by integrating multiple AI provider APIs, allowing users to configure any supported provider and interact with AI assistants directly within their notes.

## Glossary

- **Settings_UI**: The settings panel component responsible for rendering all settings tabs and their content.
- **Configured_Providers_List**: The section of the AI Providers tab that displays one compact card per provider that has a saved API key.
- **Provider_Registry**: A static data structure (or service) that enumerates all supported AI providers and their metadata (ID, display name, logo, key placeholder, "Get API Key" URL).
- **API_Key_Manager**: The service layer responsible for encrypting, storing, retrieving, validating, and clearing API keys.
- **Provider_Card**: A compact UI card (single or double line) representing one configured AI provider, showing its logo, name, connection status, and edit/delete actions.

---

## User Stories

### US-1: Configure AI Provider
**As a** user  
**I want to** select an AI provider from a list and enter my API key  
**So that** I can use AI features in my notes with any supported provider

**Acceptance Criteria:**

1. WHEN the user opens the "AI Providers" settings tab, THE Settings_UI SHALL display a provider selection control (dropdown or listbox) listing all supported AI providers (e.g., Anthropic/Claude, OpenAI/GPT, Google/Gemini).

2. WHEN the user selects a provider from the provider selection control, THE Settings_UI SHALL display an API key input field and a "Get API Key" link specific to that provider.

3. WHEN the user clicks the "Get API Key" link, THE Settings_UI SHALL open the selected provider's API key page in a new browser tab.

4. WHEN the user enters an API key and saves, THE Settings_UI SHALL validate the API key format and, if valid, persist the key securely and display a compact provider card in the configured providers list.

5. IF the API key format is invalid, THEN THE Settings_UI SHALL display an inline validation error message without saving.

6. WHEN a provider has been saved, THE Configured_Providers_List SHALL display a compact card for that provider showing the provider's logo, the provider name as the card title, and action controls to edit or delete the saved key.

7. WHEN the user activates the edit action on a provider card, THE Settings_UI SHALL re-display the provider selection control and API key input pre-populated with the existing provider's data.

8. WHEN the user activates the delete action on a provider card, THE Settings_UI SHALL remove the provider card and clear the stored API key for that provider.

9. THE Configured_Providers_List SHALL display one card per configured provider, with no duplicate provider entries permitted.

10. WHEN a connection test is triggered for a configured provider, THE Settings_UI SHALL display a visual connection status indicator on the provider card (connected / error / testing).

### US-2: Ask AI Questions
**As a** user  
**I want to** ask questions to AI within a block  
**So that** I can get answers without leaving my note

**Acceptance Criteria:**
- Can insert "Ask Claude" or "Ask GPT" block via slash command
- Can type a prompt/question in the block
- Can submit the prompt with a button or keyboard shortcut
- AI response streams in real-time (word by word)
- Can copy AI response to clipboard
- Can regenerate response if not satisfied
- Block shows loading state while waiting for response

### US-3: View AI Response History
**As a** user  
**I want to** see previous AI responses in the same block  
**So that** I can compare different answers

**Acceptance Criteria:**
- Block stores multiple prompt/response pairs
- Can navigate between previous responses
- Each response shows timestamp
- Can delete individual responses

### US-4: Manage AI Behavior
**As a** user  
**I want to** control AI behavior settings  
**So that** I can customize how AI responds

**Acceptance Criteria:**
- Settings panel has "AI Behaviour" tab (Phase 7)
- Can set default AI provider (Claude/GPT)
- Can set temperature/creativity level
- Can set max tokens/response length
- Settings apply to all new AI blocks

## Functional Requirements

### FR-1: AI Service
- Create centralized AIService for API communication
- Support multiple providers (Claude, GPT)
- Handle streaming responses
- Implement error handling and retry logic
- Support cancellation of in-flight requests

### FR-2: API Key Management
- THE API_Key_Manager SHALL support storing API keys for all supported providers (Anthropic/Claude, OpenAI/GPT, Google/Gemini, and any future providers added to the supported list).
- WHEN an API key is saved, THE API_Key_Manager SHALL encrypt the key before writing it to localStorage.
- WHEN an API key is retrieved for use, THE API_Key_Manager SHALL decrypt the key in memory and never expose the plaintext value in logs or the DOM.
- THE API_Key_Manager SHALL validate the API key format for each provider before accepting a save operation.
- THE API_Key_Manager SHALL provide a test-connection method per provider that verifies the key is accepted by the provider's API.
- WHEN the user clears all keys or logs out, THE API_Key_Manager SHALL remove all stored encrypted keys from localStorage.
- THE Provider_Registry SHALL maintain a static list of supported providers, each with: provider ID, display name, logo asset reference, API key placeholder text, and "Get API Key" URL.

### FR-3: AI Block Components
- AskClaude block with prompt input and response display
- AskGPT block with same interface
- Shared base component for common functionality
- Loading states and error states
- Response formatting (markdown support)

### FR-4: Settings UI
- THE Settings_UI SHALL render an "AI Providers" tab within the settings panel.
- WHEN no providers are configured, THE Settings_UI SHALL display an empty state with a prompt to add a provider.
- THE Settings_UI SHALL render a provider selection control (dropdown or listbox) populated from the Provider_Registry.
- WHEN a provider is selected, THE Settings_UI SHALL render an API key input field (password type) and a "Get API Key" hyperlink that opens the provider's key-generation page in a new tab.
- WHEN a provider is saved, THE Settings_UI SHALL render a compact provider card in the configured providers list containing: the provider logo, the provider name, a connection status indicator, an edit button, and a delete button.
- THE Settings_UI SHALL render a "Test Connection" action accessible from each provider card.
- THE Settings_UI SHALL render a "Clear All API Keys" danger action that removes all configured providers after user confirmation.

## Non-Functional Requirements

### NFR-1: Security
- API keys must be encrypted before storage
- Never log API keys in console
- Clear sensitive data from memory after use

### NFR-2: Performance
- Streaming responses must feel real-time (<100ms latency)
- UI must remain responsive during API calls
- Cancel requests when user navigates away

### NFR-3: Usability
- Clear error messages for API failures
- Visual feedback for all actions
- Keyboard shortcuts for common actions
- Accessible to screen readers

### NFR-4: Reliability
- Graceful degradation when API is unavailable
- Retry failed requests with exponential backoff
- Preserve user input if request fails

## Out of Scope (Future Phases)
- AI chat sidebar (Phase 7)
- Inline AI mentions with @ (Phase 7)
- Context-aware AI (using note content) (Phase 7)
- AI prompt library (Phase 8)
- Scheduled AI tasks (Phase 8)

## Success Metrics
- User can configure API key in <30 seconds
- AI response starts streaming in <2 seconds
- 95% of API requests succeed
- Zero API key leaks in logs/console
