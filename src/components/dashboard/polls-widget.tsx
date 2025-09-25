"use client"

import { useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { polls as initialPolls } from "@/lib/data"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle } from "lucide-react"

export function PollsWidget() {
  const [polls, setPolls] = useState(initialPolls)
  const { toast } = useToast()

  const handleVote = (pollId: string) => {
    setPolls(
      polls.map((p) => (p.id === pollId ? { ...p, voted: true } : p))
    )
    toast({
      title: "Vote Submitted",
      description: "Thank you for your participation!",
    })
  }

  const activePoll = polls.find((p) => !p.voted)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Poll</CardTitle>
        <CardDescription>
          Make your voice heard in group decisions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {activePoll ? (
          <div>
            <p className="font-semibold mb-4">{activePoll.question}</p>
            <RadioGroup defaultValue={activePoll.options[0].id}>
              {activePoll.options.map((option) => (
                <div key={option.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.id} id={option.id} />
                  <Label htmlFor={option.id}>{option.text}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-6 bg-muted rounded-lg">
             <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
            <p className="font-semibold">No active polls</p>
            <p className="text-sm text-muted-foreground">You are all caught up. Check back later!</p>
          </div>
        )}
      </CardContent>
      {activePoll && (
        <CardFooter>
          <Button
            className="w-full"
            onClick={() => handleVote(activePoll.id)}
          >
            Submit Vote
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
