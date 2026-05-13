import { ChangeEvent } from "react";

interface IdiomFieldProps {
  value: string;
  onChange: (value: string) => void;
  required: boolean;
}

function IdiomField({ value, onChange, required }: IdiomFieldProps) {
  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(event.target.value);
  };

  return (
    <textarea
      className="w-full min-w-[120px] p-2 border border-gray-300 rounded resize-y text-sm bg-[var(--background-color)] text-[var(--text-color)]"
      value={value}
      onChange={handleChange}
      required={required}
    />
  );
}

export default IdiomField;
