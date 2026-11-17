'use client';

import { useState } from 'react';
import styles from './page.module.css';

const PRODUCTS = ['Gemstones', 'Rudraksha', 'Puja Services', 'Other'];
const BUSINESS_TYPES = ['Astrologer', 'Retailer', 'Distributor', 'Other'];

function SuccessPage() {
  return (
    <div className={styles.successContainer}>
      <div className={styles.successCard}>
        <div className={styles.successIcon}>✦</div>
        <h2 className={styles.successTitle}>Enquiry Submitted!</h2>
        <p className={styles.successText}>
          Thank you for your interest in partnering with Remedy Setu. Our team will
          review your enquiry and reach out to you within 1–2 business days.
        </p>
        <p className={styles.successSub}>
          <em>May your journey be blessed with prosperity.</em>
        </p>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    city: '',
    businessType: '',
    productsInterested: [],
    message: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState('');

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((er) => ({ ...er, [name]: '' }));
  }

  function handleCheckbox(product) {
    setForm((f) => {
      const already = f.productsInterested.includes(product);
      return {
        ...f,
        productsInterested: already
          ? f.productsInterested.filter((p) => p !== product)
          : [...f.productsInterested, product],
      };
    });
    setErrors((er) => ({ ...er, productsInterested: '' }));
  }

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = 'Full name is required.';
    if (!form.phone.trim()) e.phone = 'Phone number is required.';
    if (!form.city.trim()) e.city = 'City is required.';
    if (!form.businessType) e.businessType = 'Please select a business type.';
    if (form.productsInterested.length === 0)
      e.productsInterested = 'Please select at least one product.';
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError('');
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setServerError(data.message || 'Submission failed. Please try again.');
      }
    } catch (err) {
      setServerError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  if (submitted) return <SuccessPage />;

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.brandMark}>✦</div>
          <h1 className={styles.brandName}>Remedy Setu</h1>
          <p className={styles.brandTagline}>Connecting Sacred Traditions with Modern Business</p>
        </header>

        {/* Form Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.formTitle}>Partner Enquiry Form</h2>
            <p className={styles.formSubtitle}>
              Register your interest in becoming a partner for Gemstones, Rudraksha &amp; Puja Services.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className={styles.form}>
            {/* Full Name */}
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="name">
                Full Name <span className={styles.required}>*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                placeholder="Your full name"
                className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
                autoComplete="name"
              />
              {errors.name && <span className={styles.errorMsg}>{errors.name}</span>}
            </div>

            {/* Phone */}
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="phone">
                Phone Number <span className={styles.required}>*</span>
              </label>
              <input
                id="phone"
                name="phone"
                type="text"
                value={form.phone}
                onChange={handleChange}
                placeholder="10-digit mobile number"
                className={`${styles.input} ${errors.phone ? styles.inputError : ''}`}
                autoComplete="tel"
                inputMode="numeric"
              />
              {errors.phone && <span className={styles.errorMsg}>{errors.phone}</span>}
            </div>

            {/* City */}
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="city">
                City <span className={styles.required}>*</span>
              </label>
              <input
                id="city"
                name="city"
                type="text"
                value={form.city}
                onChange={handleChange}
                placeholder="Your city"
                className={`${styles.input} ${errors.city ? styles.inputError : ''}`}
                autoComplete="address-level2"
              />
              {errors.city && <span className={styles.errorMsg}>{errors.city}</span>}
            </div>

            {/* Business Type */}
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="businessType">
                Business Type <span className={styles.required}>*</span>
              </label>
              <select
                id="businessType"
                name="businessType"
                value={form.businessType}
                onChange={handleChange}
                className={`${styles.select} ${errors.businessType ? styles.inputError : ''}`}
              >
                <option value="">— Select business type —</option>
                {BUSINESS_TYPES.map((bt) => (
                  <option key={bt} value={bt}>{bt}</option>
                ))}
              </select>
              {errors.businessType && <span className={styles.errorMsg}>{errors.businessType}</span>}
            </div>

            {/* Products Interested */}
            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                Products Interested In <span className={styles.required}>*</span>
              </label>
              <div className={styles.checkboxGrid}>
                {PRODUCTS.map((product) => (
                  <label key={product} className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={form.productsInterested.includes(product)}
                      onChange={() => handleCheckbox(product)}
                      className={styles.checkbox}
                    />
                    <span className={styles.checkboxText}>{product}</span>
                  </label>
                ))}
              </div>
              {errors.productsInterested && (
                <span className={styles.errorMsg}>{errors.productsInterested}</span>
              )}
            </div>

            {/* Message */}
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="message">
                Additional Message <span className={styles.optional}>(optional)</span>
              </label>
              <textarea
                id="message"
                name="message"
                value={form.message}
                onChange={handleChange}
                placeholder="Tell us about your business, requirements, or any questions you have..."
                rows={4}
                className={styles.textarea}
              />
            </div>

            {/* Server error */}
            {serverError && (
              <div className={styles.serverError}>{serverError}</div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={`${styles.submitBtn} ${loading ? styles.submitBtnLoading : ''}`}
            >
              {loading ? (
                <span className={styles.spinner} aria-label="Submitting..." />
              ) : (
                'Submit Enquiry ✦'
              )}
            </button>
          </form>
        </div>

        <footer className={styles.footer}>
          <p>© {new Date().getFullYear()} Remedy Setu. All rights reserved.</p>
        </footer>
      </div>
    </main>
  );
}
