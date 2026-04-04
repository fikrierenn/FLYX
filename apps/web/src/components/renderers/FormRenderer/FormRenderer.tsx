import type { FormDeclaration } from '@flyx/fsl-compiler';

interface FormRendererProps {
  form: FormDeclaration;
  onSubmit?: (data: Record<string, unknown>) => void;
}

export function FormRenderer({ form, onSubmit }: FormRendererProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());
    onSubmit?.(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {form.sections.map((section) => (
        <fieldset key={section.name} className="border rounded-lg p-4">
          <legend className="text-sm font-semibold text-gray-700 px-2">{section.label}</legend>
          <div className={`grid gap-4 ${form.layout === 'two_column' ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {section.fields.map((fieldName) => (
              <div key={fieldName}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{fieldName}</label>
                <input
                  name={fieldName}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-primary-500 outline-none"
                />
              </div>
            ))}
          </div>
        </fieldset>
      ))}
      {form.actions && (
        <div className="flex gap-3 justify-end">
          {form.actions.map((action) => (
            <button
              key={action.name}
              type={action.name === 'save' ? 'submit' : 'button'}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                action.style === 'primary'
                  ? 'bg-primary-600 text-white hover:bg-primary-700'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </form>
  );
}
