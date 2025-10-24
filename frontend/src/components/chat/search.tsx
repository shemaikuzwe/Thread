import { Input } from "../ui/input";
import { useDebouncedCallback } from "use-debounce";
interface Props {
  onSearch: (query: string) => void;
}
export default function Search({ onSearch }: Props) {
  const handleSearch = useDebouncedCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onSearch(e.target.value);
    },
    500,
  );
  return (
    <div className="flex w-full px-4 ">
      <Input placeholder="Search" onChange={handleSearch} />
    </div>
  );
}
