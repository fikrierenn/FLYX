import { useState } from 'react';
import { FSLEditor } from '../../components/editors/FSLEditor/FSLEditor';

const SAMPLE_FSL = `entity Customer {
  fields {
    code: String(50) { required, unique }
    name: String(200) { required }
    email: Email { unique }
    phone: Phone
    credit_limit: Decimal(12,2) { default: 0 }
    status: Enum {
      values: ["active", "inactive", "blocked"],
      default: "active"
    }
  }

  permissions {
    create: ["admin", "sales_manager"]
    read: ["admin", "sales_manager", "sales_rep"]
    update: ["admin", "sales_manager"]
    delete: ["admin"]
  }
}`;

export function EntitiesPage() {
  const [fslCode, setFslCode] = useState(SAMPLE_FSL);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Entity Designer</h1>
      <div className="bg-white rounded-lg shadow">
        <FSLEditor value={fslCode} onChange={setFslCode} />
      </div>
    </div>
  );
}
