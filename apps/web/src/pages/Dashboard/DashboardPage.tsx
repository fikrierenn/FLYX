import { LayoutDashboard, Database, FileText, GitBranch } from 'lucide-react';

const stats = [
  { label: 'Entities', value: 0, icon: Database },
  { label: 'Forms', value: 0, icon: FileText },
  { label: 'Reports', value: 0, icon: LayoutDashboard },
  { label: 'Workflows', value: 0, icon: GitBranch },
];

export function DashboardPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg shadow p-6 flex items-center gap-4">
            <div className="p-3 bg-primary-50 rounded-lg">
              <stat.icon className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
