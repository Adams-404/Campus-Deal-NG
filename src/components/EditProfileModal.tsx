import { X, Upload, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
}

const EditProfileModal = ({ open, onClose }: EditProfileModalProps) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end justify-center animate-in fade-in duration-300">
      <div className="bg-secondary w-full rounded-t-2xl overflow-hidden animate-in slide-in-from-bottom duration-500">
        <div className="flex justify-between items-center p-4 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">Edit Profile</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-4 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="space-y-2">
            <Label className="text-sm text-gray-400">Profile Picture</Label>
            <div className="grid grid-cols-4 gap-2">
              <button className="aspect-square rounded-lg border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-1 hover:border-primary/50 transition-colors">
                <Upload className="h-5 w-5 text-gray-400" />
                <span className="text-xs text-gray-400">Upload</span>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" placeholder="John Doe" className="bg-background border-white/10" />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="john@gsu.edu" className="bg-background border-white/10" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select>
              <SelectTrigger className="bg-background border-white/10">
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="lecturer">Lecturer</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="id">GSU ID Number</Label>
            <Input id="id" placeholder="Enter your GSU ID" className="bg-background border-white/10" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="verification" className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-yellow-500" />
              <span>Verification Document</span>
            </Label>
            <Input 
              id="verification" 
              type="file" 
              accept="image/*,.pdf" 
              className="bg-background border-white/10 file:bg-primary/10 file:text-primary file:border-0 file:rounded-md hover:file:bg-primary/20" 
            />
            <p className="text-sm text-gray-500">Upload your student/staff ID or relevant document</p>
          </div>
        </div>

        <div className="p-4 border-t border-white/10">
          <Button className="w-full bg-primary text-white hover:bg-primary/90">
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EditProfileModal; 