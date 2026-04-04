import { useState } from 'react';
import { FormDesigner } from '../../components/designers/FormDesigner/FormDesigner';

export function FormsPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Form Designer</h2>
      <FormDesigner />
    </div>
  );
}
