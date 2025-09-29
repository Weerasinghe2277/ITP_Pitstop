import React, { useState, useEffect, useRef } from 'react';
import Vapi from "@vapi-ai/web";
import './TechnicianVoiceAssistant.css';

// Initialize VAPI with your public API key
const vapi = new Vapi(import.meta.env.VITE_VAPI_PUBLIC_API_KEY || "YOUR_PUBLIC_API_KEY");

const TechnicianVoiceAssistant = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isAssistantSpeaking, setIsAssistantSpeaking] = useState(false);
  
  const messagesEndRef = useRef(null);
  const vapiInitialized = useRef(false);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize VAPI event listeners
  useEffect(() => {
    if (vapiInitialized.current) return;
    
    vapiInitialized.current = true;
    
    // Set up VAPI event listeners
    vapi.on("call-start", () => {
      console.log("Voice assistant connected");
      setIsConnected(true);
      setIsLoading(false);
      addMessage('system', 'Voice assistant connected. How can I help you navigate Pitstop?');
    });

    vapi.on("call-end", () => {
      console.log("Voice assistant disconnected");
      setIsConnected(false);
      setIsLoading(false); // Reset loading state
      setIsListening(false);
      setIsAssistantSpeaking(false);
      addMessage('system', 'Voice assistant disconnected.');
    });

    vapi.on("speech-start", () => {
      console.log("User started speaking");
      setIsListening(true);
    });

    vapi.on("speech-end", () => {
      console.log("User stopped speaking");
      setIsListening(false);
    });

    vapi.on("message", (message) => {
      console.log("VAPI Message:", message);
      
      // Handle status updates
      if (message.type === "status-update") {
        if (message.status === "ended") {
          setIsConnected(false);
          setIsLoading(false);
          setIsListening(false);
          setIsAssistantSpeaking(false);
          // Don't add duplicate disconnect message since call-end event already handles it
        }
        return;
      }
      
      // Handle speech updates
      if (message.type === "speech-update") {
        if (message.role === "assistant") {
          setIsAssistantSpeaking(message.status === "started");
        }
        return;
      }
      
      // Handle transcripts
      if (message.type === "transcript") {
        if (message.transcriptType === "final" && message.transcript && message.role === "user") {
          addMessage('user', message.transcript);
        }
      } else if (message.type === "assistant-message") {
        if (message.message) {
          addMessage('assistant', message.message);
        }
      }
    });

    vapi.on("error", (error) => {
      console.error("VAPI Error:", error);
      setIsConnected(false);
      setIsLoading(false);
      setIsListening(false);
      setIsAssistantSpeaking(false);
      if (error.errorMsg && !error.errorMsg.includes('ended') && !error.errorMsg.includes('customer-ended-call')) {
        addMessage('error', `Error: ${error.errorMsg}`);
      }
    });

    return () => {
      vapi.removeAllListeners();
      vapiInitialized.current = false;
    };
  }, []);

  const addMessage = (type, text) => {
    const message = {
      id: `msg-${Date.now()}-${Math.random()}`,
      type,
      text,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, message]);
  };

  const startVoiceAssistant = async () => {
    try {
      setIsLoading(true);
      
      const config = {
        model: {
          provider: 'openai',
          model: 'gpt-3.5-turbo',
          messages: [{
            role: 'system',
            content: `You are a helpful voice assistant for Pitstop Garage Management System, specifically designed to help technicians (labourers) navigate and understand their dashboard functions. 

Your role is to provide guidance and instructions on:

TECHNICIAN DASHBOARD NAVIGATION:
- How to view assigned jobs and their details
- How to update job status (pending → working → completed)
- Understanding job priorities and urgency levels
- How to access and read work instructions
- How to report job completion
- How to communicate with inspectors
- How to apply for leave requests

PITSTOP WORKFLOW GUIDANCE:
- Explain the booking workflow from technician perspective
- Help understand the job assignment process
- Explain status updates and their importance
- Guide through proper completion procedures

GENERAL SYSTEM HELP:
- Navigation tips for the dashboard
- Understanding different sections and features
- Troubleshooting common interface issues
- Best practices for efficient work tracking

Keep responses concise, practical, and focused on helping technicians work efficiently. Always be encouraging and supportive. Do not provide information about backend systems, administrative functions, or data that technicians shouldn't access.

If asked about areas outside technician scope, politely redirect to appropriate personnel (inspector, admin, etc.).`
          }],
          temperature: 0.7,
          maxTokens: 200
        },
        voice: {
          provider: '11labs',
          voiceId: 'vBKc2FfBKJfcZNyEt1n6'
        },
        firstMessage: "Hi! I'm your Pitstop assistant. I'm here to help you navigate your technician dashboard and understand your daily tasks. How can I help you today?",
        maxDurationSeconds: 600,
        backgroundSound: 'off'
      };

      await vapi.start(config);
      
    } catch (error) {
      console.error("Failed to start voice assistant:", error);
      setIsLoading(false);
      addMessage('error', 'Failed to start voice assistant. Please try again.');
    }
  };

  const stopVoiceAssistant = () => {
    console.log("Stopping VAPI call...");
    setIsLoading(true);
    try {
      vapi.stop();
    } catch (err) {
      console.error("Error stopping call:", err);
    }
    
    // Force state reset after a short delay to ensure cleanup
    setTimeout(() => {
      setIsConnected(false);
      setIsLoading(false);
      setIsListening(false);
      setIsAssistantSpeaking(false);
    }, 1000);
  };

  const sendTextMessage = async (messageText) => {
    if (!messageText.trim()) return;
    
    addMessage('user', messageText);
    
    // For text mode, we'll simulate a response based on common technician queries
    setTimeout(() => {
      const response = generateTechnicianResponse(messageText);
      addMessage('assistant', response);
    }, 1000);
  };

  const generateTechnicianResponse = (query) => {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('job') && (lowerQuery.includes('view') || lowerQuery.includes('see') || lowerQuery.includes('assigned'))) {
      return "To view your assigned jobs, go to the 'My Jobs' section in your dashboard. You'll see a list of all jobs assigned to you with their current status, priority level, and estimated completion time.";
    }
    
    if (lowerQuery.includes('status') && lowerQuery.includes('update')) {
      return "To update job status: 1) Click on the job from your list, 2) Click the 'Update Status' button, 3) Select new status (Working/Completed), 4) Add any notes if required, 5) Click 'Save'. Always update status when you start and finish work!";
    }
    
    if (lowerQuery.includes('priority') || lowerQuery.includes('urgent')) {
      return "Job priorities are shown with color codes: Red = Urgent (complete ASAP), Orange = High (complete today), Yellow = Medium (complete within 2 days), Green = Low (complete when possible). Always prioritize urgent and high-priority jobs first.";
    }
    
    if (lowerQuery.includes('inspector') || lowerQuery.includes('communicate')) {
      return "To communicate with inspectors: Use the 'Messages' tab in your job details, or click the 'Contact Inspector' button. For urgent issues, use the emergency contact feature. Always update job notes for important information.";
    }
    
    if (lowerQuery.includes('leave') || lowerQuery.includes('time off')) {
      return "To apply for leave: 1) Go to 'Leave Requests' in the main menu, 2) Click 'Apply for Leave', 3) Select dates and leave type, 4) Provide reason, 5) Submit for approval. Check 'My Leave Status' to track your applications.";
    }
    
    if (lowerQuery.includes('complete') || lowerQuery.includes('finish')) {
      return "To complete a job: 1) Ensure all work is finished according to specifications, 2) Update status to 'Completed', 3) Add completion notes and any issues encountered, 4) Take photos if required, 5) Notify inspector for final inspection.";
    }
    
    if (lowerQuery.includes('dashboard') || lowerQuery.includes('navigate')) {
      return "Your dashboard has these main sections: 'My Jobs' (assigned work), 'Job History' (completed work), 'Messages' (communications), 'Leave Requests' (time off), and 'Profile' (personal settings). Use the sidebar navigation to move between sections.";
    }
    
    if (lowerQuery.includes('help') || lowerQuery.includes('how')) {
      return "I can help you with: viewing assigned jobs, updating job status, understanding priorities, communicating with inspectors, applying for leave, completing jobs, and navigating your dashboard. What specific task do you need help with?";
    }
    
    // Default response
    return "I'm here to help you with your technician tasks. I can guide you through viewing jobs, updating status, understanding priorities, communicating with inspectors, applying for leave, and more. Could you be more specific about what you need help with?";
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (currentMessage.trim()) {
      sendTextMessage(currentMessage);
      setCurrentMessage('');
    }
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const getStatusIcon = () => {
    if (isLoading) return "🔄";
    if (isConnected && isListening) return "🎙️";
    if (isConnected && isAssistantSpeaking) return "🔊";
    if (isConnected) return "✅";
    return "🤖";
  };

  const getStatusText = () => {
    if (isLoading && !isConnected) return "Connecting...";
    if (isLoading && isConnected) return "Disconnecting...";
    if (isConnected && isListening) return "Listening...";
    if (isConnected && isAssistantSpeaking) return "Speaking...";
    if (isConnected) return "Connected";
    return "Assistant";
  };

  return (
    <div className={`technician-voice-assistant ${isExpanded ? 'expanded' : 'collapsed'}`}>
      {/* Header / Toggle Button */}
      <div className="assistant-header" onClick={toggleExpand}>
        <div className="assistant-icon">
          <span className="status-icon">{getStatusIcon()}</span>
        </div>
        <div className="assistant-info">
          <span className="assistant-name">Pitstop Assistant</span>
          <span className="assistant-status">{getStatusText()}</span>
        </div>
        <div className="expand-toggle">
          {isExpanded ? '🔽' : '🔼'}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="assistant-content">
          {/* Voice Controls */}
          <div className="voice-controls">
            {!isConnected ? (
              <button 
                onClick={startVoiceAssistant} 
                disabled={isLoading}
                className="voice-button start"
              >
                {isLoading ? "Connecting..." : "🎤 Start Voice Mode"}
              </button>
            ) : (
              <button 
                onClick={stopVoiceAssistant} 
                disabled={isLoading}
                className="voice-button stop"
              >
                {isLoading ? "Disconnecting..." : "🛑 Stop Voice Mode"}
              </button>
            )}
          </div>

          {/* Messages */}
          <div className="messages-container">
            {messages.length === 0 && (
              <div className="welcome-message">
                <p>👋 Welcome! I'm here to help you navigate Pitstop and understand your technician tasks.</p>
                <p>You can use voice mode or type questions below.</p>
              </div>
            )}
            {messages.map((message) => (
              <div key={message.id} className={`message ${message.type}`}>
                <div className="message-content">
                  <p>{message.text}</p>
                  <span className="timestamp">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Text Input */}
          <form onSubmit={handleSendMessage} className="message-input-form">
            <div className="input-container">
              <input
                type="text"
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                placeholder="Type your question here..."
                className="message-input"
              />
              <button
                type="submit"
                disabled={!currentMessage.trim()}
                className="send-button"
                title="Send message"
              >
                📤
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default TechnicianVoiceAssistant;