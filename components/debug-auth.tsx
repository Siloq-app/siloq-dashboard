'use client';

import { useState } from 'react';
import { login, register, isAuthenticated, getStoredUser, clearAuth } from '@/lib/auth-helper';

export function DebugAuth() {
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('testpassword123');
  const [name, setName] = useState('Test User');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleLogin = async () => {
    setLoading(true);
    setMessage('');
    try {
      const result = await login(email, password);
      setMessage(`✅ Login successful: ${result.user.email} (${result.user.subscription_tier || 'free_trial'})`);
    } catch (error: any) {
      setMessage(`❌ Login failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    setMessage('');
    try {
      const result = await register(name, email, password);
      setMessage(`✅ Registration successful: ${result.user.email} (${result.user.subscription_tier || 'free_trial'})`);
    } catch (error: any) {
      setMessage(`❌ Registration failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearAuth();
    setMessage('✅ Logged out');
  };

  const user = getStoredUser();

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm z-50">
      <h3 className="font-semibold text-sm mb-2">🔧 Auth Debug</h3>
      
      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span>Authenticated:</span>
          <span className={isAuthenticated() ? 'text-green-600' : 'text-red-600'}>
            {isAuthenticated() ? '✅ Yes' : '❌ No'}
          </span>
        </div>
        
        {user && (
          <div className="border-t pt-2">
            <div><strong>User:</strong> {user.email}</div>
            <div><strong>Tier:</strong> {user.subscription_tier || 'free_trial'}</div>
            <div><strong>Staff:</strong> {user.is_staff ? 'Yes' : 'No'}</div>
            <div><strong>Super:</strong> {user.is_superuser ? 'Yes' : 'No'}</div>
          </div>
        )}
        
        <div className="border-t pt-2 space-y-1">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full px-2 py-1 border rounded text-xs"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-2 py-1 border rounded text-xs"
          />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            className="w-full px-2 py-1 border rounded text-xs"
          />
        </div>
        
        <div className="flex gap-1">
          <button
            onClick={handleLogin}
            disabled={loading}
            className="flex-1 bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? '...' : 'Login'}
          </button>
          <button
            onClick={handleRegister}
            disabled={loading}
            className="flex-1 bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600 disabled:opacity-50"
          >
            {loading ? '...' : 'Register'}
          </button>
          <button
            onClick={handleLogout}
            className="flex-1 bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
          >
            Logout
          </button>
        </div>
        
        {message && (
          <div className="border-t pt-2 text-xs">
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
