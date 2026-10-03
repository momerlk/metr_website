import type { Metadata } from "next";
import SellerConsole from "@/components/seller-console";
export const metadata: Metadata = { title: "Seller console · Metr", description: "Connect your store to Metr Fit.", robots: { index: false, follow: false } };
export default function ConsolePage() { return <SellerConsole />; }
