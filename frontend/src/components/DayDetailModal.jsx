import { useState, useEffect } from 'react';
import API from '../api/axios';
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

export default function DayDetailModal({ day, onClose, completedDays, onToggle }) {
  const [tab, setTab] = useState('resources');
  const [quiz, setQuiz] = useState(null);           // all 10 questions
  const [quizLoading, setQuizLoading] = useState(false);
  const [current, setCurrent] = useState(0);         // current question index
  const [selected, setSelected] = useState(null);    // selected option index
  const [revealed, setRevealed] = useState(false);   // show answer?
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const isCompleted = completedDays.includes(day.day);
  const catColor = categoryColors[day.category] || '#6366f1';

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const generateQuiz = async () => {
    setQuizLoading(true);
    setQuiz(null);
    setCurrent(0);
    setSelected(null);
    setRevealed(false);
    setScore(0);
    setFinished(false);
    try {
      const { data } = await API.post('/quiz/generate', {
        topic: day.topic,
        subtopics: day.subtopics,
        day: day.day
      });
      setQuiz(data.questions);
      setTab('quiz');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Quiz generation failed');
    } finally {
      setQuizLoading(false);
    }
  };

  // User picks an option → immediately reveal correct/wrong + explanation
  const handleSelect = (optIdx) => {
    if (revealed) return;
    setSelected(optIdx);
    setRevealed(true);
    if (quiz && optIdx === quiz[current].correct) {
      setScore(s => s + 1);
    }
  };

  const handleNext = () => {
    if (current + 1 >= quiz.length) {
      setFinished(true);
    } else {
      setCurrent(c => c + 1);
      setSelected(null);
      setRevealed(false);
    }
  };

  const q = quiz ? quiz[current] : null;

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        {/* Header */}
        <div className="modal-header" style={{ borderTop: `4px solid ${catColor}` }}>
          <div className="modal-day-badge" style={{ background: catColor }}>Day {day.day}</div>
          <h2 className="modal-title">{day.topic}</h2>
          <div className="modal-meta">
            <span className="modal-category" style={{ color: catColor }}>{day.category}</span>
            <span className="modal-cycle">Cycle {day.cycle}</span>
          </div>
          <div className="modal-actions">
            <button
              className={`btn-complete ${isCompleted ? 'completed' : ''}`}
              onClick={() => onToggle(day.day)}
            >
              {isCompleted ? '✓ Completed' : 'Mark as Done'}
            </button>
            <button className="btn-close" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="modal-tabs">
          <button
            className={`modal-tab ${tab === 'resources' ? 'active' : ''}`}
            onClick={() => setTab('resources')}
          >
            📚 Resources
          </button>
          <button
            className={`modal-tab ${tab === 'quiz' ? 'active' : ''}`}
            onClick={() => { if (!quiz && !quizLoading) generateQuiz(); else setTab('quiz'); }}
          >
            🧠 Quiz {quiz && !finished ? `(${current + 1}/${quiz.length})` : ''}
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">

          {/* ── RESOURCES TAB ── */}
          {tab === 'resources' && (
            <div className="resources-panel">
              <div className="subtopics-section">
                <h3>📌 Topics to Cover</h3>
                <ul className="subtopic-list">
                  {day.subtopics.map((s, i) => (
                    <li key={i}><span className="bullet" style={{ background: catColor }} />{s}</li>
                  ))}
                </ul>
              </div>
              <div className="resources-section">
                <h3>🔗 Learning Resources</h3>
                <div className="resource-links">
                  {day.resources.map((url, i) => {
                    const domain = new URL(url).hostname.replace('www.', '');
                    const emoji = domain.includes('youtube') ? '▶️' : domain.includes('geeksforgeeks') ? '🟢' : '🌐';
                    return (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="resource-link">
                        <span>{emoji}</span>
                        <span>{domain}</span>
                        <span className="link-arrow">↗</span>
                      </a>
                    );
                  })}
                </div>
                <button className="btn-quiz-gen" onClick={generateQuiz} disabled={quizLoading}>
                  {quizLoading
                    ? <><span className="spinner-sm" /> Generating Quiz...</>
                    : '🧠 Take a 10-Question Quiz'}
                </button>
              </div>
            </div>
          )}

          {/* ── QUIZ TAB ── */}
          {tab === 'quiz' && (
            <div className="quiz-panel">

              {/* Loading state */}
              {quizLoading && (
                <div className="quiz-loading">
                  <div className="loading-brain">🧠</div>
                  <p>Generating 10 questions with AI...</p>
                </div>
              )}

              {/* Finished screen */}
              {!quizLoading && finished && quiz && (
                <div className="quiz-finished">
                  <div className={`final-score-ring ${score >= 8 ? 'excellent' : score >= 6 ? 'good' : 'try-again'}`}>
                    <span className="final-score-num">{score}</span>
                    <span className="final-score-denom">/{quiz.length}</span>
                  </div>
                  <div className="final-msg">
                    {score === quiz.length ? '🏆 Perfect Score!' : score >= 8 ? '🌟 Excellent!' : score >= 6 ? '👍 Good Job!' : '📖 Keep Studying!'}
                  </div>
                  <div className="final-sub">{score >= 6 ? 'Great understanding of the topic!' : 'Review the resources and try again.'}</div>
                  <button className="btn-retake" onClick={generateQuiz}>🔄 New Quiz</button>
                </div>
              )}

              {/* One question at a time */}
              {!quizLoading && !finished && q && (
                <>
                  {/* Progress bar */}
                  <div className="quiz-progress-bar">
                    <div
                      className="quiz-progress-fill"
                      style={{ width: `${((current) / quiz.length) * 100}%` }}
                    />
                  </div>
                  <div className="quiz-progress-label">
                    <span>Question {current + 1} of {quiz.length}</span>
                    <span>Score: {score}/{current + (revealed ? 1 : 0)}</span>
                  </div>

                  {/* Question card */}
                  <div className="quiz-question-card">
                    <p className="q-text">
                      <span className="q-num">Q{current + 1}.</span> {q.question}
                    </p>

                    <div className="q-options">
                      {q.options.map((opt, oi) => {
                        let cls = 'q-option';
                        if (revealed) {
                          if (oi === q.correct) cls += ' correct';
                          else if (selected === oi) cls += ' wrong';
                          else cls += ' dimmed';
                        } else if (selected === oi) {
                          cls += ' selected';
                        }
                        return (
                          <button
                            key={oi}
                            className={cls}
                            onClick={() => handleSelect(oi)}
                            disabled={revealed}
                          >
                            <span className="opt-letter">{String.fromCharCode(65 + oi)}</span>
                            {opt}
                            {revealed && oi === q.correct && <span className="opt-tick">✓</span>}
                            {revealed && selected === oi && oi !== q.correct && <span className="opt-cross">✗</span>}
                          </button>
                        );
                      })}
                    </div>

                    {/* Instant explanation */}
                    {revealed && (
                      <div className={`instant-explanation ${selected === q.correct ? 'correct-exp' : 'wrong-exp'}`}>
                        <span className="exp-icon">{selected === q.correct ? '✅' : '❌'}</span>
                        <div>
                          <div className="exp-verdict">
                            {selected === q.correct ? 'Correct!' : `Wrong — correct answer: ${q.options[q.correct]}`}
                          </div>
                          <div className="exp-text">💡 {q.explanation}</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Next button (only after answering) */}
                  {revealed && (
                    <button className="btn-next" onClick={handleNext}>
                      {current + 1 === quiz.length ? 'See Results 🏁' : 'Next Question →'}
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
