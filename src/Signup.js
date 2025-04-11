import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Signup() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        console.log('Signup form submitted', {username, email});
        try {
            console.log('Sending signup request');
            const response = await axios.post('http://localhost:8004/api/auth/signup', {
                username,
                password,
                email
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 200) {
                navigate('/login');
            } else if (response.status === 400) {
                setError(response.data?.error || 'Username already exists');
            } else if (response.status === 422) {
                setError('All fields are required');
            }
        } catch (err) {
            console.error('Signup error:', err);
            console.log('Error details:', err.response?.data);
            if (err.response) {
                if (err.response.status === 400) {
                    setError(err.response.data?.error || 'Username already exists');
                } else if (err.response.status === 422) {
                    setError('All fields are required');
                } else {
                    setError(err.response.data?.message || 'Registration failed. Please try again.');
                }
            } else {
                setError('Network error. Please check your connection.');
            }
        }
    };

    return (
        <div className="signup-container">
            <h2>Sign Up</h2>
            {error && <div className="error">{error}</div>}
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Username</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                <button type="submit">Create Account</button>
            </form>
        </div>
    );
}

export default Signup;
