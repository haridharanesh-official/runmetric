"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Activity, LayoutDashboard, BarChart3, Brain, User, LogIn, LogOut } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/coach", label: "AI Coach", icon: Brain },
  { href: "/profile", label: "Profile", icon: User },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user, login, logout } = useAuth();

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 left-0 right-0 z-50 flex justify-center px-6 pt-5"
    >
      <nav className="flex items-center gap-1 px-3 py-2 rounded-2xl border border-white/8 bg-[#0f172a]/80 backdrop-blur-2xl shadow-2xl shadow-black/40">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 px-3 py-2 mr-2 group">
          <motion.div
            whileHover={{ rotate: 15, scale: 1.1 }}
            transition={{ type: "spring", stiffness: 400 }}
            className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] flex items-center justify-center shadow-lg"
          >
            <Activity className="w-4 h-4 text-white" />
          </motion.div>
          <span className="text-[15px] font-semibold bg-gradient-to-r from-white to-[#94a3b8] bg-clip-text text-transparent hidden sm:block">
            RunMetric
          </span>
        </Link>

        <div className="w-px h-5 bg-white/10 mr-2" />

        {/* Nav links */}
        {navLinks.map((link) => {
          const active = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link key={link.href} href={link.href}>
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors duration-200 ${
                  active ? "text-white" : "text-[#64748b] hover:text-[#94a3b8]"
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="navbar-pill"
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#1e3a5f] to-[#1e2d5a] border border-[#3b82f6]/20"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon className={`relative w-4 h-4 ${active ? "text-[#3b82f6]" : ""}`} />
                <span className="relative hidden sm:block">{link.label}</span>
              </motion.div>
            </Link>
          );
        })}

        <div className="w-px h-5 bg-white/10 mx-2" />

        {user ? (
          <button
            onClick={() => logout()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-[#64748b] hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:block">Sign Out</span>
          </button>
        ) : (
          <Link
            href="/login"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 transition-colors"
          >
            <LogIn className="w-4 h-4" />
            <span className="hidden sm:block">Sign In</span>
          </Link>
        )}
      </nav>
    </motion.header>
  );
}
