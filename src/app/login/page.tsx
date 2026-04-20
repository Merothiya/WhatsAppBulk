import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default function LoginPage() {
  async function login(formData: FormData) {
    'use server';
    const password = formData.get('password') as string;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (adminPassword && password === adminPassword) {
      cookies().set('admin_token', password, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
      redirect('/');
    } else {
      // Intentionally simple, error handling can be improved
      redirect('/login?error=1');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-md w-96 text-center">
        <h1 className="text-2xl font-bold text-teal-600 mb-2">WhatsApp Bulk</h1>
        <p className="text-gray-700 mb-6 text-sm">Enter admin password to continue</p>
        
        <form action={login} className="space-y-4">
          <input 
            type="password" 
            name="password" 
            placeholder="Admin Password" 
            className="w-full border px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            required
          />
          <button type="submit" className="w-full bg-teal-600 text-white font-medium py-2 rounded-md hover:bg-teal-700 transition-colors">
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
