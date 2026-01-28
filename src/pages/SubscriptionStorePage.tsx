import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Crown, Check, Sparkles, Zap, Star, ArrowLeft,
    Loader2, CreditCard, Gift, Shield, X
} from 'lucide-react';
import useAuthStore from '../stores/authStore';
import { subscriptionService, type SubscriptionPlan, type Subscription } from '../services/subscriptionService';

const SubscriptionStorePage: React.FC = () => {
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuthStore();
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [plansData, subscriptionData] = await Promise.all([
                subscriptionService.getPlans(),
                isAuthenticated ? subscriptionService.getMySubscription().catch(() => null) : Promise.resolve(null),
            ]);
            setPlans(plansData);
            setCurrentSubscription(subscriptionData);
        } catch (error) {
            console.error('Failed to load subscription data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectPlan = (plan: SubscriptionPlan) => {
        if (!isAuthenticated) {
            navigate('/login', { state: { from: '/subscription' } });
            return;
        }
        if (plan.price === 0) return; // 무료 플랜 선택 불가
        setSelectedPlan(plan);
        setShowPaymentModal(true);
    };

    const handleSubscribe = async () => {
        if (!selectedPlan) return;
        setIsProcessing(true);
        try {
            await subscriptionService.subscribe(selectedPlan.planId);
            await loadData(); // Refresh data
            setShowPaymentModal(false);
            alert('구독이 완료되었습니다!');
        } catch (error) {
            console.error('Subscription failed:', error);
            alert('구독 처리 중 오류가 발생했습니다.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCancelSubscription = async () => {
        if (!currentSubscription) return;
        if (!confirm('정말로 구독을 해지하시겠습니까? 다음 결제일부터 청구되지 않습니다.')) return;

        try {
            await subscriptionService.cancelSubscription(currentSubscription.subscriptionId);
            await loadData();
            alert('구독이 해지되었습니다.');
        } catch (error) {
            console.error('Cancel subscription failed:', error);
            alert('구독 해지 중 오류가 발생했습니다.');
        }
    };

    const getPlanIcon = (planName: string) => {
        switch (planName) {
            case '무료': return <Gift className="text-gray-500" size={32} />;
            case '프리미엄': return <Crown className="text-amber-500" size={32} />;
            case '프로': return <Sparkles className="text-purple-500" size={32} />;
            default: return <Star size={32} />;
        }
    };

    const getPlanGradient = (planName: string) => {
        switch (planName) {
            case '무료': return 'from-gray-100 to-gray-50';
            case '프리미엄': return 'from-amber-100 to-yellow-50';
            case '프로': return 'from-purple-100 to-pink-50';
            default: return 'from-emerald-100 to-green-50';
        }
    };

    const getPlanBorder = (planName: string) => {
        switch (planName) {
            case '무료': return 'border-gray-200';
            case '프리미엄': return 'border-amber-300 shadow-amber-100';
            case '프로': return 'border-purple-300 shadow-purple-100';
            default: return 'border-emerald-200';
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-amber-50">
                <Loader2 size={48} className="text-emerald-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50">
            {/* 헤더 */}
            <header className="sticky top-0 bg-white/80 backdrop-blur-lg border-b border-emerald-100 z-50">
                <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 text-emerald-700 hover:text-emerald-600">
                        <ArrowLeft size={20} />
                        <span>돌아가기</span>
                    </Link>
                    <h1 className="text-xl font-bold text-emerald-800">구독 상점</h1>
                    <div className="w-24" /> {/* Spacer */}
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 py-12">
                {/* 타이틀 섹션 */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-900 rounded-full text-sm font-bold mb-4">
                        <Crown size={16} />
                        PREMIUM MEMBERSHIP
                    </div>
                    <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
                        더 풍부한 독서 경험을<br />
                        <span className="bg-gradient-to-r from-emerald-600 to-green-500 bg-clip-text text-transparent">
                            시작하세요
                        </span>
                    </h2>
                    <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                        프리미엄 구독으로 AI 기능 무제한, TTS 음성 읽기, 오프라인 다운로드 등
                        ReadSync의 모든 기능을 마음껏 이용하세요.
                    </p>
                </motion.div>

                {/* 현재 구독 상태 */}
                {currentSubscription && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8 p-6 bg-gradient-to-r from-emerald-500 to-green-500 rounded-2xl text-white"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/20 rounded-xl">
                                    <Crown size={24} />
                                </div>
                                <div>
                                    <p className="text-emerald-100 text-sm">현재 구독 중</p>
                                    <p className="text-xl font-bold">{currentSubscription.planName} 플랜</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-emerald-100 text-sm">다음 결제일</p>
                                <p className="font-bold">
                                    {new Date(currentSubscription.endDate).toLocaleDateString('ko-KR')}
                                </p>
                            </div>
                            <button
                                onClick={handleCancelSubscription}
                                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition-colors"
                            >
                                구독 해지
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* 플랜 카드 */}
                <div className="grid md:grid-cols-3 gap-6 mb-12">
                    {plans.map((plan, index) => {
                        const isCurrentPlan = currentSubscription?.planName === plan.name;
                        const isPopular = plan.name === '프리미엄';

                        return (
                            <motion.div
                                key={plan.planId}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className={`relative bg-gradient-to-br ${getPlanGradient(plan.name)} rounded-3xl border-2 ${getPlanBorder(plan.name)} p-6 ${isPopular ? 'shadow-xl scale-105 z-10' : 'shadow-lg'
                                    }`}
                            >
                                {isPopular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-xs font-bold rounded-full">
                                        가장 인기
                                    </div>
                                )}

                                <div className="flex items-center gap-3 mb-4">
                                    {getPlanIcon(plan.name)}
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                                        <p className="text-sm text-gray-500">{plan.description}</p>
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-extrabold text-gray-900">
                                            {plan.price === 0 ? '무료' : `₩${plan.price.toLocaleString()}`}
                                        </span>
                                        {plan.price > 0 && (
                                            <span className="text-gray-500">/월</span>
                                        )}
                                    </div>
                                </div>

                                <ul className="space-y-3 mb-6">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-start gap-2">
                                            <Check size={18} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                                            <span className="text-gray-700 text-sm">{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    onClick={() => handleSelectPlan(plan)}
                                    disabled={isCurrentPlan || plan.price === 0}
                                    className={`w-full py-3 rounded-xl font-bold transition-all ${isCurrentPlan
                                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                            : plan.price === 0
                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                : isPopular
                                                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white hover:shadow-lg hover:-translate-y-0.5'
                                                    : 'bg-gradient-to-r from-emerald-500 to-green-500 text-white hover:shadow-lg hover:-translate-y-0.5'
                                        }`}
                                >
                                    {isCurrentPlan ? '현재 이용 중' : plan.price === 0 ? '기본 플랜' : '구독하기'}
                                </button>
                            </motion.div>
                        );
                    })}
                </div>

                {/* 혜택 섹션 */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 border border-emerald-100"
                >
                    <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">
                        프리미엄의 특별한 혜택
                    </h3>
                    <div className="grid md:grid-cols-4 gap-6">
                        <BenefitCard
                            icon={<Zap className="text-amber-500" size={24} />}
                            title="AI 무제한"
                            description="AI 채팅, 요약, 분석 기능을 제한 없이 사용"
                        />
                        <BenefitCard
                            icon={<Shield className="text-emerald-500" size={24} />}
                            title="광고 없음"
                            description="방해 없는 깔끔한 독서 환경 제공"
                        />
                        <BenefitCard
                            icon={<Sparkles className="text-purple-500" size={24} />}
                            title="TTS 읽기"
                            description="고품질 음성으로 책을 들으며 이동"
                        />
                        <BenefitCard
                            icon={<CreditCard className="text-blue-500" size={24} />}
                            title="오프라인"
                            description="다운로드하여 인터넷 없이 독서"
                        />
                    </div>
                </motion.div>
            </main>

            {/* 결제 모달 */}
            <AnimatePresence>
                {showPaymentModal && selectedPlan && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => setShowPaymentModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-gray-900">구독 결제</h3>
                                <button
                                    onClick={() => setShowPaymentModal(false)}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl mb-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-gray-600">선택 플랜</span>
                                    <span className="font-bold text-gray-900">{selectedPlan.name}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">월 요금</span>
                                    <span className="text-xl font-bold text-emerald-600">
                                        ₩{selectedPlan.price.toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            <p className="text-sm text-gray-500 mb-6">
                                결제를 진행하시면 매월 자동으로 결제됩니다.
                                언제든지 구독을 해지할 수 있습니다.
                            </p>

                            <button
                                onClick={handleSubscribe}
                                disabled={isProcessing}
                                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
                            >
                                {isProcessing ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <Loader2 size={20} className="animate-spin" />
                                        처리 중...
                                    </span>
                                ) : (
                                    '결제하기'
                                )}
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const BenefitCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    description: string;
}> = ({ icon, title, description }) => (
    <div className="text-center">
        <div className="inline-flex p-3 bg-gray-50 rounded-xl mb-3">
            {icon}
        </div>
        <h4 className="font-bold text-gray-900 mb-1">{title}</h4>
        <p className="text-sm text-gray-500">{description}</p>
    </div>
);

export default SubscriptionStorePage;
