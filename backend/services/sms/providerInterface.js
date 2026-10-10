/**
 * SMS Provider Agnostic Interface
 * Defines the contract that every telecom SMS adapter must implement.
 */

export class SmsProviderInterface {
  /**
   * Name identifier of the provider
   */
  get name() {
    throw new Error('Getter "name" must be implemented by adapter.');
  }

  /**
   * Dispatch an SMS message
   * @param {Object} options
   * @param {string} options.to - E.164 formatted mobile number
   * @param {string} options.message - Rendered message body
   * @param {string} options.templateId - TRAI DLT content template ID
   * @param {string} options.entityId - TRAI DLT entity ID
   * @param {string} options.senderId - TRAI 6-character sender ID
   * @param {Array<string>} options.variables - Ordered template variables
   * @param {boolean} options.isUnicode - Whether content requires UCS-2 encoding
   * @returns {Promise<{ success: boolean, providerMessageId: string, status: string, latencyMs: number, rawResponse: any, error?: string }>}
   */
  async send(options) {
    throw new Error('Method "send" must be implemented by adapter.');
  }

  /**
   * Check status of a previously dispatched message
   * @param {string} providerMessageId 
   * @returns {Promise<{ status: string, deliveryTimestamp?: string, error?: string }>}
   */
  async getStatus(providerMessageId) {
    throw new Error('Method "getStatus" must be implemented by adapter.');
  }

  /**
   * Parse an incoming provider Delivery Receipt (DLR) webhook payload
   * @param {Object} headers 
   * @param {Object|string} body 
   * @returns {{ validSignature: boolean, providerMessageId: string, status: 'DELIVERED'|'FAILED'|'UNDELIVERED'|'QUEUED'|'SENT', errorCode?: string, rawTimestamp?: string }}
   */
  parseWebhook(headers, body) {
    throw new Error('Method "parseWebhook" must be implemented by adapter.');
  }
}
