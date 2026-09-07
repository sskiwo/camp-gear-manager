'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CloudSun, MapPin, Calendar, Loader2, Sparkles, AlertCircle, Edit2, X, Check, ChevronDown, ChevronUp } from 'lucide-react';

interface WeatherData {
  location: string;
  query: string;
  targetDate?: string | null;
  date: string;
  isDateMatched: boolean;
  isHistorical?: boolean;
  dateNote?: string | null;
  weatherCode: number;
  weatherLabel: string;
  weatherIcon: string;
  maxTemp: number;
  minTemp: number;
  rainChance: number;
  precipitationSum?: number | null;
  advice: string;
}

interface WeatherInsightBannerProps {
  campId: string;
  location?: string;
  eventDate?: string;
  onUpdateCampDetails?: (location: string, eventDate: string) => Promise<void> | void;
  isReadOnly?: boolean;
}

export default function WeatherInsightBanner({
  campId,
  location: externalLocation = '',
  eventDate: externalDate = '',
  onUpdateCampDetails,
  isReadOnly = false,
}: WeatherInsightBannerProps) {
  const [location, setLocation] = useState(externalLocation);
  const [eventDate, setEventDate] = useState(externalDate);

  const [weather, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [inputLocation, setInputLocation] = useState(externalLocation);
  const [inputDate, setInputDate] = useState(externalDate);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (externalLocation) {
      setLocation(externalLocation);
      setInputLocation(externalLocation);
    } else if (campId) {
      try {
        const cached = localStorage.getItem(`camp_meta_${campId}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.location) {
            setLocation(parsed.location);
            setInputLocation(parsed.location);
            return;
          }
        }
      } catch {}
      setLocation('');
      setInputLocation('');
    } else {
      setLocation('');
      setInputLocation('');
    }
  }, [externalLocation, campId]);

  useEffect(() => {
    if (externalDate) {
      setEventDate(externalDate);
      setInputDate(externalDate);
    } else if (campId) {
      try {
        const cached = localStorage.getItem(`camp_meta_${campId}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.event_date) {
            setEventDate(parsed.event_date);
            setInputDate(parsed.event_date);
            return;
          }
        }
      } catch {}
      setEventDate('');
      setInputDate('');
    } else {
      setEventDate('');
      setInputDate('');
    }
  }, [externalDate, campId]);

  const fetchWeather = useCallback(async (loc: string, date: string) => {
    if (!loc.trim()) {
      setWeatherData(null);
      setErrorMessage(null);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const queryParams = new URLSearchParams({
        location: loc.trim(),
        date: date.trim(),
      });

      const res = await fetch(`/api/weather?${queryParams.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '天気の取得に失敗しました');
      }

      setWeatherData(data);
    } catch (err: any) {
      console.warn('Weather fetch error:', err.message);
      setErrorMessage(err.message);
      setWeatherData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (location) {
      fetchWeather(location, eventDate);
    } else {
      setWeatherData(null);
    }
  }, [location, eventDate, fetchWeather]);

  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    const finalLoc = inputLocation.trim();
    const finalDate = inputDate.trim();

    try {
      setLocation(finalLoc);
      setEventDate(finalDate);
      if (onUpdateCampDetails) {
        await onUpdateCampDetails(finalLoc, finalDate);
      }
      setIsEditing(false);
      fetchWeather(finalLoc, finalDate);
    } catch (err) {
      console.error('Failed to save camp weather details:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-[#18181B] border border-zinc-800 rounded-2xl p-2.5 sm:p-3.5 shadow-xl space-y-2 transition-all overflow-hidden">
      {/* コンパクト要約バー（通常時は1行でスマート表示） */}
      <div className="flex items-center justify-between gap-2">
        <div
          onClick={() => weather && setIsDetailOpen(!isDetailOpen)}
          className={`flex items-center gap-2 min-w-0 flex-1 ${weather ? 'cursor-pointer select-none group/weather' : ''}`}
          title={weather ? (isDetailOpen ? 'クリックして助言を折りたたむ' : 'クリックして山仲間の助言を展開') : undefined}
        >
          <div className="flex items-center gap-1.5 shrink-0">
            <CloudSun className={`w-4 h-4 ${weather?.isHistorical ? 'text-amber-400' : 'text-[#00E5FF]'} shrink-0`} />
            {weather ? (
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-bold text-white flex-wrap sm:flex-nowrap min-w-0 flex-1">
                <span
                  className="truncate text-zinc-100 group-hover/weather:text-[#00E5FF] transition-colors"
                  title={weather.location}
                >
                  {weather.location}
                </span>
                <span className="text-zinc-600 hidden sm:inline">•</span>
                <span className="font-mono text-zinc-300 text-[11px] sm:text-xs shrink-0">
                  {weather.weatherIcon} {weather.maxTemp}℃ <span className="text-zinc-500">/</span> {weather.minTemp}℃
                </span>
                <span className="text-[11px] text-zinc-400 font-mono shrink-0 hidden xs:inline">
                  ☔ {weather.isHistorical ? `${weather.precipitationSum ?? 0}mm` : `${weather.rainChance}%`}
                </span>
              </div>
            ) : (
              <h3 className="text-xs sm:text-sm font-bold text-white truncate">
                キャンプ現地の天気 ＆ 防寒アドバイス
              </h3>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {!isReadOnly && (
            <button
              type="button"
              onClick={() => {
                setInputLocation(location);
                setInputDate(eventDate);
                setIsEditing(!isEditing);
              }}
              className="p-1.5 sm:px-2 sm:py-1.5 rounded-lg border border-zinc-700 bg-[#27272A] hover:bg-zinc-700 text-[#00E5FF] hover:text-white transition flex items-center justify-center shrink-0 cursor-pointer active:scale-95 shadow-sm"
              title="キャンプ場名・日程を設定・変更"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}

          {weather && (
            <button
              type="button"
              onClick={() => setIsDetailOpen(!isDetailOpen)}
              className={`text-[11px] font-bold px-2 sm:px-2.5 py-1 rounded-lg border transition flex items-center gap-1 shrink-0 cursor-pointer active:scale-95 ${
                isDetailOpen
                  ? 'bg-zinc-700 text-white border-zinc-600'
                  : 'bg-[#27272A] hover:bg-zinc-700 text-[#00E5FF] border-zinc-700'
              }`}
              title={isDetailOpen ? '助言を閉じる' : '山仲間のパッキング助言を見る'}
            >
              <span className="hidden xs:inline">{isDetailOpen ? '助言を閉じる' : '助言を見る'}</span>
              {isDetailOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* 設定編集フォーム（アコーディオン） */}
      {isEditing && (
        <div className="bg-[#27272A]/70 p-3 rounded-xl border border-zinc-700/80 space-y-2.5 animate-fade-in text-left overflow-hidden">
          <span className="text-[11.5px] font-bold text-white block">
            📍 キャンプ予定地と日程を設定
          </span>
          <div className="space-y-2.5 w-full">
            <div className="space-y-1 w-full">
              <label className="text-[11px] text-zinc-400 font-normal block">
                キャンプ場名 または 市町村名
              </label>
              <input
                type="text"
                placeholder="例: ふもとっぱら、あきる野市、白馬村"
                value={inputLocation}
                onChange={(e) => setInputLocation(e.target.value)}
                className="w-full bg-[#18181B] border border-zinc-700 rounded-lg px-2.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#00E5FF]"
              />
            </div>

            <div className="space-y-1 w-full">
              <label className="text-[11px] text-zinc-400 font-normal block">キャンプ日程</label>
              <input
                type="date"
                value={inputDate}
                onChange={(e) => setInputDate(e.target.value)}
                className="w-full [color-scheme:dark] bg-[#18181B] border border-zinc-700 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-[#00E5FF]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-3 py-1 rounded-lg text-xs font-normal text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
            >
              中止
            </button>
            <button
              type="button"
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="px-4 py-1.5 bg-[#00E5FF] hover:bg-cyan-400 text-black rounded-lg text-xs font-bold transition flex items-center gap-1 active:scale-95 disabled:opacity-50 cursor-pointer shadow-sm"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>天気を取得</span>
            </button>
          </div>
        </div>
      )}

      {/* 天気コンテンツ表示エリア */}
      {isLoading ? (
        <div className="py-2.5 flex items-center justify-center gap-2 text-zinc-400 text-xs font-normal">
          <Loader2 className="w-4 h-4 animate-spin text-[#00E5FF]" />
          <span>現地の最新気象データを集計中...</span>
        </div>
      ) : weather ? (
        isDetailOpen && (
          <div className="space-y-2 pt-1.5 border-t border-zinc-800/80 animate-fade-in text-left">
            {/* 日付・予報対象日タグ */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              {(eventDate || weather.targetDate) ? (
                <span
                  className={`flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 rounded-md font-bold ${
                    weather.isHistorical
                      ? 'text-amber-300 bg-amber-950/60 border border-amber-700/60'
                      : 'text-cyan-300 bg-cyan-950/60 border border-cyan-800/60'
                  }`}
                >
                  <Calendar
                    className={`w-3 h-3 ${weather.isHistorical ? 'text-amber-400' : 'text-[#00E5FF]'}`}
                  />
                  <span>{eventDate || weather.targetDate}</span>
                  {weather.isDateMatched && (
                    <span
                      className={`text-[10px] font-sans ml-0.5 ${
                        weather.isHistorical ? 'text-amber-400' : 'text-emerald-400'
                      }`}
                    >
                      {weather.isHistorical ? '（当時の気象実績）' : '（当日予報）'}
                    </span>
                  )}
                </span>
              ) : weather.date ? (
                <span className="flex items-center gap-1 text-zinc-400 font-mono text-[11px]">
                  <Calendar className="w-3 h-3 text-zinc-400" />
                  <span>本日: {weather.date}</span>
                </span>
              ) : null}

              <span className="text-xs text-white font-bold flex items-center gap-1 font-sans ml-1">
                <span>{weather.weatherIcon}</span>
                <span>{weather.weatherLabel}</span>
              </span>
            </div>

            {!weather.isDateMatched && weather.dateNote && (
              <div className="text-[11px] text-amber-300 bg-amber-950/40 border border-amber-800/50 px-2.5 py-1.5 rounded-lg flex items-start gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
                <span className="flex-1 min-w-0 leading-relaxed">{weather.dateNote}</span>
              </div>
            )}

            {/* 山仲間のアドバイス／過去実績振り返りバナー */}
            <div
              className={`${
                weather.isHistorical
                  ? 'bg-amber-950/30 border border-amber-700/50'
                  : 'bg-cyan-950/30 border border-cyan-700/50'
              } p-2.5 sm:p-3 rounded-xl flex items-start gap-2`}
            >
              <Sparkles
                className={`w-4 h-4 ${
                  weather.isHistorical ? 'text-amber-400' : 'text-[#00E5FF]'
                } shrink-0 mt-0.5`}
              />
              <div className="min-w-0 flex-1">
                <span
                  className={`text-[11px] font-bold ${
                    weather.isHistorical ? 'text-amber-400' : 'text-[#00E5FF]'
                  } block`}
                >
                  {weather.isHistorical ? '🏕️ 当日の気象実績と振り返り:' : '🏕️ 山仲間のパッキング助言:'}
                </span>
                <p className="text-[11.5px] sm:text-xs text-zinc-200 font-normal leading-relaxed mt-0.5">
                  {weather.advice}
                </p>
              </div>
            </div>
          </div>
        )
      ) : errorMessage ? (
        <div className="bg-amber-950/30 border border-amber-800/60 p-2 rounded-xl text-xs text-amber-300 flex items-start gap-2 text-left">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
          <div className="flex-1">
            <span>{errorMessage}</span>
          </div>
        </div>
      ) : (
        /* 未設定時の案内（コンパクト化） */
        <div className="bg-[#27272A]/30 border border-zinc-800/80 rounded-xl px-3 py-2 text-center flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
          <p className="text-xs text-zinc-400 font-normal text-left truncate">
            📍 キャンプ場や日程を設定すると、現地の予想気温や防寒助言が表示されます
          </p>
          {!isReadOnly && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="text-xs text-[#00E5FF] hover:underline font-bold shrink-0 cursor-pointer"
            >
              設定する ➔
            </button>
          )}
        </div>
      )}
    </div>
  );
}
