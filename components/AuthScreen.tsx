
import React, { useState } from 'react';

interface AuthScreenProps {
  hasPassword: boolean;
  onSetPassword: (password: string) => Promise<void>;
  onLogin: (password: string) => Promise<boolean>;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ hasPassword, onSetPassword, onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const title = 'パスワードの入力';
  const buttonText = hasPassword ? 'ログイン' : 'パスワードを設定';
  const placeholderText = hasPassword ? 'パスワード' : '新しいパスワード';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || !password) return;

    setError('');
    setIsLoading(true);

    try {
      if (hasPassword) {
        const success = await onLogin(password);
        if (!success) {
          setError('パスワードが違います。もう一度お試しください。');
          setPassword(''); // Clear password field on failure
        }
      } else {
        if (password.length < 4) {
          setError('パスワードは4文字以上で設定してください。');
        } else {
          await onSetPassword(password);
        }
      }
    } catch (err) {
      console.error("Authentication error:", err);
      setError('予期せぬエラーが発生しました。もう一度お試しください。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 min-h-screen flex flex-col items-center justify-center p-4 text-white">
      <div className="w-full max-w-sm">
        <header className="text-center mb-8">
            <h1 className="text-4xl font-marker">Whiteboard Photo Booth</h1>
            <p className="text-gray-400 mt-2">認証が必要です</p>
        </header>
        <main>
            <form onSubmit={handleSubmit} className="bg-gray-700 p-8 rounded-lg shadow-2xl">
              <h2 className="text-2xl font-bold text-center mb-6">{title}</h2>
              <div className="mb-4">
                  <label htmlFor="password-input" className="sr-only">{placeholderText}</label>
                  <input
                      id="password-input"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={placeholderText}
                      className="w-full bg-gray-800 text-white text-center text-lg px-4 py-3 rounded-md border-2 border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
                      autoFocus
                      required
                      aria-describedby="password-error"
                  />
              </div>

              {error && (
                  <p id="password-error" className="text-red-400 text-center mb-4" role="alert">
                      {error}
                  </p>
              )}

              <button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-md transition-transform transform hover:scale-105 shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:bg-blue-800 disabled:cursor-not-allowed disabled:scale-100"
                  disabled={isLoading || !password}
              >
                  {isLoading ? '処理中...' : buttonText}
              </button>
            </form>
        </main>
      </div>
    </div>
  );
};
