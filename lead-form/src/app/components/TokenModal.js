'use client';

import { useState } from 'react';
import styles from './TokenModal.module.css';

export default function TokenModal({ onSubmit, apiUrl }) {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!token.trim()) {
      setError('Please enter your admin token.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${apiUrl}/verify-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim() }),
      });
      if (res.ok) {
        onSubmit(token.trim());
      } else {
        setError('Invalid token. Please try again.');
      }
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <span className={styles.headerMark}>✦</span>
          <h1 className={styles.title}>Remedy Setu Sales Dashboard</h1>
        </div>
        <div className={styles.body}>
          <p className={styles.subtitle}>Enter your admin token to access the dashboard.</p>
          <form onSubmit={handleSubmit} className={styles.form}>
            <input
              type="password"
              value={token}
              onChange={(e) => { setToken(e.target.value); setError(''); }}
              placeholder="Admin token"
              className={`${styles.input} ${error ? styles.inputError : ''}`}
              autoComplete="current-password"
              autoFocus
            />
            {error && <p className={styles.error}>{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className={`${styles.btn} ${loading ? styles.btnLoading : ''}`}
            >
              {loading ? <span className={styles.spinner} /> : 'Access Dashboard ✦'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
