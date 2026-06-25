import ConversationTracker from "@/components/ConversationTracker";
import HistoryPanel from "@/components/HistoryPanel";
import BirthdayWidget from "@/components/BirthdayWidget";
import FollowUpWidget from "@/components/FollowUpWidget";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-black">Dashboard</h1>
        <p className="text-sm text-gray-400 mt-0.5">Track your daily conversations and progress.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ConversationTracker />
          <HistoryPanel />
        </div>
        <div className="space-y-6">
          <FollowUpWidget />
          <BirthdayWidget />
        </div>
      </div>
    </div>
  );
}
