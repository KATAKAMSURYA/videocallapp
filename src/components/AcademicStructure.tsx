import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, Users, Video, MessageSquare, User } from 'lucide-react'

export type AcademicNodeType = 'faculty' | 'department' | 'branch' | 'section'

export interface StudentRecord {
  id: string
  name: string
  email: string
  attendancePct: number
  status: 'Active' | 'At Risk' | 'Inactive'
}

export interface AcademicSection {
  id: string
  name: string
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
  branches: AcademicBranch[]
}

export interface AcademicFacultyRoot {
  id: string
  name: string
  departments: AcademicDepartment[]
}

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
  facultyProfile?: FacultyProfile | null
  role: 'faculty' | 'student'
  onStartMeetingForSection?: (section: AcademicSection) => void
  onInviteStudentToMeeting?: (student: StudentRecord) => void
  onSendMessageToStudent?: (student: StudentRecord) => void
  onViewStudentProfile?: (student: StudentRecord) => void
}

function matchesFacultyScope(facultyProfile: FacultyProfile | null | undefined, departmentName: string) {
  if (!facultyProfile?.department) return true
  return facultyProfile.department.trim().toLowerCase() === departmentName.trim().toLowerCase()
}

export default function AcademicStructure({
  facultyRoot,
  facultyProfile,
  role,
  onStartMeetingForSection,
  onInviteStudentToMeeting,
  onSendMessageToStudent,
  onViewStudentProfile,
}: AcademicStructureProps) {
  const scopedRoot = useMemo<AcademicFacultyRoot>(() => {
    if (role !== 'faculty') return facultyRoot
    return {
      ...facultyRoot,
      departments: facultyRoot.departments.filter((d) => matchesFacultyScope(facultyProfile, d.name)),
    }
  }, [facultyRoot, facultyProfile, role])

  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    [scopedRoot.id]: true,
  })
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null)

  // If a sectionId was selected from the sidebar, read it and select
  useMemo(() => {
    try {
      const sid = localStorage.getItem('selectedSectionId')
      if (sid) {
        setSelectedSectionId(sid)
        // ensure parents are expanded for visibility
        for (const d of scopedRoot.departments) {
          for (const b of d.branches) {
            for (const s of b.sections) {
              if (s.id === sid) {
                setExpanded((prev) => ({ ...prev, [scopedRoot.id]: true, [d.id]: true, [b.id]: true }))
                // clear the localStorage flag so it doesn't persist
                localStorage.removeItem('selectedSectionId')
                return
              }
            }
          }
        }
      }
    } catch (e) {
      // ignore
    }
  }, [scopedRoot])

  const selectedSection = useMemo(() => {
    for (const d of scopedRoot.departments) {
      for (const b of d.branches) {
        for (const s of b.sections) {
          if (s.id === selectedSectionId) return s
        }
      }
    }
    return null
  }, [scopedRoot, selectedSectionId])

  const toggle = (id: string) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))

  return (
    <div className="w-full h-full overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-full">
        {/* Tree */}
        <div className="lg:col-span-2 glass rounded-2xl border border-white/10 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10">
            <div className="text-white font-semibold">Academic Structure</div>
            <div className="text-xs text-slate-400 mt-1">Faculty → Department → Branch → Section → Students</div>
          </div>

          <div className="p-3 max-h-[calc(100vh-220px)] overflow-auto">
            <TreeNode
              type="faculty"
              label={scopedRoot.name}
              isExpanded={!!expanded[scopedRoot.id]}
              onToggle={() => toggle(scopedRoot.id)}
            />

            <AnimatePresence initial={false}>
              {expanded[scopedRoot.id] && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="ml-4"
                >
                  {scopedRoot.departments.map((dept) => (
                    <div key={dept.id} className="mt-1">
                      <TreeNode
                        type="department"
                        label={dept.name}
                        isExpanded={!!expanded[dept.id]}
                        onToggle={() => toggle(dept.id)}
                      />

                      <AnimatePresence initial={false}>
                        {expanded[dept.id] && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="ml-4"
                          >
                            {dept.branches.map((branch) => (
                              <div key={branch.id} className="mt-1">
                                <TreeNode
                                  type="branch"
                                  label={branch.name}
                                  isExpanded={!!expanded[branch.id]}
                                  onToggle={() => toggle(branch.id)}
                                />

                                <AnimatePresence initial={false}>
                                  {expanded[branch.id] && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      className="ml-4"
                                    >
                                      {branch.sections.map((section) => (
                                        <div key={section.id} className="mt-1">
                                          <button
                                            onClick={() => {
                                              setSelectedSectionId(section.id)
                                              setExpanded((prev) => ({ ...prev, [section.id]: true }))
                                            }}
                                            className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg border transition-all ${
                                              selectedSectionId === section.id
                                                ? 'bg-purple-500/15 border-purple-400/30 text-white'
                                                : 'bg-slate-900/40 border-white/5 text-slate-300 hover:bg-white/5'
                                            }`}
                                          >
                                            <div className="flex items-center gap-2">
                                              <span className="text-slate-400">S</span>
                                              <span className="font-medium">{section.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                              <Users className="w-4 h-4" />
                                              {section.students.length}
                                            </div>
                                          </button>

                                          {role === 'faculty' && selectedSectionId === section.id && (
                                            <div className="mt-2 ml-2">
                                              <button
                                                onClick={() => onStartMeetingForSection?.(section)}
                                                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/15 border border-emerald-400/30 text-emerald-200 hover:bg-emerald-500/20 transition-all"
                                              >
                                                <Video className="w-4 h-4" />
                                                Start meeting for this section
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
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Section content */}
        <div className="lg:col-span-3 glass rounded-2xl border border-white/10 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between gap-4">
            <div>
              <div className="text-white font-semibold">{selectedSection ? selectedSection.name : 'Select a section'}</div>
              <div className="text-xs text-slate-400 mt-1">
                {selectedSection ? 'Students in this section' : 'Click a Section in the tree to load students'}
              </div>
            </div>
            {role === 'faculty' && selectedSection && (
              <button
                onClick={() => onStartMeetingForSection?.(selectedSection)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/15 border border-blue-400/30 text-blue-100 hover:bg-blue-500/20 transition-all"
              >
                <Video className="w-4 h-4" />
                Start Meeting
              </button>
            )}
          </div>

          {!selectedSection ? (
            <div className="p-8 text-slate-400">
              <div className="text-sm">No section selected.</div>
              <div className="text-xs mt-2">Tip: Faculty can start meetings from any section to invite all students.</div>
            </div>
          ) : (
            <div className="p-4 overflow-auto max-h-[calc(100vh-220px)]">
              <div className="w-full overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-300">
                      <th className="py-3 px-3">Student ID</th>
                      <th className="py-3 px-3">Name</th>
                      <th className="py-3 px-3">Email</th>
                      <th className="py-3 px-3">Attendance %</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {selectedSection.students.map((student) => (
                      <tr key={student.id} className="text-slate-200 hover:bg-white/5 transition-colors">
                        <td className="py-3 px-3 font-mono text-xs text-slate-300">{student.id}</td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-slate-800/70 border border-white/10 flex items-center justify-center">
                              <User className="w-4 h-4 text-slate-300" />
                            </div>
                            <span className="font-medium text-white">{student.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-slate-300">{student.email}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-1 rounded-full text-xs border ${
                            student.attendancePct >= 85
                              ? 'bg-emerald-500/15 border-emerald-400/30 text-emerald-200'
                              : student.attendancePct >= 70
                                ? 'bg-amber-500/15 border-amber-400/30 text-amber-200'
                                : 'bg-rose-500/15 border-rose-400/30 text-rose-200'
                          }`}>
                            {student.attendancePct}%
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-1 rounded-full text-xs border ${
                            student.status === 'Active'
                              ? 'bg-blue-500/15 border-blue-400/30 text-blue-200'
                              : student.status === 'At Risk'
                                ? 'bg-amber-500/15 border-amber-400/30 text-amber-200'
                                : 'bg-slate-600/15 border-slate-500/30 text-slate-300'
                          }`}>
                            {student.status}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => onViewStudentProfile?.(student)}
                              className="px-3 py-1.5 rounded-lg bg-slate-800/60 border border-white/10 text-slate-200 hover:bg-white/5 transition-all"
                            >
                              View Profile
                            </button>
                            {role === 'faculty' && (
                              <>
                                <button
                                  onClick={() => onInviteStudentToMeeting?.(student)}
                                  className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-400/30 text-blue-200 hover:bg-blue-500/15 transition-all"
                                  title="Invite to a meeting"
                                >
                                  Invite
                                </button>
                                <button
                                  onClick={() => onSendMessageToStudent?.(student)}
                                  className="px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-400/30 text-purple-200 hover:bg-purple-500/15 transition-all flex items-center gap-2"
                                >
                                  <MessageSquare className="w-4 h-4" />
                                  Message
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function TreeNode({
  type,
  label,
  isExpanded,
  onToggle,
}: {
  type: AcademicNodeType
  label: string
  isExpanded: boolean
  onToggle: () => void
}) {
  const badge =
    type === 'faculty' ? 'F' : type === 'department' ? 'D' : type === 'branch' ? 'B' : 'S'

  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-slate-900/40 border border-white/5 text-slate-200 hover:bg-white/5 transition-all"
    >
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-md bg-slate-800/80 border border-white/10 flex items-center justify-center text-xs text-slate-300">
          {badge}
        </div>
        <span className="font-medium text-white">{label}</span>
      </div>
      <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
    </button>
  )
}
