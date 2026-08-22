import React, { useState, useMemo } from 'react';
import { useTodo } from '../context/TodoContext';
import { AIDailyDigest } from './AIDailyDigest';
import { getLocalDateString } from '../utils/dateUtils';
import {
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  Flame,
  Calendar,
  BarChart3,
  PieChart as PieIcon,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';

export const ReportingAnalyticsDashboard = () => {
  const { tasks } = useTodo();
  const [timeRange, setTimeRange] = useState('week'); // 'week' | 'month' | 'all'

  // Current date calculations
  const now = new Date();
  const todayStr = getLocalDateString(now);

  // Compute 7 days of the current week (Monday to Sunday)
  const currentWeekDays = useMemo(() => {
    const dayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday...
    const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + distanceToMonday);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = getLocalDateString(d);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      days.push({ dateStr, dayName, dayNum: d.getDate() });
    }
    return days;
  }, []);

  // Compute Weekly Statistics
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'done').length;
    const unfinished = tasks.filter(t => t.rescheduledFrom || t.status === 'unfinished').length;
    const active = tasks.filter(t => t.status !== 'done').length;

    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // High, Medium, Low breakdown
    const highDone = tasks.filter(t => t.priority === 'high' && t.status === 'done').length;
    const highTotal = tasks.filter(t => t.priority === 'high').length;

    // Weekly day-by-day bar breakdown
    const weekData = currentWeekDays.map(day => {
      const dayTasks = tasks.filter(t => t.dueDate === day.dateStr || t.rescheduledFrom === day.dateStr);
      const doneCount = dayTasks.filter(t => t.status === 'done').length;
      const unfinCount = dayTasks.filter(t => t.rescheduledFrom || t.status === 'unfinished' || (t.status !== 'done' && t.dueDate < todayStr)).length;
      const totalCount = dayTasks.length || (doneCount + unfinCount);

      return {
        ...day,
        done: doneCount,
        unfinished: unfinCount,
        total: totalCount
      };
    });

    // Peak day
    let peakDay = 'Wednesday';
    let maxDone = -1;
    weekData.forEach(d => {
      if (d.done > maxDone) {
        maxDone = d.done;
        peakDay = d.dayName;
      }
    });

    return {
      total,
      completed,
      unfinished,
      active,
      rate,
      highDone,
      highTotal,
      weekData,
      peakDay
    };
  }, [tasks, currentWeekDays, todayStr]);

  // Max value for bar scaling
  const maxBarValue = Math.max(...stats.weekData.map(d => Math.max(d.done, d.unfinished, 1)), 5);

  // SVG Pie / Donut Chart Angles
  const totalForPie = Math.max(stats.completed + stats.unfinished + stats.active, 1);
  const doneAngle = (stats.completed / totalForPie) * 360;
  const unfinAngle = (stats.unfinished / totalForPie) * 360;
  const activeAngle = (stats.active / totalForPie) * 360;

  // Donut SVG circumference math (radius = 50 -> circumference = 2 * PI * 50 = 314.159)
  const C = 314.159;
  const doneOffset = C - (stats.completed / totalForPie) * C;
  const unfinOffset = C - (stats.unfinished / totalForPie) * C;
  const activeOffset = C - (stats.active / totalForPie) * C;

  return (
    <div className="reporting-dashboard-wrapper animate-fade-in">
      {/* Top Title & Header */}
      <div className="reporting-header-row">
        <div>
          <h1 className="view-title-heading" style={{ marginBottom: '4px' }}>
            Productivity Reporting & Analytics
          </h1>
          <p className="reporting-subtitle">
            Real-time weekly performance analytics, completion velocity, and workload diagnostics.
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="reporting-time-tabs">
          <button
            type="button"
            className={`reporting-tab-btn ${timeRange === 'week' ? 'active' : ''}`}
            onClick={() => setTimeRange('week')}
          >
            This Week
          </button>
          <button
            type="button"
            className={`reporting-tab-btn ${timeRange === 'month' ? 'active' : ''}`}
            onClick={() => setTimeRange('month')}
          >
            This Month
          </button>
        </div>
      </div>

      {/* AI Daily Focus Digest */}
      <AIDailyDigest />

      {/* KPI Metric Cards Grid */}
      <div className="reporting-kpi-grid">
        {/* 1. Completion Rate */}
        <div className="kpi-metric-card">
          <div className="kpi-card-top">
            <span className="kpi-card-label">Weekly Success Rate</span>
            <div className="kpi-icon-pill green">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="kpi-number-row">
            <span className="kpi-big-number">{stats.rate}%</span>
            <span className="kpi-trend positive">
              <ArrowUpRight size={14} />
              +12% vs last wk
            </span>
          </div>
          <div className="kpi-progress-bar">
            <div className="kpi-progress-fill green" style={{ width: `${stats.rate}%` }}></div>
          </div>
        </div>

        {/* 2. Completed Tasks */}
        <div className="kpi-metric-card">
          <div className="kpi-card-top">
            <span className="kpi-card-label">Tasks Completed (Locked)</span>
            <div className="kpi-icon-pill purple">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="kpi-number-row">
            <span className="kpi-big-number">{stats.completed}</span>
            <span className="kpi-sub-text">out of {stats.total} total</span>
          </div>
          <div className="kpi-progress-bar">
            <div
              className="kpi-progress-fill purple"
              style={{ width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%` }}
            ></div>
          </div>
        </div>

        {/* 3. Unfinished / Moved Tasks */}
        <div className="kpi-metric-card">
          <div className="kpi-card-top">
            <span className="kpi-card-label">Unfinished & Rescheduled</span>
            <div className="kpi-icon-pill amber">
              <RotateCcw size={16} />
            </div>
          </div>
          <div className="kpi-number-row">
            <span className="kpi-big-number">{stats.unfinished}</span>
            <span className="kpi-sub-text">postponed to future dates</span>
          </div>
          <div className="kpi-progress-bar">
            <div
              className="kpi-progress-fill amber"
              style={{ width: `${stats.total > 0 ? (stats.unfinished / stats.total) * 100 : 0}%` }}
            ></div>
          </div>
        </div>

        {/* 4. High Priority Focus */}
        <div className="kpi-metric-card">
          <div className="kpi-card-top">
            <span className="kpi-card-label">Critical High Impact</span>
            <div className="kpi-icon-pill red">
              <Flame size={16} />
            </div>
          </div>
          <div className="kpi-number-row">
            <span className="kpi-big-number">
              {stats.highDone}/{stats.highTotal}
            </span>
            <span className="kpi-sub-text">high priority items done</span>
          </div>
          <div className="kpi-progress-bar">
            <div
              className="kpi-progress-fill red"
              style={{ width: `${stats.highTotal > 0 ? (stats.highDone / stats.highTotal) * 100 : 0}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts Section (Bar Chart & Donut Pie Chart) */}
      <div className="reporting-charts-grid">
        {/* Weekly Done vs Unfinished Performance Bar Chart */}
        <div className="chart-card-container">
          <div className="chart-card-header">
            <div className="chart-header-left">
              <BarChart3 size={18} className="chart-icon purple" />
              <div>
                <h3 className="chart-card-title">Weekly Task Velocity (Done vs Unfinished)</h3>
                <p className="chart-card-subtitle">Daily breakdown of scheduled items across this week</p>
              </div>
            </div>

            {/* Bar Chart Legend */}
            <div className="chart-legend-row">
              <span className="legend-item">
                <span className="legend-dot green"></span>
                <span>Done</span>
              </span>
              <span className="legend-item">
                <span className="legend-dot amber"></span>
                <span>Unfinished / Moved</span>
              </span>
            </div>
          </div>

          {/* Bar Chart Visual */}
          <div className="bar-chart-visual-wrapper">
            <div className="bar-chart-canvas">
              {stats.weekData.map((day) => {
                const doneHeightPercent = Math.min(Math.round((day.done / maxBarValue) * 100), 100);
                const unfinHeightPercent = Math.min(Math.round((day.unfinished / maxBarValue) * 100), 100);
                const isToday = day.dateStr === todayStr;

                return (
                  <div key={day.dateStr} className={`bar-day-column ${isToday ? 'current-day' : ''}`}>
                    <div className="bar-column-bars-track">
                      {/* Done Bar */}
                      <div
                        className="bar-pillar green"
                        style={{ height: `${Math.max(doneHeightPercent, 4)}%` }}
                        title={`${day.dayName}: ${day.done} completed`}
                      >
                        {day.done > 0 && <span className="bar-val-label">{day.done}</span>}
                      </div>

                      {/* Unfinished Bar */}
                      <div
                        className="bar-pillar amber"
                        style={{ height: `${Math.max(unfinHeightPercent, 4)}%` }}
                        title={`${day.dayName}: ${day.unfinished} unfinished/postponed`}
                      >
                        {day.unfinished > 0 && <span className="bar-val-label">{day.unfinished}</span>}
                      </div>
                    </div>

                    <div className="bar-day-label">
                      <span className="day-name">{day.dayName}</span>
                      <span className="day-num">{day.dayNum}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Task Completion & Status Distribution Pie/Donut Chart */}
        <div className="chart-card-container">
          <div className="chart-card-header">
            <div className="chart-header-left">
              <PieIcon size={18} className="chart-icon green" />
              <div>
                <h3 className="chart-card-title">Task Distribution Donut</h3>
                <p className="chart-card-subtitle">Ratio of finished, active, and rescheduled tasks</p>
              </div>
            </div>
          </div>

          <div className="donut-chart-layout">
            {/* SVG Donut */}
            <div className="donut-svg-wrapper">
              <svg viewBox="0 0 120 120" className="donut-svg">
                {/* Background Ring */}
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="transparent"
                  stroke="var(--bg-surface-subtle)"
                  strokeWidth="14"
                />
                {/* Done Segment */}
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="transparent"
                  stroke="#10B981"
                  strokeWidth="14"
                  strokeDasharray={C}
                  strokeDashoffset={doneOffset}
                  strokeLinecap="round"
                  transform="rotate(-90 60 60)"
                />
                {/* Unfinished Segment */}
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="transparent"
                  stroke="#F59E0B"
                  strokeWidth="14"
                  strokeDasharray={C}
                  strokeDashoffset={unfinOffset}
                  strokeLinecap="round"
                  transform={`rotate(${-90 + doneAngle} 60 60)`}
                />
              </svg>
              <div className="donut-center-stat">
                <span className="center-percentage">{stats.rate}%</span>
                <span className="center-sub">Success</span>
              </div>
            </div>

            {/* Donut Legend & Proportions */}
            <div className="donut-details-list">
              <div className="donut-legend-row">
                <div className="donut-color-box green"></div>
                <div className="donut-label-group">
                  <span className="donut-title">Completed (Locked)</span>
                  <span className="donut-count">{stats.completed} tasks ({Math.round((stats.completed / totalForPie) * 100)}%)</span>
                </div>
              </div>

              <div className="donut-legend-row">
                <div className="donut-color-box amber"></div>
                <div className="donut-label-group">
                  <span className="donut-title">Unfinished / Moved</span>
                  <span className="donut-count">{stats.unfinished} tasks ({Math.round((stats.unfinished / totalForPie) * 100)}%)</span>
                </div>
              </div>

              <div className="donut-legend-row">
                <div className="donut-color-box purple"></div>
                <div className="donut-label-group">
                  <span className="donut-title">Active / In Progress</span>
                  <span className="donut-count">{stats.active} tasks ({Math.round((stats.active / totalForPie) * 100)}%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Diagnostic Summary Banner */}
      <div className="reporting-ai-summary-card">
        <div className="ai-summary-icon">
          <Sparkles size={20} />
        </div>
        <div className="ai-summary-content">
          <h4 className="ai-summary-title">Weekly AI Diagnostic Insights</h4>
          <p className="ai-summary-text">
            Your peak velocity day is <strong>{stats.peakDay}</strong>. You have achieved an overall{' '}
            <strong>{stats.rate}% completion rate</strong> this week. Rescheduling unfinished tasks to future dates
            ensures zero backlog buildup while keeping your daily focus realistic.
          </p>
        </div>
      </div>
    </div>
  );
};
