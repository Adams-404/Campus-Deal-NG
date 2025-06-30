
import { Github, MessageSquare, Heart } from "lucide-react";
import { Link } from "react-router-dom";

export const FooterSection = () => {
  return (
    <footer className="py-12 bg-black mb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="font-bold mb-4 text-blue-500">
              Campus Deal
            </h3>
            <p className="text-sm text-white/80">
              Your trusted platform for campus trading and marketplace needs.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-blue-500">Quick Links</h4>
            <ul className="space-y-2 text-sm text-white/80">
              <li><Link to="/about" className="hover:text-blue-500 transition-colors">About Us</Link></li>
              <li><Link to="/help" className="hover:text-green-500 transition-colors">Help Center</Link></li>
              <li><Link to="/privacy" className="hover:text-orange-500 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/feedback" className="hover:text-red-500 transition-colors">Feedback</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-green-500">Features</h4>
            <ul className="space-y-2 text-sm text-white/80">
              <li className="hover:text-blue-500 transition-colors">Secure Trading</li>
              <li className="hover:text-green-500 transition-colors">Campus Verification</li>
              <li className="hover:text-orange-500 transition-colors">Direct Messaging</li>
              <li className="hover:text-red-500 transition-colors">Smart Search</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-orange-500">Connect</h4>
            <div className="flex space-x-4">
              <a href="#" className="text-white/80 hover:text-blue-500 transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="text-white/80 hover:text-green-500 transition-colors">
                <MessageSquare className="w-5 h-5" />
              </a>
              <a href="#" className="text-white/80 hover:text-red-500 transition-colors">
                <Heart className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
        <div className="pt-8 border-t border-blue-200/10 text-center text-sm text-white/60">
          <p>&copy; {new Date().getFullYear()} Campus Deal. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
