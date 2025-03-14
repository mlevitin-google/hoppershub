"use client";

import React, { useState, useCallback } from 'react';
import { TextField, Button, CircularProgress, Box, Typography, Grid } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

const HoppersHubAI = () => {
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [conversation, setConversation] = useState([]);

    // Function to handle sending messages to the API
    const handleSend = useCallback(async () => {
        if (!input.trim()) return;

        setIsLoading(true);
        setError(null);

        // Add user message to conversation
        const updatedConversation = [
            ...conversation,
            { role: 'user', content: input }
        ];
        setConversation(updatedConversation);

        try {
            // Make an API call to your backend endpoint
            const response = await fetch('/api/gemini', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: input,
                    conversation: updatedConversation
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to get a response');
            }

            const data = await response.json();

            // Add AI response to conversation
            setConversation([
                ...updatedConversation,
                { role: 'assistant', content: data.response }
            ]);

            setOutput(data.response);
        } catch (err) {
            setError(err.message || 'An error occurred.');
            setOutput('Sorry, there was an error processing your request.');
        } finally {
            setIsLoading(false);
        }
        setInput('');
    }, [input, conversation]);

    const handleInputChange = (e) => {
        setInput(e.target.value);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'grey.900', color: 'grey.100', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ py: 4, px: 6, borderBottom: 1, borderColor: 'grey.800' }}>
                <Typography variant="h5" fontWeight="bold">Hoppers Hub AI Companion</Typography>
            </Box>

            <Box sx={{ flex: 1, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, p: 4, gap: 4 }}>
                {/* Left panel - Chat history and input */}
                <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                        <Box sx={{ flex: 1, bgcolor: 'grey.800', border: 1, borderColor: 'grey.700', borderRadius: 2, p: 4, overflowY: 'auto', mb: 4, maxHeight: 'calc(100vh - 16rem)' }}>
                            <Typography variant="h6" fontWeight="semibold" mb={2}>Conversation:</Typography>
                            {conversation.map((msg, index) => (
                                <Box
                                    key={index}
                                    sx={{
                                        mb: 3,
                                        p: 2,
                                        borderRadius: 2,
                                        bgcolor: msg.role === 'user' ? 'blue.900' : 'grey.700',
                                    }}
                                >
                                    <Typography fontWeight="semibold">{msg.role === 'user' ? 'You:' : 'AI:'}</Typography>
                                    <Typography whiteSpace="pre-wrap">{msg.content}</Typography>
                                </Box>
                            ))}
                        </Box>

                        <TextField
                            multiline
                            rows={4}
                            value={input}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask a question about the Hopper's Hub data..."
                            sx={{
                                bgcolor: 'grey.800',
                                borderColor: 'grey.700',
                                borderRadius: 2,
                                p: 2,
                                '& .MuiOutlinedInput-root': {
                                    '& fieldset': {
                                        borderColor: 'grey.700',
                                    },
                                    '&:hover fieldset': {
                                        borderColor: 'grey.500',
                                    },
                                    '&.Mui-focused fieldset': {
                                        borderColor: 'blue.500',
                                    },
                                },
                                width: '100%',
                                '& .MuiInputBase-input': {
                                    color: 'grey.100',
                                },
                                '& .MuiInputLabel-root': {
                                    color: 'grey.400',
                                },
                            }}
                            disabled={isLoading}
                            variant="outlined"
                        />
                        <Button
                            onClick={handleSend}
                            disabled={isLoading || !input.trim()}
                            variant="contained"
                            sx={{
                                bgcolor: 'blue.500',
                                '&:hover': {
                                    bgcolor: 'blue.600',
                                },
                                color: 'white',
                                fontWeight: 'semibold',
                                py: 2,
                                px: 4,
                                borderRadius: 2,
                                transition: 'background-color 0.2s ease',
                                mt: 2,
                                width: '100%',
                            }}
                            endIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                        >
                            {isLoading ? 'Processing...' : 'Send'}
                        </Button>
                        {error && (
                            <Typography color="error" fontSize="small">{error}</Typography>
                        )}
                    </Grid>

                    {/* Right panel - Current response */}
                    <Grid item xs={12} md={8}>
                        <Box sx={{ bgcolor: 'grey.800', border: 1, borderColor: 'grey.700', borderRadius: 2, p: 4, overflowY: 'auto', maxHeight: 'calc(100vh - 12rem)' }}>
                            <Typography variant="h6" fontWeight="semibold" mb={2}>Response:</Typography>
                            {isLoading ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 100 }}>
                                    <CircularProgress size={40} />
                                </Box>
                            ) : (
                                <Typography sx={{ color: 'grey.200', whiteSpace: 'pre-wrap' }}>
                                    {output || "Awaiting your query..."}
                                </Typography>
                            )}
                        </Box>
                    </Grid>
                </Grid>
            </Box>
        </Box>
    );
};

export default HoppersHubAI;