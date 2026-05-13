import type { ScanQualityResult, ScanQualitySignals } from "@/lib/scan/types";

const MIN_BLUR_VARIANCE = 60;
const MIN_FOLIAGE_RATIO = 0.12;

export function assessLeafImageQuality(signals?: ScanQualitySignals): ScanQualityResult {
  const blurVariance = signals?.blurVariance ?? null;
  const foliageRatio = signals?.foliageRatio ?? null;
  const issues: ScanQualityResult["issues"] = [];

  if (blurVariance === null || foliageRatio === null) {
    issues.push("missing_quality_signals");
  }

  if (blurVariance !== null && blurVariance < MIN_BLUR_VARIANCE) {
    issues.push("blurry");
  }

  if (foliageRatio !== null && foliageRatio < MIN_FOLIAGE_RATIO) {
    issues.push("not_leaf");
  }

  return {
    ok: !issues.includes("blurry") && !issues.includes("not_leaf"),
    blurVariance,
    foliageRatio,
    issues,
  };
}
