import {
    Wand2, Skull, Heart, Rocket,
    Briefcase, Leaf, History, Music
} from 'lucide-react';

export const GENRES = [
    { id: 'fantasy', label: '판타지', icon: Wand2, color: 'from-purple-500 to-indigo-500' },
    { id: 'romance', label: '로맨스', icon: Heart, color: 'from-pink-500 to-rose-500' },
    { id: 'thriller', label: '스릴러', icon: Skull, color: 'from-gray-700 to-gray-900' },
    { id: 'scifi', label: 'SF', icon: Rocket, color: 'from-cyan-500 to-blue-500' },
    { id: 'business', label: '경제/경영', icon: Briefcase, color: 'from-amber-500 to-orange-500' },
    { id: 'selfhelp', label: '자기계발', icon: Leaf, color: 'from-emerald-500 to-green-500' },
    { id: 'history', label: '역사', icon: History, color: 'from-yellow-600 to-amber-700' },
    { id: 'essay', label: '에세이', icon: Music, color: 'from-teal-500 to-cyan-500' },
];

export const getGenreLabel = (id: string | null): string => {
    if (!id) return '';
    return GENRES.find(g => g.id === id)?.label || id;
};

export const getGenreLabels = (idsString: string | null): string => {
    if (!idsString) return '미설정';
    const ids = idsString.split(',').map(s => s.trim());
    return ids.map(id => getGenreLabel(id)).join(', ');
};
