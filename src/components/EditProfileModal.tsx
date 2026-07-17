import { useState } from "react";
import { useAuth } from "@/lib/auth-store";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { X } from "lucide-react";
import { Avatar } from "./avatar-img";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated: () => void;
}

export function EditProfileModal({ isOpen, onClose, onProfileUpdated }: EditProfileModalProps) {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [avatarSeed, setAvatarSeed] = useState(user?.avatarSeed || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !user) return null;

  const handleSave = async () => {
    if (!displayName.trim()) {
      toast.error("Display name cannot be empty");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName.trim(),
          bio: bio.trim(),
          avatar_seed: avatarSeed.trim() || user.address,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Profile updated successfully!");
      onProfileUpdated();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl border border-border relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-muted-foreground hover:bg-muted"
        >
          <X className="size-5" />
        </button>

        <h2 className="text-xl font-bold mb-4">Edit Profile</h2>

        <div className="space-y-4">
          {/* Avatar Preview */}
          <div className="flex items-center gap-4">
            <Avatar seed={avatarSeed || user.address} size={64} />
            <div className="flex-1">
              <label className="text-xs font-medium text-muted-foreground">Avatar Seed</label>
              <Input
                value={avatarSeed}
                onChange={(e) => setAvatarSeed(e.target.value)}
                placeholder="Enter a word or phrase for your avatar"
                className="mt-1"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Change this to get a different avatar style.
              </p>
            </div>
          </div>

          {/* Display Name */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Display Name</label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your display name"
              className="mt-1"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Bio</label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell the QIE community about yourself..."
              className="mt-1 resize-none"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSubmitting} className="bg-brand">
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
