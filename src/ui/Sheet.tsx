import React, { type ReactNode } from "react";
import { Modal, Pressable, Text } from "react-native";

type SheetProps = {
  children: ReactNode;
  onClose: () => void;
  title?: string;
  visible: boolean;
};

export function Sheet({ children, onClose, title, visible }: SheetProps) {
  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <Pressable className="flex-1 justify-end bg-scrim" onPress={onClose}>
        <Pressable className="rounded-t-2xl bg-card p-5 pb-safe-or-5" onPress={(event) => event.stopPropagation()}>
          {title ? <Text className="mb-4 text-xl font-bold text-foreground">{title}</Text> : null}
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
