import { motion } from 'framer-motion'
import { Calendar, CheckCircle2, Clapperboard, GraduationCap, Video } from 'lucide-react'

export default function FacultyStudentDashboard({ role, onQuickStartMeeting }: { role: 'faculty' | 'student'; onQuickStartMeeting?: () => void }) {
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
              : 'Join meetings, view recordings, and see meeting summaries.'}
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass rounded-xl p-4">
          <div className="text-slate-400 text-sm">Meetings</div>
          <div className="text-3xl font-bold text-blue-200">12</div>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="text-slate-400 text-sm">Attendance</div>
          <div className="text-3xl font-bold text-emerald-200">87%</div>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="text-slate-400 text-sm">Recordings</div>
          <div className="text-3xl font-bold text-purple-200">5</div>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="text-slate-400 text-sm">Academic Units</div>
          <div className="text-3xl font-bold text-cyan-200">3</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        <button className="glass rounded-xl p-5 text-left hover:bg-white/10 transition-all">
          <GraduationCap className="w-5 h-5 text-cyan-300 mb-3" />
          <h3 className="text-white font-semibold">Academic Structure</h3>
          <p className="text-slate-400 text-sm mt-1">Browse departments, branches, and sections.</p>
        </button>

        <button className="glass rounded-xl p-5 text-left hover:bg-white/10 transition-all">
          <Video className="w-5 h-5 text-blue-300 mb-3" />
          <h3 className="text-white font-semibold">Meetings</h3>
          <p className="text-slate-400 text-sm mt-1">Start, join, and manage video meetings.</p>
        </button>

        <button className="glass rounded-xl p-5 text-left hover:bg-white/10 transition-all">
          <CheckCircle2 className="w-5 h-5 text-emerald-300 mb-3" />
          <h3 className="text-white font-semibold">Attendance</h3>
          <p className="text-slate-400 text-sm mt-1">Review attendance percentages by section.</p>
        </button>

        <button className="glass rounded-xl p-5 text-left hover:bg-white/10 transition-all">
          <Clapperboard className="w-5 h-5 text-violet-300 mb-3" />
          <h3 className="text-white font-semibold">Recordings</h3>
          <p className="text-slate-400 text-sm mt-1">Access recordings and meeting summaries.</p>
        </button>

        <button className="glass rounded-xl p-5 text-left hover:bg-white/10 transition-all">
          <Calendar className="w-5 h-5 text-amber-300 mb-3" />
          <h3 className="text-white font-semibold">Schedule</h3>
          <p className="text-slate-400 text-sm mt-1">Schedule academic sessions and reminders.</p>
        </button>
      </div>
    </div>
  )
}
