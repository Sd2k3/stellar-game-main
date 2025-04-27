
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import type { Tables } from "@/integrations/supabase/types";

// Define a Note format to display the scores in a notes-like format
interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

const Notes: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Fetch game scores 
  useEffect(() => {
    const fetchGameScores = async () => {
      const { data, error } = await supabase
        .from("game_scores")
        .select("*")
        .order("created_at", { ascending: false }) as {
          data: Tables<"game_scores">[] | null;
          error: any;
        };

      if (error) {
        toast({
          variant: "destructive",
          title: "Error fetching scores",
          description: error.message,
        });
      } else if (data) {
        // Convert game_scores to notes format for display
        const formattedNotes: Note[] = data.map((item: Tables<"game_scores">) => ({
          id: item.id,
          title: `Score: ${item.score}`,
          content: `Score recorded for wallet: ${item.wallet_address}`,
          created_at: item.created_at
        }));
        setNotes(formattedNotes);
      }
    };
    fetchGameScores();
  }, [toast]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Insert into game_scores table
    const { error } = await supabase
      .from("game_scores")
      .insert([
        { 
          wallet_address: "demo-wallet-address", // Replace with actual wallet address if available
          score: parseInt(title) || 0 // Convert title to score number
        }
      ]) as { error: any };

    setLoading(false);
    if (error) {
      toast({
        variant: "destructive",
        title: "Failed to add score",
        description: error.message,
      });
    } else {
      setTitle("");
      setContent("");
      toast({
        title: "Score saved",
        description: "Your score has been recorded.",
      });

      // Refetch game scores after adding a new one
      const { data: allScores } = await supabase
        .from("game_scores")
        .select("*")
        .order("created_at", { ascending: false }) as {
          data: Tables<"game_scores">[] | null;
          error: any;
        };

      if (allScores) {
        // Convert game_scores to notes format for display
        const formattedNotes: Note[] = allScores.map((item: Tables<"game_scores">) => ({
          id: item.id,
          title: `Score: ${item.score}`,
          content: `Score recorded for wallet: ${item.wallet_address}`,
          created_at: item.created_at
        }));
        setNotes(formattedNotes);
      }
    }
  };

  return (
    <div className="min-h-screen space-gradient text-white">
      <div className="container mx-auto py-8">
        <Button variant="outline" onClick={() => navigate("/")}>
          Back to Home
        </Button>
        <header className="mb-6 text-center">
          <h1 className="text-4xl font-bold mb-2">Game Scores</h1>
          <p className="text-lg text-slate-300">
            Record and view your game scores.
          </p>
        </header>
        <form onSubmit={handleAddNote} className="mb-8 max-w-xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Add a New Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <Input
                  type="number"
                  placeholder="Score"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                />
                <Textarea
                  placeholder="Notes (optional)"
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  rows={4}
                />
                <Button
                  type="submit"
                  disabled={loading || !title.trim()}
                >
                  {loading ? "Saving..." : "Record Score"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
        <section className="max-w-2xl mx-auto space-y-4">
          {notes.length === 0 && (
            <div className="text-center text-slate-400">No scores recorded yet.</div>
          )}
          {notes.map(note => (
            <Card key={note.id}>
              <CardHeader>
                <CardTitle>{note.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-line mb-2">{note.content}</div>
                <div className="text-xs text-slate-400">
                  Recorded: {new Date(note.created_at).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      </div>
    </div>
  );
};

export default Notes;
