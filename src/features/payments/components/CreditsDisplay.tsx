"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PaymentModal } from "./PaymentModal";
import { getCredits } from "../actions";
import { Coins } from "lucide-react";

export function CreditsDisplay() {
  const [credits, setCredits] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadCredits();
  }, []);

  const loadCredits = async () => {
    setIsLoading(true);
    const result = await getCredits();
    if (result.success) {
      setCredits(result.data);
    }
    setIsLoading(false);
  };

  const handlePaymentSuccess = () => {
    loadCredits();
  };

  return (
    <>
      <div className="rounded-none border border-border bg-surface p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-accent" />
            <div>
              <p className="text-sm text-primary/70">Credits Available</p>
              <p className="font-serif text-2xl text-primary">
                {isLoading ? "..." : credits ?? 0}
              </p>
            </div>
          </div>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="rounded-none"
            variant="outline"
          >
            Buy Credit
          </Button>
        </div>
      </div>
      <PaymentModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={handlePaymentSuccess}
      />
    </>
  );
}


