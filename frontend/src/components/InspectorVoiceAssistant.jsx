import React, { useState, useEffect, useRef } from 'react';
import Vapi from "@vapi-ai/web";
import './InspectorVoiceAssistant.css';

// Initialize VAPI with your public API key
const vapi = new Vapi(import.meta.env.VITE_VAPI_PUBLIC_API_KEY || "YOUR_PUBLIC_API_KEY");

const InspectorVoiceAssistant = () => {
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
    // Prevent double initialization in React StrictMode
    if (vapiInitialized.current) {
      console.log('Inspector VAPI already initialized, skipping...');
      return;
    }
    
    console.log('Initializing Inspector VAPI event listeners...');
    vapiInitialized.current = true;
    
    // Set up VAPI event listeners with inspector-specific prefixes
    vapi.on("call-start", () => {
      console.log("Inspector voice assistant connected");
      setIsConnected(true);
      setIsLoading(false);
      addMessage('system', 'Inspector assistant connected. How can I help you manage inspections and jobs?');
    });

    vapi.on("call-end", () => {
      console.log("Inspector voice assistant disconnected");
      setIsConnected(false);
      setIsLoading(false);
      setIsListening(false);
      setIsAssistantSpeaking(false);
      addMessage('system', 'Inspector assistant disconnected.');
    });

    vapi.on("speech-start", () => {
      console.log("Inspector started speaking");
      setIsListening(true);
    });

    vapi.on("speech-end", () => {
      console.log("Inspector stopped speaking");
      setIsListening(false);
    });

    vapi.on("message", (message) => {
      console.log("VAPI Inspector Message:", message);
      
      // Handle status updates
      if (message.type === "status-update") {
        if (message.status === "ended") {
          setIsConnected(false);
          setIsLoading(false);
          setIsListening(false);
          setIsAssistantSpeaking(false);
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
        if (message.transcriptType === "final" && message.transcript) {
          if (message.role === "user") {
            addMessage('user', message.transcript);
          } else if (message.role === "assistant") {
            addMessage('assistant', message.transcript);
          }
        }
      } else if (message.type === "assistant-message") {
        if (message.message) {
          addMessage('assistant', message.message);
        }
      }
    });

    vapi.on("error", (error) => {
      console.error("VAPI Inspector Error:", error);
      setIsConnected(false);
      setIsLoading(false);
      setIsListening(false);
      setIsAssistantSpeaking(false);
      if (error.errorMsg && !error.errorMsg.includes('ended') && !error.errorMsg.includes('customer-ended-call')) {
        addMessage('error', `Error: ${error.errorMsg}`);
      }
    });

    return () => {
      console.log('Cleaning up Inspector VAPI event listeners...');
      try {
        vapi.removeAllListeners();
        // Also try to stop any active calls
        if (isConnected) {
          vapi.stop();
        }
      } catch (error) {
        console.error('Error during inspector VAPI cleanup:', error);
      }
      vapiInitialized.current = false;
    };
  }, [isConnected]); // Add isConnected as dependency to cleanup active calls

  const addMessage = (type, text) => {
    const message = {
      id: `inspector-msg-${Date.now()}-${Math.random()}`, // Add inspector prefix to prevent duplicates
      type,
      text,
      timestamp: new Date()
    };
    setMessages(prev => {
      // Check if this exact message already exists to prevent duplicates
      const isDuplicate = prev.some(existingMsg => 
        existingMsg.text === text && 
        existingMsg.type === type && 
        Math.abs(existingMsg.timestamp - message.timestamp) < 1000 // Within 1 second
      );
      
      if (isDuplicate) {
        console.log('Preventing duplicate message:', text);
        return prev;
      }
      
      return [...prev, message];
    });
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
            content: `You are a specialized voice assistant for Pitstop Garage Management System, designed to help Inspectors (Service Advisors) manage their responsibilities efficiently.

Your role is to provide guidance and instructions on:

INSPECTOR DASHBOARD NAVIGATION:
- How to view and manage assigned bookings
- How to perform vehicle inspections and assessments
- Creating jobs for bookings and assigning them to technicians
- Managing job priorities and urgency levels
- Updating booking status (pending → inspecting → working → completed)
- How to access and review inspection reports

JOB MANAGEMENT & ASSIGNMENT:
- How to create jobs for specific vehicle services
- Assigning jobs to appropriate technicians based on skills and availability
- Setting job priorities and estimated completion times
- Monitoring job progress and technician performance
- How to reassign jobs if needed

INVENTORY & GOODS REQUESTS:
- How to request parts and materials from inventory manager
- Creating goods requests for specific jobs
- Tracking inventory request status
- Understanding stock availability and lead times
- Managing parts allocation for jobs

WORKFLOW COORDINATION:
- Understanding the booking workflow from inspector perspective
- Coordinating between cashiers, technicians, and inventory
- Quality control and final inspection procedures
- When and how to mark bookings as completed
- Communication protocols with different team members

REPORTING & DOCUMENTATION:
- How to generate inspection reports
- Documenting job completion and quality checks
- Creating service records and maintenance logs
- Tracking work allocation and technician productivity

Keep responses professional, detailed, and focused on inspector responsibilities. Provide step-by-step guidance for complex procedures. Do not provide information about administrative functions, payroll, or other departments outside inspector scope.

If asked about areas outside inspector responsibilities, politely redirect to appropriate personnel (admin, cashier, inventory manager, etc.).`
          }],
          temperature: 0.7,
          maxTokens: 250
        },
        voice: {
          provider: '11labs',
          voiceId: 'vBKc2FfBKJfcZNyEt1n6' // Antoni - Warm, professional male voice for inspector guidance
        },
        firstMessage: "Hello! I'm your Pitstop Inspector Assistant. I'm here to help you manage vehicle inspections, create jobs, assign work to technicians, and coordinate service operations. How can I assist you today?",
        maxDurationSeconds: 600,
        backgroundSound: 'off'
      };

      await vapi.start(config);
      
    } catch (error) {
      console.error("Failed to start inspector voice assistant:", error);
      setIsLoading(false);
      addMessage('error', 'Failed to start voice assistant. Please try again.');
    }
  };

  const stopVoiceAssistant = () => {
    console.log("Stopping Inspector VAPI call...");
    setIsLoading(true);
    try {
      vapi.stop();
    } catch (err) {
      console.error("Error stopping inspector call:", err);
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
    
    // For text mode, we'll simulate a response based on common inspector queries
    setTimeout(() => {
      const response = generateInspectorResponse(messageText);
      addMessage('assistant', response);
    }, 1000);
  };

  const generateInspectorResponse = (query) => {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('booking') && (lowerQuery.includes('assign') || lowerQuery.includes('take') || lowerQuery.includes('inspect'))) {
      return "To take on a booking for inspection: 1) Go to 'Bookings' section, 2) Find bookings with 'Pending' status, 3) Click 'Assign to Me' or 'Start Inspection', 4) Update status to 'Inspecting'. This moves the booking from cashier to your responsibility.";
    }
    
    if (lowerQuery.includes('job') && (lowerQuery.includes('create') || lowerQuery.includes('make') || lowerQuery.includes('add'))) {
      return "To create jobs for a booking: 1) Open the booking details, 2) Click 'Create Jobs', 3) Add job description, estimated time, and priority level, 4) Select required skills/tools, 5) Set job to 'Pending' status. Jobs will then be available for technician assignment.";
    }
    
    if (lowerQuery.includes('assign') && (lowerQuery.includes('technician') || lowerQuery.includes('worker') || lowerQuery.includes('job'))) {
      return "To assign jobs to technicians: 1) Go to 'Jobs' section, 2) Find pending jobs, 3) Click 'Assign Technician', 4) Select available technician based on skills and workload, 5) Update job status to 'Assigned'. Consider technician expertise and current workload when assigning.";
    }
    
    if (lowerQuery.includes('priority') || lowerQuery.includes('urgent') || lowerQuery.includes('rush')) {
      return "Job priorities help manage workflow: RED = Critical/Emergency (complete immediately), ORANGE = High Priority (complete today), YELLOW = Medium Priority (complete within 2 days), GREEN = Low Priority (complete when possible). Set priorities based on customer needs, vehicle safety, and business impact.";
    }
    
    if (lowerQuery.includes('goods') || lowerQuery.includes('parts') || lowerQuery.includes('inventory') || lowerQuery.includes('request')) {
      return "To request parts from inventory: 1) Open the job requiring parts, 2) Click 'Request Goods', 3) Select items and quantities needed, 4) Add justification and urgency level, 5) Submit to inventory manager. Track request status in 'Goods Requests' section.";
    }
    
    if (lowerQuery.includes('stock') || lowerQuery.includes('check stock') || lowerQuery.includes('inventory level')) {
      return "To check stock levels: 1) Go to 'Inventory' section in main menu, 2) View current stock levels and availability, 3) Check 'Low Stock' alerts for items needing reorder, 4) Use search to find specific parts. Note: As an inspector, you can view stock but ordering is handled by inventory manager.";
    }
    
    if (lowerQuery.includes('invoice') || lowerQuery.includes('billing') || lowerQuery.includes('payment')) {
      return "Invoice handling: As an inspector, you don't directly manage invoices - that's handled by cashiers. Your role is to: 1) Ensure all work is completed and documented, 2) Mark booking as 'Completed' when ready, 3) Provide detailed service reports, 4) Hand over to cashier for customer billing and vehicle release.";
    }
    
    if (lowerQuery.includes('status') && (lowerQuery.includes('update') || lowerQuery.includes('change') || lowerQuery.includes('booking'))) {
      return "Booking status updates: PENDING → INSPECTING (when you start inspection), INSPECTING → WORKING (when jobs assigned to technicians), WORKING → COMPLETED (when all jobs finished and quality checked). Always verify work quality before marking as completed.";
    }
    
    if (lowerQuery.includes('inspection') && (lowerQuery.includes('report') || lowerQuery.includes('document') || lowerQuery.includes('record'))) {
      return "To create inspection reports: 1) Complete vehicle assessment, 2) Go to 'Reports' → 'Inspection Report', 3) Document findings, recommendations, and work needed, 4) Attach photos if required, 5) Generate and save report. This helps track service history and justify work recommendations.";
    }
    
    if (lowerQuery.includes('complete') || lowerQuery.includes('finish') || lowerQuery.includes('done')) {
      return "To complete a booking: 1) Verify all assigned jobs are marked 'Completed' by technicians, 2) Perform final quality inspection, 3) Update booking status to 'Completed', 4) Generate final service report, 5) Return vehicle to cashier for customer pickup and billing.";
    }
    
    if (lowerQuery.includes('technician') && (lowerQuery.includes('communicate') || lowerQuery.includes('message') || lowerQuery.includes('contact'))) {
      return "To communicate with technicians: Use the job comments system to provide instructions, the messaging feature for urgent matters, or the daily briefing section for general announcements. Always provide clear, detailed instructions and be available for questions during complex jobs.";
    }
    
    if (lowerQuery.includes('dashboard') || lowerQuery.includes('navigate') || lowerQuery.includes('overview')) {
      return "Your inspector dashboard includes: 'My Bookings' (assigned inspections), 'Job Management' (create/assign jobs), 'Goods Requests' (parts ordering), 'Reports' (inspection documentation), 'Team Overview' (technician status), and 'Quality Control' (final inspections). Use the sidebar to navigate between sections.";
    }
    
    if (lowerQuery.includes('quality') || lowerQuery.includes('check') || lowerQuery.includes('review')) {
      return "Quality control process: 1) Review completed jobs against work orders, 2) Inspect work quality and safety standards, 3) Test vehicle functions if applicable, 4) Document any issues or rework needed, 5) Approve or request corrections before marking booking complete.";
    }
    
    if (lowerQuery.includes('leave') || lowerQuery.includes('time off') || lowerQuery.includes('vacation')) {
      return "To apply for leave: 1) Go to 'Leave Requests' in main menu, 2) Click 'Apply for Leave', 3) Select dates and leave type, 4) Provide coverage arrangements for ongoing inspections, 5) Submit for approval. Ensure work handover is planned for critical bookings.";
    }
    
    if (lowerQuery.includes('help') || lowerQuery.includes('how') || lowerQuery.includes('guide')) {
      return "I can help you with: taking on bookings for inspection, creating and assigning jobs, managing priorities, requesting parts from inventory, updating booking status, generating inspection reports, communicating with technicians, quality control procedures, and dashboard navigation. What specific task do you need guidance on?";
    }
    
    // Default response
    return "I'm here to help you with inspector responsibilities including vehicle inspections, job creation and assignment, inventory requests, status updates, report generation, and team coordination. Could you be more specific about what you need help with?";
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
    return "🔍";
  };

  const getStatusText = () => {
    if (isLoading && !isConnected) return "Connecting...";
    if (isLoading && isConnected) return "Disconnecting...";
    if (isConnected && isListening) return "Listening...";
    if (isConnected && isAssistantSpeaking) return "Speaking...";
    if (isConnected) return "Connected";
    return "Inspector Assistant";
  };

  return (
    <div className={`inspector-voice-assistant ${isExpanded ? 'expanded' : 'collapsed'}`}>
      {/* Header / Toggle Button */}
      <div className="assistant-header" onClick={toggleExpand}>
        <div className="assistant-icon">
          <span className="status-icon">{getStatusIcon()}</span>
        </div>
        <div className="assistant-info">
          <span className="assistant-name">Inspector Assistant</span>
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
                <p>🔍 Welcome Inspector! I'm here to help you manage vehicle inspections, create jobs, assign work to technicians, and coordinate service operations.</p>
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
                placeholder="Ask about inspections, jobs, assignments..."
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

export default InspectorVoiceAssistant;