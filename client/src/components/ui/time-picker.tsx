import { Input } from "./input";

interface TimePickerInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function TimePickerInput({ value, onChange }: TimePickerInputProps) {
  return (
    <Input
      type="time"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-[120px]"
    />
  );
}
