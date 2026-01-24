'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Hourglass, CreditCard } from "lucide-react";

export function ApprovalPending() {
    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-150px)]">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
                        <Hourglass className="h-10 w-10 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">Account Pending Approval</CardTitle>
                    <CardDescription>
                        Thank you for registering with The Empowers Youth Group! Your account is currently under review.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p>
                        Our leadership team (Chairperson and Treasurer) will review your submission shortly. Once both have approved your membership, your account will be activated.
                    </p>
                    <div className="p-4 border rounded-lg bg-card text-center space-y-3">
                        <p className="font-semibold text-primary">
                            Have you paid the KES 500 registration fee?
                        </p>
                        <p className="text-sm">
                           If not, please complete the payment to avoid delays in your approval.
                        </p>
                        <Button asChild>
                            <a href="https://lipana.dev/pay/registration-fee-3a29-1" target="_blank" rel="noopener noreferrer">
                                <CreditCard className="mr-2 h-4 w-4" /> Pay Registration Fee
                            </a>
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        You will be notified upon account activation. If you have any questions, please contact the group secretary.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}

    