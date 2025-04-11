import React, { useState, useEffect, useRef } from 'react';
import './DocumentEditor.css';
import { useParams } from 'react-router-dom';
import axios from 'axios';

function DocumentEditor() {
    const { docId } = useParams();
    const [content, setContent] = useState('');
    const [connected, setConnected] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const ws = useRef(null);
    const saveTimeout = useRef(null); // For debouncing saves

    useEffect(() => {
        let isMounted = true;
        const abortController = new AbortController();

        // Load document content with retry logic
        const loadDocument = async (retryCount = 0) => {
            try {
                console.log(`Loading document ${docId}, attempt ${retryCount + 1}`);
                const token = localStorage.getItem('token');
                const response = await axios.get(`http://localhost:8004/api/documents/${docId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    signal: abortController.signal
                });
                
                console.log('Load response:', response.data);
                
                if (isMounted) {
                    if (response.data?.content !== undefined) {
                        setContent(response.data.content || '');
                    } else {
                        throw new Error('Invalid document response format');
                    }
                }
            } catch (error) {
                if (isMounted) {
                    console.error('Document load error:', error);
                    if (retryCount < 3 && !abortController.signal.aborted) {
                        console.log(`Retrying in ${1000 * (retryCount + 1)}ms...`);
                        setTimeout(() => loadDocument(retryCount + 1), 1000 * (retryCount + 1));
                    } else {
                        console.error('Failed to load document after retries');
                    }
                }
            }
        };

        loadDocument();

        // Connect to WebSocket with better error handling
        const token = localStorage.getItem('token');
        ws.current = new WebSocket(`ws://localhost:8004/ws/${docId}?token=${token}`);
        
        ws.current.onopen = () => {
            setConnected(true);
            console.log('WebSocket connected');
        };

        ws.current.onmessage = (e) => {
            try {
                const data = JSON.parse(e.data);
                console.log('WebSocket message received:', data);
                if (isMounted) {
                    if (data.type === 'content_update') {
                        setContent(prevContent => {
                            // Only update if content is different
                            if (prevContent !== data.content) {
                                return data.content;
                            }
                            return prevContent;
                        });
                    }
                }
            } catch (error) {
                console.error('Error handling WebSocket message:', error);
            }
        };

        ws.current.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        ws.current.onclose = () => {
            if (isMounted) {
                setConnected(false);
                console.log('WebSocket disconnected');
            }
        };

        return () => {
            isMounted = false;
            abortController.abort();
            if (ws.current) {
                ws.current.close();
            }
        };
    }, [docId]);

    // Save document periodically with better error handling
    useEffect(() => {
        const saveDocument = async () => {
            if (content) {
                try {
                    console.log('Auto-saving document...');
                    const token = localStorage.getItem('token');
                    const response = await axios.post(
                        `http://localhost:8004/api/documents/${docId}`, 
                        { content },
                        {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        }
                    );
                    console.log('Save response:', response.data);
                } catch (error) {
                    console.error('Error saving document:', error);
                }
            }
        };

        const interval = setInterval(saveDocument, 5000); // Save every 5 seconds
        return () => clearInterval(interval);
    }, [content, docId]);

    const handleChange = (e) => {
        const newContent = e.target.value;
        setContent(newContent);
        
        // Debounce save and broadcast
        clearTimeout(saveTimeout.current);
        saveTimeout.current = setTimeout(async () => {
            // Save to server
            const token = localStorage.getItem('token');
            await axios.post(
                `http://localhost:8004/api/documents/${docId}`, 
                { content: newContent },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            ).catch(error => {
                console.error('Error saving document:', error);
            });

            // Broadcast via WebSocket
            if (ws.current && connected) {
                try {
                    ws.current.send(JSON.stringify({
                        type: 'content_update',
                        content: newContent,
                        timestamp: Date.now(),
                        sender: 'self'
                    }));
                } catch (error) {
                    console.error('Error sending WebSocket message:', error);
                }
            }
        }, 300);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        window.location.href = '/login';
    };

    const handleDownload = () => {
        const element = document.createElement('a');
        const file = new Blob([content], {type: 'text/plain'});
        element.href = URL.createObjectURL(file);
        element.download = `document-${docId}.txt`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    return (
        <div className="document-editor">
            <div className="document-header">
                <h2>Editing Document: {docId}</h2>
                <div className="document-actions">
                    <button onClick={handleDownload} className="download-btn">
                        Download
                    </button>
                    <button onClick={handleLogout} className="logout-btn">
                        Logout
                    </button>
                </div>
            </div>
            <textarea 
                value={content}
                onChange={handleChange}
                style={{ width: '100%', height: '500px' }}
            />
        </div>
    );
}

export default DocumentEditor;
