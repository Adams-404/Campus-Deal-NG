import { useState, useEffect } from "react";
import { PageTransition } from "@/components/PageTransition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award, Users, ArrowLeft } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface LeaderboardEntry {
  id: string;
  name: string;
  referral_count: number;
  unverified_count: number;
  rank: number;
  avatar_url?: string;
}

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase.rpc('get_leaderboard');
      
      if (error) throw error;
      
      if (data) {
        // Get profile pictures for the users
        const userIds = data.map((item: any) => item.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, avatar_url')
          .in('id', userIds);

        const profileMap = new Map();
        profiles?.forEach(profile => {
          profileMap.set(profile.id, profile);
        });

        const formattedLeaderboard = data.map((item: any, index: number) => ({
          id: item.user_id,
          name: item.name,
          referral_count: Number(item.referral_count) || 0,
          unverified_count: Number(item.unverified_count) || 0,
          rank: index + 1,
          avatar_url: profileMap.get(item.user_id)?.avatar_url
        }));
        
        setLeaderboard(formattedLeaderboard);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-lg font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">🥇 Champion</Badge>;
      case 2:
        return <Badge className="bg-gray-400/10 text-gray-500 border-gray-400/20">🥈 Runner-up</Badge>;
      case 3:
        return <Badge className="bg-amber-600/10 text-amber-600 border-amber-600/20">🥉 Third Place</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="bg-background min-h-screen">
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-sm border-b border-white/10 ml-0 lg:ml-[300px] transition-all duration-300">
        <div className="relative max-w-2xl lg:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="w-10">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate(-1)}
                className="text-primary"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </div>
            <h1 className="text-lg font-semibold absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">Referral Leaderboard</h1>
            <div className="w-10" />
          </div>
          <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />
        </div>
      </div>

      <main className="w-full max-w-2xl lg:max-w-4xl mx-auto px-4 sm:px-6 transition-all duration-300">
        <PageTransition>
          <div className="pt-24 pb-32 space-y-6">
            <div className="text-center space-y-2">
              <div className="flex justify-center">
                <div className="p-3 rounded-full bg-gradient-to-r from-yellow-500/10 to-orange-500/10">
                  <Trophy className="w-8 h-8 text-yellow-500" />
                </div>
              </div>
              <h2 className="text-2xl font-bold">Top Referrers</h2>
              <p className="text-muted-foreground">
                See who's bringing the most new members to GSU Market
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Top 10 Leaderboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-4">
                        <div className="h-12 w-12 bg-secondary rounded-full" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-secondary rounded w-3/4" />
                          <div className="h-4 bg-secondary rounded w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : leaderboard.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No referrals yet. Be the first to start referring friends!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {leaderboard.map((entry) => (
                      <div
                        key={entry.id}
                        className={`flex items-center justify-between p-4 rounded-lg border ${
                          entry.rank <= 3 ? 'bg-gradient-to-r from-primary/5 to-transparent border-primary/20' : 'border-border'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center">
                            {getRankIcon(entry.rank)}
                          </div>
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={entry.avatar_url || ''} />
                            <AvatarFallback>
                              {entry.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-lg">{entry.name}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>{entry.referral_count} verified</span>
                              {entry.unverified_count > 0 && (
                                <span className="text-orange-500">• {entry.unverified_count} pending</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getRankBadge(entry.rank)}
                          <div className="text-right">
                            <div className="text-2xl font-bold text-primary">
                              {entry.referral_count}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Want to see your name here?{" "}
                <Button variant="link" className="p-0 h-auto font-medium" onClick={() => navigate('/settings')}>
                  Get your referral code
                </Button>
              </p>
            </div>
          </div>
        </PageTransition>
      </main>
    </div>
  );
};

export default Leaderboard;
