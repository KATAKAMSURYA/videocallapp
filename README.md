# Video Call Meeting Web App UI

A modern, professional Video Call Meeting Web App UI inspired by Zoom and Google Meet with a dark glassmorphism design.

## 🎨 Features

### UI Components
- **Meeting Screen Layout** - Large center video container with rounded corners, shadow, and glass effect
- **Header** - Meeting title, recording indicator, and participant count
- **Floating Call Controls** - Mic, Camera, Screen Share, Settings, Add User, and End Call buttons
- **Participants Panel** - Small vertical participant thumbnails on the right with active speaker highlight
- **Chat & Messages Sidebar** - Messages and Participants tabs with modern chat bubbles and timestamps
- **Audio Waveform** - Animated waveform visualization at the bottom of the video container
- **Toast Notifications** - System notifications for user actions
- **Volume Slider** - Left-side volume control with visual feedback

### Design Elements
- 🌙 **Dark Glassmorphism Theme** - Modern blur and transparency effects
- 🎭 **Smooth Animations** - Framer Motion transitions and micro-interactions
- 📱 **Responsive Design** - Desktop, Tablet, and Mobile layouts using Tailwind CSS
- 🎯 **Modern Typography** - Inter and Poppins fonts for clean, professional look
- 🎨 **Soft Shadows & Rounded Corners** - Polished, sophisticated visual hierarchy

## 🏗️ Project Structure

```
src/
├── components/
│   ├── Header.tsx              # Meeting header with title and status indicators
│   ├── VideoContainer.tsx      # Main video display area with participants grid
│   ├── ControlBar.tsx          # Floating call control buttons
│   ├── ParticipantsPanel.tsx   # Participant avatars and management
│   ├── ChatSidebar.tsx         # Messages and participants sidebar
│   ├── VolumeSlider.tsx        # Volume control slider
│   └── Toast.tsx               # Notification toasts
├── App.tsx                     # Main application component
├── index.css                   # Global styles with Tailwind directives
└── main.tsx                    # React entry point
```

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open browser to http://localhost:5173
```

### Build for Production

```bash
npm run build
```

## 🛠️ Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety and developer experience
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **Lucide React** - Icon library
- **Vite** - Lightning-fast build tool

## 📦 Dependencies

```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "lucide-react": "^0.378.0",
  "framer-motion": "^10.16.16",
  "tailwindcss": "^3.3.6",
  "typescript": "^5.2.2"
}
```

## 🎯 Component Details

### Header
Displays meeting title, recording indicator, participant count, and connection status.

### VideoContainer
Central video display with:
- Large video area with glassmorphism effect
- Participant thumbnails grid (top-right)
- Audio waveform visualization (bottom)
- Volume indicator animation
- Support for camera on/off and screen sharing states

### ControlBar
Floating control panel with buttons for:
- Microphone toggle
- Camera toggle
- Screen share
- Add participant
- Settings
- End call (danger button)

### ParticipantsPanel
Vertical scrollable list of participants with:
- Avatar display
- Active speaker highlight (green border)
- Status indicators
- Mouse-over animation effects
- Add participant button

### ChatSidebar
Tabbed interface with:
- **Messages Tab**: Chat history with timestamps and avatars
- **Participants Tab**: List of meeting participants with status
- Message input with send and attachment buttons
- Toast notifications for user actions

### VolumeSlider
Vertical volume control on left side with:
- Dynamic icon based on volume level
- Visual fill indicator
- Percentage display
- Smooth animations

### Toast Notifications
Non-intrusive notifications with 4 types:
- Info (blue)
- Success (green)
- Warning (yellow)
- Error (red)

## 🎨 Customization

### Colors
Edit the Tailwind configuration in `tailwind.config.ts` to customize colors:
- Primary blue for active states
- Purple accents for highlights
- Slate tones for dark theme

### Animations
Framer Motion animations can be customized in individual components:
- `initial` - Starting state
- `animate` - End state
- `transition` - Animation duration and easing

### Responsive Breakpoints
Tailwind CSS responsive prefixes used:
- `md:` - Tablet and above (768px)
- `lg:` - Desktop and above (1024px)

## 📝 Dummy Data

All data is hardcoded for demonstration:
- Participant avatars and names
- Chat messages with timestamps
- Meeting title and info

To integrate with a real backend, replace dummy data with API calls in:
- `ParticipantsPanel.tsx` - Fetch participants list
- `ChatSidebar.tsx` - Fetch/send messages
- `Header.tsx` - Fetch meeting details

## ♿ Accessibility

- Semantic HTML structure
- ARIA labels on icon buttons
- Keyboard navigation support
- High contrast dark theme
- Focus visible states

## 🔧 Development Tips

### Adding New Components
1. Create a new `.tsx` file in `src/components/`
2. Import required icons from `lucide-react`
3. Use Framer Motion for animations
4. Apply Tailwind classes for styling
5. Export as default export

### Styling Patterns
```tsx
// Glassmorphism effect
className="glass" // or "glass-dark"

// Button animations
<motion.button
  whileHover={{ scale: 1.1 }}
  whileTap={{ scale: 0.95 }}
>
```

## 📱 Responsive Design

The layout adapts to screen sizes:
- **Mobile** - Single column, minimized controls
- **Tablet** - Video + participants side by side
- **Desktop** - Full layout with all panels visible

## 🎬 Next Steps

To make this production-ready:
1. Integrate with WebRTC for actual video streaming (e.g., using Daily.co, Agora, or Twilio)
2. Add backend API integration for meeting management
3. Implement real chat functionality with Socket.io
4. Add audio/video permissions handling
5. Implement screen recording
6. Add user authentication
7. Deploy to hosting platform (Vercel, Netlify, AWS)

## 📄 License

This project is open source and available under the MIT License.

---

**Made with ❤️ using React, TypeScript, and Tailwind CSS**
