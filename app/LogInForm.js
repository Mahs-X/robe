// src/app/components/LoginForm.js
'use client';
import Link from 'next/link';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithGoogle } from '@/app/lib/auth'; // auth.js থেকে আমদানি
import { LogIn, Loader2, Key } from 'lucide-react'; // Lucide Icons

export default function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    
    try {
        const user = await signInWithGoogle();
        
        if (user) {
          // লগইন সফল, কিন্তু ডেটা অ্যাক্সেস Firebase Rules দ্বারা নিয়ন্ত্রিত হবে।
          // এইখানে কোনো অতিরিক্ত UID চেক করার দরকার নেই, কারণ রুলস তা করবে।
          router.push('/'); // ড্যাশবোর্ডে (স্টুডেন্টস লিস্ট) রিডাইরেক্ট করুন
        } else {
          // ইউজার সাইন-ইন উইন্ডো বন্ধ করলে বা অন্য কারণে ব্যর্থ হলে
          setError("Login process failed or was cancelled. Please try again.");
        }
    } catch (err) {
        console.error("Login attempt failed:", err);
        setError("An unexpected error occurred during login. Check console.");
    }

    setLoading(false);
  };

  return (
    <div className='flex items-center justify-center min-h-screen bg-gray-100'>
      <div className='p-8 bg-white rounded-xl shadow-2xl w-full max-w-md text-center border-t-4 border-blue-500'>
        <div className='flex justify-center mb-4'>
            <Key size={36} className='text-blue-600' />
        </div>
        <h1 className='text-2xl font-bold text-[#2c3e50] mb-2'>Admin Access Required</h1>
        <p className='text-gray-600 mb-6'>Sign in with your authorized Google Account to manage PathFinder student data.</p>
        
        {error && (
          <p className='text-red-600 bg-red-100 p-3 rounded-lg mb-4 font-medium'>{error}</p>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          className='flex items-center justify-center gap-2 w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition duration-150 shadow-md disabled:bg-gray-400'
        >
          {loading ? (
            <>
              <Loader2 size={20} className='animate-spin' /> 
              Logging in...
            </>
          ) : (
            <>
              <LogIn size={20} /> Sign in with Google
            </>
          )}
        </button>
        <button className='bg-blue-500 text-white px-4 py-2 rounded mt-4'>
  <Link href="/main">Student DataBase</Link>
</button>

      </div>
    </div>
  );
}