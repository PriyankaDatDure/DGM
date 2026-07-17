"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import AppHeader from "@/components/layout/AppHeader";
import MultiSelectDropdown from "@/components/bulletin/single-screen/MultiSelectDropdown";
import {
  cardCls,
  cellCls,
  EnhanceIconButton,
  FieldCell,
  FormField,
  inputCls,
  riskColor,
  SectionHeader,
  SectionTab,
  Th,
  ValidateRowButton,
} from "@/components/bulletin/single-screen/FormPrimitives";
import {
  BulletinData,
  Hazard,
  Interpretation,
  RegionCode,
  ValidationResult,
  WeatherEntry,
} from "@/lib/bulletin/types";
import {
  emptyInterpretation,
  emptyMetadata,
  emptyNationalHazardEntry,
  emptyRegionHazardEntry,
  emptyWeatherEntry,
} from "@/lib/bulletin/types";
import {
  CONFIDENCE_LEVELS,
  HAZARDS,
  REGIONS,
  RISK_LEVELS,
  WIND_DIRECTIONS,
  prefecturesForRegion,
  regionDisplayLabel,
} from "@/lib/bulletin/constants";
import { parseStoredPrefectures } from "@/lib/bulletin/region-prefectures";
import {
  DATA_SOURCE_OPTIONS,
  parseDataSources,
  serializeDataSources,
} from "@/lib/bulletin/data-sources";
import { sectionErrorCounts, firstSectionWithErrors, sectionForFieldKey } from "@/lib/bulletin/section-errors";
import { syncValidityFromForecast } from "@/lib/bulletin/validity-period";
import { validateBulletin, validateWeatherRow } from "@/lib/bulletin/validation";
import { useEnumLabels } from "@/lib/i18n/use-enum-labels";
import { useValidationFormatter } from "@/lib/i18n/use-validation-formatter";
import { updateBulletinToDatabase } from "@/actions/bulletin-edit";
import { submitBulletinToDatabase } from "@/actions/bulletin-submit";

const HAZARD_SCOPES = ["National", ...REGIONS] as const;
const LS_DRAFT_KEY = "dgm-forecast-draft";

const WEATHER_ROW_FIELDS: (keyof WeatherEntry)[] = [
  "temp_min_c",
  "temp_max_c",
  "temp_ressentie_c",
  "relative_humidity_pct",
  "pressure_hpa",
  "wind_direction",
  "wind_speed_kmh",
  "rainfall_mm",
  "sunshine_pct",
  "confidence",
];

function migrateBulletinDraft(draft: BulletinData): BulletinData {
  HAZARDS.forEach((hazard) => {
    const raw = draft.nationalHazard[hazard] as BulletinData["nationalHazard"][Hazard] & {
      areas_concerned?: string;
    };
    if (!Array.isArray(raw.affected_prefectures)) {
      draft.nationalHazard[hazard] = {
        risk_level: raw.risk_level ?? "",
        comment: raw.comment ?? "",
        recommendations: raw.recommendations ?? "",
        affected_prefectures: parseStoredPrefectures(raw.areas_concerned),
      };
    }
  });
  return draft;
}

function initBulletin(): BulletinData {
  const regionForecast = {} as BulletinData["regionForecast"];
  REGIONS.forEach((r) => {
    regionForecast[r] = emptyWeatherEntry();
  });
  const nationalHazard = {} as BulletinData["nationalHazard"];
  HAZARDS.forEach((h) => {
    nationalHazard[h] = emptyNationalHazardEntry();
  });
  const regionHazard = {} as BulletinData["regionHazard"];
  REGIONS.forEach((r) => {
    regionHazard[r] = {} as Record<Hazard, ReturnType<typeof emptyRegionHazardEntry>>;
    HAZARDS.forEach((h) => {
      regionHazard[r][h] = emptyRegionHazardEntry();
    });
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

function formatDisplayDate(iso: string, locale: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString(locale, { dateStyle: "medium" });
}

interface Props {
  username: string;
  fullName: string;
  editBulletinId?: string;
  initialBulletin?: BulletinData;
  loadError?: string;
}

export default function SingleScreenForm({
  username,
  fullName,
  editBulletinId,
  initialBulletin,
  loadError,
}: Props) {
  const router = useRouter();
  const t = useTranslations("singleScreen");
  const locale = useLocale();
  const tWizard = useTranslations("wizard");
  const tCommon = useTranslations("common");
  const { hazard: hazardLabel, riskLevel, windDirection, confidence, submissionStatus } =
    useEnumLabels();
  const { formatAll, formatOne } = useValidationFormatter();

  const isEditing = Boolean(editBulletinId && initialBulletin);
  const [bulletin, setBulletin] = useState<BulletinData>(() => {
    if (initialBulletin) return initialBulletin;
    const next = initBulletin();
    next.metadata.forecaster_name = fullName;
    next.metadata.submission_status = "Draft";
    return next;
  });
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Set<string>>(() => new Set());
  const [validationOpen, setValidationOpen] = useState(false);
  const [showOptional, setShowOptional] = useState(true);
  const [hazardFilter, setHazardFilter] = useState<"All" | Hazard>("All");
  const [expandedScopes, setExpandedScopes] = useState<Record<string, boolean>>({ National: true });
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [prefectureOpen, setPrefectureOpen] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [enhancingKey, setEnhancingKey] = useState<string | null>(null);
  const [summaryOriginalText, setSummaryOriginalText] = useState<string | null>(null);
  const [summaryEnhancedText, setSummaryEnhancedText] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [toast, setToast] = useState<{ msg: string; error?: boolean } | null>(
    loadError ? { msg: loadError, error: true } : null
  );
  const [rowValidateState, setRowValidateState] = useState<
    Record<string, Record<string, "ok" | "err">>
  >({});

  const liveResult = useMemo(() => validateBulletin(bulletin), [bulletin]);

  const touchField = (key: string) =>
    setTouchedFields((prev) => (prev.has(key) ? prev : new Set(prev).add(key)));

  const shouldShowFieldFeedback = (key: string) =>
    submitAttempted || touchedFields.has(key);

  const fieldError = (key: string) => {
    if (!shouldShowFieldFeedback(key) || !liveResult.fieldBlocking.has(key)) return undefined;
    const msg = liveResult.fieldBlockingMsg[key];
    return msg ? formatOne(msg) : undefined;
  };

  const fieldWarn = (key: string) => {
    if (!shouldShowFieldFeedback(key)) return undefined;
    if (liveResult.fieldBlocking.has(key)) return undefined;
    if (!liveResult.fieldWarning.has(key)) return undefined;
    const msg = liveResult.fieldWarningMsg[key];
    return msg ? formatOne(msg) : undefined;
  };

  const fieldHighlight = (key: string) => {
    if (!shouldShowFieldFeedback(key)) return "";
    if (liveResult.fieldBlocking.has(key)) return "border-red-500 bg-red-50";
    if (liveResult.fieldWarning.has(key)) return "border-amber-400 bg-amber-50";
    return "";
  };

  const highlight = fieldHighlight;

  const cellBorder = (scope: "National" | RegionCode, fieldKey: string) => {
    const rowState = rowValidateState[scope];
    if (!rowState || rowState[fieldKey] === undefined) return highlight(fieldKey);
    return rowState[fieldKey] === "err" ? "forecast-cell-err" : "forecast-cell-ok";
  };

  const isRowValidatedOk = (scope: "National" | RegionCode) => {
    const rowState = rowValidateState[scope];
    if (!rowState) return false;
    const values = Object.values(rowState);
    return values.length > 0 && values.every((v) => v === "ok");
  };

  const sectionErrors = useMemo(() => {
    if (submitAttempted) return sectionErrorCounts(liveResult);
    const counts = { s1: 0, s2: 0, s3: 0, s4: 0 };
    liveResult.fieldBlocking.forEach((key) => {
      if (touchedFields.has(key)) counts[sectionForFieldKey(key)] += 1;
    });
    return counts;
  }, [liveResult, touchedFields, submitAttempted]);

  const issues = useMemo(
    () => ({
      blocking: liveResult.blocking.length,
      warnings: liveResult.warnings.length,
      messages: formatAll(liveResult.blocking),
      warningMessages: formatAll(liveResult.warnings),
      result: liveResult,
    }),
    [liveResult, formatAll]
  );

  const fieldBlocking = liveResult.fieldBlocking;
  const fieldWarning = liveResult.fieldWarning;
  const dataSources = useMemo(
    () => parseDataSources(bulletin.metadata.data_sources),
    [bulletin.metadata.data_sources]
  );
  const isShowingOriginalSummary =
    summaryOriginalText !== null &&
    bulletin.metadata.national_forecast_text === summaryOriginalText;
  const canToggleSummaryText =
    summaryOriginalText !== null &&
    summaryEnhancedText !== null &&
    summaryOriginalText !== summaryEnhancedText;

  useEffect(() => {
    if (isEditing) return;
    try {
      const raw = localStorage.getItem(LS_DRAFT_KEY);
      if (raw && !initialBulletin) {
        const draft = migrateBulletinDraft(JSON.parse(raw) as BulletinData);
        draft.metadata.forecaster_name = fullName;
        if (!draft.metadata.submission_status) {
          draft.metadata.submission_status = "Draft";
        }
        setBulletin(draft);
      }
    } catch {
      /* ignore */
    }
  }, [isEditing, initialBulletin, fullName]);

  useEffect(() => {
    if (isEditing) return;
    setBulletin((b) =>
      b.metadata.forecaster_name === fullName
        ? b
        : { ...b, metadata: { ...b.metadata, forecaster_name: fullName } }
    );
  }, [fullName, isEditing]);

  useEffect(() => {
    if (isEditing) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(LS_DRAFT_KEY, JSON.stringify(bulletin));
        setSavedAt(new Date());
      } catch {
        /* ignore */
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [bulletin, isEditing]);

  useEffect(() => {
    if (!bulletin.metadata.forecast_date) return;
    setBulletin((b) => {
      const synced = syncValidityFromForecast(b.metadata);
      if (
        synced.validity_date === b.metadata.validity_date &&
        synced.validity_start_time === b.metadata.validity_start_time &&
        synced.validity_end_time === b.metadata.validity_end_time
      ) {
        return b;
      }
      return { ...b, metadata: synced };
    });
  }, [bulletin.metadata.forecast_date]);

  useEffect(() => {
    if (!toast || toast.error) return;
    const message = toast.msg;
    const timer = setTimeout(() => {
      setToast((current) => (current?.msg === message ? null : current));
    }, 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const setMeta = (key: keyof BulletinData["metadata"], value: string) => {
    touchField(`meta:${key}`);
    setBulletin((b) => {
      const metadata = { ...b.metadata, [key]: value };
      return {
        ...b,
        metadata: key === "forecast_date" ? syncValidityFromForecast(metadata) : metadata,
      };
    });
  };

  const enhanceText = async (
    key: string,
    text: string,
    options: {
      emptyMsg: string;
      successMsg: string;
      onSuccess: (enhanced: string, original: string) => void;
    }
  ) => {
    const trimmed = text.trim();
    if (!trimmed) {
      setToast({ msg: options.emptyMsg, error: true });
      return;
    }

    setEnhancingKey(key);
    setToast(null);
    try {
      const response = await fetch("/api/enhance-forecast-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      });
      const payload = (await response.json().catch(() => null)) as {
        enhancedText?: string;
        error?: string;
      } | null;

      if (!response.ok || !payload?.enhancedText) {
        throw new Error(payload?.error ?? t("s1.enhanceError"));
      }

      options.onSuccess(payload.enhancedText, trimmed);
      setToast({ msg: options.successMsg });
    } catch (error) {
      setToast({
        msg: error instanceof Error ? error.message : t("s1.enhanceError"),
        error: true,
      });
    } finally {
      setEnhancingKey(null);
    }
  };

  const enhanceNationalSummary = async () => {
    touchField("meta:national_forecast_text");
    await enhanceText("meta:national_forecast_text", bulletin.metadata.national_forecast_text, {
      emptyMsg: t("s1.enhanceEmpty"),
      successMsg: t("s1.enhanceSuccess"),
      onSuccess: (enhanced, original) => {
        setSummaryOriginalText(original);
        setSummaryEnhancedText(enhanced);
        setMeta("national_forecast_text", enhanced);
      },
    });
  };

  const enhanceGeneralComment = async () => {
    await enhanceText("meta:general_comment", bulletin.metadata.general_comment, {
      emptyMsg: t("s1.enhanceCommentEmpty"),
      successMsg: t("s1.enhanceCommentSuccess"),
      onSuccess: (enhanced) => setMeta("general_comment", enhanced),
    });
  };

  const enhanceHazardComment = async (
    scope: "National" | RegionCode,
    hazard: Hazard,
    current: string
  ) => {
    const key =
      scope === "National"
        ? `nathazard:${hazard}:comment`
        : `regionhazard:${scope}:${hazard}:comment`;
    await enhanceText(key, current, {
      emptyMsg: t("s1.enhanceCommentEmpty"),
      successMsg: t("s1.enhanceCommentSuccess"),
      onSuccess: (enhanced) => {
        if (scope === "National") setNationalHazard(hazard, "comment", enhanced);
        else setRegionHazard(scope, hazard, "comment", enhanced);
      },
    });
  };

  const enhanceInterpretationField = async (field: keyof Interpretation) => {
    const key = `interp:${field}`;
    await enhanceText(key, bulletin.interpretation[field], {
      emptyMsg: t("s1.enhanceTextEmpty"),
      successMsg: t("s1.enhanceTextSuccess"),
      onSuccess: (enhanced) => {
        if (field === "general_situation") touchField(key);
        setBulletin((b) => ({
          ...b,
          interpretation: { ...b.interpretation, [field]: enhanced },
        }));
      },
    });
  };

  const toggleOriginalSummary = () => {
    if (!summaryOriginalText || !summaryEnhancedText) return;
    setMeta(
      "national_forecast_text",
      isShowingOriginalSummary ? summaryEnhancedText : summaryOriginalText
    );
  };

  const setWeatherField = (scope: "National" | RegionCode, key: keyof WeatherEntry, value: string) => {
    const prefix = scope === "National" ? "national" : `region:${scope}`;
    touchField(`${prefix}:${key}`);
    setRowValidateState((prev) => {
      if (!prev[scope]) return prev;
      const next = { ...prev };
      delete next[scope];
      return next;
    });
    setBulletin((b) => {
      if (scope === "National") {
        return { ...b, nationalForecast: { ...b.nationalForecast, [key]: value } };
      }
      return {
        ...b,
        regionForecast: {
          ...b.regionForecast,
          [scope]: { ...b.regionForecast[scope], [key]: value },
        },
      };
    });
  };

  const validateForecastRow = (scope: "National" | RegionCode) => {
    const entry =
      scope === "National" ? bulletin.nationalForecast : bulletin.regionForecast[scope];
    const result = validateWeatherRow(scope, entry);
    const prefix = scope === "National" ? "national" : `region:${scope}`;
    const rowState: Record<string, "ok" | "err"> = {};
    const touched = new Set(touchedFields);

    WEATHER_ROW_FIELDS.forEach((field) => {
      const key = `${prefix}:${field}`;
      touched.add(key);
      const hasIssue =
        result.fieldBlocking.has(key) || result.fieldWarning.has(key);
      rowState[key] = hasIssue ? "err" : "ok";
    });

    setTouchedFields(touched);
    setRowValidateState((r) => ({ ...r, [scope]: rowState }));
  };

  const copyNationalToAll = () => {
    setBulletin((b) => {
      const next = { ...b.regionForecast };
      REGIONS.forEach((r) => {
        next[r] = { ...b.nationalForecast };
      });
      return { ...b, regionForecast: next };
    });
  };

  const copyNationalToRegion = (region: RegionCode) => {
    setBulletin((b) => ({
      ...b,
      regionForecast: { ...b.regionForecast, [region]: { ...b.nationalForecast } },
    }));
  };

  const setNationalHazard = (hazard: Hazard, field: string, value: string | string[]) => {
    touchField(`nathazard:${hazard}:${field}`);
    setBulletin((b) => ({
      ...b,
      nationalHazard: {
        ...b.nationalHazard,
        [hazard]: { ...b.nationalHazard[hazard], [field]: value },
      },
    }));
  };

  const setRegionHazard = (
    region: RegionCode,
    hazard: Hazard,
    field: string,
    value: string | string[]
  ) => {
    touchField(`regionhazard:${region}:${hazard}:${field}`);
    setBulletin((b) => ({
      ...b,
      regionHazard: {
        ...b.regionHazard,
        [region]: {
          ...b.regionHazard[region],
          [hazard]: { ...b.regionHazard[region][hazard], [field]: value },
        },
      },
    }));
  };

  const scrollToSection = (section: string) => {
    document.getElementById(section)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const saveBulletin = async () => {
    const toSave: BulletinData = {
      ...bulletin,
      metadata: syncValidityFromForecast({
        ...bulletin.metadata,
        forecaster_name: fullName || bulletin.metadata.forecaster_name,
        submission_status: isEditing
          ? bulletin.metadata.submission_status || "Submitted"
          : "Submitted",
      }),
    };
    setBulletin(toSave);
    setSubmitAttempted(true);

    const full = validateBulletin(toSave);
    setValidationOpen(full.blocking.length > 0 || full.warnings.length > 0);
    if (full.blocking.length > 0) {
      const section = firstSectionWithErrors(full);
      if (section) scrollToSection(section);
      setToast({
        msg: tWizard("blockingBeforeSave", { count: full.blocking.length }),
        error: true,
      });
      setTimeout(() => setToast(null), 3200);
      return;
    }
    setSubmitting(true);
    try {
      const saveResult =
        isEditing && editBulletinId
          ? await updateBulletinToDatabase(editBulletinId, toSave)
          : await submitBulletinToDatabase(toSave);
      if (!saveResult.success) {
        setToast({ msg: saveResult.error, error: true });
      } else {
        if (!isEditing) localStorage.removeItem(LS_DRAFT_KEY);
        setValidationOpen(false);
        setToast({
          msg: saveResult.message ?? (isEditing ? tWizard("updated") : tWizard("saved")),
        });
      }
    } finally {
      setSubmitting(false);
      setTimeout(() => setToast(null), 3200);
    }
  };

  const clearDraft = () => {
    if (!confirm(t("clearDraftConfirm"))) return;
    localStorage.removeItem(LS_DRAFT_KEY);
    const next = initBulletin();
    next.metadata.forecaster_name = fullName;
    next.metadata.submission_status = "Draft";
    setBulletin(next);
    setSubmitAttempted(false);
    setTouchedFields(new Set());
    setValidationOpen(false);
  };

  const cancelEdit = () => {
    router.replace("/");
    router.refresh();
  };

  const status = bulletin.metadata.submission_status || "Draft";
  const statusLabel =
    status === "Draft" || status === "Submitted" || status === "Validated"
      ? submissionStatus(status)
      : status;

  return (
    <div className="min-h-screen bg-[#f5f2ea] text-[#1f2d3a]">
      <AppHeader username={username} />

      <div className="sticky top-[var(--header-height,72px)] z-20 bg-[#0f3a4a] text-white shadow-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-start justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-white/70 sm:text-sm">{t("tagline")}</p>
            {isEditing && (
              <p className="mt-1 truncate text-[11px] text-amber-200">
                {t("editingBulletin", { id: editBulletinId ?? "" })}
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {savedAt && !isEditing && (
              <span className="hidden text-[10px] text-white/60 md:inline">
                {t("draftSaved", {
                  time: savedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                })}
              </span>
            )}
            <span
              className={`rounded border px-2 py-1 text-[10px] font-semibold tracking-wider ${
                status === "Submitted" || status === "Validated"
                  ? "border-emerald-300 bg-emerald-500/20 text-emerald-100"
                  : "border-white/25 bg-white/5"
              }`}
            >
              {t("statusLabel", { status: statusLabel })}
            </span>
          </div>
        </div>
        <div className="border-t-2 border-[#c9a24a]" />
        <nav className="mx-auto flex max-w-7xl flex-wrap gap-1 overflow-x-auto px-2 py-1 text-xs sm:px-4">
          <SectionTab href="#s1" label={t("nav.s1")} errors={sectionErrors.s1} />
          <SectionTab href="#s2" label={t("nav.s2")} errors={sectionErrors.s2} />
          <SectionTab href="#s3" label={t("nav.s3")} errors={sectionErrors.s3} />
          <SectionTab href="#s4" label={t("nav.s4")} errors={sectionErrors.s4} />
        </nav>
      </div>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 pb-32 sm:px-6">
        {/* Section 1 */}
        <section id="s1" className={cardCls}>
          <SectionHeader title={t("s1.title")} chip={t("s1.chip")} subtitle={t("s1.subtitle")} />
          <div className="bulletin-meta-grid">
            <FormField label={t("s1.forecastDate")} required errorMsg={fieldError("meta:forecast_date")} warnMsg={fieldWarn("meta:forecast_date")}>
              <input
                type="date"
                value={bulletin.metadata.forecast_date}
                onChange={(e) => setMeta("forecast_date", e.target.value)}
                className={`${inputCls} ${highlight("meta:forecast_date")}`}
              />
            </FormField>
            <FormField label={t("s1.publicationTime")} required errorMsg={fieldError("meta:publication_time")}>
              <input
                type="time"
                value={bulletin.metadata.publication_time}
                onChange={(e) => setMeta("publication_time", e.target.value)}
                className={`${inputCls} ${highlight("meta:publication_time")}`}
              />
            </FormField>
            <FormField label={t("s1.forecasterName")} required>
              <input
                value={bulletin.metadata.forecaster_name}
                readOnly
                className={`${inputCls} bg-[#f3f1eb] text-[#5c6a76]`}
              />
            </FormField>
            <FormField label={t("s1.validityPeriod")} required>
              <div className={`${inputCls} bg-[#f3f1eb] text-[#5c6a76]`}>
                {bulletin.metadata.forecast_date
                  ? t("s1.validityPeriodValue", {
                      date: formatDisplayDate(bulletin.metadata.forecast_date, locale),
                    })
                  : t("s1.validityPeriodPending")}
              </div>
            </FormField>
          </div>
          <div className="bulletin-meta-grid-wide mt-4">
            <FormField label={t("s1.dataSources")} required hint={t("s1.dataSourcesHint")} errorMsg={fieldError("meta:data_sources")}>
              <MultiSelectDropdown
                open={sourcesOpen}
                onToggle={() => {
                  touchField("meta:data_sources");
                  setSourcesOpen((o) => !o);
                }}
                value={dataSources}
                onChange={(v) => {
                  touchField("meta:data_sources");
                  setMeta("data_sources", serializeDataSources(v));
                }}
                options={DATA_SOURCE_OPTIONS}
                needed={shouldShowFieldFeedback("meta:data_sources") && fieldBlocking.has("meta:data_sources")}
                placeholder={t("s1.dataSourcesPlaceholder")}
              />
            </FormField>
            <div className="block">
              <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-semibold text-[#1f2d3a]">
                  {t("s1.nationalSummary")}
                  <span className="text-red-600">*</span>
                </div>
                {canToggleSummaryText && (
                  <button
                    type="button"
                    onClick={toggleOriginalSummary}
                    className="whitespace-nowrap rounded border border-black/15 bg-white px-3 py-1 text-xs font-semibold text-[#4b5563] transition hover:bg-black/5"
                  >
                    {isShowingOriginalSummary ? t("s1.showEnhanced") : t("s1.showOriginal")}
                  </button>
                )}
              </div>
              <div className="enhance-input-wrap">
                <textarea
                  rows={3}
                  value={bulletin.metadata.national_forecast_text}
                  onChange={(e) => {
                    setSummaryOriginalText(null);
                    setSummaryEnhancedText(null);
                    setMeta("national_forecast_text", e.target.value);
                  }}
                  className={`${inputCls} ${highlight("meta:national_forecast_text")}`}
                />
                <EnhanceIconButton
                  onClick={enhanceNationalSummary}
                  disabled={enhancingKey !== null}
                  title={enhancingKey === "meta:national_forecast_text" ? t("s1.enhancing") : t("s1.enhance")}
                />
              </div>
              {fieldError("meta:national_forecast_text") && (
                <div className="mt-1 text-[11px] text-red-700">
                  {fieldError("meta:national_forecast_text")}
                </div>
              )}
              {!fieldError("meta:national_forecast_text") &&
                fieldWarn("meta:national_forecast_text") && (
                  <div className="mt-1 text-[11px] text-amber-700">
                    {fieldWarn("meta:national_forecast_text")}
                  </div>
                )}
            </div>
          </div>
          <div className="mt-4">
            <FormField label={t("s1.comments")} optional>
              <div className="enhance-input-wrap">
                <textarea
                  rows={2}
                  value={bulletin.metadata.general_comment}
                  onChange={(e) => setMeta("general_comment", e.target.value)}
                  className={inputCls}
                />
                <EnhanceIconButton
                  onClick={enhanceGeneralComment}
                  disabled={enhancingKey !== null}
                  title={
                    enhancingKey === "meta:general_comment" ? t("s1.enhancing") : t("s1.enhance")
                  }
                />
              </div>
            </FormField>
          </div>
        </section>

        {/* Section 2 */}
        <section id="s2" className={cardCls}>
          <SectionHeader title={t("s2.title")} chip={t("s2.chip")} subtitle={t("s2.subtitle")} />
          <div className="forecast-toolbar">
            <label className="forecast-toolbar-checkbox">
              <input
                type="checkbox"
                checked={showOptional}
                onChange={(e) => setShowOptional(e.target.checked)}
              />
              {t("s2.showOptional")}
            </label>
            <button type="button" onClick={copyNationalToAll} className="forecast-toolbar-copy">
              {t("s2.copyNational")}
            </button>
          </div>
          <div className="forecast-table-wrap -mx-2 px-2">
            <table className="forecast-table text-sm">
              <thead>
                <tr className="border-b border-black/10">
                  <th className="col-scope py-2 text-left text-[10px] font-medium uppercase tracking-wider text-[#5c6a76]">
                    {t("s2.scope")}
                  </th>
                  <Th req className="col-num">{t("s2.minTemp")}</Th>
                  <Th req className="col-num">{t("s2.maxTemp")}</Th>
                  <Th req className="col-num">{t("s2.thermalComfort")}</Th>
                  <Th req className="col-num">{t("s2.humidity")}</Th>
                  {showOptional && <Th className="col-num">{t("s2.pressure")}</Th>}
                  <Th req className="col-select">{t("s2.windDir")}</Th>
                  <Th req className="col-num">{t("s2.windSpeed")}</Th>
                  <Th req className="col-num">{t("s2.rainfall")}</Th>
                  {showOptional && <Th className="col-num">{t("s2.sunshine")}</Th>}
                  {showOptional && <Th className="col-select">{t("s2.confidence")}</Th>}
                  <th className="col-action" />
                  <th className="col-validate py-2 text-center text-[10px] font-medium uppercase tracking-wider text-[#5c6a76]">
                    {t("s2.validate")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {(["National", ...REGIONS] as const).map((scope) => {
                  const isNat = scope === "National";
                  const row = isNat ? bulletin.nationalForecast : bulletin.regionForecast[scope];
                  const prefix = isNat ? "national" : `region:${scope}`;
                  const fk = (field: keyof WeatherEntry) => `${prefix}:${field}`;
                  const cellInputCls = (field: keyof WeatherEntry) =>
                    `${cellCls} ${cellBorder(scope, fk(field))}`;
                  return (
                    <tr
                      key={scope}
                      className={`border-b border-black/5 ${isNat ? "bg-[#0f3a4a]/5" : ""}`}
                    >
                      <td className={`col-scope py-2 pr-1 text-sm font-semibold ${isNat ? "text-[#0f3a4a]" : ""}`}>
                        {isNat ? t("s2.national") : regionDisplayLabel(scope)}
                      </td>
                      {(["temp_min_c", "temp_max_c"] as const).map((field) => (
                        <td key={field} className="col-num p-1 align-top">
                          <FieldCell errorMsg={fieldError(fk(field))} warnMsg={fieldWarn(fk(field))}>
                            <input
                              type="number"
                              step="0.1"
                              value={row[field]}
                              onChange={(e) => setWeatherField(scope, field, e.target.value)}
                              className={cellInputCls(field)}
                            />
                          </FieldCell>
                        </td>
                      ))}
                      <td className="col-num p-1 align-top">
                        <FieldCell
                          errorMsg={fieldError(fk("temp_ressentie_c"))}
                          warnMsg={fieldWarn(fk("temp_ressentie_c"))}
                        >
                          <input
                            type="number"
                            step="0.1"
                            value={row.temp_ressentie_c}
                            onChange={(e) => setWeatherField(scope, "temp_ressentie_c", e.target.value)}
                            className={cellInputCls("temp_ressentie_c")}
                          />
                        </FieldCell>
                      </td>
                      <td className="col-num p-1 align-top">
                        <FieldCell
                          errorMsg={fieldError(fk("relative_humidity_pct"))}
                          warnMsg={fieldWarn(fk("relative_humidity_pct"))}
                        >
                          <input
                            type="number"
                            step="0.1"
                            value={row.relative_humidity_pct}
                            onChange={(e) => setWeatherField(scope, "relative_humidity_pct", e.target.value)}
                            className={cellInputCls("relative_humidity_pct")}
                          />
                        </FieldCell>
                      </td>
                      {showOptional && (
                        <td className="col-num p-1 align-top">
                          <FieldCell
                            errorMsg={fieldError(fk("pressure_hpa"))}
                            warnMsg={fieldWarn(fk("pressure_hpa"))}
                          >
                            <input
                              type="number"
                              step="0.1"
                              value={row.pressure_hpa}
                              onChange={(e) => setWeatherField(scope, "pressure_hpa", e.target.value)}
                              className={cellInputCls("pressure_hpa")}
                            />
                          </FieldCell>
                        </td>
                      )}
                      <td className="col-select p-1 align-top">
                        <FieldCell
                          errorMsg={fieldError(fk("wind_direction"))}
                          warnMsg={fieldWarn(fk("wind_direction"))}
                        >
                          <select
                            value={row.wind_direction}
                            onChange={(e) => setWeatherField(scope, "wind_direction", e.target.value)}
                            className={cellInputCls("wind_direction")}
                          >
                            <option value="">—</option>
                            {WIND_DIRECTIONS.map((w) => (
                              <option key={w} value={w}>
                                {windDirection(w)}
                              </option>
                            ))}
                          </select>
                        </FieldCell>
                      </td>
                      <td className="col-num p-1 align-top">
                        <FieldCell errorMsg={fieldError(fk("wind_speed_kmh"))} warnMsg={fieldWarn(fk("wind_speed_kmh"))}>
                          <input
                            type="number"
                            value={row.wind_speed_kmh}
                            onChange={(e) => setWeatherField(scope, "wind_speed_kmh", e.target.value)}
                            className={cellInputCls("wind_speed_kmh")}
                          />
                        </FieldCell>
                      </td>
                      <td className="col-num p-1 align-top">
                        <FieldCell errorMsg={fieldError(fk("rainfall_mm"))} warnMsg={fieldWarn(fk("rainfall_mm"))}>
                          <input
                            type="number"
                            value={row.rainfall_mm}
                            onChange={(e) => setWeatherField(scope, "rainfall_mm", e.target.value)}
                            className={cellInputCls("rainfall_mm")}
                          />
                        </FieldCell>
                      </td>
                      {showOptional && (
                        <td className="col-num p-1 align-top">
                          <FieldCell
                            errorMsg={fieldError(fk("sunshine_pct"))}
                            warnMsg={fieldWarn(fk("sunshine_pct"))}
                          >
                            <input
                              type="number"
                              value={row.sunshine_pct}
                              onChange={(e) => setWeatherField(scope, "sunshine_pct", e.target.value)}
                              className={cellInputCls("sunshine_pct")}
                            />
                          </FieldCell>
                        </td>
                      )}
                      {showOptional && (
                        <td className="col-select p-1 align-top">
                          <select
                            value={row.confidence}
                            onChange={(e) => setWeatherField(scope, "confidence", e.target.value)}
                            className={cellInputCls("confidence")}
                          >
                            <option value="">—</option>
                            {CONFIDENCE_LEVELS.map((c) => (
                              <option key={c} value={c}>
                                {confidence(c)}
                              </option>
                            ))}
                          </select>
                        </td>
                      )}
                      <td className="col-action p-1 text-center">
                        {!isNat && (
                          <button
                            type="button"
                            onClick={() => copyNationalToRegion(scope)}
                            className="rounded border border-black/15 bg-white px-1.5 py-0.5 text-[10px] text-[#0f3a4a] hover:bg-[#0f3a4a]/5"
                            title={t("s2.copyRow")}
                          >
                            ⤓
                          </button>
                        )}
                      </td>
                      <td className="col-validate p-1 text-center align-middle">
                        <ValidateRowButton
                          onClick={() => validateForecastRow(scope)}
                          title={t("s2.validateRow")}
                          passed={isRowValidatedOk(scope)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[11px] text-[#8a95a0]">{t("s2.legend")}</p>
        </section>

        {/* Section 3 — Hazards */}
        <section id="s3" className={cardCls}>
          <SectionHeader title={t("s3.title")} chip={t("s3.chip")} subtitle={t("s3.subtitle")} />
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <label className="text-xs font-medium">{t("s3.hazardFilter")}</label>
            <select
              value={hazardFilter}
              onChange={(e) => setHazardFilter(e.target.value as "All" | Hazard)}
              className="rounded border border-black/15 bg-white px-2 py-1 text-sm"
            >
              <option value="All">{t("s3.filterAll")}</option>
              {HAZARDS.map((h) => (
                <option key={h} value={h}>
                  {hazardLabel(h)}
                </option>
              ))}
            </select>
            <span className="text-xs text-[#8a95a0]">{t("s3.filterNote")}</span>
            <div className="ml-auto flex gap-3">
              <button
                type="button"
                onClick={() =>
                  setExpandedScopes(Object.fromEntries(HAZARD_SCOPES.map((s) => [s, true])))
                }
                className="text-xs text-[#0f3a4a] hover:underline"
              >
                {t("s3.expandAll")}
              </button>
              <button
                type="button"
                onClick={() => setExpandedScopes({})}
                className="text-xs text-[#0f3a4a] hover:underline"
              >
                {t("s3.collapseAll")}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {HAZARD_SCOPES.map((scope) => {
              const open = !!expandedScopes[scope];
              const isNat = scope === "National";
              const scopeLabel = isNat
                ? t("s3.national")
                : t("s3.regionLabel", { code: scope, name: regionDisplayLabel(scope) });
              const filled = HAZARDS.filter((h) =>
                isNat
                  ? bulletin.nationalHazard[h].risk_level
                  : bulletin.regionHazard[scope][h].risk_level
              ).length;
              const scopeErrorCount = [...fieldBlocking].filter((k) =>
                isNat ? k.startsWith("nathazard:") : k.startsWith(`regionhazard:${scope}:`)
              ).length;

              return (
                <div key={scope} className="overflow-hidden rounded border border-black/10 bg-white">
                  <button
                    type="button"
                    onClick={() => setExpandedScopes((p) => ({ ...p, [scope]: !p[scope] }))}
                    className={`flex w-full items-center justify-between gap-2 px-4 py-2 text-left text-sm ${
                      isNat ? "bg-[#faf7f0]" : "bg-[#faf7f0]/60 hover:bg-[#faf7f0]"
                    }`}
                  >
                    <span className="font-semibold">{scopeLabel}</span>
                    <span className="flex items-center gap-2 text-xs text-[#5c6a76]">
                      <span>{t("s3.filled", { count: filled, total: HAZARDS.length })}</span>
                      {scopeErrorCount > 0 && (
                        <span className="rounded bg-red-100 px-1.5 py-0.5 text-red-800">
                          {scopeErrorCount}
                        </span>
                      )}
                      <span>{open ? "−" : "+"}</span>
                    </span>
                  </button>
                  {open && (
                    <div className="hazard-grid-wrap px-4 py-2">
                      <div
                        className={`hazard-grid hazard-grid-header ${isNat ? "hazard-grid-national" : ""}`}
                      >
                        <div>{t("s3.colHazard")}</div>
                        <div>{t("s3.colRisk")}</div>
                        {!isNat && <div>{t("s3.prefectures")}</div>}
                        <div>{t("s3.colComment")}</div>
                      </div>
                      {HAZARDS.filter((h) => hazardFilter === "All" || hazardFilter === h).map(
                        (h) => {
                          const entry = isNat
                            ? bulletin.nationalHazard[h]
                            : bulletin.regionHazard[scope][h];
                          const keyPrefix = isNat
                            ? `nathazard:${h}`
                            : `regionhazard:${scope}:${h}`;
                          const commentRequired =
                            entry.risk_level === "High" || entry.risk_level === "Very High";
                          const prefKey = `${keyPrefix}:affected_prefectures`;
                          const prefOpenKey = `${scope}:${h}`;
                          const prefDisabled =
                            !entry.risk_level || entry.risk_level === "None";
                          return (
                            <div
                              key={h}
                              className={`hazard-grid hazard-grid-row ${isNat ? "hazard-grid-national" : ""}`}
                            >
                              <div className="hazard-grid-label">{hazardLabel(h)}</div>
                              <FieldCell
                                errorMsg={fieldError(`${keyPrefix}:risk_level`)}
                                warnMsg={fieldWarn(`${keyPrefix}:risk_level`)}
                              >
                                <select
                                  value={entry.risk_level}
                                  onChange={(e) =>
                                    isNat
                                      ? setNationalHazard(h, "risk_level", e.target.value)
                                      : setRegionHazard(scope, h, "risk_level", e.target.value)
                                  }
                                  className={`${inputCls} ${riskColor(entry.risk_level)} ${highlight(`${keyPrefix}:risk_level`)}`}
                                >
                                  <option value="">{t("s3.riskPlaceholder")}</option>
                                  {RISK_LEVELS.map((r) => (
                                    <option key={r} value={r}>
                                      {riskLevel(r)}
                                    </option>
                                  ))}
                                </select>
                              </FieldCell>
                              {!isNat && (
                                <FieldCell errorMsg={fieldError(prefKey)} warnMsg={fieldWarn(prefKey)}>
                                  <MultiSelectDropdown
                                    open={prefectureOpen === prefOpenKey}
                                    onToggle={() => {
                                      touchField(prefKey);
                                      setPrefectureOpen((prev) =>
                                        prev === prefOpenKey ? null : prefOpenKey
                                      );
                                    }}
                                    value={bulletin.regionHazard[scope][h].affected_prefectures}
                                    onChange={(v) =>
                                      setRegionHazard(scope, h, "affected_prefectures", v)
                                    }
                                    options={prefecturesForRegion(scope)}
                                    disabled={prefDisabled}
                                    disabledPlaceholder={t("s3.prefecturesDisabled")}
                                    needed={
                                      shouldShowFieldFeedback(prefKey) && fieldBlocking.has(prefKey)
                                    }
                                    placeholder={t("s3.prefecturesPlaceholder", {
                                      name: regionDisplayLabel(scope),
                                    })}
                                  />
                                </FieldCell>
                              )}
                              <FieldCell
                                errorMsg={fieldError(`${keyPrefix}:comment`)}
                                warnMsg={fieldWarn(`${keyPrefix}:comment`)}
                              >
                                <div className="enhance-input-wrap">
                                  <input
                                    value={entry.comment}
                                    onChange={(e) =>
                                      isNat
                                        ? setNationalHazard(h, "comment", e.target.value)
                                        : setRegionHazard(scope, h, "comment", e.target.value)
                                    }
                                    placeholder={
                                      commentRequired
                                        ? t("s3.commentRequired")
                                        : t("s3.commentOptional")
                                    }
                                    className={`${inputCls} ${highlight(`${keyPrefix}:comment`)}`}
                                  />
                                  <EnhanceIconButton
                                    onClick={() =>
                                      enhanceHazardComment(isNat, scope, h, entry.comment)
                                    }
                                    disabled={enhancingKey !== null}
                                    title={
                                      enhancingKey === `${keyPrefix}:comment`
                                        ? t("s1.enhancing")
                                        : t("s1.enhance")
                                    }
                                  />
                                </div>
                              </FieldCell>
                            </div>
                          );
                        }
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <p className="mt-4 rounded border border-black/10 bg-white px-4 py-3 text-xs text-[#5c6a76]">
            {t("s3.tip")}
          </p>
        </section>

        {/* Section 4 */}
        <section id="s4" className={cardCls}>
          <SectionHeader title={t("s4.title")} subtitle={t("s4.subtitle")} />
          <div className="space-y-4">
            <FormField label={t("s4.generalSituation")} required errorMsg={fieldError("interp:general_situation")} warnMsg={fieldWarn("interp:general_situation")}>
              <div className="enhance-input-wrap">
                <textarea
                  rows={5}
                  value={bulletin.interpretation.general_situation}
                  onChange={(e) => {
                    touchField("interp:general_situation");
                    setBulletin((b) => ({
                      ...b,
                      interpretation: { ...b.interpretation, general_situation: e.target.value },
                    }));
                  }}
                  className={`${inputCls} ${highlight("interp:general_situation")}`}
                />
                <EnhanceIconButton
                  onClick={() => enhanceInterpretationField("general_situation")}
                  disabled={enhancingKey !== null}
                  title={
                    enhancingKey === "interp:general_situation" ? t("s1.enhancing") : t("s1.enhance")
                  }
                />
              </div>
              <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <span className="text-[#8a95a0]">{t("s4.interpTip")}</span>
                <span
                  className={
                    bulletin.interpretation.general_situation.trim().length < 20
                      ? "text-amber-700"
                      : "text-[#5c6a76]"
                  }
                >
                  {t("s4.charCount", {
                    count: bulletin.interpretation.general_situation.trim().length,
                  })}
                </span>
              </div>
            </FormField>
            {(
              [
                ["expected_conditions", t("s4.expectedConditions")],
                ["risk_areas", t("s4.riskAreas")],
                ["expected_evolution", t("s4.expectedEvolution")],
                ["recommendations", t("s4.recommendations")],
                ["additional_notes", t("s4.additionalNotes")],
              ] as const
            ).map(([key, label]) => (
              <FormField key={key} label={label} optional>
                <div className="enhance-input-wrap">
                  <textarea
                    rows={2}
                    value={bulletin.interpretation[key]}
                    onChange={(e) =>
                      setBulletin((b) => ({
                        ...b,
                        interpretation: { ...b.interpretation, [key]: e.target.value },
                      }))
                    }
                    className={inputCls}
                  />
                  <EnhanceIconButton
                    onClick={() => enhanceInterpretationField(key)}
                    disabled={enhancingKey !== null}
                    title={enhancingKey === `interp:${key}` ? t("s1.enhancing") : t("s1.enhance")}
                  />
                </div>
              </FormField>
            ))}
          </div>
        </section>

        {submitAttempted && validationOpen && (
          <section className="rounded-md border border-black/10 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">
                {t("validation.title", {
                  errors: issues.blocking,
                  warnings: issues.warnings,
                })}
              </h3>
              <button
                type="button"
                onClick={() => setValidationOpen(false)}
                className="text-xs text-[#5c6a76] hover:text-black"
              >
                {tCommon("close")}
              </button>
            </div>
            {issues.blocking === 0 && issues.warnings === 0 ? (
              <p className="text-sm text-green-700">{t("validation.passed")}</p>
            ) : (
              <ul className="max-h-72 space-y-1 overflow-y-auto text-xs">
                {issues.messages.map((msg, idx) => (
                  <li key={`e-${idx}`} className="rounded bg-red-50 px-2 py-1 text-red-800">
                    {msg}
                  </li>
                ))}
                {issues.warningMessages.map((msg, idx) => (
                  <li key={`w-${idx}`} className="rounded bg-amber-50 px-2 py-1 text-amber-800">
                    {msg}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 z-30 border-t border-black/10 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#5c6a76]">
            <span className="hidden md:inline">{t("footer.hint")}</span>
            {submitAttempted && issues.blocking > 0 && (
              <span className="rounded bg-red-100 px-2 py-0.5 text-red-800">
                {t("footer.errors", { count: issues.blocking })}
              </span>
            )}
            {submitAttempted && issues.warnings > 0 && (
              <span className="rounded bg-amber-100 px-2 py-0.5 text-amber-800">
                {t("footer.warnings", { count: issues.warnings })}
              </span>
            )}
          </div>
          <div className="flex w-full flex-wrap justify-end gap-2 sm:w-auto">
            {isEditing && (
              <button
                type="button"
                onClick={cancelEdit}
                className="rounded border border-black/15 bg-white px-3 py-2 text-xs text-[#5c6a76] hover:bg-black/5"
              >
                {tCommon("cancelEdit")}
              </button>
            )}
            {!isEditing && (
              <button
                type="button"
                onClick={clearDraft}
                className="rounded border border-black/15 bg-white px-3 py-2 text-xs text-[#5c6a76] hover:bg-black/5"
              >
                {t("clearDraft")}
              </button>
            )}
            <button
              type="button"
              onClick={saveBulletin}
              disabled={submitting}
              className="rounded bg-[#0f3a4a] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#0f3a4a]/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting
                ? tCommon("saving")
                : isEditing
                  ? tWizard("update")
                  : tWizard("submit")}
            </button>
          </div>
        </div>
      </footer>

      {toast && (
        <div
          className={`fixed bottom-20 left-1/2 z-40 -translate-x-1/2 rounded px-4 py-2 text-sm shadow-lg ${
            toast.error ? "bg-red-600 text-white" : "bg-[#0f3a4a] text-white"
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
