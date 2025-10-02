"use client";

import React, {useState} from "react";
import {Button} from "@/components/ui/button";
import {Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle} from "@/components/ui/dialog";
import {InviteModalProps} from "@/types";


const InviteModal: React.FC<InviteModalProps> = ({isOpen, onClose, onSend, initialEmail, userEmail}) => {
    const [email, setEmail] = useState<string>(initialEmail || "");

    const handleSendClick = () => {
        onSend(email);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Inviter un utilisateur</DialogTitle>
                </DialogHeader>
                <div>
                    <label htmlFor="invite-email" className="block text-black">
                        Email:
                    </label>
                    <input
                        type="email"
                        id="invite-email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="border p-2 rounded w-full"
                        placeholder="Enter email"
                    />
                </div>
                <DialogFooter>
                    <Button onClick={handleSendClick}>Envoyer l&apos;invitation</Button>
                    <Button onClick={onClose} className="ml-2">
                        Annuler
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default InviteModal;
