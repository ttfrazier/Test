import {
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class WebhookSigningKeyApi implements ICredentialType {
	name = 'webhookSigningKeyApi';
	displayName = 'Webhook Signing Key';
	documentationUrl = '';
	properties: INodeProperties[] = [
		{
			displayName: 'Signing Key',
			name: 'signingKey',
			type: 'string',
			typeOptions: { password: true },
			default: 'hd4RJkvm8sWCKSgwqV2d8NhyYFCsFxXz',
			required: true,
			description: 'The secret key used to compute and verify the webhook HMAC signature',
		},
	];
}
