
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 Page ",
};

const ErrorPage = () => {
  return (

    <h1 className="p-64">404 Not Found!</h1>


  );
};

export default ErrorPage;
