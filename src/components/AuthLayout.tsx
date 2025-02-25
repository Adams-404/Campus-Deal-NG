
import { Outlet } from "react-router-dom";
import { PageTransition } from "./PageTransition";

const AuthLayout = () => {
  return (
    <PageTransition>
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </PageTransition>
  );
};

export default AuthLayout;
