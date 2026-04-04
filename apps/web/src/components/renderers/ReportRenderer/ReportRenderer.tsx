import type { ReportDeclaration } from '@flyx/fsl-compiler';

interface ReportRendererProps {
  report: ReportDeclaration;
  data?: Record<string, unknown>[];
}

export function ReportRenderer({ report, data = [] }: ReportRendererProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">{report.title}</h3>

      {/* Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              {report.columns.map((col) => (
                <th key={col.name} className="px-4 py-2 text-left text-sm font-medium text-gray-600 border-b">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={report.columns.length} className="px-4 py-8 text-center text-gray-400">
                  No data available
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  {report.columns.map((col) => (
                    <td key={col.name} className="px-4 py-2 text-sm text-gray-700 border-b">
                      {String(row[col.name] ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
