import React, { memo, useMemo } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart, RadialBarChart, RadialBar
} from 'recharts';
import { Box, Typography, Paper } from '@mui/material';
import { getAriaLabel, getChartDescription, getScreenReaderText } from './AccessibilityHelpers';

// Color palette for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

// Revenue Chart Component
export const RevenueChart = memo(({ data, height = 300 }) => {
  
  return (
    <Paper 
      elevation={2} 
      sx={{ p: 2, height: height + 60 }}
      role="img"
      aria-label={getAriaLabel('revenue', data?.length || 0)}
      aria-describedby="revenue-chart-description"
    >
      <Typography variant="h6" gutterBottom>
        Revenue Trend
      </Typography>
      <div id="revenue-chart-description" className="sr-only">
        {getChartDescription('revenue', data)}
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="month" />
          <YAxis />
          <CartesianGrid strokeDasharray="3 3" />
          <Tooltip 
            formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']}
            labelFormatter={(label) => `Month: ${label}`}
          />
          <Area 
            type="monotone" 
            dataKey="revenue" 
            stroke="#8884d8" 
            fillOpacity={1} 
            fill="url(#colorRevenue)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </Paper>
  );
});

// Lead Conversion Funnel Chart
export const ConversionFunnelChart = memo(({ data, height = 300 }) => {
  return (
    <Paper elevation={2} sx={{ p: 2, height: height + 60 }}>
      <Typography variant="h6" gutterBottom>
        Lead Conversion Funnel
      </Typography>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} layout="horizontal">
          <XAxis type="number" />
          <YAxis dataKey="stage" type="category" width={100} />
          <CartesianGrid strokeDasharray="3 3" />
          <Tooltip formatter={(value) => [value, 'Leads']} />
          <Bar dataKey="count" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  );
});

// Property Types Pie Chart
export const PropertyTypesChart = memo(({ data, height = 300 }) => {
  return (
    <Paper elevation={2} sx={{ p: 2, height: height + 60 }}>
      <Typography variant="h6" gutterBottom>
        Property Types Distribution
      </Typography>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percentage }) => `${name} ${percentage}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="count"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </Paper>
  );
});

// Lead Sources Chart
export const LeadSourcesChart = memo(({ data, height = 300 }) => {
  return (
    <Paper elevation={2} sx={{ p: 2, height: height + 60 }}>
      <Typography variant="h6" gutterBottom>
        Lead Sources
      </Typography>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="source" />
          <YAxis />
          <Tooltip formatter={(value) => [value, 'Leads']} />
          <Bar dataKey="count" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  );
});

// Market Trends Chart
export const MarketTrendsChart = memo(({ data, height = 300 }) => {
  return (
    <Paper elevation={2} sx={{ p: 2, height: height + 60 }}>
      <Typography variant="h6" gutterBottom>
        Market Trends
      </Typography>
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip />
          <Legend />
          <Bar yAxisId="left" dataKey="volume" fill="#8884d8" name="Volume" />
          <Line yAxisId="right" type="monotone" dataKey="avgPrice" stroke="#ff7300" name="Avg Price" />
        </ComposedChart>
      </ResponsiveContainer>
    </Paper>
  );
});

// KPI Gauge Chart
export const KPIGaugeChart = memo(({ value, target, label, height = 200 }) => {
  const percentage = Math.min((value / target) * 100, 100);
  const data = [{ name: 'KPI', value: percentage, fill: percentage >= 80 ? '#00C49F' : percentage >= 60 ? '#FFBB28' : '#FF8042' }];
  
  return (
    <Paper elevation={2} sx={{ p: 2, height: height + 60 }}>
      <Typography variant="h6" gutterBottom align="center">
        {label}
      </Typography>
      <ResponsiveContainer width="100%" height={height}>
        <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={data} startAngle={180} endAngle={0}>
          <RadialBar dataKey="value" cornerRadius={10} fill="#8884d8" />
          <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="progress-label">
            {value.toLocaleString()}
          </text>
          <text x="50%" y="60%" textAnchor="middle" dominantBaseline="middle" className="progress-target">
            Target: {target.toLocaleString()}
          </text>
        </RadialBarChart>
      </ResponsiveContainer>
    </Paper>
  );
});

// Top Performers Chart
export const TopPerformersChart = memo(({ data, height = 300 }) => {
  return (
    <Paper elevation={2} sx={{ p: 2, height: height + 60 }}>
      <Typography variant="h6" gutterBottom>
        Top Performers
      </Typography>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} layout="horizontal">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis dataKey="name" type="category" width={100} />
          <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']} />
          <Bar dataKey="revenue" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  );
});

// Email Campaign Performance Chart
export const EmailCampaignChart = memo(({ data, height = 300 }) => {
  return (
    <Paper elevation={2} sx={{ p: 2, height: height + 60 }}>
      <Typography variant="h6" gutterBottom>
        Email Campaign Performance
      </Typography>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="sent" stackId="a" fill="#8884d8" name="Sent" />
          <Bar dataKey="opened" stackId="a" fill="#82ca9d" name="Opened" />
          <Bar dataKey="clicked" stackId="a" fill="#ffc658" name="Clicked" />
          <Bar dataKey="converted" stackId="a" fill="#ff7300" name="Converted" />
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  );
});

// Financial Overview Chart
export const FinancialOverviewChart = memo(({ data, height = 300 }) => {
  return (
    <Paper elevation={2} sx={{ p: 2, height: height + 60 }}>
      <Typography variant="h6" gutterBottom>
        Financial Overview
      </Typography>
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Amount']} />
          <Legend />
          <Bar yAxisId="left" dataKey="revenue" fill="#8884d8" name="Revenue" />
          <Bar yAxisId="left" dataKey="expenses" fill="#ff7300" name="Expenses" />
          <Line yAxisId="right" type="monotone" dataKey="profit" stroke="#00C49F" name="Profit" />
        </ComposedChart>
      </ResponsiveContainer>
    </Paper>
  );
});

// Website Traffic Chart
export const WebsiteTrafficChart = memo(({ data, height = 300 }) => {
  return (
    <Paper elevation={2} sx={{ p: 2, height: height + 60 }}>
      <Typography variant="h6" gutterBottom>
        Website Traffic
      </Typography>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="visitors" stroke="#8884d8" name="Visitors" />
          <Line type="monotone" dataKey="pageViews" stroke="#82ca9d" name="Page Views" />
        </LineChart>
      </ResponsiveContainer>
    </Paper>
  );
});

// Custom Chart Wrapper
export const CustomChart = memo(({ type, data, title, height = 300, ...props }) => {
  const chartComponents = {
    revenue: RevenueChart,
    conversion: ConversionFunnelChart,
    propertyTypes: PropertyTypesChart,
    leadSources: LeadSourcesChart,
    marketTrends: MarketTrendsChart,
    kpi: KPIGaugeChart,
    topPerformers: TopPerformersChart,
    emailCampaign: EmailCampaignChart,
    financial: FinancialOverviewChart,
    websiteTraffic: WebsiteTrafficChart
  };

  const ChartComponent = chartComponents[type];
  
  if (!ChartComponent) {
    return (
      <Paper elevation={2} sx={{ p: 2, height: height + 60 }}>
        <Typography variant="h6" gutterBottom>
          {title || 'Chart'}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height }}>
          <Typography color="text.secondary">
            Chart type "{type}" not supported
          </Typography>
        </Box>
      </Paper>
    );
  }

  return <ChartComponent data={data} title={title} height={height} {...props} />;
});
