"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createOrder, verifyPayment } from "../actions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import Script from "next/script";

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function PaymentModal({ open, onOpenChange, onSuccess }: PaymentModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  const handlePayment = async () => {
    if (!isScriptLoaded || !window.Razorpay) {
      toast.error("Payment system not ready. Please try again.");
      return;
    }

    setIsLoading(true);

    try {
      // Create order on server
      const orderResult = await createOrder();

      if (!orderResult.success) {
        toast.error(orderResult.error);
        setIsLoading(false);
        return;
      }

      const { orderId } = orderResult.data;

      // Initialize Razorpay
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        amount: 19900, // ₹199 in paise
        currency: "INR",
        name: "RangManch",
        description: "Pay ₹199 to Verify",
        order_id: orderId,
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          // Verify payment on server
          const verifyResult = await verifyPayment(
            response.razorpay_payment_id,
            response.razorpay_order_id,
            response.razorpay_signature
          );

          if (verifyResult.success) {
            toast.success("Payment successful! Credit added to your account.");
            onOpenChange(false);
            onSuccess?.();
          } else {
            toast.error(verifyResult.error || "Payment verification failed");
          }
          setIsLoading(false);
        },
        prefill: {
          // You can prefill user email if available
        },
        theme: {
          color: "#C5A059", // Muted Gold accent
        },
        modal: {
          ondismiss: () => {
            setIsLoading(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);

      razorpay.on("payment.failed", (response: { error: { description: string } }) => {
        toast.error(`Payment failed: ${response.error.description}`);
        setIsLoading(false);
      });

      razorpay.open();
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Failed to initiate payment");
      setIsLoading(false);
    }
  };

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setIsScriptLoaded(true)}
        onError={() => {
          toast.error("Failed to load payment system");
          setIsScriptLoaded(false);
        }}
      />
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="rounded-none">
          <DialogHeader>
            <DialogTitle className="font-serif">Pay ₹199 to Verify</DialogTitle>
            <DialogDescription>
              Purchase a credit to upload your film. Each credit allows you to
              submit one film for verification.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="rounded-none border border-border bg-surface p-4">
              <div className="flex items-center justify-between">
                <span className="text-primary">Credit Purchase</span>
                <span className="font-semibold text-primary">₹199</span>
              </div>
            </div>
            <Button
              onClick={handlePayment}
              disabled={isLoading || !isScriptLoaded}
              className="w-full rounded-none"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Proceed to Payment"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

