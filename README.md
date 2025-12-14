# n8n-nodes-syncaty-salla

This is an n8n community node package that allows you to interact with Salla e-commerce stores through the Syncaty SaaS platform.

## Features

- **OAuth2 Authentication**: Securely connect to Syncaty and access your Salla stores
- **Multi-Store Support**: Manage multiple Salla stores from a single n8n workflow
- **Full Salla API Access**: Orders, Products, Customers, Categories, Coupons, Shipments
- **Customer Analytics**: Access RFM scores, CLTV, churn risk, and behavioral metrics
- **Customer Segmentation**: Create and manage dynamic customer segments with advanced rules
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

| Resource | Operations |
|----------|------------|
| **Order** | Get, Get Many, Update Status, Cancel |
| **Product** | Create, Get, Get Many, Update, Delete |
| **Customer** | Create, Get, Get Many, Get Metrics, Update, Delete |
| **Category** | Create, Get, Get Many, Update, Delete |
| **Coupon** | Create, Get, Get Many, Delete |
| **Segment** | Get Many, Get Customers |
| **Shipment** | Get, Create |
| **Store Info** | Get store profile |
| **User Info** | Get user information |

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

---

## Customer Metrics (v1.1.0+)

The **Customer > Get Metrics** operation returns comprehensive customer data including:

### Contact Information
- Name, email, mobile, gender, birthday
- City, country, language preference
- Avatar URL

### Order Statistics
- Total orders count and amount
- Average order value
- Loyalty points balance
- Wallet balance

### Analytics & RFM Scores
- **Recency Score** (1-5): How recently the customer purchased
- **Frequency Score** (1-5): How often they purchase
- **Monetary Score** (1-5): How much they spend
- **RFM Segment**: Champions, Loyal, At Risk, Lost, etc.
- **Customer Lifetime Value (CLTV)**
- **Churn Risk Score**
- **Average Order Value (AOV)**
- First and last order dates

### Custom Segments
- List of all segments the customer belongs to

---

## Customer Segmentation (v1.2.0+)

### Segment > Get Many

Returns all customer segments defined in your store with:
- Segment ID, name, description
- Customer count
- Active status
- Created/updated timestamps

### Segment > Get Customers

Returns customers in a specific segment with full metrics:
- All contact information
- Order statistics
- RFM analytics data
- Churn risk indicators
- Pagination support for large segments

---

## Use Cases

### Customer Analytics & Metrics

#### 1. VIP Customer Notifications
```
Trigger: New order placed
→ Get Customer Metrics
→ If CLTV > $5000 OR RFM Segment = "Champions"
→ Send personalized thank you via WhatsApp/SMS
→ Notify sales team in Slack
```

#### 2. Churn Prevention Automation
```
Schedule: Daily at 9 AM
→ Get all customers (or specific segment)
→ Filter: churn_risk_score > 0.7
→ Send re-engagement email campaign
→ Create task in CRM for follow-up call
```

#### 3. Birthday Marketing
```
Schedule: Daily at 8 AM
→ Get customers with birthday = today
→ Get Customer Metrics (for personalization)
→ Send birthday discount coupon via email
→ If VIP customer, also send gift card
```

#### 4. Post-Purchase Analysis
```
Trigger: Order completed
→ Get Customer Metrics
→ Update customer record in external CRM
→ If first_order, trigger welcome sequence
→ If orders_count = 5, send loyalty program invite
```

### Segmentation Workflows

#### 5. Segment-Based Email Campaigns
```
Schedule: Weekly on Monday
→ Segment: Get Many (list all segments)
→ For each segment:
  → Segment: Get Customers
  → Send tailored email campaign based on segment
  → "At Risk" → Win-back offer
  → "Champions" → Early access to new products
  → "New" → Onboarding sequence
```

#### 6. Dynamic Discount Assignment
```
Trigger: Customer added to "At Risk" segment
→ Segment: Get Customers
→ For each customer:
  → Create personalized coupon in Salla
  → Send discount via preferred channel
  → Log in analytics dashboard
```

#### 7. Sales Team Alerts
```
Schedule: Daily
→ Segment: Get Customers ("High Value At Risk")
→ Filter: last_order > 60 days
→ Create tasks in Salesforce/HubSpot
→ Send summary to sales Slack channel
```

#### 8. Customer Export for External Tools
```
Schedule: Weekly
→ Segment: Get Customers ("Newsletter Subscribers")
→ Format data for Mailchimp/Klaviyo
→ Sync to email marketing platform
→ Update subscriber tags based on RFM
```

#### 9. Inventory Recommendations
```
Trigger: Product restocked
→ Segment: Get Customers ("Interested in [Category]")
→ Send "Back in Stock" notification
→ Prioritize by CLTV for limited stock
```

#### 10. Customer Health Dashboard
```
Schedule: Hourly
→ Segment: Get Many
→ For each segment, get customer count
→ Calculate segment growth/decline
→ Update Google Sheets dashboard
→ Alert if "At Risk" segment grows > 10%
```

### Multi-Channel Orchestration

#### 11. Omnichannel Customer Journey
```
Trigger: Cart abandoned
→ Get Customer Metrics
→ Based on RFM segment:
  → Champions: WhatsApp + 5% discount
  → Loyal: Email reminder
  → New: SMS with free shipping
→ Track conversion in analytics
```

#### 12. Customer Feedback Loop
```
Trigger: Order delivered
→ Wait 3 days
→ Get Customer Metrics
→ If orders_count > 3: Request review
→ If CLTV > $1000: Personal follow-up call
→ Store feedback in Google Sheets
```

---

## Response Examples

### Customer Metrics Response

```json
{
  "customer_id": "uuid",
  "salla_id": "123456",
  "contact_info": {
    "first_name": "Ahmed",
    "last_name": "Mohammed",
    "email": "ahmed@example.com",
    "mobile": "+966501234567",
    "gender": "male",
    "city": "Riyadh",
    "country": "Saudi Arabia"
  },
  "order_stats": {
    "orders_count": 15,
    "orders_amount": 4500.00,
    "orders_average": 300.00,
    "total_points": 450,
    "wallet_balance": 50.00
  },
  "analytics": {
    "recency_score": 5,
    "frequency_score": 4,
    "monetary_score": 4,
    "rfm_segment": "Loyal Customers",
    "cltv": 8500.00,
    "churn_risk_score": 0.15,
    "aov": 300.00,
    "first_order_date": "2024-01-15",
    "last_order_date": "2025-12-10"
  },
  "segments": [
    { "id": "seg-1", "name": "VIP Customers", "customer_count": 150 },
    { "id": "seg-2", "name": "Riyadh Region", "customer_count": 2300 }
  ]
}
```

### Segments List Response

```json
{
  "segments": [
    {
      "id": "uuid-1",
      "name": "VIP Customers",
      "description": "Customers with CLTV > 5000 SAR",
      "customer_count": 150,
      "is_active": true
    },
    {
      "id": "uuid-2",
      "name": "At Risk",
      "description": "High churn risk customers",
      "customer_count": 89,
      "is_active": true
    }
  ],
  "total": 2
}
```

---

## License

MIT

## Support

- Documentation: [https://syncaty.com/docs/n8n](https://syncaty.com/docs/n8n)
- Issues: [GitHub Issues](https://github.com/syncaty/n8n-nodes-syncaty-salla/issues)
- Email: support@syncaty.com

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for version history and updates.
