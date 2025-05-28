
import React, { useState } from "react";
import { Plus } from "lucide-react";
import { SellModal } from "@/components/SellModal";

export const SellButton: React.FC = () => {
  const [showSellModal, setShowSellModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowSellModal(true)}
        className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 px-4 rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-lg"
      >
        <Plus className="h-5 w-5" />
        <span>Sell Item</span>
      </button>
      
      <SellModal 
        open={showSellModal} 
        onOpenChange={setShowSellModal} 
      />
    </>
  );
};
