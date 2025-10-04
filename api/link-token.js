// api/link-token.js
// CheqMate backend endpoint — generates a Plaid link_token
// 2025-10-04: Added redirect_uri https://cheqmateios.app/plaid/return

import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

const config = new Configuration({
  basePath: PlaidEnvironments.sandbox, // or development/production
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
});

const plaidClient = new PlaidApi(config);

export default async function handler(req, res) {
  try {
    const { flow, access_token } = req.body;

    // Build the Plaid link_token request
    const request = {
      user: { client_user_id: 'user-id-123' },
      client_name: 'CheqMate',
      products: ['transactions'],
      country_codes: ['US'],
      language: 'en',
      redirect_uri: 'https://cheqmateios.app/plaid/return', // ✅ required for iOS redirect
    };

    // For update flow, attach access_token
    if (flow === 'update' && access_token) {
      request.access_token = access_token;
    }

    // Create Plaid link_token
    const response = await plaidClient.linkTokenCreate(request);
    res.status(200).json({ link_token: response.data.link_token });

  } catch (error) {
    console.error('Plaid link-token error:', error.response?.data || error.message);
    res.status(500).json({ error: error.message });
  }
}
