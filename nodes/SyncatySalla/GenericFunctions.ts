import {
    IExecuteFunctions,
    IHookFunctions,
    ILoadOptionsFunctions,
    IWebhookFunctions,
    IHttpRequestMethods,
    IRequestOptions,
    IDataObject,
    NodeApiError,
    NodeOperationError,
    JsonObject,
} from 'n8n-workflow';

/**
 * Syncaty API base URL (hardcoded)
 */
const SYNCATY_BASE_URL = 'https://syncaty.com';

/**
 * Get the Syncaty API base URL
 */
export function getBaseUrl(): string {
    return SYNCATY_BASE_URL;
}

/**
 * Make an authenticated request to Syncaty API
 */
export async function syncatyApiRequest(
    this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions | IWebhookFunctions,
    method: IHttpRequestMethods,
    endpoint: string,
    body: IDataObject = {},
    qs: IDataObject = {},
): Promise<any> {
    const baseUrl = getBaseUrl();

    const options: IRequestOptions = {
        method,
        url: `${baseUrl}/api${endpoint}`,
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        qs,
        json: true,
    };

    if (Object.keys(body).length > 0) {
        options.body = body;
    }

    try {
        return await this.helpers.requestOAuth2.call(
            this,
            'syncatyOAuth2Api',
            options,
        );
    } catch (error) {
        throw new NodeApiError(this.getNode(), error as JsonObject);
    }
}

/**
 * Get Salla access token for a specific store from Syncaty
 */
export async function getSallaToken(
    this: IExecuteFunctions | ILoadOptionsFunctions,
    storeId: string,
): Promise<string> {
    const response = await syncatyApiRequest.call(
        this,
        'GET',
        `/n8n/stores/${storeId}/token`,
    );

    if (!response.access_token) {
        throw new NodeOperationError(
            this.getNode(),
            'Failed to get Salla access token from Syncaty',
        );
    }

    return response.access_token;
}

/**
 * Make a request directly to Salla API using token from Syncaty
 */
export async function sallaApiRequest(
    this: IExecuteFunctions,
    method: IHttpRequestMethods,
    storeId: string,
    endpoint: string,
    body: IDataObject = {},
    qs: IDataObject = {},
    baseUrl?: string,
): Promise<any> {
    // Get Salla token from Syncaty
    const sallaToken = await getSallaToken.call(this, storeId);

    // Use custom base URL if provided, otherwise use default Salla API
    const apiBaseUrl = baseUrl || 'https://api.salla.dev/admin/v2';

    const options: IRequestOptions = {
        method,
        url: `${apiBaseUrl}${endpoint}`,
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sallaToken}`,
        },
        qs,
        json: true,
    };

    if (Object.keys(body).length > 0) {
        options.body = body;
    }

    try {
        return await this.helpers.request(options);
    } catch (error) {
        throw new NodeApiError(this.getNode(), error as JsonObject);
    }
}

/**
 * Make a paginated request to Salla API and return all items
 */
export async function sallaApiRequestAllItems(
    this: IExecuteFunctions,
    method: IHttpRequestMethods,
    storeId: string,
    endpoint: string,
    body: IDataObject = {},
    qs: IDataObject = {},
): Promise<any[]> {
    const returnData: any[] = [];
    let page = 1;
    const perPage = 50;

    do {
        const response = await sallaApiRequest.call(
            this,
            method,
            storeId,
            endpoint,
            body,
            { ...qs, page, per_page: perPage },
        );

        if (response.data && Array.isArray(response.data)) {
            returnData.push(...response.data);
        } else if (Array.isArray(response)) {
            returnData.push(...response);
        } else {
            break;
        }

        // Check pagination
        if (response.pagination) {
            if (response.pagination.current_page >= response.pagination.total_pages) {
                break;
            }
        } else if (!response.data || response.data.length < perPage) {
            break;
        }

        page++;
    } while (true);

    return returnData;
}

/**
 * Lookup store ID by Salla entity ID
 */
export async function lookupStoreId(
    this: IExecuteFunctions | ILoadOptionsFunctions,
    type: 'merchant' | 'product' | 'order' | 'customer',
    id: string,
): Promise<string> {
    const response = await syncatyApiRequest.call(
        this,
        'GET',
        '/n8n/lookup',
        {},
        { type, id },
    );

    if (!response.store_id) {
        throw new NodeOperationError(
            this.getNode(),
            `Could not find store for ${type} with ID: ${id}`,
        );
    }

    return response.store_id;
}
