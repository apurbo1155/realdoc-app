import React, { useEffect } from 'react'; 
import axios from 'axios'; 
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import Login from './Login';
import Signup from './Signup';
import DocumentEditor from './DocumentEditor';
import ProtectedRoute from './ProtectedRoute';

// Set the base URL for Axios
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'https://realdoc-api.onrender.com';

function App() {
  useEffect(() => {
    // Add request interceptor
    const requestInterceptor = axios.interceptors.request.use(
      config => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      error => Promise.reject(error)
    );

    // Add response interceptor
    const responseInterceptor = axios.interceptors.response.use(
      response => response,
      error => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('username');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );

    return () => {
      // Clean up interceptors
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

    return (
        <Router>
            <Routes>
                <Route path="/login" element={localStorage.getItem('token') ? <Navigate to="/" /> : <Login />} />
                <Route path="/signup" element={localStorage.getItem('token') ? <Navigate to="/" /> : <Signup />} />
                <Route path="/documents/:docId" element={
                    <ProtectedRoute>
                        <DocumentEditor />
                    </ProtectedRoute>
                } />
                <Route path="/" element={
                    <div>
                        <h1>Welcome to the RealDoc Editor</h1>
                        <nav>
                            {localStorage.getItem('token') ? (
                                <>
                                    <button onClick={() => {
                                        localStorage.removeItem('token');
                                        localStorage.removeItem('username');
                                        const navigate = useNavigate();
                                        navigate('/');
                                    }}>
                                        Logout
                                    </button>
                                    <br />
                                    <Link to={`/documents/${Date.now()}`}>New Document</Link>
                                </>
                            ) : (
                                <>
                                    <Link to="/login">Login</Link> | <Link to="/signup">Sign Up</Link>
                                    <br />
                                    <Link to={`/documents/${Date.now()}`}>New Document</Link>
                                </>
                            )}
                        </nav>
                    </div>
                } />
            </Routes>
        </Router>
    );
}

export default App;
