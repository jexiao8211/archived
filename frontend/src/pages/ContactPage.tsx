import ContactForm from '../components/ContactForm';
import styles from '../styles/pages/ContactPage.module.css';

const ContactPage = () => {
    return (
        <div className={styles.contactPage}>
            <div className={styles.contactContainer}>
                <h1 className={styles.title}>Contact Us</h1>
                <p className={styles.description}>
                    Have a question, suggestion, or need help? We'd love to hear from you!
                </p>
                <ContactForm />
            </div>
        </div>
    );
};

export default ContactPage; 