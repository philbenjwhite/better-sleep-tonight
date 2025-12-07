const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY;
const HEYGEN_BASE_URL = process.env.NEXT_PUBLIC_HEYGEN_BASE_URL || 'https://api.heygen.com';

export async function GET() {
  try {
    if (!HEYGEN_API_KEY) {
      throw new Error('HEYGEN_API_KEY is missing from environment variables');
    }

    // Fetch available interactive/streaming avatars
    const res = await fetch(`${HEYGEN_BASE_URL}/v1/streaming/avatar.list`, {
      method: 'GET',
      headers: {
        'x-api-key': HEYGEN_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('HeyGen API response:', errorText);
      throw new Error(`HeyGen API error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();

    return new Response(JSON.stringify(data, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error retrieving HeyGen avatars:', error);

    return new Response(JSON.stringify({ error: 'Failed to retrieve avatars' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
