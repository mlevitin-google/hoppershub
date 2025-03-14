"use client";

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

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
        <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
            <header className="py-4 px-6 border-b border-gray-800">
                <h1 className="text-2xl font-bold">Hoppers Hub AI Companion</h1>
            </header>

            <main className="flex-1 flex flex-col md:flex-row p-4 gap-4">
                {/* Left panel - Chat history and input */}
                <div className="w-full md:w-1/3 flex flex-col gap-4">
                    <div className="flex-1 bg-gray-800 border border-gray-700 rounded-lg p-4 overflow-y-auto mb-4 max-h-[calc(100vh-16rem)]">
                        <h2 className="text-lg font-semibold mb-2">Conversation:</h2>
                        {conversation.map((msg, index) => (
                            <div key={index} className={`mb-3 p-2 rounded-lg ${msg.role === 'user' ? 'bg-blue-900' : 'bg-gray-700'}`}>
                                <p className="font-semibold">{msg.role === 'user' ? 'You:' : 'AI:'}</p>
                                <p className="whitespace-pre-wrap">{msg.content}</p>
                            </div>
                        ))}
                    </div>
                    
                    <Textarea
                        value={input}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask a question about the Hopper's Hub data..."
                        className={cn(
                            "bg-gray-800 border-gray-700 rounded-lg p-4",
                            "focus:outline-none focus:ring-2 focus:ring-blue-500",
                            "resize-none min-h-[120px]",
                            "placeholder:text-gray-400"
                        )}
                        disabled={isLoading}
                    />
                    <Button
                        onClick={handleSend}
                        disabled={isLoading || !input.trim()}
                        className={cn(
                            "bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg",
                            "transition-colors duration-200",
                            "disabled:opacity-50 disabled:cursor-not-allowed",
                            "w-full"
                        )}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <Send className="mr-2 h-4 w-4" />
                                Send
                            </>
                        )}
                    </Button>
                    {error && (
                        <div className="text-red-500 text-sm">{error}</div>
                    )}
                </div>

                {/* Right panel - Current response */}
                <div className="w-full md:w-2/3 bg-gray-800 border border-gray-700 rounded-lg p-4 overflow-y-auto max-h-[calc(100vh-12rem)]">
                    <h2 className="text-lg font-semibold mb-2">Response:</h2>
                    {isLoading ? (
                        <div className="flex items-center justify-center h-24">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : (
                        <p className="text-gray-200 whitespace-pre-wrap">
                            {output || "Awaiting your query..."}
                        </p>
                    )}
                </div>
            </main>
        </div>
    );
};

export default HoppersHubAI;