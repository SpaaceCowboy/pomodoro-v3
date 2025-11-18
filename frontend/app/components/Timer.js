'use client';

import { useState, useEffect } from 'react';
import useSound from 'use-sound';
import {
  Sun,
  Moon,
  Volume2,
  VolumeX,
  History,
  LogOut,
} from 'lucide-react';
import axios from 'axios';
import {jwtDecode} from 'jwt-decode';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import Auth from './Auth';

export default function Timer() {
  const [user, setUser] = useState(null);
  const [timeLeft, setTimeLeft] = useState(30 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isFocus, setIsFocus] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [weeklyStats, setWeeklyStats] = useState([]);
  const [loading, setLoading] = useState(true);

  const [play] = useSound('/sounds/bell.mp3', { volume: isMuted ? 0 : 0.55 });

  // Dark mode
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  // Load user + data
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const decoded = jwtDecode(token);
      setUser({ id: decoded.id, email: decoded.email || 'User' });

      const loadData = async () => {
        try {
          const [sessRes, weeklyRes] = await Promise.all([
            axios.get(`http://localhost:5000/api/timer/sessions/${decoded.id}`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
            axios.get(`http://localhost:5000/api/timer/weekly/${decoded.id}`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
          ]);

          const focusSessions = sessRes.data.filter(s => s.type === 'focus');
          setSessions(focusSessions);

          const weeklyData = Object.entries(weeklyRes.data).map(([date, minutes]) => ({
            date: date.slice(5).replace('-', '/'), // MM/DD
            minutes,
          }));
          setWeeklyStats(weeklyData);
        } catch (err) {
          console.log('Could not load data');
          setSessions([]);
          setWeeklyStats([]);
        } finally {
          setLoading(false);
        }
      };
      loadData();
    } catch (err) {
      localStorage.removeItem('token');
      setLoading(false);
    }
  }, []);

  // Timer
  useEffect(() => {
    if (!isRunning || timeLeft === 0) return;
    const id = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(id);
  }, [isRunning, timeLeft]);

  // Session end
  useEffect(() => {
    if (timeLeft !== 0) return;

    const now = new Date();
    const session = {
      date: now.toISOString(),
      type: isFocus ? 'focus' : 'break',
      minutes: isFocus ? 30 : 15,
      start: new Date(now.getTime() - (isFocus ? 30 * 60 * 1000 : 15 * 60 * 1000)).toISOString(),
      end: now.toISOString(),
    };

    if (isFocus && user) {
      axios.post(
        'http://localhost:5000/api/timer/session',
        { userId: user.id, session },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setSessions(prev => [...prev, { ...session, type: 'focus' }]);
    }

    if (!isMuted) play();
    if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
    setIsFocus(f => !f);
    setTimeLeft(isFocus ? 15 * 60 : 30 * 60);
    setIsRunning(false);
  }, [timeLeft, isFocus, isMuted, play, user]);

  const minutes = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const seconds = String(timeLeft % 60).padStart(2, '0');

  const todayMinutes = sessions.reduce((sum, s) => sum + s.minutes, 0);
  const hours = Math.floor(todayMinutes / 60);
  const mins = todayMinutes % 60;

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    window.location.reload();
  };

  if (!user) return <Auth onLogin={(u) => { setUser(u); window.location.reload(); }} />;
  if (loading) return <div className="fixed inset-0 bg-white dark:bg-black flex items-center justify-center text-4xl opacity-60">Loading…</div>;

  return (
    <div className="fixed inset-0 bg-white dark:bg-black text-black dark:text-white flex">
      {/* Main Timer */}
      <div className="flex-1 flex items-center justify-center relative">
        <div className="text-center">
          <div className="text-sm tracking-widest opacity-60 mb-12 font-light">
            {isFocus ? 'FOCUS' : 'BREAK'}
          </div>
          <div className="text-9xl font-thin tracking-tight select-none">
            {minutes}
            <span className="inline-block animate-pulse opacity-30">:</span>
            {seconds}
          </div>

          <div className="mt-20 flex justify-center gap-16">
            <button
              onClick={() => setIsRunning(r => !r)}
              className="text-2xl tracking-widest border-b-4 border-current pb-2 transition-all hover:border-opacity-60 active:scale-95"
            >
              {isRunning ? 'PAUSE' : 'START'}
            </button>
            <button
              onClick={() => {
                setIsRunning(false);
                setTimeLeft(isFocus ? 30 * 60 : 15 * 60);
              }}
              className="text-2xl tracking-widest opacity-40 hover:opacity-70 transition"
            >
              RESET
            </button>
          </div>
        </div>

        <div className="fixed top-8 left-8 opacity-50 text-sm flex items-center gap-4">
          <span>{user.email}</span>
          <button onClick={logout}><LogOut size={20} /></button>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:block w-96 border-l border-white/10 p-8 overflow-y-auto">
        <h2 className="text-lg tracking-widest opacity-60 mb-6">Today</h2>
        <div className="text-4xl font-thin mb-2">
          {hours > 0 && `${hours}h `}{mins}m
        </div>
        <div className="text-sm opacity-60 mb-8">{sessions.length} sessions</div>

        <h3 className="text-sm tracking-widest opacity-60 mb-4">Weekly</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyStats}>
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="minutes" fill="currentColor" opacity={0.6} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-8 space-y-3 text-sm opacity-80">
          {sessions.slice(-10).reverse().map((s, i) => (
            <div key={i} className="flex justify-between">
              <span>{new Date(s.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              <span>→</span>
              <span>{new Date(s.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile history button */}
      <button
        onClick={() => setShowHistory(true)}
        className="md:hidden fixed bottom-20 left-8 opacity-50 hover:opacity-90"
      >
        <History size={32} />
      </button>

      {/* Mobile drawer */}
      {showHistory && (
        <div className="md:hidden fixed inset-0 bg-black/95 backdrop-blur z-50 p-8 flex flex-col">
          <button onClick={() => setShowHistory(false)} className="self-end text-3xl mb-8">×</button>
          <h2 className="text-3xl mb-4">Today: {hours}h {mins}m</h2>
          <div className="h-64 mb-8">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyStats}>
                <Bar dataKey="minutes" fill="currentColor" opacity={0.7} />
                <XAxis dataKey="date" />
                <Tooltip />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 overflow-y-auto">
            {sessions.slice().reverse().map((s, i) => (
              <div key={i} className="py-3 border-b border-white/10 text-lg">
                {new Date(s.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} → {new Date(s.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Icons */}
      <button onClick={() => setIsDark(d => !d)} className="fixed top-8 right-8 opacity-50 hover:opacity-90 transition-all active:scale-90 z-10">
        {isDark ? <Sun size={32} /> : <Moon size={32} />}
      </button>
      <button onClick={() => setIsMuted(m => !m)} className="fixed bottom-8 right-8 opacity-50 hover:opacity-90 transition-all active:scale-90 z-10">
        {isMuted ? <VolumeX size={32} /> : <Volume2 size={32} />}
      </button>
    </div>
  );
}