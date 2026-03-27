interface CategoryOption {
  id: string;
  name: string;
}

interface CategoryPickerProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  categories: CategoryOption[];
  placeholder?: string;
}

export function CategoryPicker({ id, label, value, onChange, categories, placeholder = "Select category" }: CategoryPickerProps) {
  return (
    <label htmlFor={id} className="text-sm text-indigo-100/85">
      {label}
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-xl border border-white/15 bg-[#0f1230] px-3 py-2 text-sm text-indigo-100"
      >
        <option value="">{placeholder}</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
    </label>
  );
}
