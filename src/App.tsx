import { useState, useEffect, useCallback } from "react";
import DropZone from "./components/DropZone";
import TabBar from "./components/TabBar";
import OverviewTab from "./components/tabs/OverviewTab";
import SubscriptionsTab from "./components/tabs/SubscriptionsTab";
import WatchHistoryTab from "./components/tabs/WatchHistoryTab";
import SearchHistoryTab from "./components/tabs/SearchHistoryTab";
import LikedTab from "./components/tabs/LikedTab";
import CommentsTab from "./components/tabs/CommentsTab";
import PlaylistsTab from "./components/tabs/PlaylistsTab";
import { parseZip, type TakeoutData } from "./utils/parser";

export default function App() {
  const [data, setData] = useState<TakeoutData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash) setActiveTab(hash);
    const fn = () => { const h = window.location.hash.replace("#", ""); if (h) setActiveTab(h); };
    window.addEventListener("hashchange", fn);
    return () => window.removeEventListener("hashchange", fn);
  }, []);

  const go = useCallback((id: string) => { setActiveTab(id); window.location.hash = id; }, []);

  const handleFile = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);
    try {
      const r = await parseZip(file);
      setData(r);
      go("overview");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to parse ZIP.");
    } finally {
      setIsLoading(false);
    }
  }, [go]);

  if (!data) {
    return (
      <>
        <DropZone onFileSelected={handleFile} isLoading={isLoading} />
        {error && <div className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded border border-red-900 bg-red-950 px-4 py-2 text-xs text-red-300">{error}</div>}
      </>
    );
  }

  const tabs = [
    { id: "overview", label: "Overview", count: 1 },
    { id: "subscriptions", label: "Subscriptions", count: data.subscriptions.length },
    { id: "watch", label: "Watch History", count: data.watchHistory.length },
    { id: "search", label: "Searches", count: data.searchHistory.length },
    { id: "liked", label: "Liked", count: data.likedVideos.length },
    { id: "comments", label: "Comments", count: data.comments.length },
    { id: "playlists", label: "Playlists", count: data.playlists.length },
  ];

  const renderTab = () => {
    switch (activeTab) {
      case "overview": return <OverviewTab data={data} onNavigate={go} />;
      case "subscriptions": return <SubscriptionsTab data={data.subscriptions} />;
      case "watch": return <WatchHistoryTab data={data.watchHistory} />;
      case "search": return <SearchHistoryTab data={data.searchHistory} />;
      case "liked": return <LikedTab data={data.likedVideos} />;
      case "comments": return <CommentsTab data={data.comments} />;
      case "playlists": return <PlaylistsTab data={data.playlists} />;
      default: return <OverviewTab data={data} onNavigate={go} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#111] text-white">
      <header className="sticky top-0 z-50 bg-[#111]">
        <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-800">
          <span className="text-xs font-medium text-neutral-400">YouTube Takeout</span>
          <button onClick={() => { setData(null); setError(null); window.location.hash = ""; }}
            className="text-[11px] text-neutral-600 hover:text-neutral-300">← New file</button>
        </div>
        <TabBar tabs={tabs} activeTab={activeTab} onTabChange={go} />
      </header>
      <main>{renderTab()}</main>
    </div>
  );
}
