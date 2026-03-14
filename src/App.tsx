import { useState } from 'react'
import LoginPage, { type FacultyRegistrationDetails } from './components/LoginPage'
import type { UserRole } from './components/LoginPage'
import Toast from './components/Toast'
import HierarchicalSidebar, { 
  type AcademicNavItem,
  type AcademicFacultyRoot,
  type AcademicSection,
  type StudentRecord,
} from './components/HierarchicalSidebar'
import type { FacultyProfile } from './components/AcademicStructure'
import FacultyStudentDashboard from './components/FacultyStudentDashboard'
import MeetingRoom from './components/MeetingRoom'
import StudentSelectionModal from './components/StudentSelectionModal'

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
  canViewRecordings: boolean
  canViewSummaries: boolean
}

const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  faculty: {
    canStartMeetingsForSection: true,
    canInviteStudents: true,
    canViewRecordings: true,
    canViewSummaries: true,
  },
  student: {
    canStartMeetingsForSection: false,
    canInviteStudents: false,
    canViewRecordings: true,
    canViewSummaries: true,
  },
}

// Mock academic structure data with detailed student information
const academicRoot: AcademicFacultyRoot = {
  id: 'CSE_FACULTY',
  name: 'Computer Science & Engineering',
  departments: [
    {
      id: 'cse_dept',
      name: 'Computer Science & Engineering',
      branches: [
        {
          id: 'cse_branch',
          name: 'Computer Science',
          sections: [
            {
              id: 'cse_section_a',
              name: 'CSE Section A (Semester 3)',
              subject: 'Data Structures & Algorithms',
              faculty: 'Prof. Anita Sharma',
              students: [
                {
                  id: 'CSE21001',
                  name: 'Aarav Patel',
                  email: 'aarav.patel@student.edu',
                  attendancePct: 85,
                  status: 'Active',
                  phone: '+91-9876543001',
                  semester: 3,
                },
                {
                  id: 'CSE21002',
                  name: 'Priya Sharma',
                  email: 'priya.sharma@student.edu',
                  attendancePct: 92,
                  status: 'Active',
                  phone: '+91-9876543002',
                  semester: 3,
                },
                {
                  id: 'CSE21003',
                  name: 'Rahul Gupta',
                  email: 'rahul.gupta@student.edu',
                  attendancePct: 78,
                  status: 'At Risk',
                  phone: '+91-9876543003',
                  semester: 3,
                },
                {
                  id: 'CSE21004',
                  name: 'Sneha Reddy',
                  email: 'sneha.reddy@student.edu',
                  attendancePct: 94,
                  status: 'Active',
                  phone: '+91-9876543004',
                  semester: 3,
                },
              ],
            },
            {
              id: 'cse_section_b',
              name: 'CSE Section B (Semester 3)',
              subject: 'Operating Systems',
              faculty: 'Dr. Vikram Singh',
              students: [
                {
                  id: 'CSE21005',
                  name: 'Amit Kumar',
                  email: 'amit.kumar@student.edu',
                  attendancePct: 88,
                  status: 'Active',
                  phone: '+91-9876543005',
                  semester: 3,
                },
                {
                  id: 'CSE21006',
                  name: 'Kavya Nair',
                  email: 'kavya.nair@student.edu',
                  attendancePct: 72,
                  status: 'At Risk',
                  phone: '+91-9876543006',
                  semester: 3,
                },
              ],
            },
          ],
        },
        {
          id: 'it_branch',
          name: 'Information Technology',
          sections: [
            {
              id: 'it_section_a',
              name: 'IT Section A (Semester 2)',
              subject: 'Programming Fundamentals',
              faculty: 'Dr. Sarah Wilson',
              students: [
                {
                  id: 'IT22001',
                  name: 'Arjun Das',
                  email: 'arjun.das@student.edu',
                  attendancePct: 90,
                  status: 'Active',
                  phone: '+91-9876543007',
                  semester: 2,
                },
                {
                  id: 'IT22002',
                  name: 'Meera Singh',
                  email: 'meera.singh@student.edu',
                  attendancePct: 86,
                  status: 'Active',
                  phone: '+91-9876543008',
                  semester: 2,
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'ece_dept',
      name: 'Electronics & Communication Engineering',
      branches: [
        {
          id: 'ece_branch',
          name: 'Electronics & Communication',
          sections: [
            {
              id: 'ece_section_a',
              name: 'ECE Section A (Semester 4)',
              subject: 'Digital Electronics',
              faculty: 'Prof. Rajesh Kumar',
              students: [
                {
                  id: 'ECE20001',
                  name: 'Karan Mehta',
                  email: 'karan.mehta@student.edu',
                  attendancePct: 82,
                  status: 'Active',
                  phone: '+91-9876543009',
                  semester: 4,
                },
                {
                  id: 'ECE20002',
                  name: 'Pooja Verma',
                  email: 'pooja.verma@student.edu',
                  attendancePct: 95,
                  status: 'Active',
                  phone: '+91-9876543010',
                  semester: 4,
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}

function App() {
  // ==================== AUTHENTICATION ====================
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
  const [facultyDirectory, setFacultyDirectory] = useState<Record<string, FacultyProfile>>({})

  // ==================== MEETING STATE ====================
  const [currentMeeting, setCurrentMeeting] = useState<{
    id: string
    title: string
    section: AcademicSection
    selectedStudents: StudentRecord[]
  } | null>(null)
  
  const [showStudentSelection, setShowStudentSelection] = useState(false)
  const [selectedSection, setSelectedSection] = useState<AcademicSection | null>(null)

  const handleLogin = (
    creds:
      | { role: 'faculty'; email: string; password: string }
      | { role: 'student'; studentId: string; email: string; password: string },
  ): AuthResult => {
    const normalizedEmail = creds.email.trim().toLowerCase()
    const normalizedPassword = creds.password.trim()

    if (normalizedPassword.length < 6) {
      return { success: false, message: 'Password must be at least 6 characters' }
    }

    if (creds.role === 'faculty') {
      // Demo faculty login or check registered faculty
      if (normalizedEmail === 'faculty@demo.com' || facultyDirectory[normalizedEmail]) {
        const faculty = facultyDirectory[normalizedEmail] || {
          facultyId: 'DEMO_FAC_001',
          name: 'Dr. Demo Faculty',
          email: normalizedEmail,
          department: 'Computer Science & Engineering',
          phone: '+91-9999999999',
          designation: 'Professor',
        }
        
        const user: UserProfile = {
          id: 'faculty-' + Date.now(),
          email: normalizedEmail,
          name: faculty.name,
          avatar: '👩‍🏫',
          role: 'faculty',
          facultyProfile: faculty,
        }
        setCurrentUser(user)
        setIsAuthenticated(true)
        return { success: true }
      } else {
        return { success: false, message: 'Faculty profile not found. Please register first.' }
      }
    }

    // Student demo login or regular login
    if (normalizedEmail === 'student@demo.com' || normalizedEmail.includes('student')) {
      const studentName = normalizedEmail.split('@')[0]
      const user: UserProfile = {
        id: 'student-' + Date.now(),
        email: normalizedEmail,
        name: studentName.charAt(0).toUpperCase() + studentName.slice(1),
        avatar: '🎓',
        role: 'student',
        studentId: (creds as any).studentId?.trim() || 'STU001',
      }
      setCurrentUser(user)
      setIsAuthenticated(true)
      return { success: true }
    }

    return { success: false, message: 'Invalid credentials' }
  }

  const handleRegisterFaculty = (details: FacultyRegistrationDetails): AuthResult => {
    const profile: FacultyProfile = {
      facultyId: details.facultyId.trim(),
      name: details.facultyName.trim(),
      email: details.facultyEmail.trim(),
      department: details.facultyDepartment.trim(),
      phone: details.phoneNumber.trim(),
      designation: details.designation.trim(),
    }

    setFacultyDirectory((prev) => ({ ...prev, [details.facultyEmail]: profile }))

    // Auto-login after registration
    setCurrentUser({
      id: 'faculty-' + Date.now(),
      email: details.facultyEmail,
      name: profile.name,
      avatar: '👩‍🏫',
      role: 'faculty',
      facultyProfile: profile,
    })
    setIsAuthenticated(true)
    return { success: true }
  }

  // ==================== NAV / LAYOUT ====================
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [selectedNav, setSelectedNav] = useState<AcademicNavItem>('dashboard')

  // ==================== TOASTS ====================
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const addToast = (message: string, type: ToastItem['type'] = 'info') => {
    const id = `toast-${Date.now()}-${Math.random()}`
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3200)
  }

  const permissions = currentUser ? ROLE_PERMISSIONS[currentUser.role] : ROLE_PERMISSIONS.student

  const handleStartMeetingForSection = (section: AcademicSection) => {
    if (!permissions.canStartMeetingsForSection) {
      addToast('Only faculty can start meetings for a section.', 'warning')
      return
    }
    
    // Show student selection modal
    setSelectedSection(section)
    setShowStudentSelection(true)
  }

  const handleStudentSelectionComplete = (selectedStudents: StudentRecord[]) => {
    if (!selectedSection) return
    
    const meetingId = `meeting-${Date.now()}`
    const meetingTitle = `${selectedSection.name} - ${selectedSection.subject || 'Class Meeting'}`
    
    setCurrentMeeting({
      id: meetingId,
      title: meetingTitle,
      section: selectedSection,
      selectedStudents,
    })
    
    setShowStudentSelection(false)
    setSelectedSection(null)
    
    addToast(`Meeting started with ${selectedStudents.length} students from ${selectedSection.name}`, 'success')
  }

  const handleEndMeeting = () => {
    if (currentMeeting) {
      addToast(`Meeting "${currentMeeting.title}" has ended.`, 'info')
      setCurrentMeeting(null)
      setSelectedNav('dashboard')
    }
  }

  const handleContactStudent = (student: StudentRecord) => {
    addToast(`Contacting ${student.name} at ${student.email}`, 'info')
    // Here you could implement actual contact functionality
  }

  const handleQuickStartMeeting = () => {
    // Use the first section available (CSE Section A) for quick start
    const defaultSection = academicRoot.departments[0]?.branches[0]?.sections[0]
    if (defaultSection) {
      handleStartMeetingForSection(defaultSection)
    } else {
      addToast('No sections available to start a meeting', 'warning')
    }
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} onRegisterFaculty={handleRegisterFaculty} />
  }

  // If in a meeting, show meeting room
  if (currentMeeting) {
    return (
      <MeetingRoom
        meetingId={currentMeeting.id}
        meetingTitle={currentMeeting.title}
        participants={[]}
        selectedStudents={currentMeeting.selectedStudents}
        currentUser={{
          id: currentUser!.id,
          name: currentUser!.name,
          email: currentUser!.email,
          role: currentUser!.role,
        }}
        onEndMeeting={handleEndMeeting}
        onInviteParticipants={() => addToast('Invite functionality will be implemented', 'info')}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <button
        onClick={() => setSidebarOpen((v) => !v)}
        className="fixed top-4 left-4 z-40 w-11 h-11 rounded-xl glass border border-white/10 text-white hover:bg-white/10 transition-all flex items-center justify-center"
        aria-label="Toggle sidebar"
      >
        ☰
      </button>

      <HierarchicalSidebar
        isOpen={sidebarOpen}
        selected={selectedNav}
        onSelect={setSelectedNav}
        academicData={academicRoot}
        userRole={currentUser?.role || 'student'}
        onStartMeeting={handleStartMeetingForSection}
        onContactStudent={handleContactStudent}
      />

      <main
        className="min-h-screen"
        style={{ marginLeft: sidebarOpen ? '320px' : '0px', transition: 'margin-left 0.22s ease-in-out' }}
      >
        <div className="p-6 md:p-10 pt-16">
          <div className="max-w-7xl mx-auto">
            {selectedNav === 'dashboard' && (
              <FacultyStudentDashboard 
                role={currentUser?.role === 'faculty' ? 'faculty' : 'student'} 
                onQuickStartMeeting={handleQuickStartMeeting}
              />
            )}

            {selectedNav === 'meetings' && (
              <div className="glass rounded-2xl border border-white/10 p-6 text-slate-200">
                <div className="text-white text-xl font-semibold mb-4">Meetings & Video Calls</div>
                <div className="space-y-4">
                  <div className="text-slate-400 text-sm">
                    Start a meeting by clicking the video icon next to any section in the Academic Structure.
                  </div>
                  
                  {currentUser?.role === 'faculty' && (
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                      <h3 className="text-blue-300 font-medium mb-2">Quick Actions</h3>
                      <div className="space-y-2">
                        <button 
                          onClick={() => {
                            // Find first section to demo
                            const firstSection = academicRoot.departments[0]?.branches[0]?.sections[0]
                            if (firstSection) {
                              handleStartMeetingForSection(firstSection)
                            }
                          }}
                          className="w-full text-left px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg transition-colors"
                        >
                          🎥 Start Demo Meeting (CSE Section A)
                        </button>
                        <button 
                          onClick={() => addToast('Schedule meeting functionality coming soon!', 'info')}
                          className="w-full text-left px-4 py-2 bg-slate-500/20 hover:bg-slate-500/30 rounded-lg transition-colors"
                        >
                          📅 Schedule Meeting
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <h3 className="text-slate-200 font-medium mb-2">Recent Meetings</h3>
                    <div className="text-slate-400 text-sm">No recent meetings found.</div>
                  </div>
                </div>
              </div>
            )}

            {selectedNav === 'recordings' && (
              <div className="glass rounded-2xl border border-white/10 p-6 text-slate-200">
                <div className="text-white text-xl font-semibold">Recordings</div>
                <div className="text-slate-400 text-sm mt-1">Meeting recordings and summaries will appear here.</div>
              </div>
            )}

            {selectedNav === 'settings' && (
              <div className="glass rounded-2xl border border-white/10 p-6 text-slate-200">
                <div className="text-white text-xl font-semibold">Settings</div>
                <div className="text-slate-400 text-sm mt-1">Application settings and preferences.</div>
                <div className="mt-6 space-y-4">
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <h3 className="text-slate-200 font-medium mb-2">User Profile</h3>
                    <div className="text-sm text-slate-300">
                      <p>Name: {currentUser?.name}</p>
                      <p>Email: {currentUser?.email}</p>
                      <p>Role: {currentUser?.role}</p>
                      {currentUser?.facultyProfile && (
                        <>
                          <p>Department: {currentUser.facultyProfile.department}</p>
                          <p>Designation: {currentUser.facultyProfile.designation}</p>
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setIsAuthenticated(false)
                      setCurrentUser(null)
                    }}
                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <div className="fixed bottom-6 right-6 z-50 space-y-2">
        {toasts.map((toast) => (
          <Toast key={toast.id} message={toast.message} type={toast.type} />
        ))}
      </div>

      {/* Student Selection Modal */}
      {showStudentSelection && selectedSection && (
        <StudentSelectionModal
          isOpen={showStudentSelection}
          onClose={() => {
            setShowStudentSelection(false)
            setSelectedSection(null)
          }}
          section={selectedSection}
          onStartMeeting={handleStudentSelectionComplete}
        />
      )}
    </div>
  )
}

export default App
