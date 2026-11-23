
import type { Metadata } from "next";
import CreatorDashboard from "./CreatorDashboard";
// import MyRsvps from "./MyRsvps";

export const metadata: Metadata = {
  title: "Dashboard | OpenFest",
  description: "Manage your outdoor events, reservations, and tickets",
};

export default function DashboardPage() {
  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      <CreatorDashboard />
    </div>
  );
}
