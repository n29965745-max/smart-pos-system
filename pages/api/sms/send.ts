import type { NextApiRequest, NextApiResponse } from 'next';
import SMSService from '../../../services/sms.service';

import { secureRoute, SecureRequest, getAdminDb } from '../../../lib/secure-route';

export default secureRoute(async function handler(req: SecureRequest, res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { phoneNumber, message, customerId, messageType, priority } = req.body;

    if (!phoneNumber || !message) {
      return res.status(400).json({ error: 'Phone number and message are required' });
    }

    const result = await SMSService.sendSMS({
      phoneNumber,
      message,
      customerId,
      messageType: messageType || 'manual',
      priority: priority || 5
    });

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'SMS sent successfully',
        data: result
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.error || 'Failed to send SMS'
      });
    }
  } catch (error: any) {
    console.error('SMS send error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});
