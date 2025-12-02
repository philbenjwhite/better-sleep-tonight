const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY;
const HEYGEN_BASE_URL = process.env.NEXT_PUBLIC_HEYGEN_BASE_URL || 'https://api.heygen.com';

export async function POST() {
  try {
    if (!HEYGEN_API_KEY) {
      throw new Error('HEYGEN_API_KEY is missing from environment variables');
    }

    const res = await fetch(`${HEYGEN_BASE_URL}/v1/streaming.create_token`, {
      method: 'POST',
      headers: {
        'x-api-key': HEYGEN_API_KEY,
      },
    });

    if (!res.ok) {
      throw new Error(`HeyGen API error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();

    return new Response(data.data.token, {
      status: 200,
    });
  } catch (error) {
    console.error('Error retrieving HeyGen access token:', error);

    return new Response('Failed to retrieve access token', {
      status: 500,
    });
  }
}
