import { X, Upload, Shield, User2, Mail, Phone, MapPin, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
  profile: any;
  kycDocument: any;
  onSave: (profile: any) => void;
}

const EditProfileModal = ({ open, onClose, profile, kycDocument, onSave }: EditProfileModalProps) => {
  const [formData, setFormData] = useState({
    first_name: profile?.first_name || '',
    last_name: profile?.last_name || '',
    phone: profile?.phone || '',
    address: profile?.address || '',
  });
  const [uploading, setUploading] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const uploadKycDocument = async (file: File) => {
    try {
      setUploading(true);
      
      const fileExt = file.name.split('.').pop();
      const filePath = `${profile.id}/${Math.random()}.${fileExt}`;

      // Upload to kyc_documents bucket
      let { error: uploadError } = await supabase.storage
        .from('kyc_documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('kyc_documents')
        .getPublicUrl(filePath);

      // Create KYC document record
      const { error: kycError } = await supabase
        .from('kyc_documents')
        .insert({
          user_id: profile.id,
          document_type: 'student_id',
          document_url: publicUrl,
          status: 'pending'
        });

      if (kycError) throw kycError;

      // Update profile KYC status
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ kyc_status: 'pending' })
        .eq('id', profile.id);

      if (profileError) throw profileError;

      toast.success('Document uploaded successfully! Verification in progress.');
      onClose();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end justify-center animate-in fade-in duration-300">
      <div className="bg-background w-full rounded-t-2xl overflow-hidden animate-in slide-in-from-bottom duration-500">
        <form onSubmit={handleSubmit}>
          <div className="flex justify-between items-center p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">Edit Profile</h2>
              {profile?.kyc_status && (
                <Badge variant={
                  profile.kyc_status === 'verified' 
                    ? 'outline'
                    : profile.kyc_status === 'rejected'
                    ? 'destructive'
                    : 'secondary'
                } className={
                  profile.kyc_status === 'verified' 
                    ? 'bg-green-500/10 text-green-500 border-green-500/20'
                    : profile.kyc_status === 'rejected'
                    ? 'bg-red-500/10 text-red-500 border-red-500/20'
                    : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                }>
                  {profile.kyc_status === 'verified' && <BadgeCheck className="w-3 h-3 mr-1" />}
                  {profile.kyc_status === 'rejected' && <X className="w-3 h-3 mr-1" />}
                  {profile.kyc_status === 'pending' && <Shield className="w-3 h-3 mr-1" />}
                  {profile.kyc_status.charAt(0).toUpperCase() + profile.kyc_status.slice(1)}
                </Badge>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="p-4 space-y-6 max-h-[80vh] overflow-y-auto">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name" className="flex items-center gap-2">
                    <User2 className="w-4 h-4 text-blue-500" />
                    First Name
                  </Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    placeholder="John"
                    className="bg-secondary border-border"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last_name" className="flex items-center gap-2">
                    <User2 className="w-4 h-4 text-blue-500" />
                    Last Name
                  </Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    placeholder="Doe"
                    className="bg-secondary border-border"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-green-500" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (234) 567-8900"
                  className="bg-secondary border-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-red-500" />
                  Address
                </Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Your address"
                  className="bg-secondary border-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="verification" className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-yellow-500" />
                  <span>Student ID Verification</span>
                  {kycDocument && (
                    <Badge variant={
                      kycDocument.status === 'verified' 
                        ? 'outline'
                        : kycDocument.status === 'rejected'
                        ? 'destructive'
                        : 'secondary'
                    } className={
                      kycDocument.status === 'verified' 
                        ? 'bg-green-500/10 text-green-500 border-green-500/20'
                        : kycDocument.status === 'rejected'
                        ? 'bg-red-500/10 text-red-500 border-red-500/20'
                        : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                    }>
                      {kycDocument.status.charAt(0).toUpperCase() + kycDocument.status.slice(1)}
                    </Badge>
                  )}
                </Label>
                <Input 
                  id="verification" 
                  type="file" 
                  accept="image/*,.pdf"
                  onChange={async (e) => {
                    if (!e.target.files?.[0]) return;
                    await uploadKycDocument(e.target.files[0]);
                  }}
                  className="bg-secondary border-border file:bg-secondary file:text-foreground file:border file:border-border file:rounded-md hover:file:bg-secondary/80" 
                />
                <p className="text-sm text-muted-foreground">
                  Upload your student ID for verification. Supported formats: Images, PDF
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-border bg-secondary/50">
            <Button 
              type="submit"
              className="w-full bg-secondary hover:bg-secondary/80"
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal; 