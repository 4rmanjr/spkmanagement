import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UserX, 
  FileText, 
  AlertCircle, 
  TrendingUp, 
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Plus,
  Printer,
  Activity
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { api } from '../api';
import type { SPKStats } from '../types';

// Loading Skeleton Component
function StatCardSkeleton() {
  return (
    <div className="stat-card" style={{ opacity: 0.7 }}>
      <div className="stat-icon" style={{ background: 'var(--bg-secondary)' }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--border)' }} />
      </div>
      <div className="stat-content">
        <div style={{ width: '60%', height: 32, borderRadius: 4, background: 'var(--border)', marginBottom: 8 }} />
        <div style={{ width: '80%', height: 16, borderRadius: 4, background: 'var(--border)' }} />
      </div>
    </div>
  );
}

export function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<SPKStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getSPKStats()
      .then(data => setStats(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('id-ID').format(value);
  };

  // Chart colors
  const COLORS = ['#6366f1', '#f59e0b', '#22c55e', '#ef4444', '#3b82f6'];

  // Prepare chart data
  const penyegelanChartData = stats?.penyegelan_by_ket.map((item, index) => ({
    name: item.KET,
    value: item.count,
    color: COLORS[index % COLORS.length]
  })) || [];

  const pencabutanChartData = stats?.pencabutan_by_ket.map((item, index) => ({
    name: item.KET,
    value: item.count,
    color: COLORS[index % COLORS.length]
  })) || [];

  const tunggakanComparisonData = [
    {
      name: 'Penyegelan',
      amount: stats?.total_tunggakan_penyegelan || 0,
    },
    {
      name: 'Pencabutan',
      amount: stats?.total_tunggakan_pencabutan || 0,
    }
  ];

  const statCards = [
    {
      title: 'Total Penyegelan',
      value: formatNumber(stats?.total_penyegelan ?? 0),
      icon: AlertCircle,
      variant: 'warning' as const,
      trend: '+12%',
      trendUp: true,
      subtitle: 'dari bulan lalu',
    },
    {
      title: 'Total Pencabutan',
      value: formatNumber(stats?.total_pencabutan ?? 0),
      icon: UserX,
      variant: 'danger' as const,
      trend: '+5%',
      trendUp: true,
      subtitle: 'dari bulan lalu',
    },
    {
      title: 'Total Data SPK',
      value: formatNumber(stats?.total_all ?? 0),
      icon: FileText,
      variant: 'primary' as const,
      trend: '+8%',
      trendUp: true,
      subtitle: 'seluruh data',
    },
    {
      title: 'Total Tunggakan',
      value: formatCurrency(stats?.total_tunggakan_all ?? 0),
      icon: TrendingUp,
      variant: 'success' as const,
      trend: '-3%',
      trendUp: false,
      subtitle: 'dari bulan lalu',
    },
  ];

  const quickActions = [
    { 
      icon: Plus, 
      label: 'Tambah Pelanggan', 
      variant: 'primary',
      onClick: () => navigate('/customers')
    },
    { 
      icon: FileText, 
      label: 'Manajemen SPK', 
      variant: 'warning',
      onClick: () => navigate('/spk')
    },
    { 
      icon: Printer, 
      label: 'Cetak Laporan', 
      variant: 'success',
      onClick: () => window.print()
    },
    { 
      icon: Activity, 
      label: 'Lihat Semua Surat', 
      variant: 'secondary',
      onClick: () => navigate('/letters')
    },
  ];

  if (loading) {
    return (
      <div>
        <div className="stats-grid">
          {[1, 2, 3, 4].map((i) => <StatCardSkeleton key={i} />)}
        </div>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '1.5rem', 
          marginTop: '1.5rem' 
        }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="card" style={{ minHeight: 300 }}>
              <div style={{ width: '40%', height: 24, borderRadius: 4, background: 'var(--border)', marginBottom: 20 }} />
              <div style={{ display: 'flex', gap: 12, flexDirection: 'column' }}>
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ width: '50%', height: 16, borderRadius: 4, background: 'var(--border)' }} />
                    <div style={{ width: '20%', height: 16, borderRadius: 4, background: 'var(--border)' }} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Quick Actions */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Zap size={20} style={{ color: 'var(--warning)' }} />
            Aksi Cepat
          </h2>
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {quickActions.map((action) => {
            const Icon = action.icon;
            const variantStyles: Record<string, React.CSSProperties> = {
              primary: { background: 'var(--primary)', color: 'white' },
              warning: { background: 'var(--warning)', color: 'white' },
              success: { background: 'var(--success)', color: 'white' },
              secondary: { background: 'var(--bg-secondary)', color: 'var(--text-primary)' },
            };
            return (
              <button
                key={action.label}
                onClick={action.onClick}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.25rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 500,
                  transition: 'all 0.2s',
                  ...variantStyles[action.variant],
                }}
              >
                <Icon size={18} />
                {action.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          const TrendIcon = stat.trendUp ? ArrowUpRight : ArrowDownRight;
          return (
            <div key={stat.title} className="stat-card" style={{ position: 'relative', overflow: 'hidden' }}>
              <div 
                className={`stat-icon ${stat.variant}`}
                style={{ 
                  position: 'relative',
                  zIndex: 1 
                }}
              >
                <Icon size={28} />
              </div>
              <div className="stat-content" style={{ position: 'relative', zIndex: 1 }}>
                <div className="stat-value" style={{ fontSize: '1.75rem' }}>{stat.value}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <span 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.125rem',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: stat.trendUp ? 'var(--success)' : 'var(--danger)'
                    }}
                  >
                    <TrendIcon size={14} />
                    {stat.trend}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {stat.subtitle}
                  </span>
                </div>
                <div className="stat-label" style={{ marginTop: '0.5rem' }}>{stat.title}</div>
              </div>
              {/* Decorative background element */}
              <div 
                style={{
                  position: 'absolute',
                  right: -20,
                  bottom: -20,
                  width: 100,
                  height: 100,
                  borderRadius: '50%',
                  background: `var(--${stat.variant})`,
                  opacity: 0.05,
                  zIndex: 0,
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
        gap: '1.5rem', 
        marginTop: '1.5rem' 
      }}>
        {/* Penyegelan Chart */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={20} style={{ color: 'var(--warning)' }} />
              Distribusi Penyegelan
            </h2>
          </div>
          <div style={{ height: 250 }}>
            {penyegelanChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={penyegelanChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {penyegelanChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
                Tidak ada data
              </div>
            )}
          </div>
          <div style={{ marginTop: '1rem' }}>
            {stats?.penyegelan_by_ket.map((item) => (
              <div key={item.KET} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                padding: '0.5rem 0',
                borderBottom: '1px solid var(--border-color)'
              }}>
                <span style={{ fontSize: '0.875rem' }}>{item.KET}</span>
                <span style={{ fontWeight: 600, color: 'var(--warning)', fontSize: '0.875rem' }}>
                  {formatNumber(item.count)} pelanggan
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Pencabutan Chart */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UserX size={20} style={{ color: 'var(--danger)' }} />
              Distribusi Pencabutan
            </h2>
          </div>
          <div style={{ height: 250 }}>
            {pencabutanChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pencabutanChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pencabutanChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
                Tidak ada data
              </div>
            )}
          </div>
          <div style={{ marginTop: '1rem' }}>
            {stats?.pencabutan_by_ket.map((item) => (
              <div key={item.KET} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                padding: '0.5rem 0',
                borderBottom: '1px solid var(--border-color)'
              }}>
                <span style={{ fontSize: '0.875rem' }}>{item.KET}</span>
                <span style={{ fontWeight: 600, color: 'var(--danger)', fontSize: '0.875rem' }}>
                  {formatNumber(item.count)} pelanggan
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Tunggakan Bar Chart */}
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div className="card-header">
            <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={20} style={{ color: 'var(--success)' }} />
              Perbandingan Tunggakan
            </h2>
          </div>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tunggakanComparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--text-secondary)" />
                <YAxis 
                  stroke="var(--text-secondary)"
                  tickFormatter={(value) => `Rp ${(value / 1000000).toFixed(0)}M`}
                />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ 
                    background: 'var(--surface)', 
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem'
                  }}
                />
                <Bar 
                  dataKey="amount" 
                  name="Total Tunggakan"
                  fill="var(--primary)"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '1.5rem', 
        marginTop: '1.5rem' 
      }}>
        <div className="card" style={{ 
          background: 'linear-gradient(135deg, var(--warning) 0%, #d97706 100%)',
          color: 'white'
        }}>
          <div className="card-header" style={{ borderBottom: 'none' }}>
            <h2 className="card-title" style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={20} />
              Total Tunggakan Penyegelan
            </h2>
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 700 }}>
              {formatCurrency(stats?.total_tunggakan_penyegelan ?? 0)}
            </div>
            <div style={{ opacity: 0.8, marginTop: '0.5rem' }}>
              dari {formatNumber(stats?.total_penyegelan ?? 0)} pelanggan
            </div>
          </div>
        </div>

        <div className="card" style={{ 
          background: 'linear-gradient(135deg, var(--danger) 0%, #dc2626 100%)',
          color: 'white'
        }}>
          <div className="card-header" style={{ borderBottom: 'none' }}>
            <h2 className="card-title" style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UserX size={20} />
              Total Tunggakan Pencabutan
            </h2>
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 700 }}>
              {formatCurrency(stats?.total_tunggakan_pencabutan ?? 0)}
            </div>
            <div style={{ opacity: 0.8, marginTop: '0.5rem' }}>
              dari {formatNumber(stats?.total_pencabutan ?? 0)} pelanggan
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}