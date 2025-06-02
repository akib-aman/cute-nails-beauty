import HeroSub from "@/components/SharedComponent/HeroSub";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 Page | Venus ",
};

const ErrorPage = () => {
  return (
    <>
      <HeroSub
        title="404 Not Found"
      />
    </>
  );
};

export default ErrorPage;
