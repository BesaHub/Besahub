import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RevenueChart, ConversionFunnelChart, PropertyTypesChart } from '../ChartComponents';

// Mock data for testing
const mockRevenueData = [
  { month: 'Jan', revenue: 100000 },
  { month: 'Feb', revenue: 120000 },
  { month: 'Mar', revenue: 110000 }
];

const mockConversionData = [
  { stage: 'Leads', count: 1000 },
  { stage: 'Qualified', count: 500 },
  { stage: 'Proposals', count: 200 },
  { stage: 'Closed', count: 50 }
];

const mockPropertyData = [
  { name: 'Office', count: 45, percentage: 45 },
  { name: 'Retail', count: 30, percentage: 30 },
  { name: 'Industrial', count: 25, percentage: 25 }
];

describe('ChartComponents', () => {
  describe('RevenueChart', () => {
    it('renders without crashing', () => {
      render(<RevenueChart data={mockRevenueData} />);
      expect(screen.getByText('Revenue Trend')).toBeInTheDocument();
    });

    it('displays correct title', () => {
      render(<RevenueChart data={mockRevenueData} />);
      expect(screen.getByText('Revenue Trend')).toBeInTheDocument();
    });

    it('handles empty data gracefully', () => {
      render(<RevenueChart data={[]} />);
      expect(screen.getByText('Revenue Trend')).toBeInTheDocument();
    });

    it('handles null data gracefully', () => {
      render(<RevenueChart data={null} />);
      expect(screen.getByText('Revenue Trend')).toBeInTheDocument();
    });

    it('applies custom height', () => {
      const { container } = render(<RevenueChart data={mockRevenueData} height={400} />);
      const paper = container.querySelector('.MuiPaper-root');
      expect(paper).toHaveStyle('height: 460px'); // height + 60
    });
  });

  describe('ConversionFunnelChart', () => {
    it('renders without crashing', () => {
      render(<ConversionFunnelChart data={mockConversionData} />);
      expect(screen.getByText('Lead Conversion Funnel')).toBeInTheDocument();
    });

    it('displays correct title', () => {
      render(<ConversionFunnelChart data={mockConversionData} />);
      expect(screen.getByText('Lead Conversion Funnel')).toBeInTheDocument();
    });

    it('handles empty data gracefully', () => {
      render(<ConversionFunnelChart data={[]} />);
      expect(screen.getByText('Lead Conversion Funnel')).toBeInTheDocument();
    });
  });

  describe('PropertyTypesChart', () => {
    it('renders without crashing', () => {
      render(<PropertyTypesChart data={mockPropertyData} />);
      expect(screen.getByText('Property Types Distribution')).toBeInTheDocument();
    });

    it('displays correct title', () => {
      render(<PropertyTypesChart data={mockPropertyData} />);
      expect(screen.getByText('Property Types Distribution')).toBeInTheDocument();
    });

    it('handles empty data gracefully', () => {
      render(<PropertyTypesChart data={[]} />);
      expect(screen.getByText('Property Types Distribution')).toBeInTheDocument();
    });
  });
});
