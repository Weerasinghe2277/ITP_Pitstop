# Pitstop Technician Voice Assistant

## Overview

The Pitstop Technician Voice Assistant is a VAPI-powered voice interface designed specifically for technicians (labourers) working in the Pitstop garage management system. It provides guidance and navigation help without requiring backend integration.

## Features

### 🎤 Voice Mode
- Real-time voice interaction using VAPI's speech-to-text and text-to-speech
- Hands-free operation for technicians working on vehicles
- Voice commands for navigation and guidance

### 💬 Text Mode  
- Text-based interaction for quiet environments
- Intelligent responses to common technician queries
- Instant feedback and guidance

### 🔄 Collapsible Interface
- Floating widget positioned at bottom-right of screen
- Expandable to show full conversation transcript
- Minimal footprint when collapsed

### 🎯 Technician-Focused Guidance
The assistant provides help with:
- **Job Management**: How to view assigned jobs and update status
- **Workflow Understanding**: Guidance on booking workflow from technician perspective
- **Dashboard Navigation**: Tips for using the technician dashboard efficiently
- **Status Updates**: How to properly update job status (pending → working → completed)
- **Communication**: How to contact inspectors and report issues
- **Leave Requests**: How to apply for time off
- **Priority Understanding**: Explanation of job priorities and urgency levels

## Setup Instructions

### 1. Install Dependencies
The required dependency (`@vapi-ai/web`) has already been installed. If you need to reinstall:

```bash
cd frontend
npm install @vapi-ai/web
```

### 2. Configure VAPI API Key
1. Sign up at [VAPI.ai](https://vapi.ai) and create an account
2. Get your public API key from the VAPI dashboard
3. Update the `.env` file in the frontend directory:

```env
VITE_VAPI_PUBLIC_API_KEY=your_actual_vapi_public_key_here
```

### 3. Component Integration
The voice assistant is automatically integrated into the Layout component and will only appear for users with the "technician" role.

## Usage Guide

### For Technicians

#### Accessing the Assistant
1. Log in with a technician account
2. Look for the "Pitstop Assistant" widget at the bottom-right of your screen
3. Click to expand the interface

#### Voice Mode
1. Click "🎤 Start Voice Mode" to begin voice interaction
2. Speak your question or request
3. The assistant will respond with voice and display the conversation
4. Click "🛑 Stop Voice Mode" when finished

#### Text Mode
1. Type your question in the message input field
2. Press Enter or click the send button (📤)
3. Receive instant text-based guidance

#### Common Voice Commands
- "How do I view my jobs?"
- "How do I update job status?"
- "What are the priority levels?"
- "How do I contact my inspector?"
- "How do I apply for leave?"
- "Help me navigate the dashboard"

## Technical Details

### Architecture
- **Frontend**: React component with VAPI Web SDK integration
- **Voice Processing**: VAPI.ai handles speech-to-text and text-to-speech
- **Response Logic**: Local rule-based responses (no backend calls)
- **Styling**: CSS with responsive design and animations

### File Structure
```
frontend/src/components/
├── TechnicianVoiceAssistant.jsx    # Main component
├── TechnicianVoiceAssistant.css    # Styling
└── Layout.tsx                      # Integration point
```

### Component Features
- **Real-time transcript display**
- **Responsive design** (mobile-friendly)
- **Accessibility support** (keyboard navigation, focus states)
- **Error handling** for voice connection issues
- **Loading states** and visual feedback

### VAPI Configuration
The assistant uses the following VAPI settings:
- **Model**: OpenAI GPT-3.5-turbo
- **Voice**: ElevenLabs Adam (professional male voice)
- **Temperature**: 0.7 for natural responses
- **Max Duration**: 10 minutes per session
- **Background Sound**: Disabled for clear audio

## Customization

### Adding New Responses
To add new guidance responses, edit the `generateTechnicianResponse` function in `TechnicianVoiceAssistant.jsx`:

```javascript
if (lowerQuery.includes('your_keyword')) {
  return "Your helpful response here...";
}
```

### Styling Changes
Modify `TechnicianVoiceAssistant.css` to customize:
- Colors and themes
- Animation speeds
- Layout dimensions
- Mobile responsiveness

### Voice Settings
Adjust VAPI configuration in the `startVoiceAssistant` function:
- Change voice provider/ID
- Modify temperature for response style
- Update system message for different behavior

## Troubleshooting

### Common Issues

#### Voice Assistant Not Appearing
- Ensure user has "technician" role
- Check browser console for errors
- Verify component import in Layout.tsx

#### Voice Mode Not Working
- Check microphone permissions in browser
- Verify VAPI API key is correctly set
- Ensure stable internet connection

#### Responses Not Relevant
- Update the system message in VAPI configuration
- Add new response patterns in `generateTechnicianResponse`
- Adjust temperature setting for response style

### Browser Compatibility
- **Chrome**: Full support
- **Firefox**: Full support  
- **Safari**: Full support
- **Mobile**: Responsive design, may require HTTPS for microphone access

## Security Notes

- API key is public (frontend use only)
- No sensitive data processing
- No backend data access
- Local response generation for privacy

## Future Enhancements

Potential improvements for future versions:
- Backend integration for real job data
- Multi-language support
- Voice commands for direct actions
- Integration with notification system
- Custom voice training for garage terminology
- Offline mode capabilities

## Support

For technical issues:
1. Check browser console for errors
2. Verify environment variables
3. Test with different browsers
4. Contact system administrator

For content updates:
1. Review system message in VAPI config
2. Update response patterns
3. Test with actual technician workflows
4. Gather user feedback for improvements