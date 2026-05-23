import { Fragment } from 'react';
import { useSelector } from 'react-redux';
import { 
  ListTodo, 
  Clock, 
  Activity, 
  CheckCircle, 
  Search 
} from 'lucide-react';

export default function DashboardView() {
  const tasks = useSelector(state => state.task.tasks);
  const teams = useSelector(state => state.team.teams);

  const getInitials = (name = "Unassigned") => {
    if (name === "Unassigned") return "?";
    return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
  };

  // --------------------------------------------------------
  // SVG workload bar chart
  // --------------------------------------------------------
  const renderWorkloadBarChart = () => {
    const teamStats = teams.map(t => {
      const tasksCount = tasks.filter(tk => tk.team === t).length;
      return { team: t, count: tasksCount };
    });

    const maxVal = Math.max(...teamStats.map(s => s.count), 4);
    const w = 560;
    const h = 300;
    const paddingX = 48;
    const paddingY = 36;
    const graphW = w - paddingX * 2;
    const graphH = h - paddingY * 2;

    const ticksCount = 4;
    const gridLines = [];
    for (let i = 0; i <= ticksCount; i++) {
      const tickY = paddingY + (graphH * (1 - i / ticksCount));
      const labelVal = Math.round((maxVal / ticksCount) * i);
      gridLines.push(
        <Fragment key={`grid-${i}`}>
          <line x1={paddingX} y1={tickY} x2={w - paddingX} y2={tickY} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
          <text x={paddingX - 12} y={tickY + 5} fill="var(--text-muted)" fontSize="13" fontWeight="600" textAnchor="end">{labelVal}</text>
        </Fragment>
      );
    }

    const barSpacing = graphW / (teamStats.length || 1);
    const barW = Math.min(48, barSpacing * 0.65);

    const bars = teamStats.map((s, idx) => {
      const x = paddingX + (barSpacing * idx) + (barSpacing - barW) / 2;
      const barH = (s.count / maxVal) * graphH;
      const y = h - paddingY - barH;

      return (
        <Fragment key={`bar-${idx}`}>
          <defs>
            <linearGradient id={`bar-grad-${idx}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" />
              <stop offset="100%" stopColor="var(--accent-purple)" />
            </linearGradient>
          </defs>
          <rect
            className="bar-chart-rect"
            x={x}
            y={y}
            width={barW}
            height={barH}
            rx="4"
            fill={`url(#bar-grad-${idx})`}
          />
          {s.count > 0 && (
            <text x={x + barW / 2} y={y - 8} fill="var(--text-primary)" fontSize="13" fontWeight="700" textAnchor="middle">{s.count}</text>
          )}
          <text className="bar-chart-label" x={x + barW / 2} y={h - paddingY + 20} textAnchor="middle">{getInitials(s.team)}</text>
        </Fragment>
      );
    });

    return (
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet">
        {gridLines}
        {bars}
      </svg>
    );
  };

  // --------------------------------------------------------
  // SVG priority donut chart
  // --------------------------------------------------------
  const renderPriorityDonutChart = () => {
    const high = tasks.filter(t => t.priority === "high").length;
    const med = tasks.filter(t => t.priority === "medium").length;
    const low = tasks.filter(t => t.priority === "low").length;
    const total = high + med + low;

    const w = 340;
    const h = 300;
    const cx = w / 2;
    const cy = h / 2 - 18;
    const r = 82;
    const strokeW = 20;
    const circ = 2 * Math.PI * r;

    const segments = [
      { count: high, color: "var(--danger)" },
      { count: med, color: "var(--warning)" },
      { count: low, color: "var(--success)" }
    ];

    let accumulatedOffset = 0;
    const rings = [];

    if (total === 0) {
      rings.push(
        <Fragment key="empty-ring">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={strokeW} />
          <text className="donut-center-text-val" x={cx} y={cy + 8} textAnchor="middle">0</text>
          <text className="donut-center-text-lbl" x={cx} y={cy + 28} textAnchor="middle">Total Tasks</text>
        </Fragment>
      );
    } else {
      segments.forEach((seg, idx) => {
        if (seg.count > 0) {
          const percent = seg.count / total;
          const dashArray = `${percent * circ} ${circ}`;
          const dashOffset = -accumulatedOffset;
          
          rings.push(
            <circle
              key={`ring-${idx}`}
              className="donut-segment"
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={strokeW}
              strokeDasharray={dashArray}
              strokeDashoffset={dashOffset}
              transform={`rotate(-90 ${cx} ${cy})`}
            />
          );
          accumulatedOffset += percent * circ;
        }
      });
    }

    return (
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet">
        {total > 0 && rings}
        {total > 0 && (
          <>
            <text className="donut-center-text-val" x={cx} y={cy + 8} textAnchor="middle">{total}</text>
            <text className="donut-center-text-lbl" x={cx} y={cy + 28} textAnchor="middle">Total Tasks</text>
          </>
        )}
        {total === 0 && rings}
        
        {/* Legend */}
        <g transform={`translate(${(w - 240)/2}, ${h - 32})`}>
          <circle cx="12" cy="6" r="5" fill="var(--danger)" />
          <text x="22" y="10" fill="var(--text-secondary)" fontSize="13" fontWeight="600">High ({high})</text>
          
          <circle cx="100" cy="6" r="5" fill="var(--warning)" />
          <text x="110" y="10" fill="var(--text-secondary)" fontSize="13" fontWeight="600">Med ({med})</text>
          
          <circle cx="175" cy="6" r="5" fill="var(--success)" />
          <text x="185" y="10" fill="var(--text-secondary)" fontSize="13" fontWeight="600">Low ({low})</text>
        </g>
      </svg>
    );
  };

  // Quick stats calculations
  const statsTotal = tasks.length;
  const statsTodo = tasks.filter(t => t.status === 'todo').length;
  const statsProgress = tasks.filter(t => t.status === 'progress').length;
  const statsReview = tasks.filter(t => t.status === 'review').length;
  const statsDone = tasks.filter(t => t.status === 'done').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page Title */}
      <div className="view-header" style={{ marginBottom: 0 }}>
        <h1 className="view-title">Workspace Analytics</h1>
        <p className="view-subtitle">Monitor project metrics, team workloads, and task checklists.</p>
      </div>

      {/* Grid of stats */}
      <div className="ud-stats-grid">
        <div className="ud-stat-card">
          <div className="ud-stat-icon total"><ListTodo size={22} /></div>
          <div className="ud-stat-info">
            <div className="ud-stat-value">{statsTotal}</div>
            <div className="ud-stat-label">Total Tasks</div>
          </div>
        </div>
        <div className="ud-stat-card">
          <div className="ud-stat-icon todo"><Clock size={22} /></div>
          <div className="ud-stat-info">
            <div className="ud-stat-value">{statsTodo}</div>
            <div className="ud-stat-label">To Do</div>
          </div>
        </div>
        <div className="ud-stat-card">
          <div className="ud-stat-icon progress"><Activity size={22} /></div>
          <div className="ud-stat-info">
            <div className="ud-stat-value">{statsProgress}</div>
            <div className="ud-stat-label">In Progress</div>
          </div>
        </div>
        <div className="ud-stat-card">
          <div className="ud-stat-icon progress" style={{ backgroundColor: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa' }}><Search size={22} /></div>
          <div className="ud-stat-info">
            <div className="ud-stat-value">{statsReview}</div>
            <div className="ud-stat-label">In Review</div>
          </div>
        </div>
        <div className="ud-stat-card">
          <div className="ud-stat-icon done"><CheckCircle size={22} /></div>
          <div className="ud-stat-info">
            <div className="ud-stat-value">{statsDone}</div>
            <div className="ud-stat-label">Done</div>
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div className="dashboard-charts-grid">
        <div className="chart-card">
          <div className="chart-card-header">
            <span className="chart-card-title">Team Workloads (Task Count)</span>
          </div>
          <div className="chart-container">
            <div className="chart-svg-container chart-svg-container--bar">
              {renderWorkloadBarChart()}
            </div>
          </div>
        </div>
        
        <div className="chart-card">
          <div className="chart-card-header">
            <span className="chart-card-title">Priority Distribution</span>
          </div>
          <div className="chart-container">
            <div className="chart-svg-container chart-svg-container--donut">
              {renderPriorityDonutChart()}
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-details-row" style={{ gridTemplateColumns: '1fr' }}>
        <div className="details-block">
          <h3 className="details-block-title">Task Completion Progress</h3>
          <div className="activity-feed-list" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {teams.length === 0 ? (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No teams created yet.</span>
            ) : (
              teams.map(teamName => {
                const teamTasks = tasks.filter(t => t.team === teamName);
                const teamDone = teamTasks.filter(t => t.status === 'done').length;
                const teamTotal = teamTasks.length;
                const percent = teamTotal > 0 ? Math.round((teamDone / teamTotal) * 100) : 0;

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }} key={teamName}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600 }}>
                      <span>{teamName}</span>
                      <span style={{ color: 'var(--primary)' }}>{percent}% ({teamDone}/{teamTotal})</span>
                    </div>
                    <div className="card-progress-bar" style={{ height: '6px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div className="card-progress-fill" style={{ width: `${percent}%`, height: '100%' }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
