import React from 'react';
import { Link } from 'react-router-dom';
import NavHeader from './NavHeader';


const HealthOverview = () => {
  return (
    <div className="health-overview-container">
      <NavHeader
        title="Health Overview"
        icon="fas fa-heartbeat"
        backLink="/"
      />

      <div className="content-section">
        <div className="section-header">
          <h2>Current Vital Statistics</h2>
          <p>Real-time monitoring of your key health metrics</p>
        </div>

        <div className="metrics-grid">
          {/* Heart Rate Card */}
          <div className="metric-card">
            <div className="metric-header">
              <div className="metric-title">Heart Rate</div>
              <div className="metric-trend trend-down">
                <i className="fas fa-arrow-down"></i> 3% from last week
              </div>
            </div>
            <div className="metric-value">72 bpm</div>
            <div className="metric-label">Resting heart rate • Last updated: Today 2:30 PM</div>
            <div className="metric-trend trend-neutral">
              <i className="fas fa-info-circle"></i> Within normal range (60-100 bpm)
            </div>
          </div>

          {/* Blood Pressure Card */}
          <div className="metric-card highlight">
            <div className="metric-header">
              <div className="metric-title">Blood Pressure</div>
              <div className="metric-trend trend-neutral">
                <i className="fas fa-minus"></i> Stable
              </div>
            </div>
            <div className="metric-value">120/80 mmHg</div>
            <div className="metric-label">Systolic/Diastolic • Last updated: Today 8:00 AM</div>
            <div className="metric-trend trend-neutral">
              <i className="fas fa-info-circle"></i> Optimal blood pressure
            </div>
          </div>

          {/* Blood Glucose Card */}
          <div className="metric-card">
            <div className="metric-header">
              <div className="metric-title">Blood Glucose</div>
              <div className="metric-trend trend-up">
                <i className="fas fa-arrow-up"></i> 2% from yesterday
              </div>
            </div>
            <div className="metric-value">95 mg/dL</div>
            <div className="metric-label">Fasting glucose • Last updated: Yesterday 7:00 AM</div>
            <div className="metric-trend trend-neutral">
              <i className="fas fa-info-circle"></i> Normal range (70-100 mg/dL)
            </div>
          </div>
        </div>

        <div className="section-header">
          <h2>Recent History</h2>
          <p>Track your health metrics over the past week</p>
        </div>

        <table className="history-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Heart Rate</th>
              <th>Blood Pressure</th>
              <th>Blood Glucose</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Today</td>
              <td>72 bpm</td>
              <td>120/80 mmHg</td>
              <td>-</td>
              <td>Morning checkup</td>
            </tr>
            <tr>
              <td>Yesterday</td>
              <td>74 bpm</td>
              <td>118/78 mmHg</td>
              <td>95 mg/dL</td>
              <td>Fasting test</td>
            </tr>
            <tr>
              <td>2 days ago</td>
              <td>71 bpm</td>
              <td>122/82 mmHg</td>
              <td>92 mg/dL</td>
              <td>After evening walk</td>
            </tr>
            <tr>
              <td>3 days ago</td>
              <td>75 bpm</td>
              <td>119/79 mmHg</td>
              <td>98 mg/dL</td>
              <td>Before breakfast</td>
            </tr>
            <tr>
              <td>4 days ago</td>
              <td>73 bpm</td>
              <td>121/80 mmHg</td>
              <td>94 mg/dL</td>
              <td>Regular check</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HealthOverview;