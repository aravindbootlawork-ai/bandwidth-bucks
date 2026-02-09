/**
 * Achievement/Badge system for BandwidthBucks
 */

export type Achievement = {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: {
    type: 'earnings' | 'bandwidth' | 'streak' | 'referrals';
    value: number;
  };
  unlockedAt?: string;
};

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_earning',
    name: 'First Step',
    description: 'Earn your first ₹10',
    icon: '🎯',
    requirement: { type: 'earnings', value: 10 }
  },
  {
    id: 'fifty_rupees',
    name: 'Getting Started',
    description: 'Accumulate ₹50 in earnings',
    icon: '⚡',
    requirement: { type: 'earnings', value: 50 }
  },
  {
    id: 'hundred_rupees',
    name: 'Notable Earner',
    description: 'Reach ₹100 in earnings',
    icon: '💰',
    requirement: { type: 'earnings', value: 100 }
  },
  {
    id: 'five_hundred_rupees',
    name: 'Serious Contributor',
    description: 'Reach ₹500 in earnings',
    icon: '🚀',
    requirement: { type: 'earnings', value: 500 }
  },
  {
    id: 'thousand_rupees',
    name: 'Elite Earner',
    description: 'Reach ₹1000 in earnings',
    icon: '👑',
    requirement: { type: 'earnings', value: 1000 }
  },
  {
    id: 'gb_shared',
    name: 'Bandwidth Contributor',
    description: 'Share 10 GB of bandwidth',
    icon: '🌐',
    requirement: { type: 'bandwidth', value: 10 }
  },
  {
    id: '50gb_shared',
    name: 'Network Hero',
    description: 'Share 50 GB of bandwidth',
    icon: '🦸',
    requirement: { type: 'bandwidth', value: 50 }
  },
  {
    id: '7day_streak',
    name: '🔥 Week Warrior',
    description: 'Keep sharing for 7 consecutive days',
    icon: '🔥',
    requirement: { type: 'streak', value: 7 }
  },
  {
    id: 'referral_friend',
    name: 'Social Butterfly',
    description: 'Refer 1 friend who signs up',
    icon: '🦋',
    requirement: { type: 'referrals', value: 1 }
  }
];

export function checkAchievements(userData: any): Achievement[] {
  const unlockedAchievements: Achievement[] = [];
  
  const earnings = userData?.totalEarnings || 0;
  const bandwidth = userData?.totalBandwidthUsed || 0;
  const streak = userData?.sharingStreak || 0;
  const referrals = userData?.referralsCount || 0;
  
  ACHIEVEMENTS.forEach(achievement => {
    switch (achievement.requirement.type) {
      case 'earnings':
        if (earnings >= achievement.requirement.value) {
          unlockedAchievements.push(achievement);
        }
        break;
      case 'bandwidth':
        if (bandwidth >= achievement.requirement.value) {
          unlockedAchievements.push(achievement);
        }
        break;
      case 'streak':
        if (streak >= achievement.requirement.value) {
          unlockedAchievements.push(achievement);
        }
        break;
      case 'referrals':
        if (referrals >= achievement.requirement.value) {
          unlockedAchievements.push(achievement);
        }
        break;
    }
  });
  
  return unlockedAchievements;
}

export function getNextAchievement(userData: any): Achievement | null {
  const unlockedIds = new Set(checkAchievements(userData).map(a => a.id));
  
  for (const achievement of ACHIEVEMENTS) {
    if (!unlockedIds.has(achievement.id)) {
      return achievement;
    }
  }
  
  return null;
}
