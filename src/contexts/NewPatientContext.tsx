import { createContext, useContext, useState, type ReactNode } from "react";

type NewPatientContextValue = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
};

const NewPatientContext = createContext<NewPatientContextValue | null>(null);

export function NewPatientProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <NewPatientContext.Provider
      value={{ isOpen, open: () => setIsOpen(true), close: () => setIsOpen(false) }}
    >
      {children}
    </NewPatientContext.Provider>
  );
}

export function useNewPatient() {
  const ctx = useContext(NewPatientContext);
  if (!ctx) return { isOpen: false, open: () => {}, close: () => {} };
  return ctx;
}
