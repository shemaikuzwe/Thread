import { useDebouncedCallback } from "use-debounce";
import { Search } from "lucide-react";
import type { ComponentProps } from "react";

interface Props extends ComponentProps<"input"> {
  placeholder: string;
  onSearch: (search: string) => void;
}
export default function SearchInput({
  placeholder,
  onSearch,
  ...props
}: Props) {
  const handleSearch = useDebouncedCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      // if (val && val.trim() !== "") {
      onSearch(val);
      // }
    },
    500,
  );
  return (
    <div className="flex gap-2 mx-4 py-1.5 px-2 rounded-md justify-start items-center bg-muted">
      <Search className="h-5 w-5" />
      <input
        {...props}
        type="text"
        placeholder={placeholder}
        className="outline-none border-none bg-inherit"
        onChange={handleSearch}
      />
    </div>
  );
}
