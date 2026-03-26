import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Bell, Bookmark, Calendar, Clapperboard, Clock3, Download, GraduationCap, MessageSquare, Video } from 'lucide-react'

interface SharedResourceItem {
  id: string
  title: string
  date: Date
  hasRecording: boolean
  hasSummary: boolean
  subject?: string
  recordingUrl?: string
  downloadUrl?: string
  fileSizeLabel?: string
  slidesUrl?: string
  summaryText?: string
  summaryUrl?: string
}

interface FacultyStudentDashboardProps {
  role: 'faculty' | 'student'
  onQuickStartMeeting?: () => void
  onNavigate?: (nav: string) => void
  upcomingMeetings?: Array<{ id: string; title: string; date: Date }>
  attendanceHistory?: Array<{ id: string; title: string; date: Date; status: 'Attended' | 'Absent' }>
  notifications?: Array<{ id: string; title: string; message: string }>
  sharedResources?: Array<SharedResourceItem>
  todayTimeline?: Array<{ id: string; timeLabel: string; title: string; kind: 'class' | 'deadline' | 'reminder' }>
  liveInvite?: { id: string; title: string; sectionName: string; host: string; startedAt: Date }
  onJoinLiveMeeting?: (meetingId: string) => void
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
  liveInvite,
  onJoinLiveMeeting,
  reminderItems = [],
  doubtRequests = [],
  onRequestDoubtSession,
  onUpdateDoubtRequestStatus,
}: FacultyStudentDashboardProps) {

  const attendedCount = attendanceHistory.filter((item) => item.status === 'Attended').length
  const attendanceRate = attendanceHistory.length > 0
    ? Math.round((attendedCount / attendanceHistory.length) * 100)
    : 0

  const [selectedSubject, setSelectedSubject] = useState('All')
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'recording' | 'summary'>('all')
  const [savedResourceIds, setSavedResourceIds] = useState<Record<string, boolean>>({})
  const [doneReminderIds, setDoneReminderIds] = useState<Record<string, boolean>>({})
  const [snoozedReminderIds, setSnoozedReminderIds] = useState<Record<string, boolean>>({})
  const [doubtTopic, setDoubtTopic] = useState('')
  const [doubtMessage, setDoubtMessage] = useState('')
  const [preferredSlot, setPreferredSlot] = useState('')
  const [lastPositions, setLastPositions] = useState<Record<string, number>>({})

  const subjectOptions = useMemo(() => {
    const values = new Set<string>()
    sharedResources.forEach((resource) => values.add(resource.subject || 'General'))
    return ['All', ...Array.from(values)]
  }, [sharedResources])

  const filteredResources = useMemo(() => {
    const filteredBySubject = selectedSubject === 'All'
      ? sharedResources
      : sharedResources.filter((resource) => (resource.subject || 'General') === selectedSubject)

    const filteredByAvailability = filteredBySubject.filter((resource) => {
      if (availabilityFilter === 'recording') return resource.hasRecording
      if (availabilityFilter === 'summary') return resource.hasSummary
      return true
    })

    return [...filteredByAvailability].sort((a, b) => b.date.getTime() - a.date.getTime())
  }, [availabilityFilter, selectedSubject, sharedResources])

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

      {role === 'student' && liveInvite && (
        <div className="glass rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6 border border-emerald-400/30 bg-emerald-500/10">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-emerald-200">Live class in progress</p>
            <h3 className="text-white font-semibold mt-1">{liveInvite.title}</h3>
            <p className="text-slate-300 text-sm mt-1">{liveInvite.sectionName} · Host: {liveInvite.host}</p>
            <p className="text-slate-400 text-xs">Started at {liveInvite.startedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onJoinLiveMeeting?.(liveInvite.id)}
              className="px-4 py-2 rounded-lg bg-emerald-500/80 hover:bg-emerald-500 text-white text-sm font-semibold"
            >
              Request to Join
            </button>
            <button
              onClick={() => onNavigate?.('meetings')}
              className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 text-sm"
            >
              View Meetings
            </button>
          </div>
        </div>
      )}

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
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-emerald-300" />
                <h3 className="text-white font-semibold">Resources Hub</h3>
              </div>
              <div className="flex gap-2">
                <select
                  value={selectedSubject}
                  onChange={(event) => setSelectedSubject(event.target.value)}
                  className="text-xs rounded-md bg-slate-900/70 border border-white/10 px-2 py-1 text-slate-200 focus:outline-none"
                >
                  {subjectOptions.map((subject) => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
                <select
                  value={availabilityFilter}
                  onChange={(event) => setAvailabilityFilter(event.target.value as 'all' | 'recording' | 'summary')}
                  className="text-xs rounded-md bg-slate-900/70 border border-white/10 px-2 py-1 text-slate-200 focus:outline-none"
                >
                  <option value="all">All</option>
                  <option value="recording">Has recording</option>
                  <option value="summary">Has summary</option>
                </select>
              </div>
            </div>

            {filteredResources.length === 0 ? (
              <p className="text-slate-500 text-sm">No resources found for this subject.</p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-auto pr-1">
                {filteredResources.slice(0, 10).map((resource) => {
                  const isSaved = Boolean(savedResourceIds[resource.id])
                  const resumeSeconds = lastPositions[resource.id] || 0
                  const formatSeconds = (seconds: number) => {
                    const mins = Math.floor(seconds / 60)
                    const secs = seconds % 60
                    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
                  }
                  return (
                    <div key={resource.id} className="rounded-lg bg-slate-900/50 border border-white/10 px-3 py-2 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs text-white truncate">{resource.title}</p>
                        <p className="text-[11px] text-slate-500 mt-1">{resource.subject || 'General'} · {resource.date.toLocaleDateString()}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {resource.hasRecording && <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-200 border border-blue-400/30">Recording</span>}
                          {resource.hasSummary && <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-200 border border-purple-400/30">Summary</span>}
                          {resource.slidesUrl && <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-200 border border-emerald-400/30">Slides</span>}
                        </div>
                        {resource.summaryText && (
                          <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{resource.summaryText}</p>
                        )}
                        {resource.hasRecording && (
                          <p className="text-[11px] text-amber-200 mt-1">Resume at {formatSeconds(resumeSeconds)}</p>
                        )}
                        <div className="flex flex-wrap gap-2 mt-2">
                          {resource.hasRecording && (
                            <>
                              <button
                                onClick={() => setLastPositions((prev) => ({ ...prev, [resource.id]: Math.min(resumeSeconds + 30, 3599) }))}
                                className="text-[11px] px-2 py-1 rounded bg-blue-500/20 hover:bg-blue-500/30 text-blue-100"
                              >
                                Save +30s
                              </button>
                              <button
                                className="text-[11px] px-2 py-1 rounded bg-blue-500/20 hover:bg-blue-500/30 text-blue-100"
                                disabled={!resource.recordingUrl}
                              >
                                Stream
                              </button>
                              <button
                                className="text-[11px] px-2 py-1 rounded bg-slate-700/60 hover:bg-slate-700 text-slate-100 disabled:opacity-50"
                                disabled={!resource.downloadUrl}
                              >
                                Download{resource.fileSizeLabel ? ` (${resource.fileSizeLabel})` : ''}
                              </button>
                            </>
                          )}
                          {resource.summaryUrl && (
                            <a
                              className="text-[11px] px-2 py-1 rounded bg-purple-500/20 hover:bg-purple-500/30 text-purple-100"
                              href={resource.summaryUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Read summary
                            </a>
                          )}
                          {resource.slidesUrl && (
                            <a
                              className="text-[11px] px-2 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-100"
                              href={resource.slidesUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              View slides
                            </a>
                          )}
                        </div>
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
