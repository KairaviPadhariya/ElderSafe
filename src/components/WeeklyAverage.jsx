import React from 'react';
import NavHeader from './NavHeader';


const WeeklyAverage = () => {
  const weekDays = [
    { day: "Monday", score: 88, trend: "up", trendValue: "+3%" },
    { day: "Tuesday", score: 85, trend: "neutral", trendValue: "±0%" },
    { day: "Wednesday", score: 82, trend: "down", trendValue: "-3%" },
    { day: "Thursday", score: 87, trend: "up", trendValue: "+2%" },
    { day: "Friday", score: 83, trend: "down", trendValue: "-2%" },
    { day: "Saturday", score: 86, trend: "up", trendValue: "+1%" },
    { day: "Sunday", score: 84, trend: "neutral", trendValue: "±0%" }
  ];

  const categories = [
    {
      id: 1,
      name: "Vital Signs",
      score: 90,
      status: "Heart rate, blood pressure, and glucose consistently normal",
      color: "#3b82f6",
      borderColor: "#3b82f6"
    },
    {
      id: 2,
      name: "Medication Adherence",
      score: 95,
      status: "28/28 doses taken on time this week",
      color: "#10b981",
      borderColor: "#10b981"
    },
    {
      id: 3,
      name: "Physical Activity",
      score: 75,
      status: "210 minutes vs. recommended 300 minutes",
      color: "#f59e0b",
      borderColor: "#f59e0b"
    },
    {
      id: 4,
      name: "Nutrition",
      score: 80,
      status: "5/7 days with balanced meals, 2 days with excess sodium",
      color: "#ef4444",
      borderColor: "#ef4444"
    }
  ];

  return (
    <div className="weekly-average-container">
      <NavHeader
        title="Weekly Average"
        icon="fas fa-chart-bar"
        backLink="/"
      />

      <div className="content-section">
        <div className="section-header">
          <h2>Overall Health Score</h2>
          <p>Your weekly health performance summary</p>
        </div>

        <div className="score-display">
          <div className="score-circle">
            <div className="score-value">85%</div>
          </div>
          <div className="score-label">Good</div>
          <div className="score-description">
            Your health metrics are within normal range for 85% of the week.
            You're maintaining good habits with room for improvement in activity levels.
          </div>
        </div>

        <div className="week-breakdown">
          {weekDays.map((day, index) => (
            <div className="day-score" key={index}>
              <div className="day-name">{day.day}</div>
              <div className="day-value">{day.score}%</div>
              <span className={`day-trend trend-${day.trend}`}>
                {day.trendValue}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="content-section">
        <div className="section-header">
          <h2>Category Breakdown</h2>
          <p>How each area contributes to your overall score</p>
        </div>

        <div className="category-scores">
          {categories.map(category => (
            <div
              className="category-card"
              key={category.id}
              style={{ borderLeftColor: category.borderColor }}
            >
              <div className="category-header">
                <div className="category-name">{category.name}</div>
                <div className="category-score">{category.score}%</div>
              </div>
              <div className="category-progress">
                <div
                  className="progress-bar"
                  style={{
                    backgroundColor: category.color,
                    width: `${category.score}%`
                  }}
                ></div>
              </div>
              <div className="category-status">
                {category.status}
              </div>
            </div>
          ))}
        </div>

        <div className="comparison-section">
          <h4><i className="fas fa-chart-line"></i> Weekly Comparison</h4>
          <p>Your score improved by 2% compared to last week (83% → 85%). The biggest improvement was in medication adherence, which increased from 90% to 95%. Continue focusing on increasing your daily activity to reach the recommended 300 minutes per week.</p>
        </div>
      </div>
    </div>
  );
};

export default WeeklyAverage;