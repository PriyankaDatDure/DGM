"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  BulletinData, ValidationResult,
  emptyMetadata, emptyWeatherEntry, emptyNationalHazardEntry,
  emptyRegionHazardEntry, emptyInterpretation,
  Hazard, RegionCode,
} from "@/lib/bulletin/types";
import { HAZARDS, REGIONS } from "@/lib/bulletin/constants";
import { validateBulletin } from "@/lib/bulletin/validation";
import MetadataStep from "@/components/bulletin/steps/MetadataStep";
import NationalForecastStep from "@/components/bulletin/steps/NationalForecastStep";
import RegionForecastStep from "@/components/bulletin/steps/RegionForecastStep";
import NationalHazardStep from "@/components/bulletin/steps/NationalHazardStep";
import RegionHazardStep from "@/components/bulletin/steps/RegionHazardStep";
import InterpretationStep from "@/components/bulletin/steps/InterpretationStep";
import AppHeader from "@/components/layout/AppHeader";
import { updateBulletinToDatabase } from "@/actions/bulletin-edit";
import { submitBulletinToDatabase } from "@/actions/bulletin-submit";

const STEP_KEYS = [
  "metadata",
  "nationalForecast",
  "regionForecast",
  "nationalHazards",
  "regionHazards",
  "interpretation",
] as const;

function initBulletin(): BulletinData {
  const regionForecast = {} as BulletinData["regionForecast"];
  REGIONS.forEach((r) => { regionForecast[r] = emptyWeatherEntry(); });

  const nationalHazard = {} as BulletinData["nationalHazard"];
  HAZARDS.forEach((h) => { nationalHazard[h] = emptyNationalHazardEntry(); });

  const regionHazard = {} as BulletinData["regionHazard"];
  REGIONS.forEach((r) => {
    regionHazard[r] = {} as Record<Hazard, ReturnType<typeof emptyRegionHazardEntry>>;
    HAZARDS.forEach((h) => { regionHazard[r][h] = emptyRegionHazardEntry(); });
  });

  return {
    metadata: emptyMetadata(),
    nationalForecast: emptyWeatherEntry(),
    regionForecast,
    nationalHazard,
    regionHazard,
    interpretation: emptyInterpretation(),
  };
}

interface Props {
  username: string;
  editBulletinId?: string;
  initialBulletin?: BulletinData;
  loadError?: string;
}

export default function FormWizard({
  username,
  editBulletinId,
  initialBulletin,
  loadError,
}: Props) {
  const router = useRouter();
  const t = useTranslations("wizard");
  const tCommon = useTranslations("common");
  const isEditing = Boolean(editBulletinId && initialBulletin);
  const [step, setStep] = useState(0);
  const [bulletin, setBulletin] = useState<BulletinData>(initialBulletin ?? initBulletin());
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [toast, setToast] = useState<{ msg: string; error?: boolean } | null>(
    loadError ? { msg: loadError, error: true } : null
  );
  const [submitting, setSubmitting] = useState(false);

  const stepLabels = STEP_KEYS.map((key) => t(`steps.${key}`));

  const fieldBlocking = result?.fieldBlocking ?? new Set<string>();
  const fieldWarning = result?.fieldWarning ?? new Set<string>();

  const runCheck = (options?: { silent?: boolean }) => {
    const r = validateBulletin(bulletin);
    setResult(r);
    if (!options?.silent) {
      if (r.blocking.length === 0) {
        setToast({ msg: t("validationPassed") });
      } else {
        setToast({
          msg: t("blockingFound", { count: r.blocking.length }),
          error: true,
        });
      }
      setTimeout(() => setToast(null), 2800);
    }
    return r;
  };

  const goNext = () => setStep((s) => s + 1);

  const cancelEdit = () => {
    setStep(0);
    setBulletin(initBulletin());
    setResult(null);
    setToast(null);
    router.replace("/");
    router.refresh();
  };

  const saveBulletin = async () => {
    const r = runCheck({ silent: true });
    if (r.blocking.length > 0) {
      setToast({
        msg: t("blockingBeforeSave", { count: r.blocking.length }),
        error: true,
      });
      setTimeout(() => setToast(null), 3200);
      return;
    }

    setSubmitting(true);
    try {
      const saveResult =
        isEditing && editBulletinId
          ? await updateBulletinToDatabase(editBulletinId, bulletin)
          : await submitBulletinToDatabase(bulletin);
      if (!saveResult.success) {
        setToast({ msg: saveResult.error, error: true });
      } else {
        setToast({
          msg: saveResult.message ?? (isEditing ? t("updated") : t("saved")),
        });
      }
    } finally {
      setSubmitting(false);
      setTimeout(() => setToast(null), 3200);
    }
  };

  const stepContent = useMemo(() => {
    switch (step) {
      case 0:
        return (
          <MetadataStep
            data={bulletin.metadata}
            onChange={(metadata) => setBulletin((b) => ({ ...b, metadata }))}
            fieldBlocking={fieldBlocking}
            fieldWarning={fieldWarning}
          />
        );
      case 1:
        return (
          <NationalForecastStep
            data={bulletin.nationalForecast}
            onChange={(nationalForecast) => setBulletin((b) => ({ ...b, nationalForecast }))}
            fieldBlocking={fieldBlocking}
            fieldWarning={fieldWarning}
          />
        );
      case 2:
        return (
          <RegionForecastStep
            data={bulletin.regionForecast}
            onChange={(region: RegionCode, entry) =>
              setBulletin((b) => ({ ...b, regionForecast: { ...b.regionForecast, [region]: entry } }))
            }
          />
        );
      case 3:
        return (
          <NationalHazardStep
            data={bulletin.nationalHazard}
            onChange={(hazard, entry) =>
              setBulletin((b) => ({ ...b, nationalHazard: { ...b.nationalHazard, [hazard]: entry } }))
            }
            fieldBlocking={fieldBlocking}
            fieldWarning={fieldWarning}
          />
        );
      case 4:
        return (
          <RegionHazardStep
            data={bulletin.regionHazard}
            onChange={(region, hazard, entry) =>
              setBulletin((b) => ({
                ...b,
                regionHazard: {
                  ...b.regionHazard,
                  [region]: { ...b.regionHazard[region], [hazard]: entry },
                },
              }))
            }
            fieldBlocking={fieldBlocking}
            fieldWarning={fieldWarning}
          />
        );
      case 5:
        return (
          <InterpretationStep
            data={bulletin.interpretation}
            onChange={(interpretation) => setBulletin((b) => ({ ...b, interpretation }))}
            fieldBlocking={fieldBlocking}
            fieldWarning={fieldWarning}
            validationResult={result}
            isEditing={isEditing}
          />
        );
      default:
        return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, bulletin, result, fieldBlocking, fieldWarning, isEditing]);

  return (
    <>
      <AppHeader username={username} />

      <nav className="tabs">
        {stepLabels.map((label, i) => (
          <button
            key={STEP_KEYS[i]}
            className={i === step ? "active" : i < step ? "done" : ""}
            onClick={() => setStep(i)}
          >
            <span className="n">{i + 1}</span>{label}
          </button>
        ))}
      </nav>

      <main className="content">{stepContent}</main>

      <div className="footer-bar">
        <div className="left">
          {t("footer", {
            step: step + 1,
            total: stepLabels.length,
            label: stepLabels[step],
          })}
        </div>
        <div className="actions">
          {isEditing && (
            <button className="btn" type="button" onClick={cancelEdit}>
              {tCommon("cancelEdit")}
            </button>
          )}
          <button className="btn" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
            {tCommon("back")}
          </button>
          {step === stepLabels.length - 1 ? (
            <button className="btn primary" onClick={saveBulletin} disabled={submitting || (Boolean(editBulletinId) && !initialBulletin)}>
              {submitting ? tCommon("saving") : isEditing ? t("update") : t("submit")}
            </button>
          ) : (
            <button className="btn primary" onClick={goNext}>{tCommon("continue")}</button>
          )}
        </div>
      </div>

      {toast && <div className={`toast ${toast.error ? "error" : ""}`}>{toast.msg}</div>}
    </>
  );
}
