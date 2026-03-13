import SuricataAlerts from "@/components/soc/SuricataAlerts";
import { useWazuhData } from "@/hooks/useWazuhData";

const SuricataPage = () => {
  const { suricataAlerts, loading, error } = useWazuhData();

  return (
    <div className="space-y-4">
      {error && (
        <div className="px-4 py-2 rounded border border-danger/30 bg-danger/10 text-danger text-xs font-mono">
          <span className="font-bold">Lỗi:</span> {error}
        </div>
      )}
      <SuricataAlerts alerts={suricataAlerts} loading={loading} />
    </div>
  );
};

export default SuricataPage;
