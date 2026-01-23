
import { Card } from '../ui/Card';

export function GrowthTree() {
    return (
        <Card className="h-full min-h-[800px] flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-b from-[#e1f8e8] to-[#94e0b5]/30 border-4 border-white shadow-xl p-0">
            {/* Background Clouds/Decoration */}
            <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-white/60 to-transparent pointer-events-none" />

            <div className="absolute top-16 text-center z-10">
                <h2 className="text-5xl font-extrabold text-[#1b573e] drop-shadow-sm mb-3 tracking-tight font-serif">성장의 나무</h2>
                <p className="text-xl font-medium text-[#1e6e4b]">Cycle Lv.6 / 10</p>
            </div>

            {/* Tree Visual Placeholder - In a real app, this would be an image or Canvas */}
            <div className="relative w-full flex-1 flex items-end justify-center pb-0">
                {/* Central Trunk */}
                <div className="w-[200px] h-[70vh] bg-[#5d4037] relative flex justify-center rounded-t-3xl shadow-inner">
                    {/* Leaves/Branches (Stylized CSS art roughly mimicking the pixel tree) */}
                    <div className="absolute bottom-[10%] -left-20 w-40 h-10 bg-[#388e3c] rounded-full opacity-90" />
                    <div className="absolute bottom-[20%] -right-20 w-40 h-10 bg-[#388e3c] rounded-full opacity-90" />
                    <div className="absolute bottom-[35%] -left-24 w-48 h-12 bg-[#2e7d32] rounded-full opacity-90" />
                    <div className="absolute bottom-[50%] -right-24 w-48 h-12 bg-[#2e7d32] rounded-full opacity-90" />
                    <div className="absolute bottom-[65%] -left-16 w-32 h-10 bg-[#43a047] rounded-full opacity-90" />
                    <div className="absolute top-[10%] -right-16 w-32 h-10 bg-[#43a047] rounded-full opacity-90" />

                    {/* Top Crown */}
                    <div className="absolute -top-10 w-48 h-32 bg-[#2e7d32] rounded-full shadow-lg" />

                    {/* Character */}
                    <div className="absolute top-[40%] left-1/2 -translate-x-1/2 w-16 h-16 z-20">
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] px-2 py-0.5 rounded whitespace-nowrap">
                            Adventurer
                        </div>
                        {/* Simple Character Placeholder */}
                        <div className="w-12 h-12 bg-blue-500 mx-auto rounded-full border-2 border-white shadow-lg relative">
                            <div className="absolute -right-2 top-0 w-4 h-4 bg-yellow-400 rounded-full animate-bounce" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Cycle indicators on the right */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 h-2/3 flex flex-col justify-between items-end pr-6 py-10 pointer-events-none">
                {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((level) => (
                    <div key={level} className="flex items-center gap-2">
                        {level === 6 && <span className="text-forest-600 font-black text-2xl drop-shadow-sm animate-pulse">{level}</span>}
                        <div className={`h-[2px] w-4 ${level === 6 ? 'bg-forest-600 w-8' : 'bg-forest-200'}`} />
                    </div>
                ))}
            </div>
        </Card>
    )
}
