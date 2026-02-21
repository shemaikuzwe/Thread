import Link from "next/link";
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
          <Link href="/" className="font-medium">
            Home
          </Link>
          <Link href="#features" className="font-medium">
            Features
          </Link>
          <Link href="#pricing" className="font-medium">
            Pricing
          </Link>
          <Button asChild variant={"ghost"}>
            <Link href="/auth/login">Login</Link>
          </Button>
          <Button asChild>
            <Link href="/auth/register">Sign Up</Link>
          </Button>
        </div>
      </nav>
    </header>
  );
}
