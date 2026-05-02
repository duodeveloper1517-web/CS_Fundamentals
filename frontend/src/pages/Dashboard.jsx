import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import DayDetailModal from '../components/DayDetailModal';
import toast from 'react-hot-toast';

const categoryColors = {
  'Computer Organization & Architecture': '#6366f1',
  'Memory Systems & Data Representation': '#8b5cf6',
  'Program Execution & Runtime': '#a855f7',
  'Operating Systems': '#ec4899',
  'Computer Networks': '#14b8a6',
  'Databases': '#f59e0b',
  'System Integration & Real-world Debugging': '#f97316'
};

const FILTERS = ['All', 'Cycle 1', 'Cycle 2', 'Completed', 'Pending', "Today's Target"];

export default function Dashboard() {
  const { user, logout, updateCompletedDays } = useAuth();
  const [schedule, setSchedule] = useState([]);
  const [completedDays, setCompletedDays] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  const todayNum = (() => {
    if (!user?.startDate) return 1;
    const diff = Math.floor((Date.now() - new Date(user.startDate)) / 86400000);
    return Math.min(Math.max(diff + 1, 1), 90);
  })();

  useEffect(() => {
    API.get('/schedule').then(({ data }) => {
      setSchedule(data.schedule);
      setCompletedDays(data.completedDays || []);
    }).catch(() => toast.error('Failed to load schedule'))
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = async (dayNum) => {
    try {
      const { data } = await API.post(`/schedule/${dayNum}/toggle`);
      setCompletedDays(data.completedDays);
      updateCompletedDays(data.completedDays);
      const isNowDone = data.completedDays.includes(dayNum);
      toast.success(isNowDone ? '✅ Day marked complete!' : '↩️ Marked as incomplete');
    } catch {
      toast.error('Failed to update progress');
    }
  };

  const filteredSchedule = schedule.filter(d => {
    if (filter === 'Cycle 1') return d.cycle === 1;
    if (filter === 'Cycle 2') return d.cycle === 2;
    if (filter === 'Completed') return completedDays.includes(d.day);
    if (filter === 'Pending') return !completedDays.includes(d.day);
    if (filter === "Today's Target") return d.day === todayNum;
    return true;
  });

  const progress = schedule.length ? Math.round((completedDays.length / 90) * 100) : 0;

  return (
    <div className="dashboard">
      {/* Navbar */}
      <nav className="navbar">
        <div className="nav-left">
          <span className="nav-logo">⚡ CS Fundamentals</span>
          <span className="nav-subtitle">90-Day Journey</span>
        </div>
        <div className="nav-right">
          <div className="nav-progress-mini">
            <span>{completedDays.length}/90 days</span>
            <div className="mini-bar"><div style={{ width: `${progress}%` }} /></div>
          </div>
          <span className="nav-user">👤 {user?.username}</span>
          <button className="btn-logout" onClick={logout}>Logout</button>
        </div>
      </nav>

      {/* Hero Stats */}
      <div className="hero-stats">
        <div className="stat-card">
          <div className="stat-number">{completedDays.length}</div>
          <div className="stat-label">Days Complete</div>
        </div>
        <div className="stat-card highlight">
          <div className="stat-number">Day {todayNum}</div>
          <div className="stat-label">Today's Target</div>
          {schedule.find(d => d.day === todayNum) && (
            <div className="stat-topic" onClick={() => setSelectedDay(schedule.find(d => d.day === todayNum))}>
              {schedule.find(d => d.day === todayNum)?.topic}
            </div>
          )}
        </div>
        <div className="stat-card">
          <div className="stat-number">{90 - completedDays.length}</div>
          <div className="stat-label">Days Remaining</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{progress}%</div>
          <div className="stat-label">Overall Progress</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="progress-section">
        <div className="progress-label">
          <span>Journey Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="filter-section">
        {FILTERS.map(f => (
          <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f}
          </button>
        ))}
        <span className="filter-count">{filteredSchedule.length} days</span>
      </div>

      {/* Schedule Grid */}
      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner-large" />
          <p>Loading your schedule...</p>
        </div>
      ) : (
        <div className="schedule-grid">
          {filteredSchedule.map(day => {
            const isCompleted = completedDays.includes(day.day);
            const isToday = day.day === todayNum;
            const catColor = categoryColors[day.category] || '#6366f1';
            // Day 1 is always unlocked; Day N unlocks only when Day N-1 is done
            const isUnlocked = day.day === 1 || completedDays.includes(day.day - 1);
            const isLocked = !isUnlocked;
            return (
              <div
                key={day.day}
                className={`day-card ${isCompleted ? 'done' : ''} ${isToday && !isLocked ? 'today' : ''} ${isLocked ? 'locked' : ''}`}
                onClick={() => !isLocked && setSelectedDay(day)}
                style={{ '--cat-color': isLocked ? '#444' : catColor }}
                title={isLocked ? `Complete Day ${day.day - 1} first to unlock this` : ''}
              >
                {isLocked ? (
                  <>
                    <div className="lock-icon">🔒</div>
                    <div className="day-number">Day {day.day}</div>
                    <div className="day-cycle">Cycle {day.cycle} · Day {day.cycleDay}</div>
                    <div className="day-topic locked-text">{day.topic}</div>
                    <div className="locked-hint">Complete Day {day.day - 1} to unlock</div>
                  </>
                ) : (
                  <>
                    {isToday && <div className="today-badge">TODAY</div>}
                    {isCompleted && <div className="done-badge">✓</div>}
                    <div className="day-number">Day {day.day}</div>
                    <div className="day-cycle">Cycle {day.cycle} · Day {day.cycleDay}</div>
                    <div className="day-topic">{day.topic}</div>
                    <div className="day-category" style={{ color: catColor }}>{day.category}</div>
                    <div className="day-card-footer">
                      <span className="subtopic-count">{day.subtopics.length} subtopics</span>
                      <button
                        className={`card-toggle ${isCompleted ? 'undo' : 'mark'}`}
                        onClick={e => { e.stopPropagation(); handleToggle(day.day); }}
                      >
                        {isCompleted ? 'Undo' : 'Mark Done'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {selectedDay && (
        <DayDetailModal
          day={selectedDay}
          completedDays={completedDays}
          onToggle={handleToggle}
          onClose={() => setSelectedDay(null)}
        />
      )}
    </div>
  );
}
