"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PaymentModal } from "./PaymentModal";
import { getCoins } from "../actions";
import { Coins } from "lucide-react";

export function CoinsDisplay() {
  const [coins, setCoins] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadCoins();
  }, []);

  const loadCoins = async () => {
    setIsLoading(true);
    const result = await getCoins();
    if (result.success) {
      setCoins(result.data);
    }
    setIsLoading(false);
  };

  const handlePaymentSuccess = () => {
    loadCoins();
  };

  return (
    <>
      <div className="rounded-none border border-border bg-surface p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-accent" />
            <div>
              <p className="text-sm text-primary/70">Coins Available</p>
              <p className="font-serif text-2xl text-primary">
                {isLoading ? "..." : coins ?? 0}
              </p>
            </div>
          </div>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="rounded-none"
            variant="outline"
          >
            Buy Coin
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





