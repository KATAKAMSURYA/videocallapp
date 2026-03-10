import { useState, useRef, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import AdminDashboard from './components/AdminDashboard'
import UserDashboard from './components/UserDashboard'
import Header from './components/Header'
import VideoContainer from './components/VideoContainer'
import ControlBar from './components/ControlBar'
import ParticipantsPanel from './components/ParticipantsPanel'
import ChatSidebar from './components/ChatSidebar'
import Toast from './components/Toast'
import TeamContacts from './components/TeamContacts'
import SelectMembers from './components/SelectMembers'
import AddMemberModal from './components/AddMemberModal'
import TeamSwitcher from './components/TeamSwitcher'
import CreateTeamModal from './components/CreateTeamModal'
import LoginPage from './components/LoginPage'
import type { UserRole } from './components/LoginPage'
import type { Team } from './components/TeamSwitcher'
import MeetingInvite from './components/MeetingInvite'
import ScreenRecording from './components/ScreenRecording'
import WaitingRoom from './components/WaitingRoom'
import FloatingReactions, { type Reaction } from './components/FloatingReactions'
import CalendarIntegration from './components/CalendarIntegration'
import VirtualBackgrounds from './components/VirtualBackgrounds'
import BreakoutRooms from './components/BreakoutRooms'
import FileSharing from './components/FileSharing'
import Whiteboard from './components/Whiteboard'
import MeetingHistory from './components/MeetingHistory'
import SettingsPage from './components/SettingsPage'
import ProfileDropdown from './components/ProfileDropdown'
import type { TeamMember } from './components/TeamContacts'
import type { WaitingParticipant } from './components/WaitingRoom'
import type { ScheduledMeeting } from './components/CalendarIntegration'
import type { SharedFile } from './components/FileSharing'
import type { MeetingRecord } from './components/MeetingHistory'

interface Toast {
  id: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
}

interface Participant {
  id: string
  name: string
}

type AppScreen = 'home' | 'contacts' | 'select-members' | 'call' | 'history'

interface TeamData {
  teamMembers: TeamMember[]
  scheduledMeetings: ScheduledMeeting[]
  meetingHistory: MeetingRecord[]
  sharedFiles: SharedFile[]
}

interface UserProfile {
  id: string
  email: string
  name: string
  avatar: string
  role: UserRole
}

interface AuthResult {
  success: boolean
  message?: string
}

type FeatureTabId = 'recording' | 'calendar' | 'backgrounds' | 'breakout' | 'files' | 'whiteboard' | 'history'

interface RolePermissions {
  canManageTeams: boolean
  canManageMembers: boolean
  canManageWaitingRoom: boolean
  canInviteParticipants: boolean
  canScheduleMeetings: boolean
  canScreenShare: boolean
  canRecord: boolean
  canShareFiles: boolean
  canUseWhiteboard: boolean
  canUseBreakoutRooms: boolean
}

const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  admin: {
    canManageTeams: true,
    canManageMembers: true,
    canManageWaitingRoom: true,
    canInviteParticipants: true,
    canScheduleMeetings: true,
    canScreenShare: true,
    canRecord: true,
    canShareFiles: true,
    canUseWhiteboard: true,
    canUseBreakoutRooms: true,
  },
  user: {
    canManageTeams: false,
    canManageMembers: false,
    canManageWaitingRoom: false,
    canInviteParticipants: false,
    canScheduleMeetings: false,
    canScreenShare: false,
    canRecord: false,
    canShareFiles: false,
    canUseWhiteboard: true,
    canUseBreakoutRooms: true,
  },
}

const FEATURE_TABS: Array<{ id: FeatureTabId; label: string; permission?: keyof RolePermissions }> = [
  { id: 'recording', label: 'Record', permission: 'canRecord' },
  { id: 'calendar', label: 'Calendar', permission: 'canScheduleMeetings' },
  { id: 'backgrounds', label: 'Background' },
  { id: 'breakout', label: 'Breakout', permission: 'canUseBreakoutRooms' },
  { id: 'files', label: 'Files', permission: 'canShareFiles' },
  { id: 'whiteboard', label: 'Board', permission: 'canUseWhiteboard' },
  { id: 'history', label: 'History' },
]

export default function App() {
  // ==================== AUTHENTICATION ====================
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)

  const handleLogin = (email: string, password: string, role: UserRole): AuthResult => {
    const normalizedEmail = email.trim().toLowerCase()
    const normalizedPassword = password.trim()

    // Demo split: admin requires demo password; email can be any admin identifier.
    if (role === 'admin' && normalizedPassword !== 'admin123') {
      return {
        success: false,
        message: 'Invalid admin credentials. Use any admin email/username with password admin123',
      }
    }

    const user: UserProfile = {
      id: 'user-' + Date.now(),
      email: normalizedEmail,
      name: normalizedEmail.split('@')[0].charAt(0).toUpperCase() + normalizedEmail.split('@')[0].slice(1),
      avatar: '👤',
      role,
    }
    setCurrentUser(user)
    setIsAuthenticated(true)
    return { success: true }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setCurrentUser(null)
    setCurrentScreen('home')
  }

  const handleViewProfile = () => {
    console.log('View Profile clicked')
    setSettingsInitialTab('profile')
    setShowSettings(true)
  }

  const handleSettingsClick = () => {
    console.log('Settings clicked')
    setSettingsInitialTab('appearance')
    setShowSettings(true)
  }

  const rolePermissions = currentUser ? ROLE_PERMISSIONS[currentUser.role] : ROLE_PERMISSIONS.user

  // ==================== MULTI-TEAM MANAGEMENT ====================
  const [teams, setTeams] = useState<Team[]>([
    {
      id: 'team-1',
      name: 'Marketing Team',
      description: 'Marketing and brand management',
      icon: '🎯',
      memberCount: 3,
      role: 'owner',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      id: 'team-2',
      name: 'Engineering',
      description: 'Product development and tech',
      icon: '⚡',
      memberCount: 4,
      role: 'admin',
      color: 'from-purple-500 to-pink-500',
    },
    {
      id: 'team-3',
      name: 'Sales Team',
      description: 'Sales and customer success',
      icon: '💼',
      memberCount: 5,
      role: 'member',
      color: 'from-orange-500 to-red-500',
    },
  ])
  const [activeTeamId, setActiveTeamId] = useState('team-1')
  
  // Team-specific data storage
  const [teamsData, setTeamsData] = useState<Record<string, TeamData>>({
    'team-1': {
      teamMembers: [
        {
          id: '1',
          name: 'Sarah Chen',
          email: 'sarah@company.com',
          phone: '+1 (555) 123-4567',
          avatar: '👩‍💼',
          status: 'online',
          role: 'Marketing Manager',
          year: '2nd',
          branch: 'CSE',
          section: 'A',
        },
        {
          id: '2',
          name: 'Alex Rivera',
          email: 'alex@company.com',
          phone: '+1 (555) 234-5678',
          avatar: '👨‍🎨',
          status: 'online',
          role: 'Brand Designer',
          year: '2nd',
          branch: 'ECE',
          section: 'B',
        },
        {
          id: '3',
          name: 'Emma Wilson',
          email: 'emma@company.com',
          phone: '+1 (555) 345-6789',
          avatar: '👩‍💻',
          status: 'offline',
          role: 'Content Creator',
          year: '1st',
          branch: 'ME',
          section: 'A',
        },
      ],
      scheduledMeetings: [
        {
          id: '1',
          title: 'Marketing Campaign Review',
          date: new Date(Date.now() + 3600000),
          duration: 60,
          participants: ['Sarah Chen', 'Alex Rivera'],
          recurring: 'none',
          reminder: 15,
        },
      ],
      meetingHistory: [
        {
          id: 'hist-1',
          title: 'Brand Strategy Meeting',
          date: new Date(Date.now() - 7200000),
          duration: 45,
          participants: ['Sarah Chen', 'Alex Rivera'],
          host: 'You',
        },
      ],
      sharedFiles: [
        {
          id: 'file-1',
          name: 'Marketing_Plan_Q1.pdf',
          size: 2458000,
          type: 'application/pdf',
          url: 'data:application/pdf;base64,demo',
          uploadedBy: 'Sarah Chen',
          uploadedAt: new Date(Date.now() - 300000),
        },
      ],
    },
    'team-2': {
      teamMembers: [
        {
          id: '4',
          name: 'David Park',
          email: 'david@company.com',
          phone: '+1 (555) 456-7890',
          avatar: '👨‍💻',
          status: 'online',
          role: 'Lead Developer',
          year: '4th',
          branch: 'CSE',
          section: 'A',
        },
        {
          id: '5',
          name: 'Lisa Zhang',
          email: 'lisa@company.com',
          phone: '+1 (555) 567-8901',
          avatar: '👩‍🔬',
          status: 'busy',
          role: 'QA Engineer',
          year: '3rd',
          branch: 'ECE',
          section: 'C',
        },
        {
          id: '6',
          name: 'Mike Johnson',
          email: 'mike@company.com',
          phone: '+1 (555) 678-9012',
          avatar: '🧑‍💻',
          status: 'online',
          role: 'Backend Engineer',
          year: '4th',
          branch: 'CSE',
          section: 'B',
        },
        {
          id: '7',
          name: 'Priya Patel',
          email: 'priya@company.com',
          phone: '+1 (555) 789-0123',
          avatar: '👩‍💼',
          status: 'online',
          role: 'Product Manager',
          year: '3rd',
          branch: 'CE',
          section: 'A',
        },
      ],
      scheduledMeetings: [
        {
          id: '2',
          title: 'Sprint Planning',
          date: new Date(Date.now() + 86400000),
          duration: 90,
          participants: ['All Team'],
          recurring: 'weekly',
          reminder: 10,
        },
      ],
      meetingHistory: [
        {
          id: 'hist-2',
          title: 'Architecture Discussion',
          date: new Date(Date.now() - 172800000),
          duration: 90,
          participants: ['David Park', 'Mike Johnson'],
          host: 'You',
        },
      ],
      sharedFiles: [],
    },
    'team-3': {
      teamMembers: [
        {
          id: '8',
          name: 'Tom Anderson',
          email: 'tom@company.com',
          phone: '+1 (555) 890-1234',
          avatar: '🧑‍💼',
          status: 'online',
          role: 'Sales Lead',
        },
        {
          id: '9',
          name: 'Julia Martinez',
          email: 'julia@company.com',
          phone: '+1 (555) 901-2345',
          avatar: '👩‍💼',
          status: 'busy',
          role: 'Account Executive',
        },
        {
          id: '10',
          name: 'Chris Lee',
          email: 'chris@company.com',
          phone: '+1 (555) 012-3456',
          avatar: '🧑',
          status: 'online',
          role: 'Sales Rep',
        },
        {
          id: '11',
          name: 'Nina Rodriguez',
          email: 'nina@company.com',
          phone: '+1 (555) 123-4567',
          avatar: '👩',
          status: 'online',
          role: 'Customer Success',
        },
        {
          id: '12',
          name: 'James Wilson',
          email: 'james@company.com',
          phone: '+1 (555) 234-5678',
          avatar: '🧔',
          status: 'offline',
          role: 'Sales Manager',
        },
      ],
      scheduledMeetings: [],
      meetingHistory: [],
      sharedFiles: [],
    },
  })
  
  // Get current team data
  const currentTeamData = teamsData[activeTeamId] || {
    teamMembers: [],
    scheduledMeetings: [],
    meetingHistory: [],
    sharedFiles: [],
  }
  
  const teamMembers = currentTeamData.teamMembers
  const scheduledMeetings = currentTeamData.scheduledMeetings
  const meetingHistory = currentTeamData.meetingHistory
  const sharedFiles = currentTeamData.sharedFiles
  
  // Helper function to update current team data
  const updateTeamData = (updates: Partial<TeamData>) => {
    setTeamsData(prev => ({
      ...prev,
      [activeTeamId]: {
        ...prev[activeTeamId],
        ...updates,
      },
    }))
  }

  // Screen Navigation
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('home')

  // Modals
  const [showAddMemberModal, setShowAddMemberModal] = useState(false)
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false)
  const [showScheduleModal, setShowScheduleModal] = useState(false)

  // New Features State
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [settingsInitialTab, setSettingsInitialTab] = useState<'profile' | 'meeting' | 'notifications' | 'privacy' | 'appearance' | 'account'>('profile')
  const [activeSettingsTab, setActiveSettingsTab] = useState<FeatureTabId>('recording')
  const [absentReminderNames, setAbsentReminderNames] = useState<string[]>([])

  const availableFeatureTabs = useMemo(
    () => FEATURE_TABS.filter((tab) => !tab.permission || rolePermissions[tab.permission]),
    [rolePermissions]
  )

  useEffect(() => {
    const hasActiveTab = availableFeatureTabs.some((tab) => tab.id === activeSettingsTab)
    if (!hasActiveTab && availableFeatureTabs.length > 0) {
      setActiveSettingsTab(availableFeatureTabs[0].id)
    }
  }, [activeSettingsTab, availableFeatureTabs])
  
  // Waiting Room - Demo Data
  const [waitingParticipants, setWaitingParticipants] = useState<WaitingParticipant[]>([
    {
      id: 'waiting-1',
      name: 'John Martinez',
      email: 'john.m@company.com',
      avatar: '👨‍💼',
      joinedAt: new Date(Date.now() - 45000), // 45 seconds ago
    },
  ])
  
  // Reactions
  const [isHandRaised, setIsHandRaised] = useState(false)
  const [handRaisedParticipants, setHandRaisedParticipants] = useState<string[]>(['Sarah Chen'])
  const [reactions, setReactions] = useState<Reaction[]>([])
  
  // Auto-hide UI controls
  const [showUIControls, setShowUIControls] = useState(true)
  const hideUITimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  
  // Meeting ID
  const [meetingId] = useState(() => Math.random().toString(36).substring(2, 11).toUpperCase())

  // Video/Audio State
  const [isMicOn, setIsMicOn] = useState(true)
  const [isCameraOn, setIsCameraOn] = useState(true)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Call State
  const [participants, setParticipants] = useState<Participant[]>([])
  const [callTimer, setCallTimer] = useState(0)
  const [activeMeetingTitle, setActiveMeetingTitle] = useState('Team Meeting')

  // UI State
  const [toasts, setToasts] = useState<Toast[]>([])
  const [showParticipants, setShowParticipants] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [isFullScreen, setIsFullScreen] = useState(false)

  // Full Screen Detection
  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullScreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullScreenChange)
    document.addEventListener('mozfullscreenchange', handleFullScreenChange)
    document.addEventListener('MSFullscreenChange', handleFullScreenChange)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullScreenChange)
      document.removeEventListener('mozfullscreenchange', handleFullScreenChange)
      document.removeEventListener('MSFullscreenChange', handleFullScreenChange)
    }
  }, [])

  // Auto-hide UI controls on inactivity (only during calls)
  useEffect(() => {
    if (currentScreen !== 'call') return

    const handleMouseMove = () => {
      setShowUIControls(true)
      
      // Clear existing timeout
      if (hideUITimeoutRef.current) {
        clearTimeout(hideUITimeoutRef.current)
      }
      
      // Set new timeout to hide after 3 seconds of inactivity
      hideUITimeoutRef.current = setTimeout(() => {
        setShowUIControls(false)
      }, 3000)
    }

    const handleMouseLeave = () => {
      if (hideUITimeoutRef.current) {
        clearTimeout(hideUITimeoutRef.current)
      }
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseleave', handleMouseLeave)

    // Show controls initially
    setShowUIControls(true)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseleave', handleMouseLeave)
      if (hideUITimeoutRef.current) {
        clearTimeout(hideUITimeoutRef.current)
      }
    }
  }, [currentScreen])

  // Initialize camera on call start
  useEffect(() => {
    if (currentScreen === 'call') {
      const initializeMedia = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          })

          streamRef.current = stream
          setVideoStream(stream)

          stream.getAudioTracks().forEach(track => {
            track.enabled = isMicOn
          })
          stream.getVideoTracks().forEach(track => {
            track.enabled = isCameraOn
          })

          addToast('Camera and microphone enabled', 'success')
        } catch (error: any) {
          console.error('Media access error:', error)
          let errorMessage = 'Unable to access camera or microphone'

          if (error.name === 'NotAllowedError') {
            errorMessage = 'Permission denied. Please allow camera/mic access'
          } else if (error.name === 'NotFoundError') {
            errorMessage = 'No camera or microphone found'
          } else if (error.name === 'NotReadableError') {
            errorMessage = 'Camera/mic is already in use'
          }

          addToast(errorMessage, 'error')
        }
      }

      initializeMedia()

      return () => {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop())
        }
      }
    }
  }, [currentScreen])

  // Call timer
  useEffect(() => {
    if (currentScreen !== 'call') {
      setCallTimer(0)
      return
    }

    // Welcome message on call start
    setTimeout(() => {
      addToast('💡 Click "Features" button to access all meeting tools', 'info')
    }, 2000)

    const timer = setInterval(() => {
      setCallTimer(prev => prev + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [currentScreen])

  const addToast = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const id = Date.now().toString()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }

  // Team Members Management
  const handleAddMember = (memberData: Omit<TeamMember, 'id' | 'status'>) => {
    if (!rolePermissions.canManageMembers) {
      addToast('Only admins can manage team members', 'warning')
      return
    }

    if (editingMember) {
      updateTeamData({
        teamMembers: teamMembers.map(m =>
          m.id === editingMember.id ? { ...m, ...memberData } : m
        ),
      })
      // Update member count
      setTeams(teams.map(t => t.id === activeTeamId ? { ...t, memberCount: teamMembers.length } : t))
      addToast(`${memberData.name} updated successfully`, 'success')
      setEditingMember(null)
    } else {
      const newMember: TeamMember = {
        id: Date.now().toString(),
        ...memberData,
        status: 'online',
      }
      updateTeamData({
        teamMembers: [...teamMembers, newMember],
      })
      // Update member count
      setTeams(teams.map(t => t.id === activeTeamId ? { ...t, memberCount: teamMembers.length + 1 } : t))
      addToast(`${memberData.name} added to team`, 'success')
    }
  }

  const handleDeleteMember = (id: string) => {
    if (!rolePermissions.canManageMembers) {
      addToast('Only admins can delete team members', 'warning')
      return
    }

    const member = teamMembers.find(m => m.id === id)
    updateTeamData({
      teamMembers: teamMembers.filter(m => m.id !== id),
    })
    // Update member count
    setTeams(teams.map(t => t.id === activeTeamId ? { ...t, memberCount: teamMembers.length - 1 } : t))
    addToast(`${member?.name} removed from team`, 'info')
  }

  const handleEditMember = (member: TeamMember) => {
    if (!rolePermissions.canManageMembers) {
      addToast('Only admins can edit team members', 'warning')
      return
    }

    setEditingMember(member)
    setShowAddMemberModal(true)
  }

  // Team Management
  const handleCreateTeam = (teamData: { name: string; description: string; icon: string; color: string }) => {
    if (!rolePermissions.canManageTeams) {
      addToast('Only admins can create teams', 'warning')
      return
    }

    const newTeam: Team = {
      id: `team-${Date.now()}`,
      name: teamData.name,
      description: teamData.description,
      icon: teamData.icon,
      memberCount: 1, // Just you
      role: 'owner',
      color: teamData.color,
    }
    setTeams([...teams, newTeam])
    setTeamsData({
      ...teamsData,
      [newTeam.id]: {
        teamMembers: [],
        scheduledMeetings: [],
        meetingHistory: [],
        sharedFiles: [],
      },
    })
    setActiveTeamId(newTeam.id)
    addToast(`Workspace "${teamData.name}" created successfully!`, 'success')
  }

  const handleSwitchTeam = (teamId: string) => {
    const team = teams.find(t => t.id === teamId)
    setActiveTeamId(teamId)
    setCurrentScreen('home')
    addToast(`Switched to ${team?.name}`, 'success')
  }

  const handleLeaveTeam = (teamId: string) => {
    const team = teams.find(t => t.id === teamId)
    if (team?.role === 'owner') {
      addToast('Cannot leave a workspace you own', 'error')
      return
    }
    setTeams(teams.filter(t => t.id !== teamId))
    // Remove team data
    const newTeamsData = { ...teamsData }
    delete newTeamsData[teamId]
    setTeamsData(newTeamsData)
    // Switch to first remaining team
    if (activeTeamId === teamId && teams.length > 1) {
      const remainingTeam = teams.find(t => t.id !== teamId)
      if (remainingTeam) {
        setActiveTeamId(remainingTeam.id)
      }
    }
    addToast(`Left workspace "${team?.name}"`, 'info')
  }

  // Call Management
  const handleStartCallWithMember = (member: TeamMember) => {
    if (!rolePermissions.canInviteParticipants) {
      addToast('Users can only join invited meetings', 'warning')
      return
    }

    setParticipants([{ id: member.id, name: member.name }])
    setActiveMeetingTitle(`Call with ${member.name}`)
    setCurrentScreen('call')
    addToast(`Starting call with ${member.name}...`, 'info')
  }

  const handleStartTeamCall = (members: TeamMember[]) => {
    if (!rolePermissions.canInviteParticipants) {
      addToast('Only admins can create and invite participants', 'warning')
      return
    }

    setParticipants(members.map(m => ({ id: m.id, name: m.name })))
    setActiveMeetingTitle(members.length > 1 ? 'Team Meeting' : `Call with ${members[0]?.name || 'Member'}`)
    setCurrentScreen('call')
    addToast(`Team meeting started with ${members.length} participant(s)`, 'success')
  }

  const handleJoinNextMeeting = () => {
    const nextMeeting = [...scheduledMeetings]
      .filter((meeting) => meeting.date > new Date())
      .sort((a, b) => a.date.getTime() - b.date.getTime())[0]

    if (!nextMeeting) {
      addToast('No upcoming meeting invitations', 'warning')
      return
    }

    const joinedParticipants = nextMeeting.participants.length > 0
      ? nextMeeting.participants.map((name, index) => ({ id: `joined-${index}`, name }))
      : [{ id: 'meeting-host', name: 'Meeting Host' }]

    setParticipants(joinedParticipants)
    setActiveMeetingTitle(nextMeeting.title)
    setCurrentScreen('call')
    addToast(`Joining ${nextMeeting.title}`, 'success')
  }

  const handleEndCall = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
    }
    
    // Save to meeting history for current team
    if (participants.length > 0) {
      const absentMembers = teamMembers
        .map((member) => member.name)
        .filter((name) => !participants.some((participant) => participant.name === name))

      const attendanceReport = teamMembers.map((member) => ({
        name: member.name,
        status: participants.some((participant) => participant.name === member.name) ? 'Attended' as const : 'Absent' as const,
      }))

      const actionItems = [
        'Share sprint blockers before next standup.',
        'Finalize pending decisions by end of day.',
        'Review assigned tasks in project board.',
      ]

      const meetingRecord: MeetingRecord = {
        id: meetingId,
        title: activeMeetingTitle,
        date: new Date(Date.now() - callTimer * 1000),
        duration: Math.floor(callTimer / 60),
        participants: participants.map(p => p.name),
        host: 'You',
        recording: `recording-${Date.now()}.mp4`,
        summary: `AI Summary: ${activeMeetingTitle} covered ${participants.length} attendees, decisions, and next steps.`,
        keyPoints: actionItems,
        attendanceReport,
        absentMembers,
        autoSharedWithAbsent: absentMembers.length > 0,
      }
      updateTeamData({
        meetingHistory: [...meetingHistory, meetingRecord],
      })

      if (absentMembers.length > 0) {
        setAbsentReminderNames(absentMembers)
        addToast(`Auto-shared recording and summary with ${absentMembers.length} absent member(s)`, 'info')
      }
    }
    
    setVideoStream(null)
    setCurrentScreen('home')
    addToast('Call ended. Thank you!', 'warning')
    setCallTimer(0)
  }

  // Waiting Room Handlers
  const handleAdmitParticipant = (id: string) => {
    if (!rolePermissions.canManageWaitingRoom) {
      addToast('Only admins can manage the waiting room', 'warning')
      return
    }

    const participant = waitingParticipants.find(p => p.id === id)
    if (participant) {
      setParticipants([...participants, { id: participant.id, name: participant.name }])
      setWaitingParticipants(waitingParticipants.filter(p => p.id !== id))
      addToast(`${participant.name} admitted to meeting`, 'success')
    }
  }

  const handleRejectParticipant = (id: string) => {
    if (!rolePermissions.canManageWaitingRoom) {
      addToast('Only admins can manage the waiting room', 'warning')
      return
    }

    const participant = waitingParticipants.find(p => p.id === id)
    setWaitingParticipants(waitingParticipants.filter(p => p.id !== id))
    addToast(`${participant?.name} removed from waiting room`, 'info')
  }

  const handleAdmitAll = () => {
    if (!rolePermissions.canManageWaitingRoom) {
      addToast('Only admins can manage the waiting room', 'warning')
      return
    }

    const newParticipants = waitingParticipants.map(p => ({ id: p.id, name: p.name }))
    setParticipants([...participants, ...newParticipants])
    setWaitingParticipants([])
    addToast('All participants admitted', 'success')
  }

  // Reactions Handlers
  const handleHandRaise = () => {
    setIsHandRaised(!isHandRaised)
    if (!isHandRaised) {
      setHandRaisedParticipants([...handRaisedParticipants, 'You'])
      addToast('Hand raised', 'info')
    } else {
      setHandRaisedParticipants(handRaisedParticipants.filter(p => p !== 'You'))
      addToast('Hand lowered', 'info')
    }
  }

  const handleReaction = (emoji: string, variant: 'float' | 'burst' | 'spiral' | 'bounce' = 'float') => {
    const id = `reaction-${Date.now()}-${Math.random()}`
    const x = Math.random() * 80 + 10 // 10-90% from left
    const newReaction = { id, emoji, x, y: 100, variant }

    setReactions([...reactions, newReaction])

    // Remove after animation completes
    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== id))
    }, 4000)
  }

  // Listen for advanced reactions from event system
  useEffect(() => {
    const handleReactionEvent = (e: any) => {
      const { emoji, variant } = e.detail
      handleReaction(emoji, variant)
    }
    
    window.addEventListener('reactionSent', handleReactionEvent)
    return () => window.removeEventListener('reactionSent', handleReactionEvent)
  }, [])

  // Calendar Handlers
  const handleScheduleMeeting = (meeting: Omit<ScheduledMeeting, 'id'>) => {
    if (!rolePermissions.canScheduleMeetings) {
      addToast('You do not have permission to schedule meetings', 'warning')
      return
    }

    const participantsWithReminder = rolePermissions.canInviteParticipants
      ? Array.from(new Set([...meeting.participants, ...absentReminderNames]))
      : meeting.participants

    if (rolePermissions.canInviteParticipants && absentReminderNames.length > 0) {
      addToast(`Reminder: previously absent members were added (${absentReminderNames.join(', ')})`, 'info')
      setAbsentReminderNames([])
    }

    const newMeeting: ScheduledMeeting = {
      ...meeting,
      participants: participantsWithReminder,
      id: Date.now().toString(),
    }
    updateTeamData({
      scheduledMeetings: [...scheduledMeetings, newMeeting],
    })
  }

  const handleEditScheduledMeeting = (id: string, updates: Partial<ScheduledMeeting>) => {
    if (!rolePermissions.canScheduleMeetings) {
      addToast('You do not have permission to edit scheduled meetings', 'warning')
      return
    }

    updateTeamData({
      scheduledMeetings: scheduledMeetings.map(m => m.id === id ? { ...m, ...updates } : m),
    })
  }

  const handleDeleteScheduledMeeting = (id: string) => {
    if (!rolePermissions.canScheduleMeetings) {
      addToast('You do not have permission to delete scheduled meetings', 'warning')
      return
    }

    updateTeamData({
      scheduledMeetings: scheduledMeetings.filter(m => m.id !== id),
    })
  }

  // File Sharing Handlers
  const handleFileUpload = (file: File) => {
    if (!rolePermissions.canShareFiles) {
      addToast('You do not have permission to share files', 'warning')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const newFile: SharedFile = {
        id: Date.now().toString(),
        name: file.name,
        size: file.size,
        type: file.type,
        url: e.target?.result as string,
        uploadedBy: 'You',
        uploadedAt: new Date(),
      }
      updateTeamData({
        sharedFiles: [...sharedFiles, newFile],
      })
    }
    reader.readAsDataURL(file)
  }

  const handleFileDelete = (id: string) => {
    if (!rolePermissions.canShareFiles) {
      addToast('You do not have permission to remove shared files', 'warning')
      return
    }

    updateTeamData({
      sharedFiles: sharedFiles.filter(f => f.id !== id),
    })
  }

  const handleMicToggle = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !isMicOn
      })
    }
    setIsMicOn(!isMicOn)
    addToast(isMicOn ? 'Microphone disabled' : 'Microphone enabled', 'info')
  }

  const handleCameraToggle = () => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !isCameraOn
      })
    }
    setIsCameraOn(!isCameraOn)
    addToast(isCameraOn ? 'Camera disabled' : 'Camera enabled', 'info')
  }

  const handleScreenShare = () => {
    if (!rolePermissions.canScreenShare) {
      addToast('Screen sharing is admin-only in this workspace', 'warning')
      return
    }

    setIsScreenSharing(!isScreenSharing)
    addToast(isScreenSharing ? 'Screen sharing stopped' : 'Screen sharing started', 'success')
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // If not authenticated, show login page
  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />
  }

  return (
    <div className="w-full h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
      {/* Modern Home Page */}
      {currentScreen === 'home' && (
        <div className="relative">
          {/* Profile Dropdown - Top Right */}
          <div className="absolute top-6 right-6 z-50">
            {currentUser && (
              <ProfileDropdown
                userEmail={currentUser.email}
                onViewProfile={handleViewProfile}
                onSettingsClick={handleSettingsClick}
                onLogoutClick={handleLogout}
              />
            )}
          </div>

          {/* Team Switcher - Positioned at top-left */}
          <div className="absolute top-6 left-6 z-50">
            <TeamSwitcher
              teams={teams}
              activeTeamId={activeTeamId}
              onSwitchTeam={handleSwitchTeam}
              onCreateTeam={() => {
                if (rolePermissions.canManageTeams) {
                  setShowCreateTeamModal(true)
                } else {
                  addToast('Only admins can create teams', 'warning')
                }
              }}
              onLeaveTeam={handleLeaveTeam}
            />
          </div>
          
          {currentUser?.role === 'admin' ? (
            <AdminDashboard
              teamMembers={teamMembers}
              scheduledMeetings={scheduledMeetings}
              meetingHistory={meetingHistory}
              onCreateMeeting={() => setCurrentScreen('select-members')}
              onManageContacts={() => setCurrentScreen('contacts')}
              onOpenAttendance={() => {
                setShowSettings(true)
                setActiveSettingsTab('history')
              }}
              onOpenRecordings={() => {
                setShowSettings(true)
                setActiveSettingsTab('history')
              }}
              onSendSummary={() => addToast('Meeting summaries sent to participants', 'success')}
              absentFromPrevious={absentReminderNames}
            />
          ) : (
            <UserDashboard
              scheduledMeetings={scheduledMeetings}
              meetingHistory={meetingHistory}
              onJoinMeeting={handleJoinNextMeeting}
              onViewHistory={() => {
                setShowSettings(true)
                setActiveSettingsTab('history')
              }}
            />
          )}
        </div>
      )}

      {/* Team Contacts Screen */}
      {currentScreen === 'contacts' && (
        <TeamContacts
          teamMembers={teamMembers}
          onStartCall={handleStartCallWithMember}
          onSelectMultiple={() => setCurrentScreen('select-members')}
          onAddMember={() => {
            setEditingMember(null)
            setShowAddMemberModal(true)
          }}
          onEditMember={handleEditMember}
          onDeleteMember={handleDeleteMember}
          canManageMembers={rolePermissions.canManageMembers}
          onBack={() => setCurrentScreen('home')}
        />
      )}

      {/* Select Members Screen */}
      {currentScreen === 'select-members' && (
        <SelectMembers
          teamMembers={teamMembers}
          onBack={() => setCurrentScreen('home')}
          onStartCall={handleStartTeamCall}
          isTeacherAdmin={currentUser?.role === 'admin' && currentUser.email.includes('teacher')}
        />
      )}

      {/* Call Screen - Professional Grid Layout with Responsive Design */}
      {currentScreen === 'call' && (
        <div className="w-full h-screen flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          {/* Header - Hidden in fullscreen mode */}
          {!isFullScreen && (
            <Header 
              callTimer={formatTime(callTimer)} 
              participantCount={participants.length}
              onToggleParticipants={() => setShowParticipants(!showParticipants)}
              onToggleChat={() => setShowChat(!showChat)}
              showParticipants={showParticipants}
              showChat={showChat}
              canInvite={rolePermissions.canInviteParticipants}
              onInvite={() => {
                if (rolePermissions.canInviteParticipants) {
                  setShowInviteModal(true)
                } else {
                  addToast('You do not have permission to invite participants', 'warning')
                }
              }}
              isVisible={showUIControls}
            />
          )}

          {/* Main Content Area - Flex to fill available space */}
          <div className={`flex flex-1 overflow-hidden ${isFullScreen ? 'gap-0' : 'gap-4'}`}>
            {/* Center Video Area */}
            <main className={`flex flex-col items-center justify-center relative flex-1 ${isFullScreen ? 'px-0 py-0' : 'px-4 sm:px-6 lg:px-8 py-4 lg:py-6'}`}>
              {/* Video Container - Fill available space */}
              <div className={`w-full h-full ${isFullScreen ? 'rounded-none' : 'rounded-3xl overflow-hidden'} flex items-center justify-center`}>
                <VideoContainer
                  isCameraOn={isCameraOn}
                  isScreenSharing={isScreenSharing}
                  videoStream={videoStream}
                  participants={participants}
                  isFullscreen={isFullScreen}
                />
              </div>
            </main>

            {/* Right Sidebar - Chat and Participants - Toggleable - Hidden in fullscreen */}
            {!isFullScreen && (showParticipants || showChat) && (
              <aside className="flex flex-col w-full md:w-80 lg:w-96 flex-shrink-0 bg-slate-900/30 backdrop-blur-sm border-l border-white/5 p-4 gap-4 overflow-hidden">
                {/* Participants Panel - Top section */}
                {showParticipants && (
                  <div className="flex flex-col">
                    <div className="text-sm font-semibold text-white mb-3 pb-2 border-b border-white/10">
                      Participants
                    </div>
                    <ParticipantsPanel
                      participants={participants}
                      onAddClick={() => {
                        addToast('Add participant feature in development', 'info')
                      }}
                      onRemove={(id: string) => {
                        setParticipants(participants.filter(p => p.id !== id))
                        addToast('Participant removed', 'info')
                      }}
                    />
                  </div>
                )}

                {/* Chat Sidebar - Flexible height, scrollable on mobile */}
                {showChat && (
                  <div className="flex-1 min-h-0 flex flex-col">
                    <ChatSidebar onAddToast={addToast} />
                  </div>
                )}
              </aside>
            )}
          </div>

          {/* Control Bar - Always at bottom, not flexi */}
          <div className={`w-full flex items-center justify-center flex-shrink-0 ${isFullScreen ? 'px-2 sm:px-4 py-4' : 'px-2 sm:px-4 py-4'}`}>
            <ControlBar
              isMicOn={isMicOn}
              isCameraOn={isCameraOn}
              isScreenSharing={isScreenSharing}
              canScreenShare={rolePermissions.canScreenShare}
              onMicToggle={handleMicToggle}
              onCameraToggle={handleCameraToggle}
              onScreenShare={handleScreenShare}
              onEndCall={handleEndCall}
              onHandRaise={handleHandRaise}
              isHandRaised={isHandRaised}
              handRaisedParticipants={handRaisedParticipants}
              onReaction={handleReaction}
              onToggleFullscreen={() => setIsFullScreen(!isFullScreen)}
              isFullscreen={isFullScreen}
            />
          </div>

          {/* Floating Reactions Animation */}
          <FloatingReactions reactions={reactions} />

          {/* Settings Panel - Floating on right side, responsive width */}
          {showSettings && (
            <motion.div
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 100, opacity: 0 }}
              className="fixed top-20 right-4 bottom-4 w-full sm:w-96 lg:w-[480px] z-40 glass-dark rounded-2xl p-4 sm:p-6 overflow-y-auto shadow-2xl border border-white/10 flex flex-col"
            >
              {/* Settings Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg sm:text-xl font-bold text-white">Meeting Features</h3>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowSettings(false)}
                  className="text-slate-400 hover:text-white transition-colors text-xl"
                >
                  ✕
                </motion.button>
              </div>

              {/* Feature Tabs - Grid layout */}
              <div className="grid grid-cols-4 gap-2 mb-6">
                {availableFeatureTabs.map((tab) => (
                  <motion.button
                    key={tab.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveSettingsTab(tab.id)}
                    className={`px-2 sm:px-3 py-2 rounded-lg text-xs font-medium transition-all text-center ${
                      activeSettingsTab === tab.id
                        ? 'bg-blue-500/40 text-blue-200 border border-blue-400/50'
                        : 'bg-slate-700/20 text-slate-300 hover:bg-slate-700/40 border border-slate-600/30'
                    }`}
                  >
                    {tab.label}
                  </motion.button>
                ))}
              </div>
              
              {/* Content Divider */}
              <div className="h-px bg-gradient-to-r from-slate-700/0 via-slate-700/50 to-slate-700/0 mb-6" />

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto pr-2">
                {activeSettingsTab === 'recording' && rolePermissions.canRecord && (
                  <ScreenRecording videoStream={videoStream} onToast={addToast} />
                )}
                {activeSettingsTab === 'calendar' && rolePermissions.canScheduleMeetings && (
                  <CalendarIntegration
                    meetings={scheduledMeetings}
                    onSchedule={handleScheduleMeeting}
                    onEdit={handleEditScheduledMeeting}
                    onDelete={handleDeleteScheduledMeeting}
                    onToast={addToast}
                  />
                )}
                {activeSettingsTab === 'backgrounds' && (
                  <VirtualBackgrounds videoRef={useRef(null)} onToast={addToast} />
                )}
                {activeSettingsTab === 'breakout' && rolePermissions.canUseBreakoutRooms && (
                  <BreakoutRooms
                    mainParticipants={participants.map(p => p.name)}
                    onToast={addToast}
                  />
                )}
                {activeSettingsTab === 'files' && rolePermissions.canShareFiles && (
                  <FileSharing
                    files={sharedFiles}
                    onUpload={handleFileUpload}
                    onDelete={handleFileDelete}
                    onToast={addToast}
                  />
                )}
                {activeSettingsTab === 'whiteboard' && rolePermissions.canUseWhiteboard && (
                  <Whiteboard onToast={addToast} />
                )}
                {activeSettingsTab === 'history' && (
                  <MeetingHistory meetings={meetingHistory} />
                )}
              </div>
            </motion.div>
          )}

          {/* Waiting Room Panel - Left side, responsive positioning */}
          {rolePermissions.canManageWaitingRoom && waitingParticipants.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="fixed top-20 left-4 w-80 sm:w-96 z-40 shadow-2xl"
            >
              <WaitingRoom
                waitingParticipants={waitingParticipants}
                onAdmit={handleAdmitParticipant}
                onReject={handleRejectParticipant}
                onAdmitAll={handleAdmitAll}
              />
            </motion.div>
          )}
        </div>
      )}

      {/* Meeting Invite Modal */}
      <MeetingInvite
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        meetingId={meetingId}
        meetingTitle={activeMeetingTitle}
        hostName="You"
      />

      {/* Add Member Modal */}
      <AddMemberModal
        isOpen={showAddMemberModal}
        onClose={() => {
          setShowAddMemberModal(false)
          setEditingMember(null)
        }}
        onAddMember={handleAddMember}
        existingMember={editingMember || undefined}
        isEditing={!!editingMember}
      />

      {/* Create Team Modal */}
      <CreateTeamModal
        isOpen={showCreateTeamModal}
        onClose={() => setShowCreateTeamModal(false)}
        onCreateTeam={handleCreateTeam}
      />

      {/* Schedule Meeting Modal */}
      {showScheduleModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowScheduleModal(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl glass-dark rounded-2xl p-8 border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">📅 Schedule a Meeting</h2>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowScheduleModal(false)}
                className="text-slate-400 hover:text-white transition-colors text-2xl"
              >
                ✕
              </motion.button>
            </div>

            <CalendarIntegration
              meetings={scheduledMeetings}
              onSchedule={handleScheduleMeeting}
              onEdit={handleEditScheduledMeeting}
              onDelete={handleDeleteScheduledMeeting}
              onToast={addToast}
              teamMembers={teamMembers}
            />
          </motion.div>
        </motion.div>
      )}

      {/* Settings Page */}
      {showSettings && (
        <SettingsPage
          onBack={() => setShowSettings(false)}
          initialTab={settingsInitialTab}
        />
      )}

      {/* Toasts */}
      <div className="fixed bottom-4 right-4 z-40 max-w-md space-y-2">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
          />
        ))}
      </div>
    </div>
  )
}
