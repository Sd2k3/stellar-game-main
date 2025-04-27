
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

interface LeaderboardEntry {
  id: string;
  rank: number;
  username: string | null;
  score: number;
  tokens: number;
  avatarUrl?: string;
}

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  className?: string;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ entries, className }) => {
  return (
    <Card className={`${className} bg-black/30 border-space-stellar-blue`}>
      <CardHeader>
        <CardTitle className="text-xl bg-gradient-to-r from-space-stellar-blue to-space-nebula-pink bg-clip-text text-transparent">
          Top Players
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {entries.map((entry, index) => (
          <React.Fragment key={entry.id}>
            {index > 0 && <Separator className="my-2 bg-space-stellar-blue/20" />}
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-3">
                <div 
                  className={`flex items-center justify-center w-7 h-7 rounded-full text-white font-bold text-sm
                    ${entry.rank === 1 ? "bg-space-nova-yellow glow-yellow" : 
                      entry.rank === 2 ? "bg-slate-300" : 
                      entry.rank === 3 ? "bg-amber-600" : "bg-space-asteroid-gray"}`}
                >
                  {entry.rank}
                </div>
                <Avatar className="h-8 w-8 border border-space-stellar-blue/50">
                  <AvatarImage src={entry.avatarUrl} />
                  <AvatarFallback className="bg-space-cosmic-purple text-white">
                    {entry.username && typeof entry.username === "string" && entry.username.trim() !== ""
                      ? entry.username.substring(0, 2).toUpperCase()
                      : "??"
                    }
                  </AvatarFallback>
                </Avatar>
                <div className="font-medium text-white">
                  {entry.username || "Anonymous Player"}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm text-space-stellar-blue">Score</div>
                  <div className="font-medium text-white">{entry.score.toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-1 text-space-nova-yellow glow-yellow">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="10" />
                    <path fill="white" d="M12 6l1.5 4.5h4.5l-3.6 2.7 1.4 4.3-3.8-2.8-3.8 2.8 1.4-4.3-3.6-2.7h4.5z" />
                  </svg>
                  <span className="font-medium">{entry.tokens}</span>
                </div>
              </div>
            </div>
          </React.Fragment>
        ))}
      </CardContent>
    </Card>
  );
};

export default Leaderboard;

