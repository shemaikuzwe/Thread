import { Button } from "@/components/ui/button";
import { Link } from "react-router";
import { Apple } from "@/components/ui/svgs/apple";
export default function HomePage() {
  return (
    <div>
      <main className="px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between lg:px-40 md:px-10 sm:px-5">
            <div className="space-y-8">
              <div className="space-y-6">
                <h1 className="text-6xl lg:text-7xl font-bold text-gray-900 leading-tight">
                  Instant
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed max-w-md">
                  A simple and secure instant messaging app
                </p>
              </div>
              <Button size="default" className="text-lg rounded-xl" asChild>
                <Link to="/auth/register">Get Started</Link>
              </Button>
            </div>
            <img src={"/phone.png"} width={330} height={220} />
          </div>

          {/* Trust Section */}
          <div className="text-center mt-4 mb-5">
            <p className="text-2xl text-gray-700 font-medium mb-5">
              Trusted by 10,000+ users
            </p>

            {/* Platform Icons */}
            <div className="flex justify-center items-center gap-12 opacity-60">
              {/* Apple */}
              <Apple width={50} height={50} />

              {/* Android */}
              <svg
                className="w-16 h-16"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993.0001.5511-.4482.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5902 8.2439 13.8533 7.8508 12 7.8508s-3.5902.3931-5.1367 1.0989L4.841 5.4467a.4161.4161 0 00-.5677-.1521.4157.4157 0 00-.1521.5676l1.9973 3.4592C2.6889 11.1867.3432 14.6589 0 18.761h24c-.3435-4.1021-2.6892-7.5743-6.1185-9.4396" />
              </svg>

              {/* Windows */}
              <svg
                className="w-12 h-12"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-13.051-1.351" />
              </svg>

              {/* Web/Globe */}
              <svg
                className="w-12 h-12"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
              </svg>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
