# n8n-nodes-webhook-signature-validator

A custom [n8n](https://n8n.io) node that validates HMAC signatures on incoming webhook requests.

## Features

- **HMAC-SHA1, SHA256, SHA512** algorithm support
- **Configurable signature header** — works with any webhook provider (GitHub, Stripe, Slack, etc.)
- **Signature prefix stripping** — handles prefixes like `sha256=`
- **Hex and Base64** encoding support
- **Timing-safe comparison** to prevent timing attacks
- **Flexible failure handling** — either throw an error or pass through with a `signatureValid` flag

## Installation

Install via the n8n community nodes UI or run:

```bash
npm install n8n-nodes-webhook-signature-validator
```

## Usage

1. Add a **Webhook Trigger** node to receive incoming requests
2. Connect the **Webhook Signature Validator** node after it
3. Configure your **Webhook Signing Key** credential with the shared secret
4. Set the algorithm, header name, and prefix to match your webhook provider

### Example: GitHub Webhooks

| Setting            | Value                |
|--------------------|----------------------|
| Algorithm          | HMAC-SHA256          |
| Signature Header   | x-hub-signature-256  |
| Signature Prefix   | sha256=              |
| Encoding           | Hex                  |

### Example: Stripe Webhooks

| Setting            | Value                |
|--------------------|----------------------|
| Algorithm          | HMAC-SHA256          |
| Signature Header   | stripe-signature     |
| Signature Prefix   | (empty)              |
| Encoding           | Hex                  |

## Credentials

Create a **Webhook Signing Key** credential and paste your provider's webhook secret.

## Development

```bash
npm install
npm run build
```

Then link the package into your n8n installation:

```bash
npm link
cd ~/.n8n
npm link n8n-nodes-webhook-signature-validator
```

## License

MIT
