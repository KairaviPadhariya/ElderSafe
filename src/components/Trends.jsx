import React, { useState } from 'react';
import NavHeader from './NavHeader';
import './Trends.css';

const Trends = () => {
  const [activePeriod, setActivePeriod] = useState('7days');
  
  const metrics = [
    {
      id: 1,
      name: "Blood Pressure",
      value: "120/80",
      change: "neutral",
      changeText: "Stable",
      period: "Weekly average"
    },
    {
      id: 2,
      name: "Blood Glucose",
      value: "95 mg/dL",
      change: "up",
      changeText: "+2%",
      period: "Weekly average"
    },
    {
      id: 3,
      name: "Weight",
      value: "154.2 lbs",
      change: "down",
      changeText: "-0.5%",
      period: "Weekly average"
    },
    {
      id: 4,
      name: "Sleep Duration",
      value: "7.2 hrs",
      change: "up",
      changeText: "+5%",
      period: "Nightly average"
    }
  ];

  const chartData = [
    { day: "Mon", value: 72, height: "70%" },
    { day: "Tue", value: 74, height: "80%" },
    { day: "Wed", value: 71, height: "65%" },
    { day: "Thu", value: 75, height: "90%" },
    { day: "Fri", value: 73, height: "85%" },
    { day: "Sat", value: 72, height: "70%" },
    { day: "Sun", value: 70, height: "68%" }
  ];

  const monthlyData = [
    { category: "Medication", percentage: 95, color: "#10b981" },
    { category: "Exercise", percentage: 85, color: "#3b82f6" },
    { category: "Vitals Check", percentage: 90, color: "#8b5cf6" },
    { category: "Sleep", percentage: 80, color: "#f59e0b" }
  ];

  return (
    <div className="trends-container">
      <NavHeader 
        title="Health Trends" 
        icon="fas fa-chart-line" 
        backLink="/"
      />
      
      <div className="content-section">
        <div className="section-header">
          <h2>Heart Rate Trends</h2>
          <p>Monitor your heart rate patterns over time</p>
        </div>
        
        <div className="period-selector">
          <button 
            className={`period-btn ${activePeriod === '7days' ? 'active' : ''}`}
            onClick={() => setActivePeriod('7days')}
          >
            7 Days
          </button>
          <button 
            className={`period-btn ${activePeriod === '30days' ? 'active' : ''}`}
            onClick={() => setActivePeriod('30days')}
          >
            30 Days
          </button>
          <button 
            className={`period-btn ${activePeriod === '3months' ? 'active' : ''}`}
            onClick={() => setActivePeriod('3months')}
          >
            3 Months
          </button>
          <button 
            className={`period-btn ${activePeriod === '6months' ? 'active' : ''}`}
            onClick={() => setActivePeriod('6months')}
          >
            6 Months
          </button>
          <button 
            className={`period-btn ${activePeriod === '1year' ? 'active' : ''}`}
            onClick={() => setActivePeriod('1year')}
          >
            1 Year
          </button>
        </div>
        
        <div className="chart-container">
          <div className="chart-title">Heart Rate (bpm) - Last 7 Days</div>
          {chartData.map((item, index) => (
            <div 
              key={index} 
              className="chart-bar" 
              style={{ height: item.height }}
            >
              <div className="chart-bar-value">{item.value}</div>
              <div className="chart-bar-label">{item.day}</div>
            </div>
          ))}
        </div>
        
        <div className="trend-summary">
          <h4><i className="fas fa-chart-line"></i> Trend Analysis</h4>
          <p>Your heart rate has remained stable within the normal range (60-100 bpm) over the past week. The average of 72 bpm shows a healthy cardiovascular state with minimal fluctuations.</p>
        </div>
      </div>
      
      <div className="content-section">
        <div className="section-header">
          <h2>All Health Metrics</h2>
          <p>Weekly changes in your key health indicators</p>
        </div>
        
        <div className="metrics-grid">
          {metrics.map(metric => (
            <div className="metric-trend-card" key={metric.id}>
              <div className="metric-header">
                <div className="metric-name">{metric.name}</div>
                <div className={`metric-change change-${metric.change}`}>
                  <i className={`fas fa-arrow-${metric.change === 'neutral' ? 'minus' : metric.change}`}></i> {metric.changeText}
                </div>
              </div>
              <div className="metric-value">{metric.value}</div>
              <div className="metric-period">{metric.period}</div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="content-section">
        <div className="section-header">
          <h2>Monthly Overview</h2>
          <p>Health metric consistency over the past month</p>
        </div>
        
        <div className="chart-container" style={{ height: '200px', marginBottom: '0' }}>
          <div className="chart-title">Monthly Consistency - October</div>
          {monthlyData.map((item, index) => (
            <div 
              key={index}
              className="chart-bar" 
              style={{ 
                height: `${item.percentage}%`,
                background: `linear-gradient(to top, ${item.color}, ${item.color}99)`
              }}
            >
              <div className="chart-bar-label">{item.category}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Trends;