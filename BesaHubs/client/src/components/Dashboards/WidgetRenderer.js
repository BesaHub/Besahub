import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Typography,
  Box,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  TrendingUp,
  TrendingDown
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  FunnelChart,
  Funnel
} from 'recharts';
import { DataGrid } from '@mui/x-data-grid';
import { executeQuery, refreshWidget } from '../../services/dashboardApi';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const WidgetRenderer = ({ widget, onRefresh }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    loadData();
  }, [widget]);

  useEffect(() => {
    if (widget.refreshInterval && widget.refreshInterval > 0) {
      const interval = setInterval(() => {
        loadData(true);
      }, widget.refreshInterval * 1000);

      return () => clearInterval(interval);
    }
  }, [widget.refreshInterval]);

  const loadData = async (isRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      const response = isRefresh
        ? await refreshWidget(widget.id)
        : await executeQuery({
            dataset: widget.dataset,
            query: widget.query
          });

      if (response.success) {
        setData(response.data);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('Error loading widget data:', err);
      setError(err.response?.data?.message || 'Failed to load widget data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadData(true);
    if (onRefresh) onRefresh();
  };

  const renderKPI = () => {
    if (!data || !data.summary || !data.summary.metrics) {
      return <Typography>No data available</Typography>;
    }

    const metrics = data.summary.metrics;
    const metricKeys = Object.keys(metrics);
    const primaryMetric = metricKeys[0];
    const value = metrics[primaryMetric];

    return (
      <Box 
        display="flex" 
        flexDirection="column" 
        alignItems="center" 
        justifyContent="center"
        height="100%"
        p={2}
      >
        <Typography variant="h2" fontWeight="bold" color="primary">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </Typography>
        <Typography variant="body2" color="text.secondary" textTransform="capitalize">
          {primaryMetric.replace(/_/g, ' ')}
        </Typography>
      </Box>
    );
  };

  const renderBarChart = () => {
    if (!data || !data.chartData || data.chartData.length === 0) {
      return <Typography>No data available</Typography>;
    }

    const chartData = data.chartData;
    const fields = data.fields || [];
    const xAxisKey = fields[0]?.name || 'name';
    const dataKeys = fields.slice(1).map(f => f.name);

    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xAxisKey} />
          <YAxis />
          <Tooltip />
          <Legend />
          {dataKeys.map((key, index) => (
            <Bar 
              key={key} 
              dataKey={key} 
              fill={COLORS[index % COLORS.length]} 
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const renderLineChart = () => {
    if (!data || !data.chartData || data.chartData.length === 0) {
      return <Typography>No data available</Typography>;
    }

    const chartData = data.chartData;
    const fields = data.fields || [];
    const xAxisKey = fields[0]?.name || 'name';
    const dataKeys = fields.slice(1).map(f => f.name);

    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xAxisKey} />
          <YAxis />
          <Tooltip />
          <Legend />
          {dataKeys.map((key, index) => (
            <Line 
              key={key}
              type="monotone"
              dataKey={key}
              stroke={COLORS[index % COLORS.length]}
              strokeWidth={2}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  };

  const renderPieChart = () => {
    if (!data || !data.chartData || data.chartData.length === 0) {
      return <Typography>No data available</Typography>;
    }

    const chartData = data.chartData;
    const fields = data.fields || [];
    const nameKey = fields[0]?.name || 'name';
    const valueKey = fields[1]?.name || 'value';

    const pieData = chartData.map(item => ({
      name: item[nameKey],
      value: Number(item[valueKey]) || 0
    }));

    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  const renderTable = () => {
    if (!data || !data.rows || data.rows.length === 0) {
      return <Typography>No data available</Typography>;
    }

    const columns = data.fields.map(field => ({
      field: field.name,
      headerName: field.name.replace(/_/g, ' ').toUpperCase(),
      flex: 1,
      minWidth: 100
    }));

    const rows = data.rows.map((row, index) => ({
      id: index,
      ...row
    }));

    return (
      <Box height={400}>
        <DataGrid
          rows={rows}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          disableSelectionOnClick
          density="compact"
        />
      </Box>
    );
  };

  const renderFunnel = () => {
    if (!data || !data.chartData || data.chartData.length === 0) {
      return <Typography>No data available</Typography>;
    }

    const chartData = data.chartData;
    const fields = data.fields || [];
    const nameKey = fields[0]?.name || 'name';
    const valueKey = fields[1]?.name || 'value';

    const funnelData = chartData.map(item => ({
      name: item[nameKey],
      value: Number(item[valueKey]) || 0
    }));

    return (
      <ResponsiveContainer width="100%" height={300}>
        <FunnelChart>
          <Tooltip />
          <Funnel
            dataKey="value"
            data={funnelData}
            isAnimationActive
          >
            {funnelData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Funnel>
        </FunnelChart>
      </ResponsiveContainer>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" height={200}>
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity="error">
          {error}
        </Alert>
      );
    }

    switch (widget.type) {
      case 'kpi':
        return renderKPI();
      case 'bar':
        return renderBarChart();
      case 'line':
        return renderLineChart();
      case 'pie':
        return renderPieChart();
      case 'table':
        return renderTable();
      case 'funnel':
        return renderFunnel();
      default:
        return <Typography>Unknown widget type: {widget.type}</Typography>;
    }
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        title={widget.title}
        action={
          <Box display="flex" alignItems="center" gap={1}>
            {lastUpdated && (
              <Typography variant="caption" color="text.secondary">
                {lastUpdated.toLocaleTimeString()}
              </Typography>
            )}
            <IconButton onClick={handleRefresh} size="small">
              <RefreshIcon />
            </IconButton>
          </Box>
        }
        titleTypographyProps={{ variant: 'h6' }}
      />
      <CardContent sx={{ flex: 1, overflow: 'auto' }}>
        {renderContent()}
      </CardContent>
    </Card>
  );
};

export default WidgetRenderer;
