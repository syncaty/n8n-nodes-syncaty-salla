import {
    IHookFunctions,
    IWebhookFunctions,
    INodeType,
    INodeTypeDescription,
    IWebhookResponseData,
    ILoadOptionsFunctions,
    INodePropertyOptions,
} from 'n8n-workflow';

import { syncatyApiRequest } from './GenericFunctions';

export class SyncatySallaTrigger implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'Syncaty Salla Trigger',
        name: 'syncatySallaTrigger',
        icon: 'file:syncaty.svg',
        group: ['trigger'],
        version: 1,
        subtitle: '={{$parameter["event"]}}',
        description: 'Receive Salla webhooks via Syncaty',
        defaults: {
            name: 'Syncaty Salla Trigger',
        },
        inputs: [],
        outputs: ['main'],
        credentials: [
            {
                name: 'syncatyOAuth2Api',
                required: true,
            },
        ],
        webhooks: [
            {
                name: 'default',
                httpMethod: 'POST',
                responseMode: 'onReceived',
                path: 'webhook',
            },
        ],
        properties: [
            {
                displayName: 'Store',
                name: 'storeId',
                type: 'options',
                typeOptions: {
                    loadOptionsMethod: 'getStores',
                },
                default: '',
                required: true,
                description: 'Select the Salla store to receive webhooks from',
            },
            {
                displayName: 'Event',
                name: 'event',
                type: 'options',
                options: [
                    // Order Events
                    { name: 'Order Created', value: 'order.created' },
                    { name: 'Order Updated', value: 'order.updated' },
                    { name: 'Order Status Updated', value: 'order.status.updated' },
                    { name: 'Order Cancelled', value: 'order.cancelled' },
                    { name: 'Order Refunded', value: 'order.refunded' },
                    { name: 'Order Shipped', value: 'order.shipped' },
                    { name: 'Order Delivered', value: 'order.delivered' },
                    // Product Events
                    { name: 'Product Created', value: 'product.created' },
                    { name: 'Product Updated', value: 'product.updated' },
                    { name: 'Product Deleted', value: 'product.deleted' },
                    { name: 'Product Available', value: 'product.available' },
                    { name: 'Product Quantity Low', value: 'product.quantity.low' },
                    // Customer Events
                    { name: 'Customer Created', value: 'customer.created' },
                    { name: 'Customer Updated', value: 'customer.updated' },
                    { name: 'Customer Login', value: 'customer.login' },
                    { name: 'Customer OTP Request', value: 'customer.otp.request' },
                    // Cart Events
                    { name: 'Abandoned Cart', value: 'abandoned.cart' },
                    { name: 'Cart Updated', value: 'cart.updated' },
                    // Coupon Events
                    { name: 'Coupon Applied', value: 'coupon.applied' },
                    // Review Events
                    { name: 'Review Added', value: 'review.added' },
                    // Shipment Events
                    { name: 'Shipment Created', value: 'shipment.creating' },
                    { name: 'Shipment Cancelled', value: 'shipment.cancelled' },
                    // Store Events
                    { name: 'Store Branch Created', value: 'store.branch.created' },
                    { name: 'Store Branch Updated', value: 'store.branch.updated' },
                    // All Events
                    { name: 'All Events', value: '*' },
                ],
                default: 'order.created',
                required: true,
                description: 'The event to listen for',
            },
        ],
    };

    methods = {
        loadOptions: {
            async getStores(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
                const stores = await syncatyApiRequest.call(this, 'GET', '/n8n/stores');
                return stores.map((store: any) => ({
                    name: `${store.name} (${store.merchant_id})`,
                    value: store.merchant_id,
                    description: store.domain || `Merchant ID: ${store.merchant_id}`,
                }));
            },
        },
    };

    webhookMethods = {
        default: {
            async checkExists(this: IHookFunctions): Promise<boolean> {
                const webhookData = this.getWorkflowStaticData('node');
                const webhookUrl = this.getNodeWebhookUrl('default');
                const storeId = this.getNodeParameter('storeId') as string;
                const event = this.getNodeParameter('event') as string;

                // Check if webhook already registered in Syncaty
                try {
                    const webhooks = await syncatyApiRequest.call(
                        this,
                        'GET',
                        `/n8n/stores/${storeId}/webhooks`,
                    );

                    for (const webhook of webhooks) {
                        if (webhook.url === webhookUrl && webhook.event === event) {
                            webhookData.webhookId = webhook.id;
                            return true;
                        }
                    }
                } catch (error) {
                    // Webhook endpoint may not exist yet
                    return false;
                }

                return false;
            },

            async create(this: IHookFunctions): Promise<boolean> {
                const webhookUrl = this.getNodeWebhookUrl('default');
                const storeId = this.getNodeParameter('storeId') as string;
                const event = this.getNodeParameter('event') as string;

                try {
                    const response = await syncatyApiRequest.call(
                        this,
                        'POST',
                        `/n8n/stores/${storeId}/webhooks`,
                        {
                            url: webhookUrl,
                            event,
                            name: `n8n-${event}`,
                        },
                    );

                    const webhookData = this.getWorkflowStaticData('node');
                    webhookData.webhookId = response.id;
                    return true;
                } catch (error) {
                    // If webhook registration fails, we still allow the trigger
                    // User will need to manually configure webhook in Salla
                    console.error('Failed to register webhook:', error);
                    return true;
                }
            },

            async delete(this: IHookFunctions): Promise<boolean> {
                const webhookData = this.getWorkflowStaticData('node');
                const storeId = this.getNodeParameter('storeId') as string;

                if (webhookData.webhookId) {
                    try {
                        await syncatyApiRequest.call(
                            this,
                            'DELETE',
                            `/n8n/stores/${storeId}/webhooks/${webhookData.webhookId}`,
                        );
                    } catch (error) {
                        // Webhook may already be deleted
                        console.error('Failed to delete webhook:', error);
                    }
                }

                delete webhookData.webhookId;
                return true;
            },
        },
    };

    async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
        const req = this.getRequestObject();
        const body = this.getBodyData();
        const event = this.getNodeParameter('event') as string;

        // Get the event from the webhook payload
        const incomingEvent = req.headers['x-salla-event'] as string || body.event;

        // Filter by event if not listening to all
        if (event !== '*' && incomingEvent !== event) {
            return {
                noWebhookResponse: true,
            };
        }

        return {
            workflowData: [
                this.helpers.returnJsonArray({
                    event: incomingEvent,
                    merchant: body.merchant,
                    data: body.data,
                    created_at: body.created_at,
                    headers: {
                        'x-salla-event': req.headers['x-salla-event'],
                        'x-salla-signature': req.headers['x-salla-signature'],
                    },
                }),
            ],
        };
    }
}
