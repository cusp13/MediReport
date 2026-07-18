import { useState } from "react";
import { useAuth } from "../auth/AuthContext";

type Props = {
  onSignIn: () => void;
  onDashboard: () => void;
  onHistory: () => void;
  onFamily: () => void;
  onRecovery: () => void;
};

export function UserMenu({ onSignIn, onDashboard, onHistory, onFamily, onRecovery }: Readonly<Props>) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  if (!user) {
    return (
      <button
        type="button"
        onClick={onSignIn}
        className="rounded-full border border-gray-200 bg-white/80 px-4 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:border-blue-300 hover:text-blue-700"
      >
        Sign in
      </button>
    );
  }

  const initial = user.name.charAt(0).toUpperCase();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-gray-200 bg-white/80 py-1 pl-1 pr-3 transition-colors hover:border-blue-300"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-teal-500 text-sm font-semibold text-white">
          {initial}
        </span>
        <span className="max-w-[8rem] truncate text-sm font-medium text-gray-700">
          {user.name}
        </span>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="animate-fade-in absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onDashboard();
              }}
              className="block w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
            >
              Dashboard
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onHistory();
              }}
              className="block w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
            >
              Report history
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onRecovery();
              }}
              className="block w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
            >
              Recovery Monitor
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onFamily();
              }}
              className="block w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
            >
              Family members
            </button>
            <div className="border-t border-gray-100" />
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                logout();
              }}
              className="block w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
            >
              Log out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
