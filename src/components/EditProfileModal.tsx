import { useState } from "react";
import { useAuth } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { X, Loader2 } from "lucide-react";
import { Avatar } from "./avatar-img";
import { API_BASE, resolveQieName } from "@/lib/posts";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated: () => void;
}

export function EditProfileModal({ isOpen, onClose, onProfileUpdated }: EditProfileModalProps) {
  const { user, updateProfile } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [avatarSeed, setAvatarSeed] = useState(user?.avatarSeed || "");
  const [qieId, setQieId] = useState((user as any)?.qie_id || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidatingQieId, setIsValidatingQieId] = useState(false);
  const [qieIdError, setQieIdError] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const handleSave = async () => {
    if (!displayName.trim()) {
      toast.error("Display name cannot be empty");
      return;
    }

    setIsSubmitting(true);
    try {
      // Jika user mengisi QIE ID, validasi dulu via MCP
      let finalQieId = qieId.trim().toLowerCase();
      if (finalQieId) {
        setIsValidatingQieId(true);
        const resolved = await resolveQieName(finalQieId);
        setIsValidatingQieId(false);
        
        if (!resolved) {
          setQieIdError("QIE ID not found in QIE Mainnet");
          toast.error("QIE ID not found. Please check the spelling.");
          setIsSubmitting(false);
          return;
        }
        if (resolved.address.toLowerCase() !== user.address.toLowerCase()) {
          setQieIdError("This QIE ID belongs to another wallet");
          toast.error("This QIE ID belongs to another wallet.");
          setIsSubmitting(false);
          return;
        }
      }

      const res = await fetch(`${API_BASE}/profiles/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: displayName.trim(),
          bio: bio.trim(),
          avatar_seed: avatarSeed.trim() || user.address,
          qie_id: finalQieId || null,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to update profile");

      updateProfile({
        displayName: displayName.trim(),
        bio: bio.trim(),
        avatarSeed: avatarSeed.trim() || user.address,
      });

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl border border-border relative my-8">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-muted-foreground hover:bg-muted"
        >
          <X className="size-5" />
        </button>

        <h2 className="text-xl font-bold mb-4">Edit Profile</h2>

        <div className="space-y-4">
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

          <div>
            <label className="text-xs font-medium text-muted-foreground">QIE ID (Optional)</label>
            <Input
              value={qieId}
              onChange={(e) => {
                setQieId(e.target.value);
                setQieIdError(null);
              }}
              placeholder="example: name.qie"
              className="mt-1"
            />
            {qieIdError && (
              <p className="text-[10px] text-destructive mt-1">{qieIdError}</p>
            )}
            {!qieIdError && (
              <p className="text-[10px] text-muted-foreground mt-1">
                Enter your .qie name. We'll verify it on QIE Mainnet.
              </p>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Display Name</label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your display name"
              className="mt-1"
            />
          </div>

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
            <Button onClick={handleSave} disabled={isSubmitting || isValidatingQieId} className="bg-brand">
              {isSubmitting || isValidatingQieId ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
