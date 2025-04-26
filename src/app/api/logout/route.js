import { cookies } from 'next/headers';

export async function POST() {
  cookies().set('token', '', {
    httpOnly: true,
    path: '/',
    maxAge: 0,
  });

  return new Response(JSON.stringify({ success: true, message: 'Logout berhasil' }), {
    status: 200,
  });
}
