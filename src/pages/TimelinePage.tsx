import AttackTimeline from "@/components/soc/AttackTimeline";
import { useWazuhData } from "@/hooks/useWazuhData";

const TimelinePage = () => {
  const { timeline, loading, error } = useWazuhData({ needs: { timeline: true }, pollMs: 30_000 });

  return (
    <div className="space-y-4">
      {error && (
        <div className="px-4 py-2 rounded border border-danger/30 bg-danger/10 text-danger text-xs font-mono">
          <span className="font-bold">Lỗi:</span> {error}
        </div>
      )}
      <AttackTimeline timeline={timeline} loading={loading} />
    </div>
  );
};

export default TimelinePage;
