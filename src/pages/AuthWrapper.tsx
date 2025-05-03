
import React from 'react';

type AuthWrapperProps = {
  children: React.ReactNode;
};

const AuthWrapper = ({ children }: AuthWrapperProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md p-6 bg-card rounded-lg shadow-lg border border-border">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold mb-1">Welcome to Tradezy</h2>
          <p className="text-muted-foreground">Sign in to continue</p>
        </div>
        {children}
      </div>
    </div>
  );
};

export default AuthWrapper;
