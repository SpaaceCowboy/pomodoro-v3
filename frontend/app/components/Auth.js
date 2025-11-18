'use client';

import { useState } from 'react';
import axios from 'axios';

export default function Auth({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const url = isRegister 
      ? 'http://localhost:5000/api/auth/register'
      : 'http://localhost:5000/api/auth/login';

    try {
      const res = await axios.post(url, { email, password });
      localStorage.setItem('token', res.data.token);
      onLogin({ id: res.data.user._id || res.data.user.id, email: res.data.user.email });
    } catch (err) {
      setError(err.response?.data?.msg || 'Something went wrong');
    }
  };

  return (
    <div className="fixed inset-0 bg-white dark:bg-black flex items-center justify-center text-black dark:text-white">
      <form onSubmit={handleSubmit} className="text-center space-y-8">
        <h1 className="text-4xl font-thin">{isRegister ? 'Create Account' : 'Welcome Back'}</h1>
        
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="block w-80 p-4 bg-transparent border-b-2 border-current text-center text-2xl"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="block w-80 p-4 bg-transparent border-b-2 border-current text-center text-2xl"
        />

        {error && <p className="text-red-500">{error}</p>}

        <button type="submit" className="text-2xl tracking-widest border-b-4 border-current pb-2">
          {isRegister ? 'REGISTER' : 'LOGIN'}
        </button>

        <button
          type="button"
          onClick={() => setIsRegister(!isRegister)}
          className="block opacity-60 hover:opacity-100"
        >
          {isRegister ? 'Already have an account? Login' : 'No account? Register'}
        </button>
      </form>
    </div>
  );
}