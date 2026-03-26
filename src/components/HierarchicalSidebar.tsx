import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Video,
  GraduationCap,
  Users,
  Clapperboard,
  Settings,
  ChevronRight,
  ChevronDown,
  User,
  Phone,
  Mail,
  BookOpen,
} from 'lucide-react'

export type AcademicNavItem = 'dashboard' | 'academic-structure' | 'meetings' | 'recordings' | 'settings'

export interface StudentRecord {
  id: string
  name: string
  email: string
  attendancePct: number
  status: 'Active' | 'At Risk' | 'Inactive'
  phone?: string
  semester?: number
  yearNumber?: number
  lifecycleStatus?: 'active' | 'graduated'
}

export interface AcademicSection {
  id: string
  name: string
  students: StudentRecord[]
  subject?: string
  faculty?: string
  departmentName?: string
  yearNumber?: number
}

export interface AcademicYear {
  id: string
  yearNumber: number
  students: StudentRecord[]
}

export interface AcademicBranch {
  id: string
  name: string
  sections: AcademicSection[]
}

export interface AcademicDepartment {
  id: string
  name: string
  code?: string
  totalYears?: number
  years?: AcademicYear[]
  branches?: AcademicBranch[]
  graduatedStudents?: StudentRecord[]
}

export interface AcademicFacultyRoot {
  id: string
  name: string
  departments: AcademicDepartment[]
}

interface HierarchicalSidebarProps {
  isOpen: boolean
  selected: AcademicNavItem
  onSelect: (id: AcademicNavItem) => void
  academicData: AcademicFacultyRoot
  userRole: 'faculty' | 'student'
  onStartMeeting?: (section: AcademicSection) => void
  onContactStudent?: (student: StudentRecord) => void
}

const NAV_ITEMS: Array<{ id: AcademicNavItem; label: string; icon: JSX.Element }> = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { id: 'academic-structure', label: 'Academic Structure', icon: <GraduationCap className="w-5 h-5" /> },
  { id: 'meetings', label: 'Meetings', icon: <Video className="w-5 h-5" /> },
  { id: 'recordings', label: 'Recordings', icon: <Clapperboard className="w-5 h-5" /> },
  { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
]

const yearLabel = (year: number) => {
  if (year === 1) return '1st Year'
  if (year === 2) return '2nd Year'
  if (year === 3) return '3rd Year'
  return `${year}th Year`
}

const inferYearNumber = (student: StudentRecord) => {
  if (student.yearNumber && student.yearNumber > 0) return student.yearNumber
  if (student.semester && student.semester > 0) return Math.min(4, Math.max(1, Math.ceil(student.semester / 2)))
  return 1
}

const normalizeDepartmentYears = (department: AcademicDepartment): AcademicYear[] => {
  if (department.years && department.years.length > 0) {
    return [...department.years].sort((a, b) => a.yearNumber - b.yearNumber)
  }

  const totalYears = department.totalYears || 4
  const yearBuckets = new Map<number, StudentRecord[]>()

  for (let year = 1; year <= totalYears; year += 1) {
    yearBuckets.set(year, [])
  }

  const sections = department.branches?.flatMap((branch) => branch.sections) || []
  sections.forEach((section) => {
    section.students.forEach((student) => {
      const yearNumber = inferYearNumber(student)
      const existing = yearBuckets.get(yearNumber) || []
      yearBuckets.set(yearNumber, [...existing, { ...student, yearNumber }])
    })
  })

  return Array.from(yearBuckets.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([yearNumber, students]) => ({
      id: `${department.id}_year_${yearNumber}`,
      yearNumber,
      students,
    }))
}

export default function HierarchicalSidebar({
  isOpen,
  selected,
  onSelect,
  academicData,
  userRole,
  onStartMeeting,
  onContactStudent,
}: HierarchicalSidebarProps) {
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({})

  const normalizedDepartments = useMemo(
    () =>
      academicData.departments.map((department) => ({
        ...department,
        years: normalizeDepartmentYears(department),
      })),
    [academicData],
  )

  const toggleExpanded = (id: string) => {
    setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <AnimatePresence initial={false}>
      <motion.aside
        initial={false}
        animate={{ width: isOpen ? 320 : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.22, ease: 'easeInOut' }}
        className="fixed left-0 top-0 h-screen z-30 overflow-hidden"
      >
        <div className="h-full w-[320px] glass-dark border-r border-white/10 bg-gradient-to-b from-slate-900/70 to-slate-950/70 backdrop-blur-lg flex flex-col">
          <div className="px-5 py-5 border-b border-white/10 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">UV</span>
              </div>
              <div>
                <div className="text-white font-bold leading-tight">University Meet</div>
                <div className="text-xs text-slate-400">Academic video meetings</div>
              </div>
            </div>
          </div>

          <nav className="p-3 space-y-1 flex-shrink-0">
            {NAV_ITEMS
              .filter((item) => userRole === 'faculty' || (item.id !== 'academic-structure' && item.id !== 'meetings'))
              .map((item) => (
              <button
                key={item.id}
                onClick={() => onSelect(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left border ${
                  selected === item.id
                    ? 'bg-blue-500/20 border-blue-400/30 text-blue-100'
                    : 'border-transparent text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className={selected === item.id ? 'text-blue-300' : 'text-slate-400'}>{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          {userRole === 'faculty' && (
          <div className="px-3 border-t border-white/10 pt-3 flex-1 overflow-y-auto">
            <div className="flex items-center gap-2 px-3 py-2 mb-2">
              <GraduationCap className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-200">Academic Structure</span>
            </div>

            <div className="space-y-1">
              {normalizedDepartments.map((department) => (
                <div key={department.id}>
                  <button
                    onClick={() => toggleExpanded(`dept_${department.id}`)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/5 rounded-lg transition-colors"
                  >
                    {expandedItems[`dept_${department.id}`] ? (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                    <BookOpen className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm text-slate-200 truncate">
                      {department.name}
                      {department.code ? ` (${department.code})` : ''}
                    </span>
                  </button>

                  <AnimatePresence>
                    {expandedItems[`dept_${department.id}`] && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="ml-4 overflow-hidden"
                      >
                        {department.years?.map((year) => (
                          <div key={year.id}>
                            <div className="flex items-center justify-between">
                              <button
                                onClick={() => toggleExpanded(`year_${department.id}_${year.yearNumber}`)}
                                className="flex-1 flex items-center gap-2 px-3 py-2 text-left hover:bg-white/5 rounded-lg transition-colors"
                              >
                                {expandedItems[`year_${department.id}_${year.yearNumber}`] ? (
                                  <ChevronDown className="w-3 h-3 text-slate-400" />
                                ) : (
                                  <ChevronRight className="w-3 h-3 text-slate-400" />
                                )}
                                <GraduationCap className="w-3 h-3 text-cyan-400" />
                                <span className="text-xs text-slate-300 truncate">
                                  {yearLabel(year.yearNumber)} ({year.students.length})
                                </span>
                              </button>
                              {userRole === 'faculty' && onStartMeeting && year.students.length > 0 && (
                                <button
                                  onClick={() =>
                                    onStartMeeting({
                                      id: `${department.id}_year_${year.yearNumber}`,
                                      name: `${department.name} - ${yearLabel(year.yearNumber)}`,
                                      students: year.students,
                                      subject: `${department.name} Year ${year.yearNumber}`,
                                      departmentName: department.name,
                                      yearNumber: year.yearNumber,
                                    })
                                  }
                                  className="p-1 hover:bg-blue-500/20 rounded text-blue-400 hover:text-blue-300 transition-colors"
                                  title="Start Meeting"
                                >
                                  <Video className="w-3 h-3" />
                                </button>
                              )}
                            </div>

                            <AnimatePresence>
                              {expandedItems[`year_${department.id}_${year.yearNumber}`] && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="ml-4 space-y-1 overflow-hidden"
                                >
                                  {year.students.map((student) => (
                                    <div
                                      key={student.id}
                                      className="flex items-center justify-between px-3 py-2 hover:bg-white/5 rounded-lg transition-colors group"
                                    >
                                      <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <User className="w-3 h-3 text-slate-500 flex-shrink-0" />
                                        <div className="min-w-0 flex-1">
                                          <div className="text-xs text-slate-300 truncate">{student.name}</div>
                                          <div className="text-xs text-slate-500 truncate">{student.id}</div>
                                        </div>
                                      </div>
                                      {onContactStudent && (
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button
                                            onClick={() => onContactStudent(student)}
                                            className="p-1 hover:bg-green-500/20 rounded text-green-400 hover:text-green-300 transition-colors"
                                            title="Contact Student"
                                          >
                                            <Mail className="w-3 h-3" />
                                          </button>
                                          <button
                                            onClick={() => {
                                              window.open(`tel:${student.phone || ''}`)
                                            }}
                                            className="p-1 hover:bg-blue-500/20 rounded text-blue-400 hover:text-blue-300 transition-colors"
                                            title="Call Student"
                                          >
                                            <Phone className="w-3 h-3" />
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        ))}

                        {(department.graduatedStudents?.length || 0) > 0 && (
                          <div className="mt-2">
                            <button
                              onClick={() => toggleExpanded(`graduated_${department.id}`)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/5 rounded-lg transition-colors"
                            >
                              {expandedItems[`graduated_${department.id}`] ? (
                                <ChevronDown className="w-3 h-3 text-slate-400" />
                              ) : (
                                <ChevronRight className="w-3 h-3 text-slate-400" />
                              )}
                              <Users className="w-3 h-3 text-amber-400" />
                              <span className="text-xs text-slate-300 truncate">
                                Graduated Students ({department.graduatedStudents?.length || 0})
                              </span>
                            </button>

                            <AnimatePresence>
                              {expandedItems[`graduated_${department.id}`] && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="ml-4 space-y-1 overflow-hidden"
                                >
                                  {department.graduatedStudents?.map((student) => (
                                    <div key={student.id} className="px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                      <div className="text-xs text-amber-200 truncate">{student.name}</div>
                                      <div className="text-xs text-amber-400/80 truncate">{student.id}</div>
                                    </div>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
          )}

          <div className="p-4 border-t border-white/10 text-xs text-slate-500 flex-shrink-0">
            {userRole === 'faculty' ? 'Faculty Dashboard' : 'Student Dashboard'}
          </div>
        </div>
      </motion.aside>
    </AnimatePresence>
  )
}
