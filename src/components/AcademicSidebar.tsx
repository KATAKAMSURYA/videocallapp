import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Video,
  GraduationCap,
  Users,
  CheckCircle2,
  Clapperboard,
  Settings,
  ChevronRight,
} from 'lucide-react'
import type { AcademicFacultyRoot } from './HierarchicalSidebar'
import { useState } from 'react'

export type AcademicNavItem =
  | 'dashboard'
  | 'meetings'
  | 'academic-structure'
  | 'students'
  | 'attendance'
  | 'recordings'
  | 'settings'

const NAV_ITEMS: Array<{ id: AcademicNavItem; label: string; icon: React.ReactNode }> = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { id: 'meetings', label: 'Meetings', icon: <Video className="w-5 h-5" /> },
  { id: 'academic-structure', label: 'Academic Structure', icon: <GraduationCap className="w-5 h-5" /> },
  { id: 'students', label: 'Students', icon: <Users className="w-5 h-5" /> },
  { id: 'attendance', label: 'Attendance', icon: <CheckCircle2 className="w-5 h-5" /> },
  { id: 'recordings', label: 'Recordings', icon: <Clapperboard className="w-5 h-5" /> },
  { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
]

interface AcademicSidebarProps {
  isOpen: boolean
  selected: AcademicNavItem
  onSelect: (id: AcademicNavItem) => void
  academicData?: AcademicFacultyRoot
  onSelectSection?: (sectionId: string) => void
}

export default function AcademicSidebar({ isOpen, selected, onSelect, academicData, onSelectSection }: AcademicSidebarProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }))

  return (
    <AnimatePresence initial={false}>
      <motion.aside
        initial={false}
        animate={{ width: isOpen ? 280 : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.22, ease: 'easeInOut' }}
        className="fixed left-0 top-0 h-screen z-30 overflow-hidden"
      >
        <div className="h-full w-[280px] glass-dark border-r border-white/10 bg-gradient-to-b from-slate-900/70 to-slate-950/70 backdrop-blur-lg">
          <div className="px-5 py-5 border-b border-white/10">
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

          <nav className="p-3 space-y-1">
            {NAV_ITEMS.map((item) => (
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

            {/* Hierarchical Academic Tree compact header (visual separator) */}
            {academicData && (
              <div className="mt-2 px-3 py-2 text-xs text-slate-400">Departments</div>
            )}
          </nav>

          {/* Academic hierarchy tree */}
          {academicData && (
            <div className="p-2 overflow-auto max-h-[calc(100vh-220px)]">
              <div className="space-y-1">
                <div>
                  <button
                    onClick={() => toggle(academicData.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-white/3 text-slate-200"
                  >
                    <div className="w-6 h-6 rounded-md bg-slate-800/80 flex items-center justify-center text-xs text-slate-300">F</div>
                    <div className="flex-1 text-sm font-medium">{academicData.name}</div>
                    <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${expanded[academicData.id] ? 'rotate-90' : ''}`} />
                  </button>

                  {expanded[academicData.id] && (
                    <div className="ml-3 mt-1 space-y-1">
                      {academicData.departments.map((dept) => (
                        <div key={dept.id}>
                          <button
                            onClick={() => toggle(dept.id)}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-white/3 text-slate-200"
                          >
                            <div className="w-5 h-5 text-sky-400">📁</div>
                            <div className="flex-1 text-sm">{dept.name}</div>
                            <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${expanded[dept.id] ? 'rotate-90' : ''}`} />
                          </button>

                          {expanded[dept.id] && (
                            <div className="ml-3 mt-1 space-y-1">
                              {(dept.branches || []).map((branch) => (
                                <div key={branch.id}>
                                  <button
                                    onClick={() => toggle(branch.id)}
                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-white/3 text-slate-200"
                                  >
                                    <div className="w-4 h-4 text-sky-300">📁</div>
                                    <div className="flex-1 text-sm">{branch.name}</div>
                                    <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${expanded[branch.id] ? 'rotate-90' : ''}`} />
                                  </button>

                                  {expanded[branch.id] && (
                                    <div className="ml-3 mt-1 space-y-1">
                                      {branch.sections.map((section) => (
                                        <button
                                          key={section.id}
                                          onClick={() => {
                                            onSelect('academic-structure')
                                            onSelectSection?.(section.id)
                                          }}
                                          className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-white/5 text-slate-300 text-sm"
                                        >
                                          <div className="w-2 h-2 rounded-full bg-slate-400/40" />
                                          <div className="flex-1 text-sm">{section.name}</div>
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10 text-xs text-slate-500">
            Sidebar stays fixed; content updates in the middle.
          </div>
        </div>
      </motion.aside>
    </AnimatePresence>
  )
}
