// Accessibility helpers for analytics components

export const getAriaLabel = (chartType, dataLength) => {
  const labels = {
    revenue: `Revenue chart showing ${dataLength} data points`,
    conversion: `Lead conversion funnel with ${dataLength} stages`,
    propertyTypes: `Property types distribution pie chart with ${dataLength} categories`,
    leadSources: `Lead sources bar chart with ${dataLength} sources`,
    marketTrends: `Market trends line chart with ${dataLength} data points`,
    kpi: 'Key performance indicator gauge',
    topPerformers: `Top performers chart showing ${dataLength} entries`,
    emailCampaign: `Email campaign performance chart with ${dataLength} campaigns`,
    financial: `Financial overview chart with ${dataLength} data points`,
    websiteTraffic: `Website traffic chart with ${dataLength} data points`
  };
  
  return labels[chartType] || `Chart with ${dataLength} data points`;
};

export const getChartDescription = (chartType, data) => {
  const descriptions = {
    revenue: `This chart displays revenue trends over time. Current total: $${data?.reduce((sum, item) => sum + (item.revenue || 0), 0).toLocaleString() || 0}`,
    conversion: `This funnel chart shows lead conversion rates through different stages of the sales process.`,
    propertyTypes: `This pie chart shows the distribution of different property types in your portfolio.`,
    leadSources: `This bar chart displays the performance of different lead sources.`,
    marketTrends: `This line chart shows market trends and patterns over time.`,
    kpi: `This gauge displays current performance against target goals.`,
    topPerformers: `This chart highlights the top performing agents or properties.`,
    emailCampaign: `This chart shows the performance metrics of email marketing campaigns.`,
    financial: `This chart provides an overview of financial metrics and performance.`,
    websiteTraffic: `This chart displays website traffic patterns and visitor statistics.`
  };
  
  return descriptions[chartType] || 'This chart displays data visualization for analytics purposes.';
};

export const getKeyboardNavigationInstructions = () => {
  return {
    chart: 'Use arrow keys to navigate between data points. Press Enter to select a data point for more details.',
    dashboard: 'Use Tab to navigate between widgets. Press Enter to interact with a widget.',
    kpi: 'Use Tab to navigate between KPI cards. Press Enter to edit KPI values.',
    report: 'Use Tab to navigate between report options. Press Enter to select or generate reports.'
  };
};

export const getScreenReaderText = (value, format = 'number') => {
  switch (format) {
    case 'currency':
      return `$${value.toLocaleString()}`;
    case 'percentage':
      return `${value}%`;
    case 'number':
      return value.toLocaleString();
    case 'date':
      return new Date(value).toLocaleDateString();
    default:
      return String(value);
  }
};

export const getFocusableElements = (container) => {
  const focusableSelectors = [
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])'
  ].join(', ');
  
  return container.querySelectorAll(focusableSelectors);
};

export const trapFocus = (container) => {
  const focusableElements = getFocusableElements(container);
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleTabKey = (e) => {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    }
  };

  container.addEventListener('keydown', handleTabKey);
  
  return () => {
    container.removeEventListener('keydown', handleTabKey);
  };
};

export const announceToScreenReader = (message, priority = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};
