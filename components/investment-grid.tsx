import { mockInvestments } from "@/lib/mock-data";
import InvestmentCard from "@/components/investment-card";

export default function InvestmentGrid() {
  return (
    <div className="py-8">
      <h2 className="text-3xl font-bold mb-6">Opportunités d'Investissement</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockInvestments.map((investment) => (
          <InvestmentCard key={investment.id} investment={investment} />
        ))}
      </div>
    </div>
  );
}
