'use client';

import { useEffect, useState } from 'react';
import { getNextAchievement, checkAchievements, ACHIEVEMENTS } from '@/lib/achievements';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

export function AchievementsUI() {
  const { user } = useUser();
  const db = useFirestore();
  const userDocRef = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return doc(db, 'users', user.uid);
  }, [db, user?.uid]);

  const { data: userData } = useDoc(userDocRef);
  const [unlocked, setUnlocked] = useState<any[]>([]);
  const [nextAch, setNextAch] = useState<any | null>(null);

  useEffect(() => {
    if (!userData) return;
    const list = checkAchievements(userData);
    setUnlocked(list);
    setNextAch(getNextAchievement(userData));
  }, [userData]);

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm">
      <h3 className="text-sm font-bold mb-2">Achievements</h3>
      <div className="flex flex-wrap gap-3">
        {ACHIEVEMENTS.map((a) => {
          const isUnlocked = unlocked.some(u => u.id === a.id);
          return (
            <div key={a.id} className={`p-2 rounded-md border ${isUnlocked ? 'bg-primary/10 border-primary' : 'bg-muted/10 border-muted'} w-36` }>
              <div className="text-2xl">{a.icon}</div>
              <div className="text-xs font-semibold">{a.name}</div>
              <div className="text-[11px] text-muted-foreground">{a.description}</div>
            </div>
          );
        })}
      </div>
      {nextAch && (
        <div className="mt-3 text-xs">
          Next: <strong>{nextAch.name}</strong> — {nextAch.description}
        </div>
      )}
    </div>
  );
}
