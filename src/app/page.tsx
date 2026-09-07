'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { HelpCircle, Lock, Globe, AlertTriangle, RefreshCw, Eye, Plus, CopyPlus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getOrCreateAnonymousUser } from '@/lib/auth';
import WeightsSummary from '@/components/WeightsSummary';
import WeatherInsightBanner from '@/components/WeatherInsightBanner';
import GearSearch from '@/components/GearSearch';
import GearList from '@/components/GearList';
import CsvManager from '@/components/CsvManager';
import ShareAppCard from '@/components/ShareAppCard';
import HelpGuideModal, { STORAGE_KEY_GUIDE_SEEN } from '@/components/HelpGuideModal';
import Footer from '@/components/Footer';
import { GearItem } from '@/components/GearItemCard';

type Camp = {
  id: string;
  title: string;
  event_date: string;
  memo?: string;
  location?: string;
  is_public: boolean;
  user_id?: string;
};

const STORAGE_KEY_SCREEN_MODE = 'camp_active_screen_mode';
const STORAGE_KEY_TARGET_WEIGHT = 'camp_target_weight_kg';
const STORAGE_KEY_OWNED_CAMPS = 'camp_owned_tokens_map';
const STORAGE_KEY_CAMPS_CACHE = 'camp_cached_camps_list';

type CampMeta = {
  title?: string;
  location?: string;
  event_date?: string;
  updated_at?: number;
};

function getCampMeta(campId: string): CampMeta | null {
  try {
    const cached = localStorage.getItem(`camp_meta_${campId}`);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
}

function saveCampMeta(campId: string, updates: Partial<CampMeta>) {
  try {
    const existing = getCampMeta(campId) || {};
    const merged: CampMeta = {
      ...existing,
      ...updates,
      updated_at: Date.now(),
    };
    localStorage.setItem(`camp_meta_${campId}`, JSON.stringify(merged));
    return merged;
  } catch (e) {
    console.warn('LocalStorage saveCampMeta error:', e);
    return null;
  }
}

function generateRandomToken() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

function CampHomeContent() {
  const searchParams = useSearchParams();
  const urlCampId = searchParams.get('camp');

  const [camps, setCamps] = useState<Camp[]>([]);
  const [selectedCampId, setSelectedCampId] = useState<string>('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [gears, setGears] = useState<GearItem[]>([]);
  const [allGearsInAccount, setAllGearsInAccount] = useState<GearItem[]>([]);

  const [ownedCampIds, setOwnedCampIds] = useState<Set<string>>(new Set());

  const [screenMode, setScreenMode] = useState<'edit' | 'packing' | 'review'>('edit');
  const [unusedGearIds, setUnusedGearIds] = useState<Set<string>>(new Set());
  const [targetWeightKg, setTargetWeightKg] = useState<number>(15.0);

  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [isAddCampOpen, setIsAddCampOpen] = useState(false);
  const [newCampTitle, setNewCampTitle] = useState('');
  const [copyOption, setCopyOption] = useState<'latest' | 'select' | 'none'>('none');
  const [selectedSourceCampId, setSelectedSourceCampId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isEditCampOpen, setIsEditCampOpen] = useState(false);
  const [editCampTitle, setEditCampTitle] = useState('');
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    ベース: false,
    調理: false,
    衣類: false,
    その他: false,
    消耗品: false,
  });

  // ⛺ 縦長スクロール圧迫感を解消するスタッキング状態（カテゴリタブ & 下部ツール開閉）
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>('すべて');
  const [isShareOpen, setIsShareOpen] = useState<boolean>(false);
  const [isCsvOpen, setIsCsvOpen] = useState<boolean>(false);

  // ⛺ 閲覧専用判定: 自分のバッジ（user_id）が付いているか、または端末所有トークンがある場合は編集可能
  const isReadOnly = Boolean(
    selectedCampId && 
    !ownedCampIds.has(selectedCampId) && 
    !(currentUserId && camps.find((c) => c.id === selectedCampId)?.user_id === currentUserId)
  );

  const visibleCamps = camps.filter(
    (c) => ownedCampIds.has(c.id) || c.id === selectedCampId || (currentUserId && c.user_id === currentUserId)
  );

  const myOwnedCamps = camps.filter(
    (c) => ownedCampIds.has(c.id) || (currentUserId && c.user_id === currentUserId)
  );

  const registerCampOwnership = (campId: string) => {
    try {
      const current = localStorage.getItem(STORAGE_KEY_OWNED_CAMPS);
      const parsed = current ? JSON.parse(current) : {};
      parsed[campId] = generateRandomToken();
      localStorage.setItem(STORAGE_KEY_OWNED_CAMPS, JSON.stringify(parsed));
      setOwnedCampIds((prev) => new Set([...prev, campId]));
    } catch (err) {
      console.warn('Failed to save ownership token:', err);
    }
  };

  const updateUrlWithCamp = useCallback((campId: string) => {
    if (!campId) return;
    const params = new URLSearchParams(window.location.search);
    params.set('camp', campId);
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, '', newUrl);
  }, []);

  const handleSelectCamp = (campId: string) => {
    setSelectedCampId(campId);
    updateUrlWithCamp(campId);
  };

  const handleScreenModeChange = (mode: 'edit' | 'packing' | 'review') => {
    if (isReadOnly) return;
    setScreenMode(mode);
    try {
      localStorage.setItem(STORAGE_KEY_SCREEN_MODE, mode);
    } catch (err) {
      console.warn('Failed to save screen mode:', err);
    }
  };

  const handleTargetWeightChange = (newTargetKg: number) => {
    if (isReadOnly) return;
    setTargetWeightKg(newTargetKg);
    try {
      localStorage.setItem(STORAGE_KEY_TARGET_WEIGHT, String(newTargetKg));
    } catch (err) {
      console.warn('Failed to save target weight:', err);
    }
  };

  const fetchCamps = async () => {
    setIsLoading(true);
    setConnectionError(null);

    try {
      // ⛺ 1. 匿名ユーザーバッジを自動発行・取得
      const userId = await getOrCreateAnonymousUser();
      setCurrentUserId(userId);

      let savedOwnedIds: string[] = [];
      try {
        const savedOwned = localStorage.getItem(STORAGE_KEY_OWNED_CAMPS);
        if (savedOwned) {
          savedOwnedIds = Object.keys(JSON.parse(savedOwned));
          setOwnedCampIds(new Set(savedOwnedIds));
        }
      } catch (e) {
        console.warn('LocalStorage error:', e);
      }

      const { data, error } = await supabase
        .from('camps')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Fetch Camps Error:', error);
        setConnectionError(`Supabaseエラー: ${error.message}`);
        // オフライン・通信エラー時のローカルフォールバック
        try {
          const cachedCamps = localStorage.getItem(STORAGE_KEY_CAMPS_CACHE);
          if (cachedCamps) {
            const parsed: Camp[] = JSON.parse(cachedCamps);
            if (Array.isArray(parsed) && parsed.length > 0) {
              const enriched = parsed.map((c) => {
                const meta = getCampMeta(c.id);
                if (meta) {
                  return {
                    ...c,
                    title: meta.title?.trim() ? meta.title.trim() : c.title,
                    location: meta.location !== undefined ? meta.location : (c.location || ''),
                    event_date: meta.event_date !== undefined ? meta.event_date : (c.event_date || ''),
                  };
                }
                return c;
              });
              setCamps(enriched);
              const initialId = urlCampId || enriched[0]?.id;
              if (initialId) {
                setSelectedCampId(initialId);
                updateUrlWithCamp(initialId);
              }
            }
          }
        } catch {}
        setIsLoading(false);
        return;
      }

      const allCamps = (data || []).map((c: any) => {
        const meta = getCampMeta(c.id);
        if (meta) {
          return {
            ...c,
            // ⛺ 端末で編集した最新データを最優先（DB同期遅れやRLS制限があっても絶対に元に戻らない）
            title: meta.title?.trim() ? meta.title.trim() : c.title,
            location: meta.location !== undefined ? meta.location : (c.location || ''),
            event_date: meta.event_date !== undefined ? meta.event_date : (c.event_date || ''),
          };
        }
        return c;
      });
      setCamps(allCamps);
      try {
        localStorage.setItem(STORAGE_KEY_CAMPS_CACHE, JSON.stringify(allCamps));
      } catch {}

      // ⛺ 2. 自分のキャンプID一覧（LocalStorage または user_id 一致）
      const myCampIdsFromDb = userId
        ? allCamps.filter((c) => c.user_id === userId).map((c) => c.id)
        : [];
      const combinedOwnedIds = Array.from(new Set([...savedOwnedIds, ...myCampIdsFromDb]));
      if (combinedOwnedIds.length > 0) {
        setOwnedCampIds(new Set(combinedOwnedIds));
      }

      // ⛺ 3. 既存の所有キャンプで user_id が未設定の場合、安全に自分のIDを刻印（マイグレーション）
      if (userId) {
        const campsToMigrate = allCamps.filter(
          (c) => savedOwnedIds.includes(c.id) && (!c.user_id || c.user_id !== userId)
        );
        for (const camp of campsToMigrate) {
          await supabase.from('camps').update({ user_id: userId }).eq('id', camp.id);
        }
      }

      // 🎯 4. 【最優先】URLに ?camp=ID がある場合は、複製直後でも共有でも必ずそのキャンプを開く
      if (urlCampId) {
        const matched = allCamps.find((c) => c.id === urlCampId);
        if (matched) {
          setSelectedCampId(matched.id);
          updateUrlWithCamp(matched.id);
          setIsLoading(false);
          return;
        }
      }

      // 5. この端末で過去に作成したキャンプがある場合、その最新を開く
      const myCamps = allCamps.filter((c) => combinedOwnedIds.includes(c.id));
      if (myCamps.length > 0) {
        setSelectedCampId(myCamps[0].id);
        updateUrlWithCamp(myCamps[0].id);
        setIsLoading(false);
        return;
      }

      // 6. 初見アクセス：初期キャンプを新規作成
      const { data: newCamp, error: createErr } = await supabase
        .from('camps')
        .insert([{ title: 'マイ・ファーストキャンプ', is_public: false, user_id: userId || undefined }])
        .select()
        .single();

      if (createErr || !newCamp) {
        setConnectionError(`初期キャンプ作成エラー: ${createErr?.message}`);
        setIsLoading(false);
        return;
      }

      registerCampOwnership(newCamp.id);
      saveCampMeta(newCamp.id, { title: newCamp.title, location: '', event_date: '' });
      setCamps((prev) => {
        const updated = [newCamp, ...prev];
        try {
          localStorage.setItem(STORAGE_KEY_CAMPS_CACHE, JSON.stringify(updated));
        } catch {}
        return updated;
      });
      setSelectedCampId(newCamp.id);
      updateUrlWithCamp(newCamp.id);
    } catch (err: any) {
      console.error('Network / Unexpected Error:', err);
      setConnectionError(`ネットワーク接続エラー: ${err?.message || '通信に失敗しました'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGears = async () => {
    if (!selectedCampId) return;

    try {
      const { data: currentGears, error } = await supabase
        .from('gears')
        .select('*')
        .eq('camp_id', selectedCampId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Fetch Gears Error:', error);
        setConnectionError(`ギア取得エラー: ${error.message}`);
        return;
      }
      if (currentGears) setGears(currentGears as GearItem[]);

      const { data: allGears } = await supabase.from('gears').select('*');
      if (allGears) setAllGearsInAccount(allGears as GearItem[]);
    } catch (err: any) {
      console.error('Fetch Gears Network Error:', err);
    }
  };

  useEffect(() => {
    try {
      const savedOwned = localStorage.getItem(STORAGE_KEY_OWNED_CAMPS);
      if (savedOwned) {
        const parsed = JSON.parse(savedOwned);
        setOwnedCampIds(new Set(Object.keys(parsed)));
      }

      const savedMode = localStorage.getItem(STORAGE_KEY_SCREEN_MODE) as 'edit' | 'packing' | 'review' | null;
      if (savedMode && (savedMode === 'edit' || savedMode === 'packing' || savedMode === 'review')) {
        setScreenMode(savedMode);
      }

      const savedWeight = localStorage.getItem(STORAGE_KEY_TARGET_WEIGHT);
      if (savedWeight && !isNaN(Number(savedWeight))) {
        setTargetWeightKg(Number(savedWeight));
      }

      const hasSeenGuide = localStorage.getItem(STORAGE_KEY_GUIDE_SEEN);
      if (!hasSeenGuide) {
        setIsHelpOpen(true);
      }

      // ⛺ キャッシュからキャンプ一覧を即時復元（リロード時のチラつき・巻き戻りを完全防止）
      const cachedCamps = localStorage.getItem(STORAGE_KEY_CAMPS_CACHE);
      if (cachedCamps) {
        const parsed: Camp[] = JSON.parse(cachedCamps);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const enriched = parsed.map((c) => {
            const meta = getCampMeta(c.id);
            if (meta) {
              return {
                ...c,
                title: meta.title?.trim() ? meta.title.trim() : c.title,
                location: meta.location !== undefined ? meta.location : (c.location || ''),
                event_date: meta.event_date !== undefined ? meta.event_date : (c.event_date || ''),
              };
            }
            return c;
          });
          setCamps(enriched);
          const initialId = urlCampId || enriched[0]?.id;
          if (initialId) {
            setSelectedCampId(initialId);
          }
        }
      }
    } catch (err) {
      console.warn('LocalStorage load error:', err);
    }

    fetchCamps();
  }, []);

  useEffect(() => {
    if (selectedCampId) {
      setUnusedGearIds(new Set());
      fetchGears();
    }
  }, [selectedCampId]);

  const handleOpenAddCampModal = () => {
    setNewCampTitle('');
    setCopyOption(myOwnedCamps.length > 0 ? 'latest' : 'none');
    if (myOwnedCamps.length > 0) {
      setSelectedSourceCampId(myOwnedCamps[0].id);
    }
    setIsEditCampOpen(false);
    setIsAddCampOpen(true);
  };

  const getCampGearCount = (campId: string) => {
    return allGearsInAccount.filter((g) => g.camp_id === campId).length;
  };

  const handleCreateCamp = async () => {
    if (!newCampTitle.trim()) {
      alert('キャンプ名を入力してください！');
      return;
    }

    setIsSubmitting(true);

    const { data: newCamp, error: createErr } = await supabase
      .from('camps')
      .insert([{ title: newCampTitle.trim(), is_public: false, user_id: currentUserId || undefined }])
      .select()
      .single();

    if (createErr || !newCamp) {
      alert(`保存に失敗しました:\n${createErr?.message}`);
      setIsSubmitting(false);
      return;
    }

    registerCampOwnership(newCamp.id);

    let targetSourceId = '';
    if (copyOption === 'latest' && myOwnedCamps.length > 0) {
      targetSourceId = myOwnedCamps[0].id;
    } else if (copyOption === 'select' && selectedSourceCampId) {
      targetSourceId = selectedSourceCampId;
    }

    if (targetSourceId) {
      const { data: sourceGears } = await supabase
        .from('gears')
        .select('*')
        .eq('camp_id', targetSourceId);

      if (sourceGears && sourceGears.length > 0) {
        const clonedGears = sourceGears.map((g) => ({
          camp_id: newCamp.id,
          user_id: currentUserId || undefined,
          name: g.name,
          brand: g.brand || '',
          model_number: g.model_number || '',
          product_name: g.product_name || g.name,
          category: g.category || 'ベース',
          weight: Number(g.weight) || 0,
          price: Number(g.price) || 0,
          quantity: Number(g.quantity) || 1,
          is_packed: false,
          is_selected: g.is_selected !== false,
          is_consumable: g.is_consumable || false,
          product_url: g.product_url || '',
          purchase_date: g.purchase_date || '',
          fuel_type: g.fuel_type || '',
          memo: g.memo || '',
          total_brought_count: 0,
          total_used_count: 0,
          is_emergency_gear: Boolean(g.is_emergency_gear),
          is_weight_estimated: Boolean(g.is_weight_estimated),
        }));

        await supabase.from('gears').insert(clonedGears);
      }
    }

    setIsSubmitting(false);
    registerCampOwnership(newCamp.id);
    saveCampMeta(newCamp.id, {
      title: newCamp.title,
      location: '',
      event_date: '',
    });
    setCamps((prev) => {
      const updated = [newCamp, ...prev];
      try {
        localStorage.setItem(STORAGE_KEY_CAMPS_CACHE, JSON.stringify(updated));
      } catch {}
      return updated;
    });
    setSelectedCampId(newCamp.id);
    updateUrlWithCamp(newCamp.id);
    setNewCampTitle('');
    setIsAddCampOpen(false);
    setConnectionError(null);
    fetchGears();
  };

  const handleCloneCurrentCamp = async () => {
    if (!currentSelectedCamp) return;
    setIsSubmitting(true);

    const title = `${currentSelectedCamp.title}（マイコピー）`;
    const { data: newCamp, error: createErr } = await supabase
      .from('camps')
      .insert([{ title, is_public: false, user_id: currentUserId || undefined }])
      .select()
      .single();

    if (createErr || !newCamp) {
      alert(`複製に失敗しました: ${createErr?.message}`);
      setIsSubmitting(false);
      return;
    }

    registerCampOwnership(newCamp.id);
    const clonedLoc = currentSelectedCamp.location || '';
    const clonedDate = currentSelectedCamp.event_date || '';
    const clonedCampObj = {
      ...newCamp,
      location: clonedLoc,
      event_date: clonedDate,
    };
    saveCampMeta(newCamp.id, {
      title,
      location: clonedLoc,
      event_date: clonedDate,
    });

    if (gears.length > 0) {
      const clonedGears = gears.map((g) => ({
        camp_id: newCamp.id,
        user_id: currentUserId || undefined,
        name: g.name,
        brand: g.brand || '',
        model_number: g.model_number || '',
        product_name: g.product_name || g.name,
        category: g.category || 'ベース',
        weight: Number(g.weight) || 0,
        price: Number(g.price) || 0,
        quantity: Number(g.quantity) || 1,
        is_packed: false,
        is_selected: g.is_selected !== false,
        is_consumable: g.is_consumable || false,
        product_url: g.product_url || '',
        purchase_date: g.purchase_date || '',
        fuel_type: g.fuel_type || '',
        memo: g.memo || '',
        total_brought_count: 0,
        total_used_count: 0,
        is_emergency_gear: Boolean(g.is_emergency_gear),
        is_weight_estimated: Boolean(g.is_weight_estimated),
      }));

      await supabase.from('gears').insert(clonedGears);
    }

    setIsSubmitting(false);
    setCamps((prev) => {
      const updated = [clonedCampObj, ...prev];
      try {
        localStorage.setItem(STORAGE_KEY_CAMPS_CACHE, JSON.stringify(updated));
      } catch {}
      return updated;
    });
    setSelectedCampId(newCamp.id);
    updateUrlWithCamp(newCamp.id);
    alert('🎉 このパッキングをあなたの端末専用に複製しました！編集を開始できます。');
    fetchGears();
  };

  const handleUpdateCampTitle = async () => {
    if (!editCampTitle.trim() || !selectedCampId || isReadOnly) return;
    const trimmedTitle = editCampTitle.trim();

    // 1. ローカルStateおよびキャッシュ一覧を即時更新
    setCamps((prev) => {
      const updated = prev.map((c) => (c.id === selectedCampId ? { ...c, title: trimmedTitle } : c));
      try {
        localStorage.setItem(STORAGE_KEY_CAMPS_CACHE, JSON.stringify(updated));
      } catch {}
      return updated;
    });
    setIsEditCampOpen(false);

    // 2. ローカルストレージに確実に永続保存（リフレッシュしても絶対に元に戻らない）
    saveCampMeta(selectedCampId, { title: trimmedTitle });

    // 3. Supabase（クラウド側）へ同期
    try {
      const { error } = await supabase
        .from('camps')
        .update({ title: trimmedTitle })
        .eq('id', selectedCampId);

      if (error) {
        console.warn('Supabase title sync warning (saved locally):', error.message);
      }
    } catch (e) {
      console.warn('Supabase title sync network error (saved locally):', e);
    }
  };

  const handleUpdateCampWeather = async (newLocation: string, newDate: string) => {
    if (!selectedCampId || isReadOnly) return;

    // 1. ローカルStateおよびキャッシュ一覧を即時更新
    setCamps((prev) => {
      const updated = prev.map((c) =>
        c.id === selectedCampId
          ? { ...c, location: newLocation, event_date: newDate }
          : c
      );
      try {
        localStorage.setItem(STORAGE_KEY_CAMPS_CACHE, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // 2. ローカルストレージに確実に永続保存（リフレッシュしても絶対に元に戻らない）
    saveCampMeta(selectedCampId, { location: newLocation, event_date: newDate });

    // 3. Supabase（クラウド側）へ同期
    try {
      const updates: Record<string, any> = {
        location: newLocation,
        event_date: newDate,
      };
      const { error } = await supabase.from('camps').update(updates).eq('id', selectedCampId);
      if (error) {
        console.warn('Supabase weather sync warning (saved locally):', error.message);
      }
    } catch (e) {
      console.warn('Camp location update error (saved locally):', e);
    }
  };

  const startEditCampTitle = () => {
    const current = camps.find((c) => c.id === selectedCampId);
    if (current) {
      setEditCampTitle(current.title);
      setIsEditCampOpen(true);
    }
  };

  const handleTogglePublic = async () => {
    if (isReadOnly) return;
    const currentCamp = camps.find((c) => c.id === selectedCampId);
    if (!currentCamp) return;

    const newPublicStatus = !currentCamp.is_public;
    const { error } = await supabase
      .from('camps')
      .update({ is_public: newPublicStatus })
      .eq('id', selectedCampId);

    if (error) {
      alert(`公開設定の変更に失敗しました:\n${error.message}`);
      return;
    }

    setCamps((prev) =>
      prev.map((c) => (c.id === selectedCampId ? { ...c, is_public: newPublicStatus } : c))
    );

    alert(newPublicStatus ? '🌐 コミュニティに公開しました！' : '🔒 非公開に設定しました。');
  };

  const handleDeleteCamp = async () => {
    if (!selectedCampId || isReadOnly) return;
    if (myOwnedCamps.length <= 1) {
      alert('最後の1つのキャンプは削除できません。');
      return;
    }

    const currentCamp = camps.find((c) => c.id === selectedCampId);
    const confirmed = window.confirm(`「${currentCamp?.title}」を削除してもよろしいですか？\n※登録されているギアもすべて削除されます。`);
    if (!confirmed) return;

    const { error } = await supabase.from('camps').delete().eq('id', selectedCampId);
    if (error) {
      alert(`削除に失敗しました:\n${error.message}`);
      return;
    }

    const remaining = myOwnedCamps.filter((c) => c.id !== selectedCampId);
    try {
      localStorage.removeItem(`camp_meta_${selectedCampId}`);
    } catch {}
    setCamps((prev) => {
      const updated = prev.filter((c) => c.id !== selectedCampId);
      try {
        localStorage.setItem(STORAGE_KEY_CAMPS_CACHE, JSON.stringify(updated));
      } catch {}
      return updated;
    });
    setSelectedCampId(remaining[0].id);
    updateUrlWithCamp(remaining[0].id);
    setIsEditCampOpen(false);
  };

  const handleDeleteAllGears = async () => {
    if (!selectedCampId || isReadOnly) return;
    const confirmed = window.confirm('このキャンプのギアをすべて削除してもよろしいですか？');
    if (!confirmed) return;

    await supabase.from('gears').delete().eq('camp_id', selectedCampId);
    fetchGears();
  };

  const handleResetAllPacked = async () => {
    if (!selectedCampId || isReadOnly) return;
    const confirmed = window.confirm('当日のパッキング完了チェックをリセットして0%にしますか？');
    if (!confirmed) return;

    setGears((prev) => prev.map((g) => ({ ...g, is_packed: false })));
    await supabase.from('gears').update({ is_packed: false }).eq('camp_id', selectedCampId);
  };

  const toggleCategoryOpen = (catName: string) => {
    setOpenCategories((prev) => ({ ...prev, [catName]: !prev[catName] }));
  };

  const scrollToCategory = (catName: string) => {
    setSelectedCategoryTab(catName);
    setOpenCategories((prev) => ({ ...prev, [catName]: true }));
    setTimeout(() => {
      document.getElementById(`category-${catName}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const handleAddGear = async (item: any) => {
    if (isReadOnly || !selectedCampId) return;

    const rawName = (item.name || item.product_name || '').trim();
    const rawBrand = (item.brand || '').trim();
    const rawModel = (item.model_number || '').trim();

    const fullName = item.name?.trim() 
      ? item.name.trim() 
      : `${rawBrand} ${rawName} ${rawModel}`.trim();

    let cat = item.category || 'ベース';
    if (cat === 'ベースギア') cat = 'ベース';
    if (cat === '調理ギア') cat = '調理';
    if (cat === 'その他・日用品') cat = 'その他';
    if (cat === '食料・消耗品') cat = '消耗品';

    const finalProductUrl = (item.product_url || item.productUrl || '').trim();

    const newGearData = {
      camp_id: selectedCampId,
      user_id: currentUserId || undefined,
      name: fullName || rawName || '新しいギア',
      brand: rawBrand,
      model_number: rawModel,
      product_name: item.product_name || rawName || fullName,
      category: cat,
      weight: Number(item.weight) || 0,
      price: Number(item.price) || 0,
      quantity: Math.max(1, Number(item.quantity) || 1),
      is_packed: false,
      is_selected: true,
      is_consumable: cat === '消耗品',
      product_url: finalProductUrl,
      purchase_date: item.purchase_date || '',
      fuel_type: item.fuel_type === '不要/なし' ? '' : (item.fuel_type || ''),
      memo: (item.memo || '').trim(),
      total_brought_count: 0,
      total_used_count: 0,
      is_emergency_gear: Boolean(item.is_emergency_gear),
      is_weight_estimated: Boolean(item.is_weight_estimated),
    };

    const { data, error } = await supabase.from('gears').insert([newGearData]).select().single();
    if (error) {
      alert(`ギアの追加に失敗しました:\n${error.message}`);
      return;
    }

    if (data) {
      setGears((prev) => [data as GearItem, ...prev]);
    }
    fetchGears();
  };

  const togglePacked = async (id: string, currentStatus: boolean) => {
    if (isReadOnly) return;
    const nextStatus = !currentStatus;
    setGears((prev) =>
      prev.map((g) => (String(g.id) === String(id) ? { ...g, is_packed: nextStatus } : g))
    );

    const { error } = await supabase.from('gears').update({ is_packed: nextStatus }).eq('id', id);
    if (error) {
      console.error('Update is_packed Error:', error);
      fetchGears();
    }
  };

  const toggleSelected = async (id: string, currentStatus: boolean) => {
    if (isReadOnly) return;
    const nextStatus = !currentStatus;
    setGears((prev) =>
      prev.map((g) => (String(g.id) === String(id) ? { ...g, is_selected: nextStatus } : g))
    );
    setAllGearsInAccount((prev) =>
      prev.map((g) => (String(g.id) === String(id) ? { ...g, is_selected: nextStatus } : g))
    );

    const { error } = await supabase.from('gears').update({ is_selected: nextStatus }).eq('id', id);
    if (error) {
      console.error('Update is_selected Error:', error);
      fetchGears();
    }
  };

  const handleToggleUnusedGear = (gearId: string) => {
    if (isReadOnly) return;
    const cleanId = String(gearId);
    setUnusedGearIds((prev) => {
      const next = new Set(prev);
      if (next.has(cleanId)) {
        next.delete(cleanId);
      } else {
        next.add(cleanId);
      }
      return next;
    });
  };

  const updateQuantity = async (id: string, currentQty: number, delta: number) => {
    if (isReadOnly) return;
    const newQty = Math.max(1, currentQty + delta);
    setGears((prev) =>
      prev.map((g) => (String(g.id) === String(id) ? { ...g, quantity: newQty } : g))
    );

    await supabase.from('gears').update({ quantity: newQty }).eq('id', id);
  };

  const updateGear = async (id: string, updateData: any) => {
    if (isReadOnly) return;
    setGears((prev) =>
      prev.map((g) => (String(g.id) === String(id) ? { ...g, ...updateData } : g))
    );

    const { error } = await supabase.from('gears').update(updateData).eq('id', id);
    if (error) {
      console.error('Update Gear Error:', error);
      alert(`保存に失敗しました:\n${error.message}`);
      fetchGears();
      return;
    }
    fetchGears();
  };

  const deleteGear = async (id: string) => {
    if (isReadOnly) return;
    setGears((prev) => prev.filter((g) => String(g.id) !== String(id)));
    await supabase.from('gears').delete().eq('id', id);
    fetchGears();
  };

  const handleReorderGears = (reorderedGears: any[]) => {
    setGears(reorderedGears);
  };

  const currentSelectedCamp = camps.find((c) => c.id === selectedCampId);

  return (
    <main className="min-h-screen bg-[#09090B] text-zinc-100 p-3 sm:p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-4 w-full">

        {/* 閲覧専用モード案内バナー */}
        {isReadOnly && (
          <div className="bg-amber-950/70 border border-amber-500/50 p-3 sm:p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 shadow-lg">
            <div className="flex items-center gap-2 min-w-0">
              <Eye className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-[12px] font-bold text-white">
                  👀 閲覧専用モードで表示中
                </p>
                <p className="text-[11px] text-amber-200/80">
                  作成者のパッキングリストを表示しています。チェックや編集はロックされています。
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <button
                type="button"
                onClick={handleCloneCurrentCamp}
                disabled={isSubmitting}
                className="px-2.5 sm:px-3 py-1.5 bg-[#FF5500] hover:bg-[#e04c00] text-white rounded-lg text-[11px] font-bold shadow-md transition flex items-center gap-1 cursor-pointer disabled:opacity-50 whitespace-nowrap"
              >
                <CopyPlus className="w-3.5 h-3.5" />
                <span>この装備を複製して使う</span>
              </button>
              <button
                type="button"
                onClick={handleOpenAddCampModal}
                className="px-2.5 sm:px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white rounded-lg text-[11px] font-bold border border-zinc-700 transition flex items-center gap-1 cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>新規作成</span>
              </button>
            </div>
          </div>
        )}

        {/* 通信エラー診断バナー */}
        {connectionError && (
          <div className="bg-red-950/80 border border-red-500/80 p-4 rounded-2xl space-y-2 shadow-2xl">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h3 className="text-[13px] font-bold text-white">Supabaseとの通信に失敗しました</h3>
                <p className="text-[11px] font-mono text-red-200 mt-1 break-all bg-red-900/50 p-2 rounded-lg">
                  {connectionError}
                </p>
              </div>
            </div>
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={fetchCamps}
                className="px-3 py-1.5 bg-red-800 hover:bg-red-700 text-white rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>再接続を試す</span>
              </button>
            </div>
          </div>
        )}
        
        {/* ヘッダーエリア */}
        <header className="border-b border-zinc-800 pb-3 space-y-3 w-full">
          <div className="flex items-center justify-between gap-1.5 sm:gap-2 w-full">
            <Link
              href="/"
              className="flex items-center gap-1.5 sm:gap-2.5 hover:opacity-90 transition-opacity cursor-pointer group min-w-0"
              title="トップページを表示"
            >
              <div className="relative w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 shrink-0 drop-shadow-md transition-transform group-hover:scale-105">
                <Image
                  src="/logo.svg"
                  alt="Camp Gear Manager Logo"
                  fill
                  sizes="36px"
                  className="object-contain"
                  priority
                />
              </div>
              <h1 className="text-[15px] sm:text-[18px] md:text-[20px] font-black text-white tracking-tight truncate">
                <span className="text-[#FF5500]">Camp Gear</span> Manager
              </h1>
            </Link>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsHelpOpen(true)}
                className="h-8 w-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 flex items-center justify-center transition cursor-pointer shadow-sm active:scale-95 shrink-0"
                title="使い方ガイド"
                aria-label="使い方ガイド"
              >
                <HelpCircle className="w-4 h-4" />
              </button>

              {!isReadOnly && (
                <button
                  type="button"
                  onClick={handleTogglePublic}
                  className={`h-8 px-2 sm:px-2.5 md:px-3 rounded-xl text-[11px] sm:text-[12px] font-bold transition border flex items-center gap-1 shadow-sm active:scale-95 cursor-pointer shrink-0 whitespace-nowrap ${
                    currentSelectedCamp?.is_public
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30'
                      : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700 hover:text-white'
                  }`}
                >
                  {currentSelectedCamp?.is_public ? (
                    <>
                      <Globe className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>公開中</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <span>非公開</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* キャンプ選択セレクター */}
          <div className="flex items-center justify-between gap-2 bg-[#18181B] px-3 sm:px-3.5 py-2.5 rounded-xl border border-zinc-800 shadow-sm w-full">
            <div className="flex-1 min-w-0">
              {isLoading ? (
                <span className="text-[13px] sm:text-[14px] text-zinc-400 font-bold block animate-pulse truncate">
                  キャンプデータを読み込み中...
                </span>
              ) : visibleCamps.length > 0 ? (
                <select
                  value={selectedCampId}
                  onChange={(e) => handleSelectCamp(e.target.value)}
                  className="w-full bg-transparent text-white text-[15px] sm:text-[17px] md:text-[18px] font-bold focus:outline-none truncate cursor-pointer"
                >
                  {visibleCamps.map((camp) => (
                    <option key={camp.id} value={camp.id} className="bg-[#18181B] text-white text-[15px] sm:text-[17px]">
                      {camp.title} {!ownedCampIds.has(camp.id) && '（閲覧専用）'}
                    </option>
                  ))}
                </select>
              ) : (
                <button
                  type="button"
                  onClick={fetchCamps}
                  className="text-[12px] sm:text-[13px] text-amber-400 hover:underline flex items-center gap-1.5 font-bold cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>未接続: タップして再取得</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {!isReadOnly ? (
                <button
                  onClick={startEditCampTitle}
                  className="w-8 h-8 flex items-center justify-center bg-[#27272A] hover:bg-zinc-700 text-zinc-200 hover:text-white rounded-lg text-sm transition border border-zinc-700 cursor-pointer shadow-sm active:scale-95"
                  title="キャンプ設定"
                >
                  ✏️
                </button>
              ) : (
                <button
                  onClick={handleOpenAddCampModal}
                  className="px-2.5 py-1.5 bg-[#FF5500] hover:bg-[#e04c00] text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-sm active:scale-95 cursor-pointer whitespace-nowrap"
                  title="新しい自分専用のキャンプを作成"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>新規作成</span>
                </button>
              )}
            </div>
          </div>
        </header>

        {isEditCampOpen && !isReadOnly && (
          <div className="bg-[#18181B] border border-[#FF5500]/50 p-4 rounded-2xl space-y-4 shadow-2xl animate-fade-in w-full">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <h3 className="text-[14px] font-semibold text-white">キャンプ設定・管理</h3>
              <button
                onClick={() => setIsEditCampOpen(false)}
                className="text-zinc-400 hover:text-white text-[12px] font-normal p-1 cursor-pointer"
              >
                ✕ 閉じる
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-normal text-zinc-400 block">キャンプ名の変更</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={editCampTitle}
                  onChange={(e) => setEditCampTitle(e.target.value)}
                  className="flex-1 bg-[#27272A] border border-zinc-700 rounded-xl px-3 py-1.5 text-[12px] text-white focus:outline-none focus:border-[#FF5500]"
                />
                <button
                  onClick={handleUpdateCampTitle}
                  className="bg-[#FF5500] hover:bg-[#e04c00] text-white px-4 py-1.5 rounded-xl text-[12px] font-bold cursor-pointer transition shadow-sm"
                >
                  保存
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-2">
              <button
                onClick={handleOpenAddCampModal}
                className="px-3 py-1.5 bg-[#FF5500]/20 hover:bg-[#FF5500]/30 text-[#FF5500] border border-[#FF5500]/40 rounded-xl text-[12px] font-bold transition cursor-pointer flex items-center gap-1.5"
              >
                <span>＋</span>
                <span>新しいキャンプを追加</span>
              </button>

              <button
                onClick={handleDeleteCamp}
                disabled={myOwnedCamps.length <= 1}
                className="px-3 py-1.5 bg-red-950/30 hover:bg-red-900/60 text-[#EF4444] hover:text-white border border-[#EF4444]/40 rounded-xl text-[12px] font-bold transition cursor-pointer flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                title={myOwnedCamps.length <= 1 ? '最後の1つは削除できません' : '現在のキャンプを削除'}
              >
                <span>🗑️</span>
                <span>このキャンプを削除</span>
              </button>
            </div>
          </div>
        )}

        {isAddCampOpen && (
          <div className="bg-[#18181B] border border-[#FF5500]/50 p-5 rounded-2xl space-y-4 shadow-2xl animate-fade-in w-full">
            <h3 className="text-[14px] font-semibold text-white">新しいキャンプを追加</h3>

            <div className="space-y-1">
              <label className="text-[12px] font-normal text-zinc-400 block">キャンプ名（必須）</label>
              <input
                type="text"
                placeholder="例: 2026年8月 ふもとっぱらソロキャン"
                value={newCampTitle}
                onChange={(e) => setNewCampTitle(e.target.value)}
                className="w-full bg-[#27272A] border border-zinc-700 rounded-xl px-3 py-2 text-[12px] text-white focus:border-[#FF5500] focus:outline-none"
              />
            </div>

            <div className="space-y-2.5 pt-1 border-t border-zinc-800">
              <label className="text-[12px] font-normal text-zinc-400 block">パッキングの引き継ぎ</label>

              <div className="space-y-2 text-[12px]">
                <label className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition ${
                  copyOption === 'latest' ? 'bg-[#FF5500]/10 border-[#FF5500] text-white' : 'bg-[#27272A]/40 border-zinc-800 text-zinc-300 hover:bg-[#27272A]'
                }`}>
                  <input
                    type="radio"
                    name="copyOption"
                    value="latest"
                    checked={copyOption === 'latest'}
                    onChange={() => setCopyOption('latest')}
                    disabled={myOwnedCamps.length === 0}
                    className="mt-0.5 accent-[#FF5500]"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold block">直近のキャンプから引き継ぐ</span>
                    {myOwnedCamps.length > 0 ? (
                      <span className="text-[12px] text-zinc-400 block truncate font-mono mt-0.5">
                        直近: {myOwnedCamps[0].title} ({getCampGearCount(myOwnedCamps[0].id)}点)
                      </span>
                    ) : (
                      <span className="text-[12px] text-zinc-500 block mt-0.5">※過去に作成したキャンプがありません</span>
                    )}
                  </div>
                </label>

                <label className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition ${
                  copyOption === 'select' ? 'bg-[#FF5500]/10 border-[#FF5500] text-white' : 'bg-[#27272A]/40 border-zinc-800 text-zinc-300 hover:bg-[#27272A]'
                }`}>
                  <input
                    type="radio"
                    name="copyOption"
                    value="select"
                    checked={copyOption === 'select'}
                    onChange={() => setCopyOption('select')}
                    disabled={myOwnedCamps.length === 0}
                    className="mt-0.5 accent-[#FF5500]"
                  />
                  <div className="flex-1 min-w-0 space-y-2">
                    <span className="font-semibold block">過去のパッキングから選択</span>
                    {copyOption === 'select' && (
                      <select
                        value={selectedSourceCampId}
                        onChange={(e) => setSelectedSourceCampId(e.target.value)}
                        className="w-full bg-[#18181B] border border-zinc-700 text-white text-[12px] px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-[#FF5500]"
                      >
                        {myOwnedCamps.map((camp) => (
                          <option key={camp.id} value={camp.id}>
                            {camp.title} ({getCampGearCount(camp.id)}点)
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </label>

                <label className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition ${
                  copyOption === 'none' ? 'bg-[#FF5500]/10 border-[#FF5500] text-white' : 'bg-[#27272A]/40 border-zinc-800 text-zinc-300 hover:bg-[#27272A]'
                }`}>
                  <input
                    type="radio"
                    name="copyOption"
                    value="none"
                    checked={copyOption === 'none'}
                    onChange={() => setCopyOption('none')}
                    className="accent-[#FF5500]"
                  />
                  <span className="font-semibold">空の状態で作成する (ギア0件)</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                onClick={handleCreateCamp}
                disabled={isSubmitting}
                className="bg-[#FF5500] hover:bg-[#E04B00] text-white px-5 py-2 rounded-xl text-[12px] font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? '作成中...' : '作成'}
              </button>
              <button
                onClick={() => setIsAddCampOpen(false)}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded-xl text-[12px] font-normal cursor-pointer transition"
              >
                中止
              </button>
            </div>
          </div>
        )}

        {currentSelectedCamp && (
          <WeatherInsightBanner
            campId={selectedCampId}
            location={currentSelectedCamp.location || ''}
            eventDate={currentSelectedCamp.event_date || ''}
            onUpdateCampDetails={handleUpdateCampWeather}
            isReadOnly={isReadOnly}
          />
        )}

        <WeightsSummary
          gears={gears}
          screenMode={screenMode}
          unusedGearIds={unusedGearIds}
          onCategoryClick={scrollToCategory}
          targetWeightKg={targetWeightKg}
          onTargetWeightChange={handleTargetWeightChange}
        />
        
        {!isReadOnly && <GearSearch onAddGear={handleAddGear} />}

        <GearList
          gears={gears}
          allCampsCount={myOwnedCamps.length}
          allGearsInUserAccount={allGearsInAccount}
          screenMode={screenMode}
          onScreenModeChange={handleScreenModeChange}
          unusedGearIds={unusedGearIds}
          onToggleUnusedGear={handleToggleUnusedGear}
          targetWeightKg={targetWeightKg}
          openCategories={openCategories}
          onToggleCategoryOpen={toggleCategoryOpen}
          onTogglePacked={togglePacked}
          onToggleSelected={toggleSelected}
          onUpdateQuantity={updateQuantity}
          onUpdateGear={updateGear}
          onDeleteGear={deleteGear}
          onDeleteAllGears={handleDeleteAllGears}
          onResetAllPacked={handleResetAllPacked}
          onReorderGears={handleReorderGears}
          selectedCategoryTab={selectedCategoryTab}
          onSelectCategoryTab={setSelectedCategoryTab}
          isReadOnly={isReadOnly}
        />

        {/* ⛺ 下部ツールのスタッキング収納（共有 & CSV管理アコーディオン） */}
        <div className="space-y-3 pt-2">
          {/* 🔗 パッキング共有カード（アコーディオン） */}
          <div className="bg-[#18181B] border border-zinc-800 rounded-2xl overflow-hidden shadow-md transition-all">
            <button
              type="button"
              onClick={() => setIsShareOpen((prev) => !prev)}
              className="w-full px-4 py-3 sm:px-5 sm:py-3.5 flex items-center justify-between hover:bg-zinc-800/40 transition cursor-pointer text-left"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-base sm:text-lg">🔗</span>
                <div>
                  <span className="text-[13px] sm:text-[14px] font-bold text-white block">
                    このパッキングを共有する
                  </span>
                  <span className="text-[11px] text-zinc-400 block font-normal">
                    LINEやSNSで仲間・家族と持ち物リストを共有
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 shrink-0 font-medium">
                <span>{isShareOpen ? '閉じる' : '開く'}</span>
                <span className={`transform transition-transform duration-200 ${isShareOpen ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </div>
            </button>

            {isShareOpen && (
              <div className="p-4 sm:p-5 pt-2 border-t border-zinc-800/60 animate-fade-in">
                <ShareAppCard campId={selectedCampId} isReadOnly={isReadOnly} />
              </div>
            )}
          </div>

          {/* 📂 CSVデータ管理・バックアップ（アコーディオン） */}
          {!isReadOnly && (
            <div className="bg-[#18181B] border border-zinc-800 rounded-2xl overflow-hidden shadow-md transition-all">
              <button
                type="button"
                onClick={() => setIsCsvOpen((prev) => !prev)}
                className="w-full px-4 py-3 sm:px-5 sm:py-3.5 flex items-center justify-between hover:bg-zinc-800/40 transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-base sm:text-lg">📂</span>
                  <div>
                    <span className="text-[13px] sm:text-[14px] font-bold text-white block">
                      CSVデータ管理・バックアップ
                    </span>
                    <span className="text-[11px] text-zinc-400 block font-normal">
                      エクセルでの一括編集やバックアップ・復元
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 shrink-0 font-medium">
                  <span>{isCsvOpen ? '閉じる' : '開く'}</span>
                  <span className={`transform transition-transform duration-200 ${isCsvOpen ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </div>
              </button>

              {isCsvOpen && (
                <div className="p-4 sm:p-5 pt-2 border-t border-zinc-800/60 animate-fade-in">
                  <CsvManager gears={gears} selectedCampId={selectedCampId} onGearsUpdated={fetchGears} />
                </div>
              )}
            </div>
          )}
        </div>

        <HelpGuideModal
          isOpen={isHelpOpen}
          onClose={() => setIsHelpOpen(false)}
        />

        <Footer />
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#09090B] text-zinc-400 p-8 text-center text-sm">読み込み中...</div>}>
      <CampHomeContent />
    </Suspense>
  );
}