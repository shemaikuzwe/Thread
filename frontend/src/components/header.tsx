import { Link } from "react-router-dom";
import Logo from "./logo";
import { Button } from "./ui/button";

export default function Header() {
  return (
    <header className="px-6 py-2">
      <nav className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <Logo />
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a href="#" className="text-gray-600 hover:text-gray-900 font-medium">
            Home
          </a>
          <a href="#" className="text-gray-600 hover:text-gray-900 font-medium">
            Features
          </a>
          <Button asChild variant={"ghost"}>
            <Link
              to="/login"
            >
              Login
            </Link>
          </Button>
          <Button asChild>
            <Link to="/register">Register</Link>
          </Button>
        </div>
      </nav>
    </header>
  );
}
