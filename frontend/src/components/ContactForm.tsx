import React, { useState } from 'react';
import { submitContactForm } from '../api';
import styles from '../styles/components/ContactForm.module.css';

interface ContactFormData {
    name: string;
    email: string;
    subject: string;
    message: string;
}

const ContactForm: React.FC = () => {
    const [formData, setFormData] = useState<ContactFormData>({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitStatus('idle');
        setErrorMessage('');

        try {
            const response = await submitContactForm(formData);
            setSubmitStatus('success');
            setFormData({ name: '', email: '', subject: '', message: '' });
        } catch (error: any) {
            setSubmitStatus('error');
            
            // Handle rate limiting errors specifically
            if (error.response?.status === 429) {
                const errorDetail = error.response.data;
                if (errorDetail?.message) {
                    setErrorMessage(errorDetail.message);
                } else {
                    setErrorMessage('Too many contact form submissions. Please try again later.');
                }
            } else {
                setErrorMessage(error instanceof Error ? error.message : 'Failed to send message');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.contactFormContainer}>
            {submitStatus === 'success' && (
                <div className={styles.successMessage}>
                    Thank you for your message! We'll get back to you soon.
                </div>
            )}
            
            {submitStatus === 'error' && (
                <div className={styles.errorMessage}>
                    {errorMessage}
                </div>
            )}

            <form onSubmit={handleSubmit} className={styles.contactForm}>
                <div className={styles.formGroup}>
                    <label htmlFor="name" className={styles.label}>Name *</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className={styles.input}
                        placeholder="Your name"
                    />
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="email" className={styles.label}>Email *</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className={styles.input}
                        placeholder="your.email@example.com"
                    />
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="subject" className={styles.label}>Subject *</label>
                    <input
                        type="text"
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        required
                        className={styles.input}
                        placeholder="What is this about?"
                    />
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="message" className={styles.label}>Message *</label>
                    <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        required
                        className={styles.textarea}
                        placeholder="Tell us more about your inquiry..."
                        rows={6}
                    />
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className={styles.submitButton}
                >
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                </button>
            </form>
        </div>
    );
};

export default ContactForm; 