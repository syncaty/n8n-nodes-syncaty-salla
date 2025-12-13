# n8n-nodes-syncaty-salla

This is an n8n community node package that allows you to interact with Salla e-commerce stores through the Syncaty SaaS platform.

## Features

- **OAuth2 Authentication**: Securely connect to Syncaty and access your Salla stores
- **Multi-Store Support**: Manage multiple Salla stores from a single n8n workflow
- **Full Salla API Access**: Orders, Products, Customers, Categories, Coupons, Shipments
- **Webhook Triggers**: Receive real-time events from Salla stores

## Installation

### Community Node (Recommended)

1. Go to **Settings** > **Community Nodes**
2. Select **Install**
3. Enter `n8n-nodes-syncaty-salla`
4. Agree to the risks and click **Install**

### Manual Installation

```bash
npm install n8n-nodes-syncaty-salla
```

## Setup

### 1. Create OAuth App in Syncaty

1. Log in to [Syncaty](https://syncaty.com)
2. Go to **Settings** > **OAuth Apps**
3. Click **Create App**
4. Enter your app details:
   - **Name**: Your integration name
   - **Redirect URI**: `https://your-n8n-instance.com/rest/oauth2-credential/callback`
5. Save and copy the **Client ID** and **Client Secret**

### 2. Configure n8n Credentials

1. In n8n, go to **Credentials**
2. Create new **Syncaty Salla OAuth2 API** credential
3. Enter your **Client ID** and **Client Secret**
4. Click **Connect** to authorize

## Nodes

### Syncaty Salla

Main node for interacting with Salla API through Syncaty.

**Resources:**
- **Order**: Get, Get Many, Update Status, Cancel
- **Product**: Create, Get, Get Many, Update, Delete
- **Customer**: Create, Get, Get Many, Update, Delete
- **Category**: Create, Get, Get Many, Update, Delete
- **Coupon**: Create, Get, Get Many, Delete
- **Shipment**: Get, Create
- **Store Info**: Get store profile

### Syncaty Salla Trigger

Webhook trigger node for receiving Salla events.

**Events:**
- Order: created, updated, status updated, cancelled, refunded, shipped, delivered
- Product: created, updated, deleted, available, quantity low
- Customer: created, updated, login, OTP request
- Cart: abandoned, updated
- Coupon: applied
- Review: added
- Shipment: created, cancelled
- Store: branch created, branch updated

## License

MIT

## Support

- Documentation: [https://syncaty.com/docs/n8n](https://syncaty.com/docs/n8n)
- Issues: [GitHub Issues](https://github.com/syncaty/n8n-nodes-syncaty-salla/issues)
- Email: support@syncaty.com
