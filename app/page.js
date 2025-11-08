import React from 'react'
import LoginForm from './LogInForm'
import Link from 'next/link'
export default function page() {
  return (
    <div>
  <Link href="/main">
    <button className='bg-blue-500 text-white px-4 py-2 rounded mt-4 m-4'>
      Go to Student DataBase
    </button>
  </Link>

    </div>
  )
}
