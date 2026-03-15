import { useMemo, useState } from 'react'
import LoginPage, { type FacultyRegistrationDetails, type UserRole } from './components/LoginPage'
import AcademicSidebar, { type AcademicNavItem } from './components/AcademicSidebar'
import AcademicStructure, {
  type AcademicFacultyRoot,
  type AcademicSection,
  type FacultyProfile,
  type StudentRecord,
} from './components/AcademicStructure'
import FacultyStudentDashboard from './components/FacultyStudentDashboard'
import Toast from './components/Toast'

interface ToastItem {
  id: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
}

interface UserProfile {
  id: string
  email: string
  name: string
  avatar: string
  role: UserRole
  facultyProfile?: FacultyProfile
  studentId?: string
}

interface AuthResult {
  success: boolean
  message?: string
}

interface RolePermissions {
  canStartMeetingsForSection: boolean
  canInviteStudents: boolean
}

const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  faculty: {
    canStartMeetingsForSection: true,
    canInviteStudents: true,
  },
  student: {
    canStartMeetingsForSection: false,
    canInviteStudents: false,
  },
}

export default function AcademicApp() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
  
  // In-memory faculty directory for this session
  const [facultyDirectory, setFacultyDirectory] = useState<Record<string, FacultyProfile>>({})

  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [selectedNav, setSelectedNav] = useState<AcademicNavItem>('dashboard')

  const [toasts, setToasts] = useState<ToastItem[]>([])

  const addToast = (message: string, type: ToastItem['type'] = 'info') => {
    const id = `toast-${Date.now()}-${Math.random()}`
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3200)
  }

  const permissions = currentUser ? ROLE_PERMISSIONS[currentUser.role] : ROLE_PERMISSIONS.student

  const handleLogin = (
    creds:
      | { role: 'faculty'; email: string; password: string }
      | { role: 'student'; studentId: string; email: string; password: string },
  ): AuthResult => {
    const email = creds.email.trim().toLowerCase()
    
    // Simple validation
    if (!email) return { success: false, message: 'Email is required' }
    if (creds.password.trim().length < 6) return { success: false, message: 'Password must be at least 6 characters' }

    if (creds.role === 'faculty') {
      const faculty = facultyDirectory[email]
      if (!faculty) return { success: false, message: 'Faculty profile not found. Please register first.' }
      
      setCurrentUser({
        id: `faculty-${Date.now()}`,
        email,
        name: faculty.name,
        avatar: '👩‍🏫',
        role: 'faculty',
        facultyProfile: faculty,
      })
      setIsAuthenticated(true)
      return { success: true }
    }

    // Student Login
    setCurrentUser({
      id: `student-${Date.now()}`,
      email,
      name: email.split('@')[0] || 'Student',
      avatar: '🎓',
      role: 'student',
      studentId: creds.studentId.trim(),
    })
    setIsAuthenticated(true)
    return { success: true }
  }

  const handleRegisterFaculty = (details: FacultyRegistrationDetails): AuthResult => {
    const email = details.facultyEmail.trim().toLowerCase()
    if (!email) return { success: false, message: 'Faculty Email is required' }
    if (details.password.trim().length < 6) return { success: false, message: 'Password must be at least 6 characters' }

    const profile: FacultyProfile = {
      facultyId: details.facultyId.trim(),
      name: details.facultyName.trim(),
      email,
      department: details.facultyDepartment.trim(),
      phone: details.phoneNumber.trim(),
      designation: details.designation.trim(),
    }

    setFacultyDirectory((prev) => ({ ...prev, [email]: profile }))
    
    // Auto-login
    setCurrentUser({
      id: `faculty-${Date.now()}`,
      email,
      name: profile.name,
      avatar: '👩‍🏫',
      role: 'faculty',
      facultyProfile: profile,
    })
    setIsAuthenticated(true)
    return { success: true }
  }

  // Mock Academic Data
  const academicRoot = useMemo<AcademicFacultyRoot>(() => {
    const mkStudents = (prefix: string, count: number): StudentRecord[] =>
      Array.from({ length: count }).map((_, idx) => {
        const n = idx + 1
        const attendance = Math.max(55, Math.min(98, 60 + (idx * 7) % 40))
        return {
          id: `${prefix}${String(n).padStart(3, '0')}`,
          name: `Student ${prefix}${String(n).padStart(2, '0')}`,
          email: `${prefix.toLowerCase()}${n}@university.edu`,
          attendancePct: attendance,
          status: attendance >= 85 ? 'Active' : attendance >= 70 ? 'At Risk' : 'Inactive',
        }
      })

    return {
      id: 'faculty-root',
      name: 'Faculty of Engineering',
      departments: [
        {
          id: 'dept-cse',
          name: 'CSE',
          branches: [
            {
              id: 'branch-ai',
              name: 'AI & ML',
              sections: [
                { id: 'sec-ai-a', name: 'Section A', students: mkStudents('AI-A-', 8) },
                { id: 'sec-ai-b', name: 'Section B', students: mkStudents('AI-B-', 7) },
              ],
            },
            {
              id: 'branch-cs',
              name: 'Computer Science',
              sections: [
                { id: 'sec-cs-a', name: 'Section A', students: mkStudents('CS-A-', 6) },
              ],
            },
          ],
        },
        {
          id: 'dept-ece',
          name: 'ECE',
          branches: [
            {
              id: 'branch-ece',
              name: 'Electronics',
              sections: [
                 { id: 'sec-ece-a', name: 'Section A', students: mkStudents('ECE-A-', 5) }
              ]
            }
          ]
        }
      ],
    }
  }, [])

  const handleStartMeetingForSection = (section: AcademicSection) => {
    if (!permissions.canStartMeetingsForSection) {
      addToast('Only faculty can start meetings for a section.', 'warning')
      return
    }
    // Logic to properly start meeting would go here (e.g. create room, notify students)
    addToast(`Meeting started for ${section.name}. Invited ${section.students.length} students.`, 'success')
    setSelectedNav('meetings')
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} onRegisterFaculty={handleRegisterFaculty} />
  }

  const handleSidebarSelectSection = (sectionId: string) => {
    // navigate to academic structure and highlight the section
    setSelectedNav('academic-structure')
    // pass selection via a small event in localStorage (simple cross-component signal)
    try {
      localStorage.setItem('selectedSectionId', sectionId)
    } catch (e) {
      // ignore
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 font-sans">
      {/* Toggle Button */}
      <button
        onClick={() => setSidebarOpen((v) => !v)}
        className="fixed top-4 left-4 z-50 w-10 h-10 rounded-lg glass border border-white/10 text-white hover:bg-white/10 transition-all flex items-center justify-center shadow-lg"
        aria-label="Toggle sidebar"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
      </button>

      {/* Sidebar */}
      <AcademicSidebar
        isOpen={sidebarOpen}
        selected={selectedNav}
        onSelect={setSelectedNav}
        academicData={academicRoot}
        onSelectSection={handleSidebarSelectSection}
      />

      {/* Main Content Area */}
      <main
        className="min-h-screen transition-all duration-300 ease-in-out"
        style={{ marginLeft: sidebarOpen ? '280px' : '0px' }}
      >
        <div className="p-6 md:p-8 pt-20 max-w-7xl mx-auto space-y-6">
          
          {selectedNav === 'dashboard' && (
            <FacultyStudentDashboard 
              role={currentUser?.role === 'faculty' ? 'faculty' : 'student'} 
              onQuickStartMeeting={() => {
                addToast("Quick meeting started from dashboard", "success");
                setSelectedNav("meetings");
              }}
            />
          )}

          {selectedNav === 'meetings' && (
            <div className="glass rounded-2xl border border-white/10 p-8">
              <h2 className="text-2xl font-bold text-white mb-4">Meetings</h2>
              <p className="text-slate-400">Manage and join your academic meetings here.</p>
              <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-3 text-sky-400 mb-2">
                  <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"/>
                  Active Session
                </div>
                <div className="font-medium text-lg">Introduction to Artificial Intelligence</div>
                <div className="text-sm text-slate-400 mt-1">Section A • 42 mins elapsed</div>
                <button className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors">
                  Join Meeting
                </button>
              </div>
            </div>
          )}

          {selectedNav === 'academic-structure' && (
            <AcademicStructure
              facultyRoot={academicRoot}
              facultyProfile={currentUser?.facultyProfile}
              role={currentUser?.role === 'faculty' ? 'faculty' : 'student'}
              onStartMeetingForSection={handleStartMeetingForSection}
              onInviteStudentToMeeting={(s) => addToast(`Invited ${s.name} to a meeting.`, 'success')}
              onSendMessageToStudent={(s) => addToast(`Message sent to ${s.name}.`, 'success')}
              onViewStudentProfile={(s) => addToast(`Viewing profile: ${s.name} (${s.id})`, 'info')}
            />
          )}

          {selectedNav === 'students' && (
            <div className="glass rounded-2xl border border-white/10 p-8">
              <h2 className="text-2xl font-bold text-white mb-2">Students Directory</h2>
              <p className="text-slate-400">Please navigate to <strong>Academic Structure</strong> and select a section to view the specific student list and take actions.</p>
            </div>
          )}

          {selectedNav === 'attendance' && (
             <div className="glass rounded-2xl border border-white/10 p-8">
              <h2 className="text-2xl font-bold text-white mb-2">Attendance Records</h2>
              <p className="text-slate-400">Detailed attendance reports will be displayed here.</p>
            </div>
          )}

          {selectedNav === 'recordings' && (
             <div className="glass rounded-2xl border border-white/10 p-8">
              <h2 className="text-2xl font-bold text-white mb-2">Class Recordings</h2>
              <p className="text-slate-400">Past lectures and automated summaries.</p>
            </div>
          )}

          {selectedNav === 'settings' && (
             <div className="glass rounded-2xl border border-white/10 p-8">
              <h2 className="text-2xl font-bold text-white mb-2">Settings</h2>
              <p className="text-slate-400">Profile and application settings.</p>
              <div className="mt-4 p-4 border border-white/10 rounded-lg">
                <div className="text-sm text-slate-400 uppercase tracking-wider mb-2">Current Session</div>
                <div>{currentUser?.name}</div>
                <div className="text-sm text-slate-500">{currentUser?.email}</div>
                <button 
                  onClick={() => setIsAuthenticated(false)}
                  className="mt-4 text-red-400 hover:text-red-300 text-sm font-medium"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Toast Notifications Overlay */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast 
              message={toast.message} 
              type={toast.type} 
            />
          </div>
        ))}
      </div>
    </div>
  )
}
