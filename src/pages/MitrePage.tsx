import MitreHeatmap from "@/components/soc/MitreHeatmap";
import { useWazuhData } from "@/hooks/useWazuhData";

const MitrePage = () => {
  const { mitreData, loading, error } = useWazuhData({ needs: { mitreData: true }, pollMs: false });

  return (
    <div className="space-y-4">
      {error && (
        <div className="px-4 py-2 rounded border border-danger/30 bg-danger/10 text-danger text-xs font-mono">
          <span className="font-bold">Lỗi:</span> {error}
        </div>
      )}
      <MitreHeatmap mitreData={mitreData} loading={loading} />
    </div>
  );
};

export default MitrePage;
