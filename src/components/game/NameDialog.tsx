
import React, { useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface NameDialogProps {
  open: boolean;
  onSubmit: (name: string) => void;
}

const NameDialog: React.FC<NameDialogProps> = ({ open, onSubmit }) => {
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (name.trim()) {
      setSubmitted(true);
      onSubmit(name.trim());
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enter Your Name</DialogTitle>
          <DialogDescription>
            To record your score on the leaderboard, please enter a name or alias.
          </DialogDescription>
        </DialogHeader>
        <Input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Your name or alias"
          maxLength={32}
          disabled={submitted}
        />
        <DialogFooter>
          <Button
            onClick={handleSubmit}
            className="w-full"
            disabled={!name.trim() || submitted}
          >
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NameDialog;
