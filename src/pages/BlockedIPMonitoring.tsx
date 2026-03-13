import BlockedIPList from "@/components/soc/BlockedIPList";
import { useWazuhData } from "@/hooks/useWazuhData";

const BlockedIPMonitoring = () => {
  const { blockedIPs, loading, error } = useWazuhData({ needs: { blockedIPs: true }, pollMs: 30_000 });

  return (
    <div className="space-y-4">
      {error && (
        <div className="px-4 py-2 rounded border border-danger/30 bg-danger/10 text-danger text-xs font-mono">
          <span className="font-bold">Lỗi:</span> {error}
        </div>
      )}
      <BlockedIPList attackers={blockedIPs} loading={loading} />
    </div>
  );
};

export default BlockedIPMonitoring;
