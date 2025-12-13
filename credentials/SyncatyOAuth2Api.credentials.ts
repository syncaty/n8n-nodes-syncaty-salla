import {
    IAuthenticateGeneric,
    ICredentialTestRequest,
    ICredentialType,
    INodeProperties,
} from 'n8n-workflow';

export class SyncatyOAuth2Api implements ICredentialType {
    name = 'syncatyOAuth2Api';
    extends = ['oAuth2Api'];
    displayName = 'Syncaty Salla OAuth2 API';
    documentationUrl = 'https://syncaty.com/docs/n8n';

    properties: INodeProperties[] = [
        {
            displayName: 'Grant Type',
            name: 'grantType',
            type: 'hidden',
            default: 'authorizationCode',
        },
        {
            displayName: 'Authorization URL',
            name: 'authUrl',
            type: 'hidden',
            default: 'https://syncaty.com/oauth/authorize',
        },
        {
            displayName: 'Access Token URL',
            name: 'accessTokenUrl',
            type: 'hidden',
            default: 'https://syncaty.com/api/oauth/token',
        },
        {
            displayName: 'Scope',
            name: 'scope',
            type: 'hidden',
            default: '',
        },
        {
            displayName: 'Auth URI Query Parameters',
            name: 'authQueryParameters',
            type: 'hidden',
            default: 'response_type=code',
        },
        {
            displayName: 'Authentication',
            name: 'authentication',
            type: 'hidden',
            default: 'body',
        },
        {
            displayName: 'Client ID',
            name: 'clientId',
            type: 'string',
            default: '',
            required: true,
            description: 'Your Syncaty OAuth Client ID from Settings > OAuth Apps',
        },
        {
            displayName: 'Client Secret',
            name: 'clientSecret',
            type: 'string',
            typeOptions: {
                password: true,
            },
            default: '',
            required: true,
            description: 'Your Syncaty OAuth Client Secret',
        },
    ];

    authenticate: IAuthenticateGeneric = {
        type: 'generic',
        properties: {
            headers: {
                Authorization: '=Bearer {{$credentials.oauthTokenData.access_token}}',
            },
        },
    };

    test: ICredentialTestRequest = {
        request: {
            baseURL: 'https://syncaty.com',
            url: '/api/n8n/stores',
            method: 'GET',
        },
    };
}
