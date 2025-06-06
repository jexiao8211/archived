import { useState, useContext, type ChangeEvent, type FormEvent } from 'react';
import { AuthContext } from '../contexts/AuthContext';

const Login = () => {
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });

    const { login } = useContext(AuthContext);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        login(formData.username, formData.password);
    };

    return (
        <form onSubmit={handleSubmit}>
            <input type="text" name="username" placeholder="Username" onChange={handleChange} />
            <input type="password" name="password" placeholder="Password" onChange={handleChange} />
            <button type="submit">Login</button>
        </form>
    );
};

export default Login;