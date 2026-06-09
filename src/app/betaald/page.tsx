import { Suspense } from "react";
import PaymentResult from "@/components/PaymentResult";

export const metadata = { title: "Betaling — Bijles" };

export default function BetaaldPage() {
  return (
    <Suspense fallback={null}>
      <PaymentResult />
    </Suspense>
  );
}
