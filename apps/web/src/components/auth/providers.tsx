import Github from "./github";
import Google from "./google";

export function OAuthProviders() {
  return (
    <div className=" mb-6 flex gap-2 justify-center items-center">
      <Google />
      <Github />
    </div>
  );
}
