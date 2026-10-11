# Security

Canvas runs generated React code in an iframe with `sandbox="allow-scripts"`, without same-origin privileges. Its CSP blocks network requests, nested frames and forms. Only the trusted shell holds the MCP/HTTP session token. The Node service compiles source; it never imports generated modules for execution.

The local HTTP service listens only on `127.0.0.1`, checks the Host and Origin headers and requires a bearer token for its API. Preview links and ready files contain local session credentials: do not share them or publish the canvas data directory. The trusted UI can open explicitly supplied local TSX/JSX files.

The compiler import policy is an authoring restriction, not a complete JavaScript security proof. Browser sandboxing supplies the execution boundary. A canvas can still consume CPU or memory; only open source you are comfortable running in your browser. The plugin does not provide backups, encryption at rest, a multi-user authorization system or a public hosting service.

Please avoid posting secrets or private documents in public issues. If the eventual GitHub repository enables private vulnerability reporting, use its Security tab. Until a private channel is available, open an issue requesting a private contact without including exploit details or sensitive data. Do not claim a reporting feature has been enabled until it is configured.
