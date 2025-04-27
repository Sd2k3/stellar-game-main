
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface TokenBalanceProps {
  balance: number;
  pendingBalance: number;
  className?: string;
}

const TokenBalance: React.FC<TokenBalanceProps> = ({
  balance,
  pendingBalance,
  className,
}) => {
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Your Stellar Token Balance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="h-8 w-8 text-space-nova-yellow glow-yellow" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="10" />
              <path fill="white" d="M12 6l1.5 4.5h4.5l-3.6 2.7 1.4 4.3-3.8-2.8-3.8 2.8 1.4-4.3-3.6-2.7h4.5z" />
            </svg>
            <div>
              <span className="text-2xl font-bold">{balance}</span>
              {pendingBalance > 0 && (
                <span className="text-sm text-muted-foreground ml-2">
                  (+{pendingBalance} pending verification)
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <span className="text-sm text-muted-foreground">
              Tracked on Monad
            </span>
          </div>
        </div>
        
        {pendingBalance > 0 && (
          <div className="mt-3">
            <div className="flex justify-between text-sm mb-1">
              <span>Verification Progress</span>
              <span>Via Screenpipe</span>
            </div>
            <Progress value={66} className="h-2" />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TokenBalance;
