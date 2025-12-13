import {
    IWebhookFunctions,
    INodeType,
    INodeTypeDescription,
    IWebhookResponseData,
    INodeExecutionData,
} from 'n8n-workflow';

export class SyncatySallaWebhook implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'Syncaty Salla Webhook',
        name: 'prosynaiSallaWebhook',
        icon: 'file:syncaty.svg',
        group: ['trigger'],
        version: 1,
        subtitle: 'All Salla Events',
        description: 'Receive all Salla webhooks and route by event type',
        defaults: {
            name: 'Salla Webhook',
        },
        inputs: [],
        // Multiple outputs for different event categories
        outputs: ['main', 'main', 'main', 'main', 'main'],
        outputNames: ['Orders', 'Products', 'Customers', 'Cart', 'Other'],
        credentials: [
            {
                name: 'syncatyOAuth2Api',
                required: false,
            },
        ],
        webhooks: [
            {
                name: 'default',
                httpMethod: 'POST',
                responseMode: 'onReceived',
                path: 'salla-webhook',
            },
        ],
        properties: [
            {
                displayName: 'Info',
                name: 'info',
                type: 'notice',
                default: '',
                description: 'This webhook accepts all Salla events and routes them to different outputs based on the event type. Configure this webhook URL in your OAuth app settings.',
            },
        ],
    };

    async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
        const req = this.getRequestObject();
        const body = this.getBodyData() || {};

        // Get the event from the webhook payload - check multiple sources
        let incomingEvent: string | undefined;

        // Try header first
        if (req.headers && req.headers['x-salla-event']) {
            incomingEvent = req.headers['x-salla-event'] as string;
        }
        // Then try body.event
        if (!incomingEvent && body && typeof body.event === 'string') {
            incomingEvent = body.event;
        }
        // Then try body.type (some webhooks use this)
        if (!incomingEvent && body && typeof body.type === 'string') {
            incomingEvent = body.type;
        }

        // Build the output data - always succeeds even without event
        const outputData = this.helpers.returnJsonArray({
            event: incomingEvent || null,
            merchant: body.merchant || null,
            data: body.data || body,
            created_at: body.created_at || new Date().toISOString(),
            raw: body,
            headers: {
                'x-salla-event': req.headers?.['x-salla-event'] || null,
                'x-salla-signature': req.headers?.['x-salla-signature'] || null,
                'x-forwarded-by': req.headers?.['x-forwarded-by'] || null,
            },
        });

        // Route to appropriate output based on event type
        // Output 0: Orders
        // Output 1: Products
        // Output 2: Customers
        // Output 3: Cart
        // Output 4: Other (default - includes unknown/missing events)

        let outputIndex = 4; // Default to "Other"

        if (incomingEvent) {
            const eventLower = incomingEvent.toLowerCase();

            if (eventLower.startsWith('order.') || eventLower.includes('order')) {
                outputIndex = 0; // Orders
            } else if (eventLower.startsWith('product.') || eventLower.includes('product')) {
                outputIndex = 1; // Products
            } else if (eventLower.startsWith('customer.') || eventLower.includes('customer')) {
                outputIndex = 2; // Customers
            } else if (eventLower.startsWith('cart.') || eventLower.includes('cart') || eventLower.includes('abandoned')) {
                outputIndex = 3; // Cart
            }
            // All other known events go to "Other" (outputIndex stays 4)
        }
        // If no event found, also goes to "Other" (outputIndex stays 4)

        // Create array with empty arrays for unused outputs and data for the matching output
        const workflowData: INodeExecutionData[][] = [[], [], [], [], []];
        workflowData[outputIndex] = outputData;

        return {
            workflowData,
        };
    }
}
