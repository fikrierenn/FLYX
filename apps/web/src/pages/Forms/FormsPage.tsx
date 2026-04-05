import { useState } from 'react';
import { FormDesigner } from '../../components/designers/FormDesigner/FormDesigner';

export function FormsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Form Designer</h1>
      <FormDesigner />
    </div>
  );
}
