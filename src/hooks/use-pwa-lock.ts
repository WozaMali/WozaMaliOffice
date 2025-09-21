"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";

type PwaLockState = {
	needsSetup: boolean;
	isLocked: boolean;
	username: string | null;
	lockAfterMs: number;
};

const LS_LAST_ACTIVE = "pwaLock.lastActiveAt";
const LS_LOCK_AFTER = "pwaLock.lockAfterMs";
const SS_UNLOCKED = "pwaLock.unlockedSession";

function getNow(): number {
	return Date.now();
}

async function sha256Hex(input: string): Promise<string> {
	const enc = new TextEncoder();
	const data = enc.encode(input);
	const digest = await crypto.subtle.digest("SHA-256", data);
	const bytes = new Uint8Array(digest);
	return Array.from(bytes)
		.map(b => b.toString(16).padStart(2, "0"))
		.join("");
}

function randomSaltHex(bytes: number = 16): string {
	const arr = new Uint8Array(bytes);
	crypto.getRandomValues(arr);
	return Array.from(arr).map(b => b.toString(16).padStart(2, "0")).join("");
}

function readNumber(key: string, fallback: number): number {
	try {
		const v = localStorage.getItem(key);
		if (!v) return fallback;
		const n = Number(v);
		return Number.isFinite(n) ? n : fallback;
	} catch {
		return fallback;
	}
}

function readString(key: string): string | null {
	try {
		return localStorage.getItem(key);
	} catch {
		return null;
	}
}

export function usePwaLock(lockAfterMinutes: number = 30) {
	const { user } = useAuth();
	const defaultLockAfter = useMemo(() => lockAfterMinutes * 60 * 1000, [lockAfterMinutes]);
	const [state, setState] = useState<PwaLockState>(() => {
		if (typeof window === "undefined") {
			return { needsSetup: false, isLocked: false, username: null, lockAfterMs: defaultLockAfter };
		}
		const configuredLockAfter = readNumber(LS_LOCK_AFTER, defaultLockAfter);
		// Initial unknown state until we fetch from server
		return { needsSetup: true, isLocked: true, username: null, lockAfterMs: configuredLockAfter };
	});

	const lock = useCallback(() => {
		try { sessionStorage.removeItem(SS_UNLOCKED); } catch {}
		setState(s => ({ ...s, isLocked: true }));
	}, []);

	const touch = useCallback(() => {
		try { localStorage.setItem(LS_LAST_ACTIVE, String(getNow())); } catch {}
	}, []);

	const setup = useCallback(async (username: string, pin: string): Promise<{ success: boolean; error?: string }> => {
		username = (username || "").trim();
		if (!username) return { success: false, error: "Username required" };
		if (!/^\d{5}$/.test(pin)) return { success: false, error: "PIN must be 5 digits" };
		if (!user?.id) return { success: false, error: "Not authenticated" };
		const salt = randomSaltHex(16);
		const saltedHash = await sha256Hex(`${salt}::${pin}`);
		try {
			const { error } = await supabase
				.from('user_pins')
				.upsert({ user_id: user.id, username, salt, salted_hash: saltedHash, last_changed_at: new Date().toISOString() }, { onConflict: 'user_id' });
			if (error) return { success: false, error: error.message };
			localStorage.setItem(LS_LAST_ACTIVE, String(getNow()));
			localStorage.setItem(LS_LOCK_AFTER, String(state.lockAfterMs));
			sessionStorage.setItem(SS_UNLOCKED, "true");
			setState({ needsSetup: false, isLocked: false, username, lockAfterMs: state.lockAfterMs });
			return { success: true };
		} catch (e: any) {
			return { success: false, error: e?.message || "Failed to save PIN" };
		}
	}, [state.lockAfterMs, user?.id]);

	const unlock = useCallback(async (username: string, pin: string): Promise<{ success: boolean; error?: string }> => {
		username = (username || "").trim();
		if (!username) return { success: false, error: "Username required" };
		if (!/^\d{5}$/.test(pin)) return { success: false, error: "PIN must be 5 digits" };
		if (!user?.id) return { success: false, error: "Not authenticated" };
		try {
			const { data, error } = await supabase
				.from('user_pins')
				.select('username, salt, salted_hash')
				.eq('user_id', user.id)
				.maybeSingle();
			if (error || !data) return { success: false, error: "Not set up" };
			if (data.username !== username) return { success: false, error: "Invalid credentials" };
			const hashed = await sha256Hex(`${data.salt}::${pin}`);
			if (hashed !== data.salted_hash) return { success: false, error: "Invalid credentials" };
			localStorage.setItem(LS_LAST_ACTIVE, String(getNow()));
			sessionStorage.setItem(SS_UNLOCKED, "true");
			setState(s => ({ ...s, isLocked: false, needsSetup: false, username }));
			return { success: true };
		} catch (e: any) {
			return { success: false, error: e?.message || "Unlock failed" };
		}
	}, [user?.id]);

	const updateLockAfterMinutes = useCallback((minutes: number) => {
		const ms = Math.max(1, Math.floor(minutes)) * 60 * 1000;
		try { localStorage.setItem(LS_LOCK_AFTER, String(ms)); } catch {}
		setState(s => ({ ...s, lockAfterMs: ms }));
	}, []);

	// Idle & visibility handling
	const checkIdleRef = useRef<ReturnType<typeof setInterval> | null>(null);
	useEffect(() => {
		// Fetch pin setup status from server
		const init = async () => {
			if (!user?.id) return;
			try {
				const { data } = await supabase
					.from('user_pins')
					.select('username')
					.eq('user_id', user.id)
					.maybeSingle();
				const sessionUnlocked = typeof window !== "undefined" && sessionStorage.getItem(SS_UNLOCKED) === "true";
				const last = readNumber(LS_LAST_ACTIVE, 0);
				const idle = getNow() - readNumber(LS_LOCK_AFTER, state.lockAfterMs);
				const timedOut = getNow() - last >= state.lockAfterMs;
				setState(s => ({
					...s,
					needsSetup: !data,
					isLocked: !data ? true : (!sessionUnlocked || timedOut),
					username: data?.username || null,
				}));
			} catch {}
		};
		init();
	}, [user?.id]);

	useEffect(() => {
		// Always lock on new session start to require PIN at reopen
		if (!state.needsSetup) {
			setState(s => ({ ...s, isLocked: sessionStorage.getItem(SS_UNLOCKED) === "true" ? s.isLocked : true }));
		}
		const onActivity = () => {
			if (!state.isLocked) touch();
		};
		const onVisibility = () => {
			if (document.visibilityState === "visible") {
				const last = readNumber(LS_LAST_ACTIVE, 0);
				if (getNow() - last >= state.lockAfterMs) lock();
			} else {
				touch();
			}
		};
		window.addEventListener("mousemove", onActivity);
		window.addEventListener("keydown", onActivity);
		window.addEventListener("click", onActivity, { capture: true });
		window.addEventListener("touchstart", onActivity, { passive: true });
		document.addEventListener("visibilitychange", onVisibility);
		checkIdleRef.current = setInterval(() => {
			const last = readNumber(LS_LAST_ACTIVE, 0);
			if (!state.isLocked && getNow() - last >= state.lockAfterMs) {
				lock();
			}
		}, 15 * 1000);
		return () => {
			window.removeEventListener("mousemove", onActivity);
			window.removeEventListener("keydown", onActivity);
			window.removeEventListener("click", onActivity, { capture: true } as any);
			window.removeEventListener("touchstart", onActivity as any);
			document.removeEventListener("visibilitychange", onVisibility);
			if (checkIdleRef.current) clearInterval(checkIdleRef.current);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [state.isLocked, state.needsSetup, state.lockAfterMs, lock, touch]);

	return {
		needsSetup: state.needsSetup,
		isLocked: state.isLocked,
		username: state.username,
		lockAfterMs: state.lockAfterMs,
		setup,
		unlock,
		lock,
		touch,
		updateLockAfterMinutes,
	};
}


