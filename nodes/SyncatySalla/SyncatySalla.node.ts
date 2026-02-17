import {
    IExecuteFunctions,
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
    ILoadOptionsFunctions,
    INodePropertyOptions,
    IDataObject,
} from 'n8n-workflow';

import {
    syncatyApiRequest,
    sallaApiRequest,
    sallaApiRequestAllItems,
} from './GenericFunctions';

export class SyncatySalla implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'Syncaty Salla',
        name: 'syncatySalla',
        icon: 'file:syncaty.svg',
        group: ['transform'],
        version: 1,
        subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
        description: 'Interact with Salla stores via Syncaty platform',
        defaults: {
            name: 'Syncaty Salla',
        },
        inputs: ['main'],
        outputs: ['main'],
        credentials: [
            {
                name: 'syncatyOAuth2Api',
                required: true,
            },
        ],
        properties: [
            // Store Selection
            {
                displayName: 'Store',
                name: 'storeId',
                type: 'options',
                typeOptions: {
                    loadOptionsMethod: 'getStores',
                },
                default: '',
                required: true,
                description: 'Select the Salla store to operate on',
            },
            // Resource
            {
                displayName: 'Resource',
                name: 'resource',
                type: 'options',
                noDataExpression: true,
                options: [
                    { name: 'Order', value: 'order' },
                    { name: 'Product', value: 'product' },
                    { name: 'Customer', value: 'customer' },
                    { name: 'Category', value: 'category' },
                    { name: 'Coupon', value: 'coupon' },
                    { name: 'Segment', value: 'segment' },
                    { name: 'Shipment', value: 'shipment' },
                    { name: 'Store Info', value: 'store' },
                    { name: 'User Info', value: 'user' },
                ],
                default: 'order',
                description: 'Resource to operate on',
            },

            // ==================== ORDER OPERATIONS ====================
            {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                noDataExpression: true,
                displayOptions: {
                    show: { resource: ['order'] },
                },
                options: [
                    { name: 'Get', value: 'get', description: 'Get an order by ID', action: 'Get an order' },
                    { name: 'Get Many', value: 'getAll', description: 'Get many orders', action: 'Get many orders' },
                    { name: 'Update Status', value: 'updateStatus', description: 'Update order status', action: 'Update order status' },
                    { name: 'Cancel', value: 'cancel', description: 'Cancel an order', action: 'Cancel an order' },
                ],
                default: 'get',
            },
            // Order ID
            {
                displayName: 'Order ID',
                name: 'orderId',
                type: 'string',
                default: '',
                required: true,
                displayOptions: {
                    show: { resource: ['order'], operation: ['get', 'updateStatus', 'cancel'] },
                },
                description: 'Salla Order ID',
            },
            // Order Status
            {
                displayName: 'Status',
                name: 'orderStatus',
                type: 'options',
                options: [
                    { name: 'In Progress', value: 'in_progress' },
                    { name: 'Completed', value: 'completed' },
                    { name: 'Under Review', value: 'under_review' },
                    { name: 'Delivering', value: 'delivering' },
                    { name: 'Shipped', value: 'shipped' },
                    { name: 'Delivered', value: 'delivered' },
                    { name: 'Restored', value: 'restored' },
                ],
                default: 'in_progress',
                displayOptions: {
                    show: { resource: ['order'], operation: ['updateStatus'] },
                },
            },
            // Order Filters
            {
                displayName: 'Filters',
                name: 'orderFilters',
                type: 'collection',
                placeholder: 'Add Filter',
                default: {},
                displayOptions: {
                    show: { resource: ['order'], operation: ['getAll'] },
                },
                options: [
                    {
                        displayName: 'Status',
                        name: 'status',
                        type: 'multiOptions',
                        options: [
                            { name: 'Pending', value: 'pending' },
                            { name: 'In Progress', value: 'in_progress' },
                            { name: 'Completed', value: 'completed' },
                            { name: 'Cancelled', value: 'cancelled' },
                            { name: 'Refunded', value: 'refunded' },
                        ],
                        default: [],
                    },
                    {
                        displayName: 'Date From',
                        name: 'date_from',
                        type: 'dateTime',
                        default: '',
                    },
                    {
                        displayName: 'Date To',
                        name: 'date_to',
                        type: 'dateTime',
                        default: '',
                    },
                    {
                        displayName: 'Customer ID',
                        name: 'customer_id',
                        type: 'string',
                        default: '',
                    },
                ],
            },

            // ==================== PRODUCT OPERATIONS ====================
            {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                noDataExpression: true,
                displayOptions: {
                    show: { resource: ['product'] },
                },
                options: [
                    { name: 'Create', value: 'create', description: 'Create a product', action: 'Create a product' },
                    { name: 'Get', value: 'get', description: 'Get a product by ID', action: 'Get a product' },
                    { name: 'Get Many', value: 'getAll', description: 'Get many products', action: 'Get many products' },
                    { name: 'Update', value: 'update', description: 'Update a product', action: 'Update a product' },
                    { name: 'Delete', value: 'delete', description: 'Delete a product', action: 'Delete a product' },
                ],
                default: 'get',
            },
            // Product ID
            {
                displayName: 'Product ID',
                name: 'productId',
                type: 'string',
                default: '',
                required: true,
                displayOptions: {
                    show: { resource: ['product'], operation: ['get', 'update', 'delete'] },
                },
                description: 'Salla Product ID',
            },
            // Product Create/Update Fields
            {
                displayName: 'Name',
                name: 'productName',
                type: 'string',
                default: '',
                required: true,
                displayOptions: {
                    show: { resource: ['product'], operation: ['create'] },
                },
            },
            {
                displayName: 'Price',
                name: 'productPrice',
                type: 'number',
                default: 0,
                required: true,
                displayOptions: {
                    show: { resource: ['product'], operation: ['create'] },
                },
            },
            {
                displayName: 'Update Fields',
                name: 'productUpdateFields',
                type: 'collection',
                placeholder: 'Add Field',
                default: {},
                displayOptions: {
                    show: { resource: ['product'], operation: ['create', 'update'] },
                },
                options: [
                    { displayName: 'Name', name: 'name', type: 'string', default: '' },
                    { displayName: 'Price', name: 'price', type: 'number', default: 0 },
                    { displayName: 'Sale Price', name: 'sale_price', type: 'number', default: 0 },
                    { displayName: 'Quantity', name: 'quantity', type: 'number', default: 0 },
                    { displayName: 'SKU', name: 'sku', type: 'string', default: '' },
                    { displayName: 'Description', name: 'description', type: 'string', default: '' },
                    { displayName: 'Status', name: 'status', type: 'options', options: [
                        { name: 'Active', value: 'sale' },
                        { name: 'Hidden', value: 'hidden' },
                        { name: 'Out of Stock', value: 'out' },
                    ], default: 'sale' },
                ],
            },
            // Product Filters
            {
                displayName: 'Filters',
                name: 'productFilters',
                type: 'collection',
                placeholder: 'Add Filter',
                default: {},
                displayOptions: {
                    show: { resource: ['product'], operation: ['getAll'] },
                },
                options: [
                    {
                        displayName: 'Status',
                        name: 'status',
                        type: 'options',
                        options: [
                            { name: 'All', value: '' },
                            { name: 'Active', value: 'sale' },
                            { name: 'Hidden', value: 'hidden' },
                            { name: 'Out of Stock', value: 'out' },
                        ],
                        default: '',
                    },
                    {
                        displayName: 'Keyword',
                        name: 'keyword',
                        type: 'string',
                        default: '',
                    },
                    {
                        displayName: 'Category ID',
                        name: 'category_id',
                        type: 'string',
                        default: '',
                    },
                ],
            },

            // ==================== CUSTOMER OPERATIONS ====================
            {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                noDataExpression: true,
                displayOptions: {
                    show: { resource: ['customer'] },
                },
                options: [
                    { name: 'Create', value: 'create', description: 'Create a customer', action: 'Create a customer' },
                    { name: 'Get', value: 'get', description: 'Get a customer by ID', action: 'Get a customer' },
                    { name: 'Get Many', value: 'getAll', description: 'Get many customers', action: 'Get many customers' },
                    { name: 'Get Metrics', value: 'getMetrics', description: 'Get customer metrics including segments, analytics, contact info and order stats', action: 'Get customer metrics' },
                    { name: 'Update', value: 'update', description: 'Update a customer', action: 'Update a customer' },
                    { name: 'Delete', value: 'delete', description: 'Delete a customer', action: 'Delete a customer' },
                ],
                default: 'get',
            },
            // Customer ID
            {
                displayName: 'Customer ID',
                name: 'customerId',
                type: 'string',
                default: '',
                required: true,
                displayOptions: {
                    show: { resource: ['customer'], operation: ['get', 'update', 'delete', 'getMetrics'] },
                },
                description: 'Salla Customer ID',
            },
            // Customer Fields
            {
                displayName: 'Customer Fields',
                name: 'customerFields',
                type: 'collection',
                placeholder: 'Add Field',
                default: {},
                displayOptions: {
                    show: { resource: ['customer'], operation: ['create', 'update'] },
                },
                options: [
                    { displayName: 'First Name', name: 'first_name', type: 'string', default: '' },
                    { displayName: 'Last Name', name: 'last_name', type: 'string', default: '' },
                    { displayName: 'Email', name: 'email', type: 'string', default: '' },
                    { displayName: 'Mobile', name: 'mobile', type: 'string', default: '' },
                    { displayName: 'City', name: 'city', type: 'string', default: '' },
                    { displayName: 'Country Code', name: 'country_code', type: 'string', default: 'SA' },
                ],
            },

            // ==================== CATEGORY OPERATIONS ====================
            {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                noDataExpression: true,
                displayOptions: {
                    show: { resource: ['category'] },
                },
                options: [
                    { name: 'Get', value: 'get', description: 'Get a category by ID', action: 'Get a category' },
                    { name: 'Get Many', value: 'getAll', description: 'Get many categories', action: 'Get many categories' },
                    { name: 'Create', value: 'create', description: 'Create a category', action: 'Create a category' },
                    { name: 'Update', value: 'update', description: 'Update a category', action: 'Update a category' },
                    { name: 'Delete', value: 'delete', description: 'Delete a category', action: 'Delete a category' },
                ],
                default: 'getAll',
            },
            // Category ID
            {
                displayName: 'Category ID',
                name: 'categoryId',
                type: 'string',
                default: '',
                required: true,
                displayOptions: {
                    show: { resource: ['category'], operation: ['get', 'update', 'delete'] },
                },
            },
            // Category Fields
            {
                displayName: 'Category Fields',
                name: 'categoryFields',
                type: 'collection',
                placeholder: 'Add Field',
                default: {},
                displayOptions: {
                    show: { resource: ['category'], operation: ['create', 'update'] },
                },
                options: [
                    { displayName: 'Name', name: 'name', type: 'string', default: '' },
                    { displayName: 'Parent ID', name: 'parent_id', type: 'string', default: '' },
                    { displayName: 'Status', name: 'status', type: 'options', options: [
                        { name: 'Active', value: 'active' },
                        { name: 'Hidden', value: 'hidden' },
                    ], default: 'active' },
                ],
            },

            // ==================== COUPON OPERATIONS ====================
            {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                noDataExpression: true,
                displayOptions: {
                    show: { resource: ['coupon'] },
                },
                options: [
                    { name: 'Get', value: 'get', description: 'Get a coupon by ID', action: 'Get a coupon' },
                    { name: 'Get Many', value: 'getAll', description: 'Get many coupons', action: 'Get many coupons' },
                    { name: 'Create', value: 'create', description: 'Create a coupon', action: 'Create a coupon' },
                    { name: 'Delete', value: 'delete', description: 'Delete a coupon', action: 'Delete a coupon' },
                ],
                default: 'getAll',
            },
            // Coupon ID
            {
                displayName: 'Coupon ID',
                name: 'couponId',
                type: 'string',
                default: '',
                required: true,
                displayOptions: {
                    show: { resource: ['coupon'], operation: ['get', 'delete'] },
                },
            },
            // Coupon Fields
            {
                displayName: 'Coupon Fields',
                name: 'couponFields',
                type: 'collection',
                placeholder: 'Add Field',
                default: {},
                displayOptions: {
                    show: { resource: ['coupon'], operation: ['create'] },
                },
                options: [
                    { displayName: 'Code', name: 'code', type: 'string', default: '' },
                    { displayName: 'Type', name: 'type', type: 'options', options: [
                        { name: 'Percentage', value: 'percentage' },
                        { name: 'Fixed', value: 'fixed' },
                    ], default: 'percentage' },
                    { displayName: 'Amount', name: 'amount', type: 'number', default: 0 },
                    { displayName: 'Maximum Uses', name: 'maximum_uses', type: 'number', default: 0 },
                    { displayName: 'Start Date', name: 'start_date', type: 'dateTime', default: '' },
                    { displayName: 'Expiry Date', name: 'expiry_date', type: 'dateTime', default: '' },
                ],
            },

            // ==================== SEGMENT OPERATIONS ====================
            {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                noDataExpression: true,
                displayOptions: {
                    show: { resource: ['segment'] },
                },
                options: [
                    { name: 'Get Many', value: 'getAll', description: 'Get all customer segments', action: 'Get many segments' },
                    { name: 'Get Customers', value: 'getCustomers', description: 'Get customers in a segment with their metrics', action: 'Get segment customers' },
                ],
                default: 'getAll',
            },
            // Segment ID
            {
                displayName: 'Segment ID',
                name: 'segmentId',
                type: 'string',
                default: '',
                required: true,
                displayOptions: {
                    show: { resource: ['segment'], operation: ['getCustomers'] },
                },
                description: 'The ID of the segment (returned from Get Many operation)',
            },
            // Segment Customers Pagination
            {
                displayName: 'Return All',
                name: 'returnAllSegmentCustomers',
                type: 'boolean',
                default: false,
                description: 'Whether to return all customers or only up to a limit',
                displayOptions: {
                    show: { resource: ['segment'], operation: ['getCustomers'] },
                },
            },
            {
                displayName: 'Limit',
                name: 'segmentCustomersLimit',
                type: 'number',
                default: 25,
                description: 'Max number of customers to return',
                typeOptions: {
                    minValue: 1,
                    maxValue: 100,
                },
                displayOptions: {
                    show: { resource: ['segment'], operation: ['getCustomers'], returnAllSegmentCustomers: [false] },
                },
            },

            // ==================== SHIPMENT OPERATIONS ====================
            {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                noDataExpression: true,
                displayOptions: {
                    show: { resource: ['shipment'] },
                },
                options: [
                    { name: 'Get', value: 'get', description: 'Get shipment by Order ID', action: 'Get shipment' },
                    { name: 'Create', value: 'create', description: 'Create a shipment', action: 'Create a shipment' },
                ],
                default: 'get',
            },
            // Shipment Order ID
            {
                displayName: 'Order ID',
                name: 'shipmentOrderId',
                type: 'string',
                default: '',
                required: true,
                displayOptions: {
                    show: { resource: ['shipment'], operation: ['get', 'create'] },
                },
            },
            // Shipment Fields
            {
                displayName: 'Shipment Fields',
                name: 'shipmentFields',
                type: 'collection',
                placeholder: 'Add Field',
                default: {},
                displayOptions: {
                    show: { resource: ['shipment'], operation: ['create'] },
                },
                options: [
                    { displayName: 'Shipping Company ID', name: 'shipping_company_id', type: 'string', default: '' },
                    { displayName: 'Tracking Number', name: 'tracking_number', type: 'string', default: '' },
                    { displayName: 'Tracking URL', name: 'tracking_url', type: 'string', default: '' },
                ],
            },

            // ==================== STORE INFO OPERATIONS ====================
            {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                noDataExpression: true,
                displayOptions: {
                    show: { resource: ['store'] },
                },
                options: [
                    { name: 'Get Info', value: 'get', description: 'Get store information', action: 'Get store info' },
                ],
                default: 'get',
            },

            // ==================== USER INFO OPERATIONS ====================
            {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                noDataExpression: true,
                displayOptions: {
                    show: { resource: ['user'] },
                },
                options: [
                    { name: 'Get Info', value: 'get', description: 'Get user information from Salla accounts', action: 'Get user info' },
                ],
                default: 'get',
            },

            // ==================== RETURN ALL / LIMIT ====================
            {
                displayName: 'Return All',
                name: 'returnAll',
                type: 'boolean',
                default: false,
                description: 'Whether to return all results or only up to a limit',
                displayOptions: {
                    show: {
                        operation: ['getAll'],
                    },
                },
            },
            {
                displayName: 'Limit',
                name: 'limit',
                type: 'number',
                default: 50,
                description: 'Max number of results to return',
                typeOptions: {
                    minValue: 1,
                    maxValue: 100,
                },
                displayOptions: {
                    show: {
                        operation: ['getAll'],
                        returnAll: [false],
                    },
                },
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

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        const items = this.getInputData();
        const returnData: INodeExecutionData[] = [];

        const resource = this.getNodeParameter('resource', 0) as string;
        const operation = this.getNodeParameter('operation', 0) as string;
        const storeId = this.getNodeParameter('storeId', 0) as string;

        for (let i = 0; i < items.length; i++) {
            try {
                let responseData: any;

                // ==================== ORDER ====================
                if (resource === 'order') {
                    if (operation === 'get') {
                        const orderId = this.getNodeParameter('orderId', i) as string;
                        responseData = await sallaApiRequest.call(this, 'GET', storeId, `/orders/${orderId}`);
                    } else if (operation === 'getAll') {
                        const returnAll = this.getNodeParameter('returnAll', i) as boolean;
                        const filters = this.getNodeParameter('orderFilters', i) as IDataObject;
                        const qs: IDataObject = {};

                        if (filters.status && (filters.status as string[]).length > 0) {
                            qs.status = (filters.status as string[]).join(',');
                        }
                        if (filters.date_from) qs.date_from = filters.date_from;
                        if (filters.date_to) qs.date_to = filters.date_to;
                        if (filters.customer_id) qs.customer_id = filters.customer_id;

                        if (returnAll) {
                            responseData = await sallaApiRequestAllItems.call(this, 'GET', storeId, '/orders', {}, qs);
                        } else {
                            const limit = this.getNodeParameter('limit', i) as number;
                            qs.per_page = limit;
                            const response = await sallaApiRequest.call(this, 'GET', storeId, '/orders', {}, qs);
                            responseData = response.data || response;
                        }
                    } else if (operation === 'updateStatus') {
                        const orderId = this.getNodeParameter('orderId', i) as string;
                        const status = this.getNodeParameter('orderStatus', i) as string;
                        responseData = await sallaApiRequest.call(this, 'PUT', storeId, `/orders/${orderId}/status`, { status });
                    } else if (operation === 'cancel') {
                        const orderId = this.getNodeParameter('orderId', i) as string;
                        responseData = await sallaApiRequest.call(this, 'POST', storeId, `/orders/${orderId}/cancel`);
                    }
                }

                // ==================== PRODUCT ====================
                else if (resource === 'product') {
                    if (operation === 'get') {
                        const productId = this.getNodeParameter('productId', i) as string;
                        responseData = await sallaApiRequest.call(this, 'GET', storeId, `/products/${productId}`);
                    } else if (operation === 'getAll') {
                        const returnAll = this.getNodeParameter('returnAll', i) as boolean;
                        const filters = this.getNodeParameter('productFilters', i) as IDataObject;
                        const qs: IDataObject = {};

                        if (filters.status) qs.status = filters.status;
                        if (filters.keyword) qs.keyword = filters.keyword;
                        if (filters.category_id) qs.category_id = filters.category_id;

                        if (returnAll) {
                            responseData = await sallaApiRequestAllItems.call(this, 'GET', storeId, '/products', {}, qs);
                        } else {
                            const limit = this.getNodeParameter('limit', i) as number;
                            qs.per_page = limit;
                            const response = await sallaApiRequest.call(this, 'GET', storeId, '/products', {}, qs);
                            responseData = response.data || response;
                        }
                    } else if (operation === 'create') {
                        const name = this.getNodeParameter('productName', i) as string;
                        const price = this.getNodeParameter('productPrice', i) as number;
                        const updateFields = this.getNodeParameter('productUpdateFields', i) as IDataObject;
                        const body: IDataObject = { name, price, ...updateFields };
                        responseData = await sallaApiRequest.call(this, 'POST', storeId, '/products', body);
                    } else if (operation === 'update') {
                        const productId = this.getNodeParameter('productId', i) as string;
                        const updateFields = this.getNodeParameter('productUpdateFields', i) as IDataObject;
                        responseData = await sallaApiRequest.call(this, 'PUT', storeId, `/products/${productId}`, updateFields);
                    } else if (operation === 'delete') {
                        const productId = this.getNodeParameter('productId', i) as string;
                        responseData = await sallaApiRequest.call(this, 'DELETE', storeId, `/products/${productId}`);
                    }
                }

                // ==================== CUSTOMER ====================
                else if (resource === 'customer') {
                    if (operation === 'get') {
                        const customerId = this.getNodeParameter('customerId', i) as string;
                        responseData = await sallaApiRequest.call(this, 'GET', storeId, `/customers/${customerId}`);
                    } else if (operation === 'getAll') {
                        const returnAll = this.getNodeParameter('returnAll', i) as boolean;
                        if (returnAll) {
                            responseData = await sallaApiRequestAllItems.call(this, 'GET', storeId, '/customers');
                        } else {
                            const limit = this.getNodeParameter('limit', i) as number;
                            const response = await sallaApiRequest.call(this, 'GET', storeId, '/customers', {}, { per_page: limit });
                            responseData = response.data || response;
                        }
                    } else if (operation === 'create') {
                        const customerFields = this.getNodeParameter('customerFields', i) as IDataObject;
                        responseData = await sallaApiRequest.call(this, 'POST', storeId, '/customers', customerFields);
                    } else if (operation === 'update') {
                        const customerId = this.getNodeParameter('customerId', i) as string;
                        const customerFields = this.getNodeParameter('customerFields', i) as IDataObject;
                        responseData = await sallaApiRequest.call(this, 'PUT', storeId, `/customers/${customerId}`, customerFields);
                    } else if (operation === 'delete') {
                        const customerId = this.getNodeParameter('customerId', i) as string;
                        responseData = await sallaApiRequest.call(this, 'DELETE', storeId, `/customers/${customerId}`);
                    } else if (operation === 'getMetrics') {
                        const customerId = this.getNodeParameter('customerId', i) as string;
                        // Get metrics from Syncaty API (includes segments, analytics, contact info, order stats)
                        responseData = await syncatyApiRequest.call(this, 'GET', `/n8n/stores/${storeId}/customers/${customerId}/metrics`);
                    }
                }

                // ==================== CATEGORY ====================
                else if (resource === 'category') {
                    if (operation === 'get') {
                        const categoryId = this.getNodeParameter('categoryId', i) as string;
                        responseData = await sallaApiRequest.call(this, 'GET', storeId, `/categories/${categoryId}`);
                    } else if (operation === 'getAll') {
                        const returnAll = this.getNodeParameter('returnAll', i) as boolean;
                        if (returnAll) {
                            responseData = await sallaApiRequestAllItems.call(this, 'GET', storeId, '/categories');
                        } else {
                            const limit = this.getNodeParameter('limit', i) as number;
                            const response = await sallaApiRequest.call(this, 'GET', storeId, '/categories', {}, { per_page: limit });
                            responseData = response.data || response;
                        }
                    } else if (operation === 'create') {
                        const categoryFields = this.getNodeParameter('categoryFields', i) as IDataObject;
                        responseData = await sallaApiRequest.call(this, 'POST', storeId, '/categories', categoryFields);
                    } else if (operation === 'update') {
                        const categoryId = this.getNodeParameter('categoryId', i) as string;
                        const categoryFields = this.getNodeParameter('categoryFields', i) as IDataObject;
                        responseData = await sallaApiRequest.call(this, 'PUT', storeId, `/categories/${categoryId}`, categoryFields);
                    } else if (operation === 'delete') {
                        const categoryId = this.getNodeParameter('categoryId', i) as string;
                        responseData = await sallaApiRequest.call(this, 'DELETE', storeId, `/categories/${categoryId}`);
                    }
                }

                // ==================== COUPON ====================
                else if (resource === 'coupon') {
                    if (operation === 'get') {
                        const couponId = this.getNodeParameter('couponId', i) as string;
                        responseData = await sallaApiRequest.call(this, 'GET', storeId, `/coupons/${couponId}`);
                    } else if (operation === 'getAll') {
                        const returnAll = this.getNodeParameter('returnAll', i) as boolean;
                        if (returnAll) {
                            responseData = await sallaApiRequestAllItems.call(this, 'GET', storeId, '/coupons');
                        } else {
                            const limit = this.getNodeParameter('limit', i) as number;
                            const response = await sallaApiRequest.call(this, 'GET', storeId, '/coupons', {}, { per_page: limit });
                            responseData = response.data || response;
                        }
                    } else if (operation === 'create') {
                        const couponFields = this.getNodeParameter('couponFields', i) as IDataObject;
                        responseData = await sallaApiRequest.call(this, 'POST', storeId, '/coupons', couponFields);
                    } else if (operation === 'delete') {
                        const couponId = this.getNodeParameter('couponId', i) as string;
                        responseData = await sallaApiRequest.call(this, 'DELETE', storeId, `/coupons/${couponId}`);
                    }
                }

                // ==================== SEGMENT ====================
                else if (resource === 'segment') {
                    if (operation === 'getAll') {
                        // Get all segments from Syncaty API
                        responseData = await syncatyApiRequest.call(this, 'GET', `/n8n/stores/${storeId}/segments`);
                        // Return the segments array
                        responseData = responseData.segments || responseData;
                    } else if (operation === 'getCustomers') {
                        const segmentId = this.getNodeParameter('segmentId', i) as string;
                        const returnAll = this.getNodeParameter('returnAllSegmentCustomers', i) as boolean;

                        if (returnAll) {
                            // Fetch all pages
                            const allCustomers: any[] = [];
                            let page = 1;
                            const perPage = 50;

                            do {
                                const response = await syncatyApiRequest.call(
                                    this,
                                    'GET',
                                    `/n8n/stores/${storeId}/segments/${segmentId}/customers`,
                                    {},
                                    { page, per_page: perPage }
                                );

                                if (response.customers && Array.isArray(response.customers)) {
                                    allCustomers.push(...response.customers);
                                }

                                if (!response.pagination || page >= response.pagination.total_pages) {
                                    break;
                                }
                                page++;
                            } while (true);

                            responseData = allCustomers;
                        } else {
                            const limit = this.getNodeParameter('segmentCustomersLimit', i) as number;
                            const response = await syncatyApiRequest.call(
                                this,
                                'GET',
                                `/n8n/stores/${storeId}/segments/${segmentId}/customers`,
                                {},
                                { page: 1, per_page: limit }
                            );
                            responseData = response.customers || response;
                        }
                    }
                }

                // ==================== SHIPMENT ====================
                else if (resource === 'shipment') {
                    const orderId = this.getNodeParameter('shipmentOrderId', i) as string;
                    if (operation === 'get') {
                        responseData = await sallaApiRequest.call(this, 'GET', storeId, `/orders/${orderId}/shipments`);
                    } else if (operation === 'create') {
                        const shipmentFields = this.getNodeParameter('shipmentFields', i) as IDataObject;
                        responseData = await sallaApiRequest.call(this, 'POST', storeId, `/orders/${orderId}/shipments`, shipmentFields);
                    }
                }

                // ==================== STORE INFO ====================
                else if (resource === 'store') {
                    if (operation === 'get') {
                        responseData = await sallaApiRequest.call(this, 'GET', storeId, '/store/info');
                    }
                }

                // ==================== USER INFO ====================
                else if (resource === 'user') {
                    if (operation === 'get') {
                        // User info endpoint is on Salla accounts domain, not the store API
                        responseData = await sallaApiRequest.call(this, 'GET', storeId, '/oauth2/user/info', {}, {}, 'https://accounts.salla.sa');
                    }
                }

                // Return data
                const executionData = this.helpers.constructExecutionMetaData(
                    this.helpers.returnJsonArray(responseData.data || responseData),
                    { itemData: { item: i } },
                );
                returnData.push(...executionData);

            } catch (error) {
                if (this.continueOnFail()) {
                    returnData.push({ json: { error: (error as Error).message }, pairedItem: { item: i } });
                    continue;
                }
                throw error;
            }
        }

        return [returnData];
    }
}
