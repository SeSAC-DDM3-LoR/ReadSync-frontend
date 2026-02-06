import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CreditCard, Check, Loader2, ArrowLeft, ShieldCheck, AlertCircle } from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import useAuthStore from '../stores/authStore';
import { cartService } from '../services/cartService';
import { paymentService } from '../services/paymentService';
import type { CartItem } from '../services/cartService';

// TossPayments 타입 선언
declare global {
    interface Window {
        TossPayments: (clientKey: string) => {
            widgets: (options: { customerKey: string }) => TossPaymentsWidgets;
        };
    }
}

interface TossPaymentsWidgets {
    setAmount: (amount: { currency: string; value: number }) => Promise<void>;
    renderPaymentMethods: (options: { selector: string; variantKey?: string }) => Promise<void>;
    renderAgreement: (options: { selector: string; variantKey?: string }) => Promise<void>;
    requestPayment: (options: {
        orderId: string;
        orderName: string;
        successUrl: string;
        failUrl: string;
        customerEmail?: string;
        customerName?: string;
    }) => Promise<void>;
}

const CheckoutPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { isAuthenticated } = useAuthStore();

    // State
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isWidgetReady, setIsWidgetReady] = useState(false);
    const [resultMessage, setResultMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Refs for TossPayments
    const widgetsRef = useRef<TossPaymentsWidgets | null>(null);
    const isInitializedRef = useRef(false);

    // 금액 계산
    const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountAmount = 0;
    const finalAmount = totalAmount - discountAmount;

    // 결제 확인 중복 방지 Ref
    const isConfirmingRef = useRef(false);

    // 결제 리다이렉트 처리
    const processPaymentRedirect = useCallback(async () => {
        const paymentKey = searchParams.get('paymentKey');
        const orderId = searchParams.get('orderId');
        const amount = searchParams.get('amount');
        const errorCode = searchParams.get('code');
        const errorMessage = searchParams.get('message');

        // 결제 성공 리다이렉트
        if (paymentKey && orderId && amount) {
            // 이미 확인 중이면 중복 실행 방지
            if (isConfirmingRef.current) return true;
            isConfirmingRef.current = true;

            setIsProcessing(true);
            try {
                await paymentService.confirmPayment({
                    paymentKey,
                    orderId,
                    amount: parseInt(amount)
                });

                setResultMessage({
                    type: 'success',
                    message: `결제가 완료되었습니다! (주문번호: ${orderId})`
                });

                // URL 파라미터 제거
                window.history.replaceState({}, '', window.location.pathname);

                // 잠시 후 마이페이지로 이동
                setTimeout(() => {
                    navigate('/mypage/subscription');
                }, 2000);

            } catch (err: any) {
                console.error('Payment confirmation failed:', err);
                setError(err.response?.data?.message || '결제 승인 중 오류가 발생했습니다.');
                window.history.replaceState({}, '', window.location.pathname);
                isConfirmingRef.current = false; // 실패 시 재시도 가능하게 할지 여부는 정책에 따름 (여기서는 해제)
            } finally {
                setIsProcessing(false);
            }
            return true;
        }

        // 결제 실패 리다이렉트
        if (errorCode) {
            setError(`결제 실패: ${errorMessage || errorCode}`);
            window.history.replaceState({}, '', window.location.pathname);
            return true;
        }

        return false;
    }, [searchParams, navigate]);

    // TossPayments SDK 로드
    const loadTossPaymentsSDK = useCallback(() => {
        return new Promise<void>((resolve, reject) => {
            if (typeof window.TossPayments !== 'undefined') {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://js.tosspayments.com/v2/standard';
            script.async = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('TossPayments SDK 로드 실패'));
            document.head.appendChild(script);
        });
    }, []);

    // 결제 위젯 초기화
    const initPaymentWidget = useCallback(async (amount: number) => {
        if (isInitializedRef.current || !window.TossPayments) return;

        // DOM 요소가 존재하는지 확인
        const paymentContainer = document.getElementById('payment-widget-container');
        const agreementContainer = document.getElementById('agreement-container');

        if (!paymentContainer || !agreementContainer) {
            // DOM이 아직 준비되지 않음 - 잠시 후 재시도
            console.log('Payment widget containers not ready, retrying...');
            setTimeout(() => initPaymentWidget(amount), 100);
            return;
        }

        try {
            // 일반 결제용 테스트 클라이언트 키 (payment.html과 동일)
            const clientKey = 'test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm';
            const customerKey = 'CUSTOMER_' + Math.random().toString(36).substring(2, 12);

            const tossPayments = window.TossPayments(clientKey);
            const widgets = tossPayments.widgets({ customerKey });
            widgetsRef.current = widgets;

            // 금액 설정
            await widgets.setAmount({
                currency: 'KRW',
                value: amount
            });

            // 결제 수단 렌더링
            await widgets.renderPaymentMethods({
                selector: '#payment-widget-container',
                variantKey: 'DEFAULT'
            });

            // 이용약관 렌더링
            await widgets.renderAgreement({
                selector: '#agreement-container',
                variantKey: 'AGREEMENT'
            });

            isInitializedRef.current = true;
            setIsWidgetReady(true);

        } catch (err) {
            console.error('Widget initialization failed:', err);
            setError('결제 위젯을 초기화하는데 실패했습니다.');
        }
    }, []);

    // 페이지 로드 시 초기화
    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        const initialize = async () => {
            // 결제 리다이렉트 처리 먼저 확인
            const isRedirect = await processPaymentRedirect();
            if (isRedirect) {
                setIsLoading(false);
                return;
            }

            // 장바구니 로드
            try {
                const items = await cartService.getCart();
                setCartItems(items);

                if (items.length === 0) {
                    alert('장바구니가 비어있습니다.');
                    navigate('/cart');
                    return;
                }

                // 금액 계산
                const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

                // SDK 로드 및 위젯 초기화
                await loadTossPaymentsSDK();
                await initPaymentWidget(total);

            } catch (err) {
                console.error('Failed to load cart:', err);
                setError('장바구니 정보를 불러오는데 실패했습니다.');
            } finally {
                setIsLoading(false);
            }
        };

        initialize();
    }, [isAuthenticated, navigate, processPaymentRedirect, loadTossPaymentsSDK, initPaymentWidget]);

    // 금액 변경 시 위젯 업데이트
    useEffect(() => {
        if (widgetsRef.current && finalAmount > 0) {
            widgetsRef.current.setAmount({
                currency: 'KRW',
                value: finalAmount
            });
        }
    }, [finalAmount]);

    // 결제 요청
    const handlePayment = async () => {
        if (!widgetsRef.current || finalAmount <= 0) {
            setError('결제 위젯이 준비되지 않았습니다.');
            return;
        }

        setIsProcessing(true);
        setError(null);

        try {
            const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
            const orderName = cartItems.length > 1
                ? `${cartItems[0].title} 외 ${cartItems.length - 1}건`
                : cartItems[0]?.title || 'ReadSync 도서 구매';

            await widgetsRef.current.requestPayment({
                orderId,
                orderName,
                successUrl: `${window.location.origin}/checkout`,
                failUrl: `${window.location.origin}/checkout`,
                customerEmail: 'customer@readsync.com',
                customerName: 'ReadSync 고객'
            });

        } catch (err: any) {
            if (err.code === 'USER_CANCEL') {
                // 사용자가 결제를 취소한 경우
                console.log('User cancelled payment');
            } else {
                console.error('Payment request failed:', err);
                setError(err.message || '결제 요청 중 오류가 발생했습니다.');
            }
        } finally {
            setIsProcessing(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 size={40} className="text-emerald-500 animate-spin" />
            </div>
        );
    }

    // 결제 완료 결과 표시
    if (resultMessage) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
                <Header />
                <main className="pt-24 pb-16 px-4">
                    <div className="max-w-2xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`p-8 rounded-3xl text-center ${resultMessage.type === 'success'
                                ? 'bg-emerald-50 border-2 border-emerald-200'
                                : 'bg-red-50 border-2 border-red-200'
                                }`}
                        >
                            {resultMessage.type === 'success' ? (
                                <Check size={64} className="mx-auto text-emerald-500 mb-4" />
                            ) : (
                                <AlertCircle size={64} className="mx-auto text-red-500 mb-4" />
                            )}
                            <h1 className={`text-2xl font-bold mb-2 ${resultMessage.type === 'success' ? 'text-emerald-700' : 'text-red-700'
                                }`}>
                                {resultMessage.type === 'success' ? '결제 완료!' : '결제 실패'}
                            </h1>
                            <p className="text-gray-600">{resultMessage.message}</p>
                            <p className="text-sm text-gray-500 mt-4">잠시 후 마이페이지로 이동합니다...</p>
                        </motion.div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
            <Header />

            <main className="pt-24 pb-16 px-4">
                <div className="max-w-2xl mx-auto">
                    {/* 뒤로가기 */}
                    <Link
                        to="/cart"
                        className="flex items-center gap-2 text-gray-600 hover:text-emerald-600 mb-8"
                    >
                        <ArrowLeft size={20} />
                        장바구니로 돌아가기
                    </Link>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <h1 className="text-3xl font-extrabold text-gray-900 mb-8 flex items-center gap-3">
                            <CreditCard className="text-emerald-500" />
                            결제하기
                        </h1>

                        {/* 에러 메시지 */}
                        {error && (
                            <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 flex items-center gap-2 font-medium">
                                <AlertCircle size={20} />
                                {error}
                            </div>
                        )}

                        {/* 주문 요약 */}
                        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mb-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">주문 요약</h2>

                            {/* 상품 리스트 */}
                            <div className="mb-4 space-y-2 max-h-40 overflow-y-auto">
                                {cartItems.map((item) => (
                                    <div key={item.cartId} className="flex justify-between text-sm text-gray-600">
                                        <span className="truncate flex-1 pr-4">{item.title}</span>
                                        <span>x{item.quantity}</span>
                                    </div>
                                ))}
                            </div>
                            <hr className="my-4 border-gray-100" />

                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">상품 금액</span>
                                    <span className="font-medium">₩{totalAmount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">할인</span>
                                    <span className="font-medium text-red-500">-₩{discountAmount.toLocaleString()}</span>
                                </div>
                                <hr className="my-4 border-gray-100" />
                                <div className="flex justify-between text-lg">
                                    <span className="font-bold">총 결제금액</span>
                                    <span className="font-extrabold text-emerald-600">₩{finalAmount.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* 결제 위젯 영역 */}
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">결제 수단 선택</h2>

                            {/* TossPayments 결제 위젯 컨테이너 */}
                            <div
                                id="payment-widget-container"
                                className="bg-white rounded-xl min-h-[300px]"
                            />

                            {/* TossPayments 이용약관 컨테이너 */}
                            <div
                                id="agreement-container"
                                className="bg-white rounded-xl mt-4"
                            />

                            {!isWidgetReady && !error && (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 size={24} className="text-emerald-500 animate-spin mr-2" />
                                    <span className="text-gray-500">결제 위젯을 불러오는 중...</span>
                                </div>
                            )}
                        </div>

                        {/* 보안 안내 */}
                        <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl mb-6">
                            <ShieldCheck className="text-emerald-600" />
                            <p className="text-sm text-emerald-700">
                                테스트 환경입니다. 실제 비용이 청구되지 않습니다.
                            </p>
                        </div>

                        {/* 결제 버튼 */}
                        <button
                            onClick={handlePayment}
                            disabled={isProcessing || !isWidgetReady}
                            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 hover:shadow-emerald-300 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 size={20} className="animate-spin" />
                                    결제 처리 중...
                                </>
                            ) : (
                                <>
                                    <Check size={20} />
                                    {finalAmount.toLocaleString()}원 결제하기
                                </>
                            )}
                        </button>
                    </motion.div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default CheckoutPage;
