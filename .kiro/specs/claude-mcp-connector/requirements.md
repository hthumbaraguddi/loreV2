# Requirements Document

## Introduction

The Claude MCP Connector enables users to export content from Claude (Anthropic's AI assistant) directly into Lore notes via a Model Context Protocol (MCP) server. When a user types in Claude, the connector captures that content and routes it to Lore as structured notes. This spec covers the requirements for building the MCP server, hosting it, and distributing the connector so others can use it.

## Glossary

- **MCP_Server**: A server implementing the Model Context Protocol that acts as a bridge between Claude and Lore, receiving content from Claude and forwarding it to the Lore API.
- **Claude_Connector**: The integration component configured within Claude (via Anthropic's connector/plugin system) that connects Claude to the MCP_Server.
- **Lore_API**: The interface exposed by the Lore application that accepts incoming notes and content from external sources.
- **Note_Exporter**: The component responsible for transforming Claude conversation content into Lore-compatible note format and sending it to the Lore_API.
- **Connector_Package**: The distributable artifact (configuration, manifest, and documentation) that end users install to connect their Claude instance to an MCP_Server.
- **Host_Environment**: The runtime environment where the MCP_Server is deployed (local machine, cloud service, or self-hosted server).
- **User**: A person who uses Claude and wants their Claude content exported to Lore notes.
- **Distributor**: A person or organization that packages and publishes the Connector_Package for others to install.

---

## Requirements

### Requirement 1: MCP Server Core

**User Story:** As a User, I want an MCP server that receives content from Claude, so that my Claude conversations can be captured and sent to Lore.

#### Acceptance Criteria

1. THE MCP_Server SHALL implement the Model Context Protocol specification to accept tool calls from Claude.
2. WHEN Claude invokes a tool call on the MCP_Server, THE MCP_Server SHALL receive the content payload and acknowledge receipt within 5 seconds.
3. WHEN a content payload is received, THE Note_Exporter SHALL transform the payload into a Lore-compatible note structure before forwarding it to the Lore_API.
4. IF the Lore_API is unreachable, THEN THE MCP_Server SHALL queue the content payload and retry delivery with exponential backoff up to 3 attempts.
5. IF a content payload fails all retry attempts, THEN THE MCP_Server SHALL log the failure with the payload details and return an error response to Claude.
6. THE MCP_Server SHALL expose a health-check endpoint that returns the server status and Lore_API connectivity state.

---

### Requirement 2: Claude Connector Configuration

**User Story:** As a User, I want to configure Claude to connect to my MCP server, so that content I type in Claude is automatically exported to Lore.

#### Acceptance Criteria

1. THE Claude_Connector SHALL be configurable via a manifest file that specifies the MCP_Server endpoint URL and authentication credentials.
2. WHEN the Claude_Connector is installed and configured, THE Claude_Connector SHALL register the export tool with Claude so it is available during conversations.
3. WHEN a User triggers an export action in Claude (explicitly or via an automatic rule), THE Claude_Connector SHALL invoke the MCP_Server tool call with the selected content.
4. WHERE automatic export is enabled, THE Claude_Connector SHALL export content to Lore after each Claude response without requiring manual User action.
5. WHERE manual export is enabled, THE Claude_Connector SHALL provide an explicit export action the User can invoke to send selected content to Lore.
6. IF the MCP_Server endpoint is unreachable during a tool call, THEN THE Claude_Connector SHALL display a descriptive error message to the User within Claude's interface.

---

### Requirement 3: Note Creation in Lore

**User Story:** As a User, I want content exported from Claude to appear as structured notes in Lore, so that I can reference and organize my Claude conversations alongside my other notes.

#### Acceptance Criteria

1. WHEN the Note_Exporter receives a content payload, THE Note_Exporter SHALL create a new Lore note containing the exported content, a timestamp, and a source label identifying it as originating from Claude.
2. WHEN a note is created, THE Lore_API SHALL return a note identifier that the MCP_Server includes in its acknowledgement response to Claude.
3. THE Note_Exporter SHALL preserve the original formatting of the Claude content (including code blocks, lists, and headings) when creating the Lore note.
4. WHERE a User has specified a target notebook or folder, THE Note_Exporter SHALL create the note in that location rather than the default location.
5. IF the Lore_API returns a validation error for a note, THEN THE MCP_Server SHALL return a descriptive error to Claude indicating what content was rejected and why.

---

### Requirement 4: MCP Server Hosting

**User Story:** As a User, I want to host the MCP server in a way that suits my setup (local or cloud), so that I can use the connector regardless of my infrastructure preferences.

#### Acceptance Criteria

1. THE MCP_Server SHALL support local execution as a standalone process on macOS, Windows, and Linux without requiring additional runtime dependencies beyond a documented install step.
2. THE MCP_Server SHALL support deployment to a cloud Host_Environment via a provided configuration (e.g., container image or deployment manifest).
3. WHEN running locally, THE MCP_Server SHALL bind to a configurable port and accept connections from Claude on the same machine or local network.
4. WHEN running in a cloud Host_Environment, THE MCP_Server SHALL support HTTPS termination and token-based authentication to secure the endpoint.
5. THE MCP_Server SHALL read its configuration (Lore API URL, authentication tokens, port, export mode) from environment variables or a configuration file, with environment variables taking precedence.
6. IF a required configuration value is missing at startup, THEN THE MCP_Server SHALL log a descriptive error identifying the missing value and exit with a non-zero status code.

---

### Requirement 5: Authentication and Security

**User Story:** As a User, I want the connector to authenticate securely with both Claude and Lore, so that my notes and credentials are protected.

#### Acceptance Criteria

1. THE MCP_Server SHALL require a shared secret token for all incoming requests from the Claude_Connector, rejecting unauthenticated requests with an HTTP 401 response.
2. THE MCP_Server SHALL authenticate outbound requests to the Lore_API using a Lore API token stored in the Host_Environment configuration.
3. THE MCP_Server SHALL never log authentication tokens, API keys, or other credentials in plaintext.
4. WHEN transmitting content between the Claude_Connector and the MCP_Server over a network, THE MCP_Server SHALL require TLS encryption for all non-localhost connections.
5. IF an incoming request fails authentication, THEN THE MCP_Server SHALL log the failure with the request origin (IP address) and timestamp, without logging the submitted token value.

---

### Requirement 6: Connector Distribution

**User Story:** As a Distributor, I want to package and publish the connector so that other users can install it easily, so that the connector can reach a broad audience.

#### Acceptance Criteria

1. THE Connector_Package SHALL include a manifest file, setup documentation, and all configuration templates required for a User to connect Claude to a running MCP_Server.
2. THE Connector_Package SHALL be publishable to at least one public connector registry or marketplace supported by Anthropic's Claude connector ecosystem.
3. THE Connector_Package documentation SHALL include step-by-step instructions for three Host_Environment scenarios: local machine, self-hosted server, and cloud deployment.
4. WHEN a new version of the MCP_Server is released, THE Connector_Package SHALL include a changelog entry describing what changed and any migration steps required.
5. THE Connector_Package SHALL specify the minimum supported version of the MCP protocol and Claude connector API it is compatible with.
6. WHERE a User installs the Connector_Package from a registry, THE Connector_Package SHALL provide a verification mechanism (e.g., checksum or signature) so the User can confirm the package has not been tampered with.

---

### Requirement 7: Observability and Diagnostics

**User Story:** As a User, I want visibility into what the connector is doing, so that I can diagnose problems when content does not appear in Lore as expected.

#### Acceptance Criteria

1. THE MCP_Server SHALL emit structured logs for each content payload received, including the timestamp, payload size, export status, and Lore note identifier (if created).
2. WHEN an export fails, THE MCP_Server SHALL include the failure reason and the number of retry attempts in the log entry.
3. THE MCP_Server SHALL expose a diagnostics endpoint that returns the last N export events (configurable, default 50) with their statuses.
4. WHERE a User enables verbose logging, THE MCP_Server SHALL log the full content payload for each export event to aid debugging.
5. THE MCP_Server SHALL track and expose a count of successful exports, failed exports, and queued retries as runtime metrics accessible via the health-check endpoint.
