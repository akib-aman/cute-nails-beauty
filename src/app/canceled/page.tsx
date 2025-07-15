
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Payment Failed",
};

const ErrorPage = () => {
  return (

    <h1 className="p-64">Payment Failed - try again</h1>


  );
};

export default ErrorPage;
