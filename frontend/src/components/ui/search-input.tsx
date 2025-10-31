import { useDebouncedCallback } from "use-debounce";
import { Input } from "./input";

interface Props {
  placeholder: string;
  onSearch: (search: string) => void;
}
export default function SearchInput({ placeholder, onSearch }: Props) {
  const handleSearch = useDebouncedCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      if (val && val.trim() !== "") {
        onSearch(val);
      }
    },
    500,
  );
  return (
    <div>
      <Input placeholder={placeholder} onChange={handleSearch} />
    </div>
  );
}
