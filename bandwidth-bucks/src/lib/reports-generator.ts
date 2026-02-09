/**
 * Generate earning reports for users
 * Works on both client and server
 */

export interface EarningReportData {
  firstName: string;
  lastName: string;
  email: string;
  totalEarnings: number;
  monthlyData: {
    month: string;
    earnings: number;
    bandwidthGB: number;
  }[];
  payoutHistory: {
    date: string;
    amount: number;
    method: string;
    status: string;
  }[];
}

export function generateEarningReportHTML(data: EarningReportData): string {
  const currentDate = new Date().toLocaleDateString();
  const totalPayouts = data.payoutHistory
    .filter(p => p.status === 'approved')
    .reduce((sum, p) => sum + p.amount, 0);
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; color: #9400D3; margin-bottom: 30px; }
        .section { margin: 20px 0; }
        .section h2 { color: #9400D3; border-bottom: 2px solid #9400D3; padding-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f0e6ff; color: #9400D3; font-weight: bold; }
        .stat { display: inline-block; margin: 10px 20px; }
        .stat-value { font-size: 24px; font-weight: bold; color: #9400D3; }
        .stat-label { font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>BandwidthBucks - Earning Report</h1>
        <p>Generated on ${currentDate}</p>
      </div>
      
      <div class="section">
        <h2>User Information</h2>
        <p><strong>Name:</strong> ${data.firstName} ${data.lastName}</p>
        <p><strong>Email:</strong> ${data.email}</p>
      </div>
      
      <div class="section">
        <h2>Earnings Summary</h2>
        <div class="stat">
          <div class="stat-value">₹${data.totalEarnings.toFixed(2)}</div>
          <div class="stat-label">Total Earnings</div>
        </div>
        <div class="stat">
          <div class="stat-value">₹${totalPayouts.toFixed(2)}</div>
          <div class="stat-label">Total Received</div>
        </div>
        <div class="stat">
          <div class="stat-value">₹${(data.totalEarnings - totalPayouts).toFixed(2)}</div>
          <div class="stat-label">Pending Balance</div>
        </div>
      </div>
      
      <div class="section">
        <h2>Monthly Breakdown</h2>
        <table>
          <thead>
            <tr>
              <th>Month</th>
              <th>Earnings (₹)</th>
              <th>Bandwidth (GB)</th>
            </tr>
          </thead>
          <tbody>
            ${data.monthlyData.map(m => `
              <tr>
                <td>${m.month}</td>
                <td>₹${m.earnings.toFixed(2)}</td>
                <td>${m.bandwidthGB.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      
      <div class="section">
        <h2>Payout History</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${data.payoutHistory.map(p => `
              <tr>
                <td>${p.date}</td>
                <td>₹${p.amount.toFixed(2)}</td>
                <td>${p.method}</td>
                <td><strong style="color: ${p.status === 'approved' ? 'green' : 'orange'}">${p.status}</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </body>
    </html>
  `;
}

export function downloadReport(html: string, filename: string = 'earning-report.html') {
  // This would be called client-side to download
  const blob = new Blob([html], { type: 'text/html' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
