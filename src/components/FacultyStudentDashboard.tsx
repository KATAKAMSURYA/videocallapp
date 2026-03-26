import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, Bell, Bookmark, Calendar, CheckCircle2, Clapperboard, Clock3, Download, GraduationCap, MessageSquare, TrendingUp, Video } from 'lucide-react'

interface FacultyStudentDashboardProps {
  role: 'faculty' | 'student'
  onQuickStartMeeting?: () => void
  onNavigate?: (nav: string) => void
  upcomingMeetings?: Array<{ id: string; title: string; date: Date }>
  attendanceHistory?: Array<{ id: string; title: string; date: Date; status: 'Attended' | 'Absent' }>
  notifications?: Array<{ id: string; title: string; message: string }>
  sharedResources?: Array<{ id: string; title: string; date: Date; hasRecording: boolean; hasSummary: boolean; subject?: string }>
  todayTimeline?: Array<{ id: string; timeLabel: string; title: string; kind: 'class' | 'deadline' | 'reminder' }>
  attendanceWeeklyTrend?: Array<{ day: string; percentage: number }>
  attendanceRiskThreshold?: number
  reminderItems?: Array<{ id: string; title: string; message: string; type: 'assignment' | 'lab' | 'exam' | 'reminder'; dueLabel: string }>
  doubtRequests?: Array<{ id: string; topic: string; preferredSlot: string; requestedBy?: string; status: 'Sent' | 'Accepted' | 'Rescheduled' | 'Completed'; requestedAtLabel: string }>
  onRequestDoubtSession?: (payload: { topic: string; message: string; preferredSlot: string }) => void
  onUpdateDoubtRequestStatus?: (requestId: string, status: 'Sent' | 'Accepted' | 'Rescheduled' | 'Completed') => void
}

export default function FacultyStudentDashboard({
  role,
  onQuickStartMeeting,
  onNavigate,
  upcomingMeetings = [],
  attendanceHistory = [],
  notifications = [],
  sharedResources = [],
  todayTimeline = [],
  attendanceWeeklyTrend = [],
  attendanceRiskThreshold = 75,
  reminderItems = [],
  doubtRequests = [],
  onRequestDoubtSession,
  onUpdateDoubtRequestStatus,
}: FacultyStudentDashboardProps) {
  const attendedCount = attendanceHistory.filter((item) => item.status === 'Attended').length
  const attendanceRate = attendanceHistory.length > 0
    ? Math.round((attendedCount / attendanceHistory.length) * 100)
    : 0
  const isAtRisk = role === 'student' && attendanceRate < attendanceRiskThreshold

  const [selectedSubject, setSelectedSubject] = useState('All')
  const [savedResourceIds, setSavedResourceIds] = useState<Record<string, boolean>>({})
  const [doneReminderIds, setDoneReminderIds] = useState<Record<string, boolean>>({})
  const [snoozedReminderIds, setSnoozedReminderIds] = useState<Record<string, boolean>>({})
  const [doubtTopic, setDoubtTopic] = useState('')
  const [doubtMessage, setDoubtMessage] = useState('')
  const [preferredSlot, setPreferredSlot] = useState('')

  const subjectOptions = useMemo(() => {
    const values = new Set<string>()
    sharedResources.forEach((resource) => values.add(resource.subject || 'General'))
    return ['All', ...Array.from(values)]
  }, [sharedResources])

  const filteredResources = useMemo(() => {
    if (selectedSubject === 'All') return sharedResources
    return sharedResources.filter((resource) => (resource.subject || 'General') === selectedSubject)
  }, [selectedSubject, sharedResources])

  const visibleReminders = reminderItems.filter((item) => !doneReminderIds[item.id] && !snoozedReminderIds[item.id])

  const handleToggleBookmark = (resourceId: string) => {
    setSavedResourceIds((prev) => ({ ...prev, [resourceId]: !prev[resourceId] }))
  }

  const handleMarkDone = (reminderId: string) => {
    setDoneReminderIds((prev) => ({ ...prev, [reminderId]: true }))
  }

  const handleSnooze = (reminderId: string) => {
    setSnoozedReminderIds((prev) => ({ ...prev, [reminderId]: true }))
  }

  const handleSubmitDoubtSession = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!doubtTopic.trim() || !doubtMessage.trim() || !preferredSlot.trim()) {
      return
    }

    onRequestDoubtSession?.({
      topic: doubtTopic.trim(),
      message: doubtMessage.trim(),
      preferredSlot: preferredSlot.trim(),
    })

    setDoubtTopic('')
    setDoubtMessage('')
    setPreferredSlot('')
  }

  const getDoubtStatusClass = (status: 'Sent' | 'Accepted' | 'Rescheduled' | 'Completed') => {
    if (status === 'Sent') return 'text-sky-200 border-sky-400/30 bg-sky-500/10'
    if (status === 'Accepted') return 'text-emerald-200 border-emerald-400/30 bg-emerald-500/10'
    if (status === 'Rescheduled') return 'text-amber-200 border-amber-400/30 bg-amber-500/10'
    return 'text-violet-200 border-violet-400/30 bg-violet-500/10'
  }

  return (
    <div className="w-full h-full">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            {role === 'faculty' ? 'Faculty Dashboard' : 'Student Dashboard'}
          </h1>
          <p className="text-slate-300 mt-2">
            {role === 'faculty'
              ? 'Manage your academic sections and host video meetings.'
              : 'Join-only access: track meetings, attendance, reminders, and shared resources.'}
          </p>
        </div>
        {role === 'faculty' && (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onQuickStartMeeting?.()}
            className="px-6 py-3 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 font-semibold"
          >
            Start Meeting
          </motion.button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="glass rounded-xl p-4">
          <div className="text-slate-400 text-sm">{role === 'faculty' ? 'Meetings' : 'Upcoming Meetings'}</div>
          <div className="text-3xl font-bold text-blue-200">{role === 'faculty' ? 12 : upcomingMeetings.length}</div>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="text-slate-400 text-sm">{role === 'faculty' ? 'Recordings' : 'Attendance Rate'}</div>
          <div className="text-3xl font-bold text-purple-200">{role === 'faculty' ? 5 : `${attendanceRate}%`}</div>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="text-slate-400 text-sm">{role === 'faculty' ? 'Academic Units' : 'Shared Resources'}</div>
          <div className="text-3xl font-bold text-cyan-200">{role === 'faculty' ? 3 : sharedResources.length}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {role === 'faculty' && (
          <button className="glass rounded-xl p-5 text-left hover:bg-white/10 transition-all" onClick={() => onNavigate?.('academic-structure')}>
            <GraduationCap className="w-5 h-5 text-cyan-300 mb-3" />
            <h3 className="text-white font-semibold">Academic Structure</h3>
            <p className="text-slate-400 text-sm mt-1">Browse departments, academic years, and students.</p>
          </button>
        )}

        {role === 'faculty' && (
          <button className="glass rounded-xl p-5 text-left hover:bg-white/10 transition-all" onClick={() => onNavigate?.('meetings')}>
            <Video className="w-5 h-5 text-blue-300 mb-3" />
            <h3 className="text-white font-semibold">Meetings</h3>
            <p className="text-slate-400 text-sm mt-1">Start, join, and manage video meetings.</p>
          </button>
        )}

        <button className="glass rounded-xl p-5 text-left hover:bg-white/10 transition-all" onClick={() => onNavigate?.('recordings')}>
          <Clapperboard className="w-5 h-5 text-violet-300 mb-3" />
          <h3 className="text-white font-semibold">{role === 'faculty' ? 'Recordings' : 'Shared Resources'}</h3>
          <p className="text-slate-400 text-sm mt-1">
            {role === 'faculty' ? 'Access recordings and meeting summaries.' : 'Download shared recordings and summaries from joined meetings.'}
          </p>
        </button>

        {role === 'faculty' && (
          <button className="glass rounded-xl p-5 text-left hover:bg-white/10 transition-all" onClick={() => onNavigate?.('meetings')}>
            <Calendar className="w-5 h-5 text-amber-300 mb-3" />
            <h3 className="text-white font-semibold">Schedule</h3>
            <p className="text-slate-400 text-sm mt-1">Schedule academic sessions and reminders.</p>
          </button>
        )}
      </div>

      {role === 'faculty' && (
        <div className="glass rounded-xl p-5 mt-6">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="w-4 h-4 text-blue-300" />
            <h3 className="text-white font-semibold">Doubt Requests Admin</h3>
          </div>
          {doubtRequests.length === 0 ? (
            <p className="text-slate-500 text-sm">No student doubt requests yet.</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-auto pr-1">
              {doubtRequests.map((request) => (
                <div key={request.id} className="rounded-lg bg-slate-900/50 border border-white/10 px-3 py-2 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">{request.topic}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {request.requestedBy ? `${request.requestedBy} · ` : ''}{request.preferredSlot} · {request.requestedAtLabel}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${getDoubtStatusClass(request.status)}`}>
                      {request.status}
                    </span>
                    <select
                      value={request.status}
                      onChange={(event) => onUpdateDoubtRequestStatus?.(request.id, event.target.value as 'Sent' | 'Accepted' | 'Rescheduled' | 'Completed')}
                      className="text-xs rounded-md bg-slate-900/70 border border-white/10 px-2 py-1 text-slate-200 focus:outline-none"
                    >
                      <option value="Sent">Sent</option>
                      <option value="Accepted">Accepted</option>
                      <option value="Rescheduled">Rescheduled</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {role === 'student' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
          <div className="glass rounded-xl p-5 lg:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <Clock3 className="w-4 h-4 text-cyan-300" />
              <h3 className="text-white font-semibold">Today</h3>
            </div>
            {todayTimeline.length === 0 ? (
              <p className="text-slate-500 text-sm">No classes, deadlines, or reminders for today.</p>
            ) : (
              <div className="space-y-2">
                {todayTimeline.slice(0, 8).map((item) => (
                  <div key={item.id} className="rounded-lg bg-slate-900/50 border border-white/10 px-3 py-2 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs text-slate-400">{item.timeLabel}</p>
                      <p className="text-sm text-white truncate mt-0.5">{item.title}</p>
                    </div>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full border ${item.kind === 'class'
                      ? 'text-cyan-200 border-cyan-400/30 bg-cyan-500/10'
                      : item.kind === 'deadline'
                        ? 'text-rose-200 border-rose-400/30 bg-rose-500/10'
                        : 'text-amber-200 border-amber-400/30 bg-amber-500/10'}`}>
                      {item.kind}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-purple-300" />
              <h3 className="text-white font-semibold">Attendance Insights</h3>
            </div>

            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-slate-400">Weekly trend</p>
              <p className="text-sm text-purple-200 font-medium">{attendanceRate}%</p>
            </div>

            {attendanceWeeklyTrend.length === 0 ? (
              <p className="text-slate-500 text-sm">No attendance trend data yet.</p>
            ) : (
              <div className="space-y-2">
                {attendanceWeeklyTrend.map((point) => (
                  <div key={point.day} className="flex items-center gap-2">
                    <div className="w-10 text-[11px] text-slate-400">{point.day}</div>
                    <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full bg-purple-400/70" style={{ width: `${Math.max(0, Math.min(100, point.percentage))}%` }} />
                    </div>
                    <div className="w-10 text-right text-[11px] text-slate-300">{point.percentage}%</div>
                  </div>
                ))}
              </div>
            )}

            <div className={`mt-4 rounded-lg border px-3 py-2 text-xs ${isAtRisk
              ? 'border-rose-400/30 bg-rose-500/10 text-rose-200'
              : 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'}`}>
              <div className="flex items-center gap-2">
                {isAtRisk ? <AlertTriangle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                {isAtRisk
                  ? `At risk: attendance below ${attendanceRiskThreshold}%.`
                  : `On track: attendance is above ${attendanceRiskThreshold}%.`}
              </div>
            </div>
          </div>

          <div className="glass rounded-xl p-5">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-emerald-300" />
                <h3 className="text-white font-semibold">Resources Hub</h3>
              </div>
              <select
                value={selectedSubject}
                onChange={(event) => setSelectedSubject(event.target.value)}
                className="text-xs rounded-md bg-slate-900/70 border border-white/10 px-2 py-1 text-slate-200 focus:outline-none"
              >
                {subjectOptions.map((subject) => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>

            {filteredResources.length === 0 ? (
              <p className="text-slate-500 text-sm">No resources found for this subject.</p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-auto pr-1">
                {filteredResources.slice(0, 10).map((resource) => {
                  const isSaved = Boolean(savedResourceIds[resource.id])
                  return (
                    <div key={resource.id} className="rounded-lg bg-slate-900/50 border border-white/10 px-3 py-2 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs text-white truncate">{resource.title}</p>
                        <p className="text-[11px] text-slate-500 mt-1">{resource.subject || 'General'} · {resource.date.toLocaleDateString()}</p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          {resource.hasRecording ? 'Recording' : ''}
                          {resource.hasRecording && resource.hasSummary ? ' · ' : ''}
                          {resource.hasSummary ? 'Summary' : ''}
                        </p>
                      </div>
                      <button
                        onClick={() => handleToggleBookmark(resource.id)}
                        className={`p-1.5 rounded transition-colors ${isSaved ? 'bg-amber-500/20 text-amber-300' : 'bg-white/5 text-slate-400 hover:text-slate-200'}`}
                        title={isSaved ? 'Remove bookmark' : 'Save bookmark'}
                      >
                        <Bookmark className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="glass rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Bell className="w-4 h-4 text-amber-300" />
              <h3 className="text-white font-semibold">Reminder Center</h3>
            </div>

            {visibleReminders.length === 0 ? (
              <p className="text-slate-500 text-sm">No active reminders.</p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-auto pr-1">
                {visibleReminders.slice(0, 8).map((item) => (
                  <div key={item.id} className="rounded-lg bg-slate-900/50 border border-white/10 px-3 py-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs text-white truncate">{item.title}</p>
                        <p className="text-[11px] text-slate-400 mt-1">{item.message}</p>
                        <p className="text-[11px] text-amber-200 mt-1">{item.type.toUpperCase()} · {item.dueLabel}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => handleSnooze(item.id)}
                        className="text-[11px] px-2 py-1 rounded bg-slate-700/60 hover:bg-slate-700 text-slate-200"
                      >
                        Snooze
                      </button>
                      <button
                        onClick={() => handleMarkDone(item.id)}
                        className="text-[11px] px-2 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200"
                      >
                        Mark done
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass rounded-xl p-5 lg:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="w-4 h-4 text-cyan-300" />
              <h3 className="text-white font-semibold">Request Doubt Session</h3>
            </div>
            <form onSubmit={handleSubmitDoubtSession} className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                value={doubtTopic}
                onChange={(event) => setDoubtTopic(event.target.value)}
                placeholder="Topic (e.g., DSA, Networks)"
                className="rounded-lg bg-slate-900/70 border border-white/10 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none"
              />
              <input
                value={preferredSlot}
                onChange={(event) => setPreferredSlot(event.target.value)}
                placeholder="Preferred slot (e.g., Tomorrow 4 PM)"
                className="rounded-lg bg-slate-900/70 border border-white/10 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/20 text-cyan-200 text-sm font-medium"
              >
                Send Request
              </button>
              <textarea
                value={doubtMessage}
                onChange={(event) => setDoubtMessage(event.target.value)}
                placeholder="Describe your doubt briefly..."
                className="md:col-span-3 rounded-lg bg-slate-900/70 border border-white/10 px-3 py-2 text-sm text-white placeholder-slate-500 min-h-[90px] focus:outline-none"
              />
            </form>
            <p className="text-[11px] text-slate-500 mt-2">One-click request to faculty replaces direct meeting controls.</p>
          </div>

          <div className="glass rounded-xl p-5 lg:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="w-4 h-4 text-blue-300" />
              <h3 className="text-white font-semibold">Doubt Request Tracking</h3>
            </div>
            {doubtRequests.length === 0 ? (
              <p className="text-slate-500 text-sm">No faculty requests yet.</p>
            ) : (
              <div className="space-y-2 max-h-52 overflow-auto pr-1">
                {doubtRequests.map((request) => (
                  <div key={request.id} className="rounded-lg bg-slate-900/50 border border-white/10 px-3 py-2 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm text-white truncate">{request.topic}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{request.preferredSlot} · {request.requestedAtLabel}</p>
                    </div>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${getDoubtStatusClass(request.status)}`}>
                      {request.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="glass rounded-xl p-5 lg:col-span-2">
              <h3 className="text-white font-semibold mb-3">Recent Notifications</h3>
              <div className="space-y-2 max-h-40 overflow-auto pr-1">
                {notifications.slice(0, 5).map((notification) => (
                  <div key={notification.id} className="rounded-lg bg-slate-900/50 border border-white/10 px-3 py-2">
                    <p className="text-xs text-white">{notification.title}</p>
                    <p className="text-[11px] text-slate-400 mt-1">{notification.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
