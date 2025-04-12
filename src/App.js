import React, { useEffect } from 'react'; 
import axios from 'axios'; 

// Set the base URL for Axios
axios.defaults.baseURL = process.env.NODE_ENV === 'production' 
  ? 'https://realdoc-api.onrender.com/api' 
  : 'http://localhost:8001/api';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Login from './Login';
import Signup from './Signup';
import DocumentEditor from './DocumentEditor';
import ProtectedRoute from './ProtectedRoute';

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
        <Router basename={process.env.PUBLIC_URL}>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/documents/:docId" element={<DocumentEditor />} />
                <Route path="/" element={
                    <div>
                        <h1>Welcome to the RealDoc Editor</h1>
                        <nav>
                            {localStorage.getItem('token') ? (
                                <>
                                    <button onClick={() => {
                                        localStorage.removeItem('token');
                                        localStorage.removeItem('username');
                                        window.location.href = '/';
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
