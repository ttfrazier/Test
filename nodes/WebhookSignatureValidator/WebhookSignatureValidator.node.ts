import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';
import { createHmac, timingSafeEqual } from 'crypto';

export class WebhookSignatureValidator implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Webhook Signature Validator',
		name: 'webhookSignatureValidator',
		icon: 'file:webhookSignatureValidator.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["algorithm"]}} signature validation',
		description: 'Validates the HMAC signing key / signature of an incoming webhook request',
		defaults: {
			name: 'Webhook Signature Validator',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'webhookSigningKeyApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Algorithm',
				name: 'algorithm',
				type: 'options',
				options: [
					{ name: 'HMAC-SHA1', value: 'sha1' },
					{ name: 'HMAC-SHA256', value: 'sha256' },
					{ name: 'HMAC-SHA512', value: 'sha512' },
				],
				default: 'sha256',
				description: 'The HMAC algorithm used to compute the signature',
			},
			{
				displayName: 'Signature Header',
				name: 'signatureHeader',
				type: 'string',
				default: 'x-signature-256',
				required: true,
				description: 'The name of the HTTP header that contains the signature (e.g. x-hub-signature-256)',
			},
			{
				displayName: 'Signature Prefix',
				name: 'signaturePrefix',
				type: 'string',
				default: 'sha256=',
				description: 'Optional prefix before the hex signature in the header value (e.g. "sha256=")',
			},
			{
				displayName: 'Encoding',
				name: 'encoding',
				type: 'options',
				options: [
					{ name: 'Hex', value: 'hex' },
					{ name: 'Base64', value: 'base64' },
				],
				default: 'hex',
				description: 'Encoding of the signature value',
			},
			{
				displayName: 'On Validation Failure',
				name: 'onFailure',
				type: 'options',
				options: [
					{
						name: 'Stop Execution (Error)',
						value: 'error',
						description: 'Throw an error and stop the workflow',
					},
					{
						name: 'Pass Through With Flag',
						value: 'flag',
						description: 'Continue execution and set $json.signatureValid = false',
					},
				],
				default: 'error',
				description: 'What to do when the signature is invalid',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const credentials = await this.getCredentials('webhookSigningKeyApi');
		const signingKey = credentials.signingKey as string;

		for (let i = 0; i < items.length; i++) {
			try {
				const algorithm = this.getNodeParameter('algorithm', i) as string;
				const signatureHeader = this.getNodeParameter('signatureHeader', i) as string;
				const signaturePrefix = this.getNodeParameter('signaturePrefix', i) as string;
				const encoding = this.getNodeParameter('encoding', i) as 'hex' | 'base64';
				const onFailure = this.getNodeParameter('onFailure', i) as string;

				// Get the headers from the incoming webhook data
				const headers = items[i].json.headers as Record<string, string> | undefined;
				if (!headers) {
					throw new NodeOperationError(
						this.getNode(),
						'No headers found in the input data. Connect this node after a Webhook Trigger node.',
						{ itemIndex: i },
					);
				}

				// Header names are typically lowercased
				const headerKey = signatureHeader.toLowerCase();
				const receivedSignatureRaw = headers[headerKey] as string | undefined;

				if (!receivedSignatureRaw) {
					throw new NodeOperationError(
						this.getNode(),
						`Signature header "${signatureHeader}" not found in the request headers`,
						{ itemIndex: i },
					);
				}

				// Strip the prefix if present
				let receivedSignature = receivedSignatureRaw;
				if (signaturePrefix && receivedSignatureRaw.startsWith(signaturePrefix)) {
					receivedSignature = receivedSignatureRaw.slice(signaturePrefix.length);
				}

				// Determine the body to verify against
				const body = items[i].json.body;
				let payload: string;
				if (typeof body === 'string') {
					payload = body;
				} else if (body !== undefined) {
					payload = JSON.stringify(body);
				} else {
					// Fall back to the full JSON minus headers
					const { headers: _h, ...rest } = items[i].json;
					payload = JSON.stringify(rest);
				}

				// Compute expected signature
				const expectedSignature = createHmac(algorithm, signingKey)
					.update(payload)
					.digest(encoding);

				// Constant-time comparison to prevent timing attacks
				let isValid = false;
				try {
					const sigBuffer = Buffer.from(receivedSignature, encoding);
					const expectedBuffer = Buffer.from(expectedSignature, encoding);

					if (sigBuffer.length === expectedBuffer.length) {
						isValid = timingSafeEqual(sigBuffer, expectedBuffer);
					}
				} catch {
					isValid = false;
				}

				if (!isValid && onFailure === 'error') {
					throw new NodeOperationError(
						this.getNode(),
						'Webhook signature validation failed — the signature does not match the expected value',
						{ itemIndex: i },
					);
				}

				// Build output item
				const outputItem: INodeExecutionData = {
					json: {
						...items[i].json,
						signatureValid: isValid,
					},
					pairedItem: { item: i },
				};

				if (items[i].binary) {
					outputItem.binary = items[i].binary;
				}

				returnData.push(outputItem);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							...items[i].json,
							signatureValid: false,
							error: (error as Error).message,
						},
						pairedItem: { item: i },
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
