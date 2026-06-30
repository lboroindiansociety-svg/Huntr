import { useState } from 'react'
import { Download, FileText, FileSpreadsheet, Printer } from 'lucide-react'

function ExportData({ internships, user }) {
  const [exporting, setExporting] = useState(false)

  const exportToCSV = () => {
    setExporting(true)
    
    const headers = [
      'Company Name',
      'Role',
      'Location',
      'Status',
      'Applied Date',
      'Deadline',
      'Notes',
      'Created At'
    ]

    const csvContent = [
      headers.join(','),
      ...internships.map(internship => [
        `"${internship.company_name}"`,
        `"${internship.role}"`,
        `"${internship.location}"`,
        `"${internship.status}"`,
        `"${internship.applied_date || ''}"`,
        `"${internship.deadline || ''}"`,
        `"${internship.notes || ''}"`,
        `"${new Date(internship.created_at).toLocaleDateString()}"`
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `internships_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    setExporting(false)
  }

  const exportToPDF = () => {
    setExporting(true)
    
    // Create a simple HTML report
    const reportHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Internship Report - ${user.email}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { text-align: center; margin-bottom: 30px; }
            .stats { display: flex; justify-content: space-around; margin: 20px 0; }
            .stat { text-align: center; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .status-applied { color: #3b82f6; }
            .status-interviewing { color: #f59e0b; }
            .status-offer { color: #10b981; }
            .status-rejected { color: #ef4444; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>HUNTR - Internship Report</h1>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
            <p>User: ${user.email}</p>
          </div>
          
          <div class="stats">
            <div class="stat">
              <h3>${internships.length}</h3>
              <p>Total Applications</p>
            </div>
            <div class="stat">
              <h3>${internships.filter(i => i.status === 'applied').length}</h3>
              <p>Applied</p>
            </div>
            <div class="stat">
              <h3>${internships.filter(i => i.status === 'interviewing').length}</h3>
              <p>Interviewing</p>
            </div>
            <div class="stat">
              <h3>${internships.filter(i => i.status === 'offer').length}</h3>
              <p>Offers</p>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Company</th>
                <th>Role</th>
                <th>Location</th>
                <th>Status</th>
                <th>Applied Date</th>
                <th>Deadline</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              ${internships.map(internship => `
                <tr>
                  <td>${internship.company_name}</td>
                  <td>${internship.role}</td>
                  <td>${internship.location}</td>
                  <td class="status-${internship.status}">${internship.status}</td>
                  <td>${internship.applied_date || 'N/A'}</td>
                  <td>${internship.deadline || 'N/A'}</td>
                  <td>${internship.notes || ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `

    const blob = new Blob([reportHTML], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `internship_report_${new Date().toISOString().split('T')[0]}.html`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    setExporting(false)
  }

  const printReport = () => {
    setExporting(true)
    
    const printWindow = window.open('', '_blank')
    const reportHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Internship Report - ${user.email}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { text-align: center; margin-bottom: 30px; }
            .stats { display: flex; justify-content: space-around; margin: 20px 0; }
            .stat { text-align: center; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .status-applied { color: #3b82f6; }
            .status-interviewing { color: #f59e0b; }
            .status-offer { color: #10b981; }
            .status-rejected { color: #ef4444; }
            @media print {
              body { margin: 20px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>HUNTR - Internship Report</h1>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
            <p>User: ${user.email}</p>
          </div>
          
          <div class="stats">
            <div class="stat">
              <h3>${internships.length}</h3>
              <p>Total Applications</p>
            </div>
            <div class="stat">
              <h3>${internships.filter(i => i.status === 'applied').length}</h3>
              <p>Applied</p>
            </div>
            <div class="stat">
              <h3>${internships.filter(i => i.status === 'interviewing').length}</h3>
              <p>Interviewing</p>
            </div>
            <div class="stat">
              <h3>${internships.filter(i => i.status === 'offer').length}</h3>
              <p>Offers</p>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Company</th>
                <th>Role</th>
                <th>Location</th>
                <th>Status</th>
                <th>Applied Date</th>
                <th>Deadline</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              ${internships.map(internship => `
                <tr>
                  <td>${internship.company_name}</td>
                  <td>${internship.role}</td>
                  <td>${internship.location}</td>
                  <td class="status-${internship.status}">${internship.status}</td>
                  <td>${internship.applied_date || 'N/A'}</td>
                  <td>${internship.deadline || 'N/A'}</td>
                  <td>${internship.notes || ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="no-print" style="margin-top: 30px; text-align: center;">
            <button onclick="window.print()">Print Report</button>
            <button onclick="window.close()">Close</button>
          </div>
        </body>
      </html>
    `
    
    printWindow.document.write(reportHTML)
    printWindow.document.close()
    
    setTimeout(() => {
      printWindow.print()
      setExporting(false)
    }, 500)
  }

  return (
    <div className="card-elevated p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Export Data
        </h3>
        <Download className="h-5 w-5 text-gray-400" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={exportToCSV}
          disabled={exporting || internships.length === 0}
          className="flex items-center space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors disabled:opacity-50"
        >
          <FileSpreadsheet className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          <div className="text-left">
            <p className="font-medium text-gray-900 dark:text-gray-100">Export CSV</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Download as spreadsheet</p>
          </div>
        </button>

        <button
          onClick={exportToPDF}
          disabled={exporting || internships.length === 0}
          className="flex items-center space-x-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors disabled:opacity-50"
        >
          <FileText className="h-6 w-6 text-green-600 dark:text-green-400" />
          <div className="text-left">
            <p className="font-medium text-gray-900 dark:text-gray-100">Export HTML</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Download as report</p>
          </div>
        </button>

        <button
          onClick={printReport}
          disabled={exporting || internships.length === 0}
          className="flex items-center space-x-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors disabled:opacity-50"
        >
          <Printer className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          <div className="text-left">
            <p className="font-medium text-gray-900 dark:text-gray-100">Print Report</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Print formatted report</p>
          </div>
        </button>
      </div>

      {exporting && (
        <div className="mt-4 text-center">
          <div className="loading-spinner rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Preparing export...</p>
        </div>
      )}

      {internships.length === 0 && (
        <div className="mt-4 text-center text-gray-500 dark:text-gray-400">
          <p>No data to export. Add some internships first!</p>
        </div>
      )}
    </div>
  )
}

export default ExportData 