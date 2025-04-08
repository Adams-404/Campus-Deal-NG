
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export const CtaSection = () => {
  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-blue-950/30 rounded-2xl p-12 text-center backdrop-blur-sm border border-blue-200/10 hover:border-blue-200/20 transition-all duration-300">
          <h2 className="text-3xl font-bold mb-4 text-white">
            Ready to <span className="bg-orange-500 px-6 py-2 rounded-[15px] inline-block my-2">Start Trading</span>
          </h2>
          <p className="text-white/80 mb-8 max-w-2xl mx-auto">
            Join thousands of GSU students who are already buying and selling on our platform.
          </p>
          <Link to="/auth">
            <Button style={{ width: '200px' }} className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-6 text-lg rounded-full transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl">
              Join Now <ArrowRight className="ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
