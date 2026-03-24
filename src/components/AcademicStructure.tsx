import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowUp,
  Building2,
  Download,
  Plus,
  Save,
  Search,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import { EmptyState } from './EmptyStates'
import type {
  AcademicDepartment,
  AcademicFacultyRoot,
  AcademicSection,
  AcademicYear,
  StudentRecord,
} from './HierarchicalSidebar.tsx'

export type { AcademicFacultyRoot, AcademicSection, StudentRecord } from './HierarchicalSidebar.tsx'

export interface FacultyProfile {
  facultyId: string
  name: string
  email: string
  department: string
  phone?: string
  designation?: string
}

interface AcademicStructureProps {
  facultyRoot: AcademicFacultyRoot
  facultyProfile?: FacultyProfile
  role: 'faculty' | 'student'
  onStartMeetingForSection?: (section: AcademicSection) => void
  onInviteStudentToMeeting?: (student: StudentRecord) => void
  onSendMessageToStudent?: (student: StudentRecord) => void
  onViewStudentProfile?: (student: StudentRecord) => void
  onAcademicRootChange?: (departments: AcademicDepartment[]) => void
}

type AdminPanel = 'departments' | 'years' | 'students'

interface ManagedDepartment {
  id: string
  name: string
  code: string
  totalYears: number
  years: AcademicYear[]
  graduatedStudents: StudentRecord[]
}

const STATUS_TONE: Record<StudentRecord['status'], string> = {
  Active: 'bg-emerald-500/15 border-emerald-400/30 text-emerald-200',
  'At Risk': 'bg-amber-500/15 border-amber-400/30 text-amber-200',
  Inactive: 'bg-rose-500/15 border-rose-400/30 text-rose-200',
}

const yearLabel = (yearNumber: number) => {
  const labels = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth']
  return `${labels[yearNumber - 1] || `${yearNumber}th`} Year`
}

const inferYearNumber = (student: StudentRecord) => {
  if (student.yearNumber && student.yearNumber > 0) return student.yearNumber
  if (student.semester && student.semester > 0) return Math.min(6, Math.max(1, Math.ceil(student.semester / 2)))
  return 1
}

const createDepartmentId = () => `dept_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
const createStudentId = () => `STU${Date.now().toString().slice(-6)}`

const normalizeDepartment = (department: AcademicDepartment): ManagedDepartment => {
  const totalYears = department.totalYears || department.years?.length || 4
  const studentBuckets = new Map<number, StudentRecord[]>()

  Array.from({ length: totalYears }, (_, index) => index + 1).forEach((yearNumber) => {
    studentBuckets.set(yearNumber, [])
  })

  department.years?.forEach((year) => {
    studentBuckets.set(
      year.yearNumber,
      year.students.map((student) => ({
        ...student,
        yearNumber: student.yearNumber || year.yearNumber,
      })),
    )
  })

  department.branches?.forEach((branch) => {
    branch.sections.forEach((section) => {
      section.students.forEach((student) => {
        const yearNumber = inferYearNumber(student)
        const existing = studentBuckets.get(yearNumber) || []
        if (!existing.some((item) => item.id === student.id)) {
          studentBuckets.set(yearNumber, [...existing, { ...student, yearNumber }])
        }
      })
    })
  })

  const years: AcademicYear[] = Array.from({ length: totalYears }, (_, index) => {
    const yearNumber = index + 1
    return {
      id: `${department.id}_year_${yearNumber}`,
      yearNumber,
      students: (studentBuckets.get(yearNumber) || []).sort((a, b) => a.name.localeCompare(b.name)),
    }
  })

  return {
    id: department.id,
    name: department.name,
    code: department.code || department.name.slice(0, 3).toUpperCase(),
    totalYears,
    years,
    graduatedStudents: department.graduatedStudents || [],
  }
}

const normalizeRoot = (root: AcademicFacultyRoot) => root.departments.map((department) => normalizeDepartment(department))

export default function AcademicStructure({
  facultyRoot,
  facultyProfile,
  role,
  onStartMeetingForSection,
  onInviteStudentToMeeting,
  onSendMessageToStudent,
  onViewStudentProfile,
  onAcademicRootChange,
}: AcademicStructureProps) {
  const [departments, setDepartments] = useState<ManagedDepartment[]>(() => normalizeRoot(facultyRoot))
  const [activePanel, setActivePanel] = useState<AdminPanel>('departments')
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(() => {
    try {
      return localStorage.getItem('selectedDepartmentId')
    } catch {
      return null
    }
  })
  const [selectedYearNumber, setSelectedYearNumber] = useState(1)
  const [newDepartment, setNewDepartment] = useState({ name: '', code: '', totalYears: 4 })
  const [editingDepartmentId, setEditingDepartmentId] = useState<string | null>(null)
  const [departmentDraft, setDepartmentDraft] = useState({ name: '', code: '', totalYears: 4 })
  const [newStudent, setNewStudent] = useState({ name: '', email: '', departmentId: '', yearNumber: 1 })
  const [studentSearch, setStudentSearch] = useState('')

  useEffect(() => {
    setDepartments(normalizeRoot(facultyRoot))
  }, [facultyRoot])

  useEffect(() => {
    if (!onAcademicRootChange) return
    onAcademicRootChange(
      departments.map((department) => ({
        id: department.id,
        name: department.name,
        code: department.code,
        totalYears: department.totalYears,
        years: department.years,
        graduatedStudents: department.graduatedStudents,
      })),
    )
  }, [departments, onAcademicRootChange])

  const applySelectedDepartment = useCallback((departmentId: string | null) => {
    if (!departmentId) {
      setSelectedDepartmentId(null)
      return
    }

    const targetDepartment = departments.find((department) => department.id === departmentId)
    if (!targetDepartment) return

    setSelectedDepartmentId(targetDepartment.id)
    setSelectedYearNumber(targetDepartment.years[0]?.yearNumber || 1)

    try {
      localStorage.setItem('selectedDepartmentId', targetDepartment.id)
      window.dispatchEvent(new CustomEvent('academicDepartmentSelected', { detail: { departmentId: targetDepartment.id } }))
    } catch {
      // Ignore storage access failures.
    }
  }, [departments])

  useEffect(() => {
    if (!selectedDepartmentId && departments[0]) {
      setSelectedDepartmentId(departments[0].id)
      setSelectedYearNumber(departments[0].years[0]?.yearNumber || 1)
    }
  }, [departments, selectedDepartmentId])

  useEffect(() => {
    const onDepartmentSelected = (event: Event) => {
      const customEvent = event as CustomEvent<{ departmentId?: string }>
      if (customEvent.detail?.departmentId) {
        setSelectedDepartmentId(customEvent.detail.departmentId)
      }
    }

    window.addEventListener('academicDepartmentSelected', onDepartmentSelected)
    return () => window.removeEventListener('academicDepartmentSelected', onDepartmentSelected)
  }, [])

  const selectedDepartment = useMemo(
    () => departments.find((department) => department.id === selectedDepartmentId) || departments[0] || null,
    [departments, selectedDepartmentId],
  )

  const selectedYear = useMemo(
    () => selectedDepartment?.years.find((year) => year.yearNumber === selectedYearNumber) || selectedDepartment?.years[0] || null,
    [selectedDepartment, selectedYearNumber],
  )

  const availableYearOptions = useMemo(() => {
    const targetDepartment = departments.find((department) => department.id === newStudent.departmentId) || selectedDepartment
    const totalYears = targetDepartment?.totalYears || 4
    return Array.from({ length: totalYears }, (_, index) => index + 1)
  }, [departments, newStudent.departmentId, selectedDepartment])

  const resolvedNewStudentYear = availableYearOptions.includes(newStudent.yearNumber)
    ? newStudent.yearNumber
    : (availableYearOptions[0] || 1)

  const filteredStudents = useMemo(() => {
    const students = selectedYear?.students || []
    const query = studentSearch.trim().toLowerCase()
    if (!query) return students
    return students.filter((student) =>
      student.name.toLowerCase().includes(query) || student.id.toLowerCase().includes(query),
    )
  }, [selectedYear, studentSearch])

  const totalStudents = useMemo(
    () => departments.reduce((sum, department) => sum + department.years.reduce((yearSum, year) => yearSum + year.students.length, 0), 0),
    [departments],
  )

  const departmentFormValid = newDepartment.name.trim().length > 1 && newDepartment.code.trim().length > 1
  const departmentEditValid = departmentDraft.name.trim().length > 1 && departmentDraft.code.trim().length > 1
  const studentFormValid = newStudent.name.trim().length > 1 && newStudent.email.trim().length > 3 && newStudent.departmentId.trim().length > 0

  const createDepartment = () => {
    if (!departmentFormValid) return

    const id = createDepartmentId()
    const years: AcademicYear[] = Array.from({ length: newDepartment.totalYears }, (_, index) => ({
      id: `${id}_year_${index + 1}`,
      yearNumber: index + 1,
      students: [],
    }))

    const created: ManagedDepartment = {
      id,
      name: newDepartment.name.trim(),
      code: newDepartment.code.trim().toUpperCase(),
      totalYears: newDepartment.totalYears,
      years,
      graduatedStudents: [],
    }

    setDepartments((prev) => [...prev, created])
    setNewDepartment({ name: '', code: '', totalYears: 4 })
    applySelectedDepartment(created.id)
  }

  const startEditDepartment = (department: ManagedDepartment) => {
    setEditingDepartmentId(department.id)
    setDepartmentDraft({ name: department.name, code: department.code, totalYears: department.totalYears })
  }

  const saveDepartmentEdit = () => {
    if (!editingDepartmentId || !departmentEditValid) return

    setDepartments((prev) => prev.map((department) => {
      if (department.id !== editingDepartmentId) return department

      const years: AcademicYear[] = Array.from({ length: departmentDraft.totalYears }, (_, index) => {
        const yearNumber = index + 1
        return department.years.find((year) => year.yearNumber === yearNumber) || {
          id: `${department.id}_year_${yearNumber}`,
          yearNumber,
          students: [],
        }
      })

      return {
        ...department,
        name: departmentDraft.name.trim(),
        code: departmentDraft.code.trim().toUpperCase(),
        totalYears: departmentDraft.totalYears,
        years,
      }
    }))

    setEditingDepartmentId(null)
  }

  const deleteDepartment = (departmentId: string) => {
    setDepartments((prev) => prev.filter((department) => department.id !== departmentId))
    if (selectedDepartmentId === departmentId) {
      setSelectedDepartmentId(null)
      setSelectedYearNumber(1)
    }
  }

  const addStudent = () => {
    if (!studentFormValid) return

    const student: StudentRecord = {
      id: createStudentId(),
      name: newStudent.name.trim(),
      email: newStudent.email.trim().toLowerCase(),
      attendancePct: 0,
      status: 'Active',
      yearNumber: resolvedNewStudentYear,
      lifecycleStatus: 'active',
    }

    setDepartments((prev) => prev.map((department) => {
      if (department.id !== newStudent.departmentId) return department
      return {
        ...department,
        years: department.years.map((year) => (
          year.yearNumber === resolvedNewStudentYear
            ? { ...year, students: [...year.students, student] }
            : year
        )),
      }
    }))

    applySelectedDepartment(newStudent.departmentId)
    setSelectedYearNumber(resolvedNewStudentYear)
    setNewStudent((prev) => ({ ...prev, name: '', email: '' }))
  }

  const moveStudentToYear = (departmentId: string, studentId: string, targetYear: number) => {
    setDepartments((prev) => prev.map((department) => {
      if (department.id !== departmentId) return department

      let studentToMove: StudentRecord | null = null
      const yearsWithoutStudent = department.years.map((year) => ({
        ...year,
        students: year.students.filter((student) => {
          if (student.id === studentId) {
            studentToMove = { ...student, yearNumber: targetYear }
            return false
          }
          return true
        }),
      }))

      if (!studentToMove) return department

      return {
        ...department,
        years: yearsWithoutStudent.map((year) => (
          year.yearNumber === targetYear
            ? { ...year, students: [...year.students, studentToMove as StudentRecord] }
            : year
        )),
      }
    }))
  }

  const promoteAcademicYear = () => {
    if (!selectedDepartment) return

    setDepartments((prev) => prev.map((department) => {
      if (department.id !== selectedDepartment.id) return department

      const graduatedStudents = [...department.graduatedStudents]
      const nextYears = department.years.map((year) => ({ ...year, students: [] as StudentRecord[] }))

      department.years.forEach((year) => {
        year.students.forEach((student) => {
          const nextYear = year.yearNumber + 1
          if (nextYear > department.totalYears) {
            graduatedStudents.push({ ...student, lifecycleStatus: 'graduated' })
            return
          }

          const target = nextYears.find((candidate) => candidate.yearNumber === nextYear)
          if (target) {
            target.students.push({ ...student, yearNumber: nextYear })
          }
        })
      })

      return {
        ...department,
        years: nextYears,
        graduatedStudents,
      }
    }))
  }

  const deleteStudent = (departmentId: string, yearNumber: number, studentId: string) => {
    setDepartments((prev) => prev.map((department) => {
      if (department.id !== departmentId) return department
      return {
        ...department,
        years: department.years.map((year) => (
          year.yearNumber === yearNumber
            ? { ...year, students: year.students.filter((student) => student.id !== studentId) }
            : year
        )),
      }
    }))
  }

  const cycleStudentStatus = (departmentId: string, yearNumber: number, studentId: string) => {
    const cycle: StudentRecord['status'][] = ['Active', 'At Risk', 'Inactive']
    setDepartments((prev) => prev.map((department) => {
      if (department.id !== departmentId) return department
      return {
        ...department,
        years: department.years.map((year) => (
          year.yearNumber === yearNumber
            ? {
                ...year,
                students: year.students.map((student) => (
                  student.id === studentId
                    ? { ...student, status: cycle[(cycle.indexOf(student.status) + 1) % cycle.length] }
                    : student
                )),
              }
            : year
        )),
      }
    }))
  }

  const exportStudentsCSV = () => {
    if (!selectedDepartment || !selectedYear) return
    const rows = [
      ['ID', 'Name', 'Email', 'Status', 'Year'],
      ...selectedYear.students.map((student) => [
        student.id,
        student.name,
        student.email,
        student.status,
        String(selectedYear.yearNumber),
      ]),
    ]
    const csv = rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${selectedDepartment.code}_Year${selectedYear.yearNumber}_students.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const openMeetingForSelectedYear = () => {
    if (!selectedDepartment || !selectedYear || selectedYear.students.length === 0) return

    onStartMeetingForSection?.({
      id: `${selectedDepartment.id}_year_${selectedYear.yearNumber}`,
      name: `${selectedDepartment.name} - ${yearLabel(selectedYear.yearNumber)}`,
      students: selectedYear.students,
      subject: `${selectedDepartment.name} ${yearLabel(selectedYear.yearNumber)}`,
      departmentName: selectedDepartment.name,
      yearNumber: selectedYear.yearNumber,
    })
  }

  const openMeetingForYear = (yearNumber: number) => {
    if (!selectedDepartment) return
    const targetYear = selectedDepartment.years.find((year) => year.yearNumber === yearNumber)
    if (!targetYear || targetYear.students.length === 0) return

    onStartMeetingForSection?.({
      id: `${selectedDepartment.id}_year_${targetYear.yearNumber}`,
      name: `${selectedDepartment.name} - ${yearLabel(targetYear.yearNumber)}`,
      students: targetYear.students,
      subject: `${selectedDepartment.name} ${yearLabel(targetYear.yearNumber)}`,
      departmentName: selectedDepartment.name,
      yearNumber: targetYear.yearNumber,
    })
  }

  const statCards = [
    {
      label: 'Departments',
      value: departments.length,
      tone: 'from-cyan-500/20 to-blue-500/10 border-cyan-400/20',
      icon: <Building2 className="w-4 h-4 text-cyan-200" />,
    },
    {
      label: 'Active Students',
      value: totalStudents,
      tone: 'from-emerald-500/20 to-green-500/10 border-emerald-400/20',
      icon: <Users className="w-4 h-4 text-emerald-200" />,
    },
  ]

  return (
    <div className="w-full h-full">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 mb-4">
        {statCards.map((stat) => (
          <motion.div key={stat.label} whileHover={{ y: -2 }} className={`rounded-2xl border ${stat.tone} bg-gradient-to-br p-4`}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-400">{stat.label}</div>
              {stat.icon}
            </div>
            <div className="text-3xl font-semibold text-white">{stat.value}</div>
          </motion.div>
        ))}
      </div>

      <div className="glass rounded-2xl border border-white/10 p-5 mb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-[0.24em] text-slate-500 mb-1">Academic Management</div>
            <div className="text-2xl font-semibold text-white">University structure control</div>
            <div className="text-sm text-slate-400 mt-1">
              {facultyProfile ? `${facultyProfile.name} · ${facultyProfile.department}` : 'Manage departments, cohorts, and student operations.'}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['departments', 'years', 'students'] as AdminPanel[]).map((panel) => (
              <button
                key={panel}
                onClick={() => setActivePanel(panel)}
                className={`px-4 py-2 rounded-xl border text-sm transition-colors ${
                  activePanel === panel
                    ? 'bg-cyan-500/15 border-cyan-400/30 text-cyan-200'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                {panel.charAt(0).toUpperCase() + panel.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2 glass rounded-2xl border border-white/10 p-4 max-h-[70vh] overflow-y-auto">
          <div className="text-sm font-medium text-slate-300">Departments</div>
          <div className="text-xs text-slate-500 mt-1 mb-3">Select a department to narrow the year and student context.</div>

          {departments.length === 0 ? (
            <EmptyState message="No departments available" subMessage="Create your first department to begin structuring the academic hierarchy." />
          ) : (
            <div className="space-y-2">
              {departments.map((department) => (
                <motion.button
                  key={department.id}
                  whileHover={{ scale: 1.01 }}
                  onClick={() => {
                    applySelectedDepartment(department.id)
                    setActivePanel('students')
                  }}
                  className={`w-full rounded-2xl border p-4 text-left transition-colors ${
                    selectedDepartment?.id === department.id
                      ? 'border-cyan-400/40 bg-cyan-500/10'
                      : 'border-white/10 bg-slate-900/40 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium text-white">{department.name}</div>
                      <div className="text-xs text-slate-400 mt-1">{department.code} · {department.totalYears} years</div>
                    </div>
                    <div className="text-xs text-slate-400">{department.years.reduce((sum, year) => sum + year.students.length, 0)} students</div>
                  </div>
                </motion.button>
              ))}
            </div>
          )}

          {selectedDepartment && (
            <div className="mt-4">
              <div className="text-sm font-medium text-slate-300 mb-2">Academic Years</div>
              <div className="space-y-2">
                {selectedDepartment.years.map((year) => (
                  <div
                    key={year.id}
                    className={`rounded-xl border p-3 ${
                      selectedYear?.yearNumber === year.yearNumber
                        ? 'border-cyan-400/30 bg-cyan-500/10'
                        : 'border-white/10 bg-slate-900/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <button
                        onClick={() => {
                          setSelectedYearNumber(year.yearNumber)
                          setActivePanel('students')
                        }}
                        className="text-left"
                      >
                        <div className="text-sm text-white">{yearLabel(year.yearNumber)}</div>
                        <div className="text-xs text-slate-400 mt-1">{year.students.length} students</div>
                      </button>
                      {role === 'faculty' && year.students.length > 0 && (
                        <button
                          onClick={() => {
                            setSelectedYearNumber(year.yearNumber)
                            openMeetingForYear(year.yearNumber)
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/30 text-cyan-200 text-xs"
                        >
                          Start Call
                        </button>
                      )}
                    </div>

                    {selectedYear?.yearNumber === year.yearNumber && year.students.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-white/10">
                        <div className="text-[11px] uppercase tracking-[0.16em] text-slate-500 mb-1">Students</div>
                        <div className="space-y-1">
                          {year.students.slice(0, 3).map((student) => (
                            <div key={student.id} className="text-xs text-slate-300 truncate">
                              {student.name} ({student.id})
                            </div>
                          ))}
                          {year.students.length > 3 && (
                            <div className="text-xs text-slate-500">+{year.students.length - 3} more</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-3 glass rounded-2xl border border-white/10 p-5 max-h-[70vh] overflow-y-auto">
          {activePanel === 'departments' && (
            <div>
              <h3 className="text-white font-semibold mb-3">Department Management</h3>

              {role === 'faculty' && (
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 mb-4">
                  <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                    <div>
                      <div className="text-sm font-medium text-white">Create Department</div>
                      <div className="text-xs text-slate-400 mt-1">Add a department code and define how many academic years it manages.</div>
                    </div>
                    <div className="text-xs text-slate-500">Name + code required</div>
                  </div>
                  <div className="grid md:grid-cols-4 gap-2 mb-2">
                    <input value={newDepartment.name} onChange={(e) => setNewDepartment((prev) => ({ ...prev, name: e.target.value }))} placeholder="Department name" className="px-3 py-2 rounded-lg bg-slate-800/70 border border-white/10 text-white" />
                    <input value={newDepartment.code} onChange={(e) => setNewDepartment((prev) => ({ ...prev, code: e.target.value }))} placeholder="Code" className="px-3 py-2 rounded-lg bg-slate-800/70 border border-white/10 text-white" />
                    <input type="number" min={1} max={6} value={newDepartment.totalYears} onChange={(e) => setNewDepartment((prev) => ({ ...prev, totalYears: Number(e.target.value) || 4 }))} className="px-3 py-2 rounded-lg bg-slate-800/70 border border-white/10 text-white" />
                    <button onClick={createDepartment} disabled={!departmentFormValid} className="px-3 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 disabled:bg-slate-700/50 disabled:text-slate-500 disabled:border-white/10 disabled:cursor-not-allowed border border-emerald-400/30 text-emerald-200 flex items-center justify-center gap-2">
                      <Plus className="w-4 h-4" />
                      Add Department
                    </button>
                  </div>
                  <div className="text-xs text-slate-500">Tip: short codes like CSE, ECE, or MATH keep the sidebar and exports readable.</div>
                </div>
              )}

              <div className="space-y-3">
                {departments.map((department) => (
                  <div key={department.id} className="rounded-2xl border border-white/10 bg-slate-900/30 p-4">
                    {editingDepartmentId === department.id ? (
                      <div className="grid md:grid-cols-4 gap-2">
                        <input value={departmentDraft.name} onChange={(e) => setDepartmentDraft((prev) => ({ ...prev, name: e.target.value }))} className="px-3 py-2 rounded-lg bg-slate-800/70 border border-white/10 text-white" />
                        <input value={departmentDraft.code} onChange={(e) => setDepartmentDraft((prev) => ({ ...prev, code: e.target.value }))} className="px-3 py-2 rounded-lg bg-slate-800/70 border border-white/10 text-white" />
                        <input type="number" min={1} max={6} value={departmentDraft.totalYears} onChange={(e) => setDepartmentDraft((prev) => ({ ...prev, totalYears: Number(e.target.value) || 4 }))} className="px-3 py-2 rounded-lg bg-slate-800/70 border border-white/10 text-white" />
                        <div className="flex gap-2">
                          <button onClick={saveDepartmentEdit} disabled={!departmentEditValid} className="flex-1 px-3 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 disabled:bg-slate-700/50 disabled:text-slate-500 disabled:border-white/10 disabled:cursor-not-allowed border border-blue-400/30 text-blue-200 flex items-center justify-center gap-2">
                            <Save className="w-4 h-4" />
                            Save
                          </button>
                          <button onClick={() => setEditingDepartmentId(null)} className="px-3 py-2 rounded-lg bg-slate-700/40 hover:bg-slate-700/60 border border-white/10 text-slate-300">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div>
                          <div className="text-white font-medium">{department.name}</div>
                          <div className="text-xs text-slate-400 mt-1">{department.code} · {department.totalYears} years · {department.years.reduce((sum, year) => sum + year.students.length, 0)} students</div>
                        </div>
                        {role === 'faculty' && (
                          <div className="flex items-center gap-2">
                            <button onClick={() => startEditDepartment(department)} className="px-3 py-2 rounded-lg bg-slate-700/40 hover:bg-slate-700/60 border border-white/10 text-slate-200 text-sm">Edit</button>
                            <button onClick={() => deleteDepartment(department.id)} className="px-3 py-2 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-400/20 text-rose-200 text-sm">Delete</button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activePanel === 'years' && (
            <div>
              <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                <h3 className="text-white font-semibold">Year Structure</h3>
                {role === 'faculty' && selectedDepartment && (
                  <button onClick={promoteAcademicYear} className="px-3 py-2 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/30 text-amber-200 flex items-center gap-2 text-sm">
                    <ArrowUp className="w-4 h-4" />
                    Promote Academic Year
                  </button>
                )}
              </div>

              {!selectedDepartment ? (
                <EmptyState message="Choose a department first" subMessage="Year structure depends on the selected department." />
              ) : (
                <div className="space-y-2">
                  {selectedDepartment.years.map((year) => (
                    <div key={year.id} className="p-4 rounded-xl bg-slate-900/40 border border-white/10 flex items-center justify-between">
                      <div>
                        <div className="text-white font-medium">{yearLabel(year.yearNumber)}</div>
                        <div className="text-xs text-slate-400 mt-1">{year.students.length} active students</div>
                      </div>
                      <button onClick={() => setSelectedYearNumber(year.yearNumber)} className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-sm">Focus</button>
                    </div>
                  ))}

                  {selectedDepartment.graduatedStudents.length > 0 && (
                    <div className="rounded-xl border border-fuchsia-400/20 bg-fuchsia-500/5 p-4 mt-4">
                      <div className="text-sm font-medium text-fuchsia-200 mb-2">Graduated Students</div>
                      <div className="text-xs text-slate-400">{selectedDepartment.graduatedStudents.length} students completed the final academic year.</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activePanel === 'students' && (
            <div>
              <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                <h3 className="text-white font-semibold">Student Management</h3>
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  {selectedDepartment && selectedYear && (
                    <button onClick={openMeetingForSelectedYear} disabled={selectedYear.students.length === 0} className="px-3 py-2 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 disabled:bg-slate-700/50 disabled:text-slate-500 disabled:border-white/10 disabled:cursor-not-allowed border border-cyan-400/30 text-cyan-200 text-sm">
                      Start Year Meeting
                    </button>
                  )}
                  {role === 'faculty' && selectedYear && selectedYear.students.length > 0 && (
                    <button onClick={exportStudentsCSV} className="px-3 py-2 rounded-lg bg-slate-700/40 hover:bg-slate-700/60 border border-white/10 text-slate-200 flex items-center gap-2 text-sm">
                      <Download className="w-4 h-4" />
                      Export CSV
                    </button>
                  )}
                </div>
              </div>

              {role === 'faculty' && (
                <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 mb-4">
                  <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                    <div>
                      <div className="text-sm font-medium text-white">Add Student</div>
                      <div className="text-xs text-slate-400 mt-1">Assign each student to a department and academic year before inviting them to meetings.</div>
                    </div>
                    <div className="text-xs text-slate-500">Name + email + department required</div>
                  </div>
                  <div className="grid md:grid-cols-4 gap-2 mb-2">
                    <input value={newStudent.name} onChange={(e) => setNewStudent((prev) => ({ ...prev, name: e.target.value }))} placeholder="Student name" className="px-3 py-2 rounded-lg bg-slate-800/70 border border-white/10 text-white" />
                    <input value={newStudent.email} onChange={(e) => setNewStudent((prev) => ({ ...prev, email: e.target.value }))} placeholder="Student email" className="px-3 py-2 rounded-lg bg-slate-800/70 border border-white/10 text-white" />
                    <select
                      value={newStudent.departmentId}
                      onChange={(e) => {
                        const departmentId = e.target.value
                        const targetDepartment = departments.find((department) => department.id === departmentId)
                        const maxYear = targetDepartment?.totalYears || 4
                        setNewStudent((prev) => ({ ...prev, departmentId, yearNumber: Math.min(prev.yearNumber, maxYear) }))
                      }}
                      className="px-3 py-2 rounded-lg bg-slate-800/70 border border-white/10 text-white"
                    >
                      <option value="">Select Department</option>
                      {departments.map((department) => (
                        <option key={department.id} value={department.id}>{department.name}</option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <select value={resolvedNewStudentYear} onChange={(e) => setNewStudent((prev) => ({ ...prev, yearNumber: Number(e.target.value) || 1 }))} className="flex-1 px-3 py-2 rounded-lg bg-slate-800/70 border border-white/10 text-white">
                        {availableYearOptions.map((year) => (
                          <option key={year} value={year}>{yearLabel(year)}</option>
                        ))}
                      </select>
                      <button onClick={addStudent} disabled={!studentFormValid} className="px-3 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 disabled:bg-slate-700/50 disabled:text-slate-500 disabled:border-white/10 disabled:cursor-not-allowed border border-emerald-400/30 text-emerald-200">
                        Add
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500">Students appear immediately in the selected academic hierarchy and can be moved between years later.</div>
                </div>
              )}

              {selectedYear && selectedYear.students.length > 0 && (
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} placeholder="Search by name or ID" className="w-full pl-9 pr-9 py-2 rounded-lg bg-slate-800/70 border border-white/10 text-white text-sm" />
                  {studentSearch && (
                    <button onClick={() => setStudentSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}

              {!selectedDepartment || !selectedYear ? (
                <EmptyState message="Select department and year" subMessage="Choose a department and academic year to review students, send invites, or start a meeting." />
              ) : filteredStudents.length === 0 ? (
                <EmptyState message={studentSearch ? 'No students match your search' : 'No students in this year'} subMessage={studentSearch ? 'Try a different student name or ID.' : 'Use the add student form above to populate this year.'} />
              ) : (
                <div className="space-y-2">
                  <div className="text-xs text-slate-400 mb-1">
                    {selectedDepartment.name} · {yearLabel(selectedYear.yearNumber)}
                    {studentSearch && <span className="ml-2 text-cyan-300">{filteredStudents.length} of {selectedYear.students.length} shown</span>}
                  </div>

                  {filteredStudents.map((student) => (
                    <div key={student.id} className="rounded-2xl border border-white/10 bg-slate-900/30 p-4">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                          <div className="text-white font-medium">{student.name}</div>
                          <div className="text-xs text-slate-400 mt-1">{student.id} · {student.email}</div>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full border text-xs ${STATUS_TONE[student.status]}`}>{student.status}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3 mt-3 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <select value={student.yearNumber || selectedYear.yearNumber} onChange={(e) => moveStudentToYear(selectedDepartment.id, student.id, Number(e.target.value) || selectedYear.yearNumber)} className="px-3 py-2 rounded-lg bg-slate-800/70 border border-white/10 text-white text-sm">
                            {selectedDepartment.years.map((year) => (
                              <option key={year.id} value={year.yearNumber}>{yearLabel(year.yearNumber)}</option>
                            ))}
                          </select>
                          {role === 'faculty' && (
                            <button onClick={() => cycleStudentStatus(selectedDepartment.id, selectedYear.yearNumber, student.id)} className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-sm">
                              Cycle Status
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <button onClick={() => onViewStudentProfile?.(student)} className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-sm">Profile</button>
                          <button onClick={() => onInviteStudentToMeeting?.(student)} className="px-3 py-2 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/30 text-cyan-200 text-sm">Invite</button>
                          <button onClick={() => onSendMessageToStudent?.(student)} className="px-3 py-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/30 text-emerald-200 text-sm">Message</button>
                          {role === 'faculty' && (
                            <button onClick={() => deleteStudent(selectedDepartment.id, selectedYear.yearNumber, student.id)} className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-400/20 text-rose-200">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {selectedDepartment.graduatedStudents.length > 0 && (
                    <div className="mt-4">
                      <div className="text-xs text-amber-300 mb-2">Graduated Students ({selectedDepartment.graduatedStudents.length})</div>
                      <div className="space-y-1">
                        {selectedDepartment.graduatedStudents.map((student) => (
                          <div key={student.id} className="px-3 py-2 rounded bg-amber-500/10 border border-amber-500/20 text-xs text-amber-100">
                            {student.name} ({student.id})
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 text-xs text-slate-500">Academic Management: Departments · Years · Students · Promote Academic Year</div>
    </div>
  )
}