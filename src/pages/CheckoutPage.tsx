import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Check, Loader2, ArrowLeft, ShieldCheck, AlertCircle } from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import useAuthStore from '../stores/authStore';
import { cartService } from '../services/cartService';
import { paymentService } from '../services/paymentService';
import type { CartItem } from '../services/cartService';

const CheckoutPage: React.FC = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuthStore();

    // State
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        loadCart();
    }, [isAuthenticated]);

    const loadCart = async () => {
        try {
            const items = await cartService.getCart();
            setCartItems(items);
            if (items.length === 0) {
                // 장바구니가 비었으면 돌아가기
                alert("장바구니가 비어있습니다.");
                navigate('/cart');
            }
        } catch (err) {
            console.error("Failed to load cart:", err);
            setError("장바구니 정보를 불러오는데 실패했습니다.");
        } finally {
            setIsLoading(false);
        }
    };


    // 금액 계산
    const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountAmount = 0; // 추후 쿠폰/포인트 등 적용 가능
    const finalAmount = totalAmount - discountAmount;

    const handlePayment = async () => {
        if (finalAmount <= 0) return;

        setIsProcessing(true);
        setError(null);

        try {
            // [TEST MODE] 가짜 결제 키 및 주문 ID 생성/사용
            const testPaymentKey = `TEST_${Date.now()}_${Math.random().toString(36).substring(7)}`;
            const testOrderId = `ORDER_${Date.now()}_${Math.random().toString(36).substring(7)}`;

            // 백엔드에 결제 승인 요청 (Mock 동작)
            await paymentService.confirmPayment({
                paymentKey: testPaymentKey,
                orderId: testOrderId,
                amount: finalAmount
            });

            // 성공 시 처리
            alert("결제가 완료되었습니다!");
            // 여기서 주문 완료 페이지로 이동하거나 마이페이지 등으로 이동
            navigate('/mypage/credits'); // 일단 마이페이지(혹은 포인트/주문내역)로 이동

        } catch (err: any) {
            console.error("Payment failed:", err);
            setError(err.response?.data?.message || "결제 처리 중 오류가 발생했습니다.");
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

                        {/* 결제 정보 */}
                        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mb-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-6">결제 수단</h2>

                            {/* 결제 방법 선택 (임시) */}
                            <div className="space-y-3">
                                <label className="flex items-center gap-4 p-4 border-2 border-emerald-500 rounded-xl cursor-pointer bg-emerald-50">
                                    <input type="radio" name="payment" checked readOnly className="w-5 h-5 text-emerald-500" />
                                    <div className="flex-1">
                                        <p className="font-bold text-gray-900">신용/체크카드 (테스트)</p>
                                        <p className="text-sm text-gray-500">실제 결제되지 않는 테스트 모드입니다.</p>
                                    </div>
                                    <img src="https://static.toss.im/icons/png/4x/icon-toss-logo.png" alt="Toss" className="h-6 opacity-50" />
                                </label>
                            </div>
                        </div>

                        {/* 주문 요약 */}
                        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mb-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">주문 요약</h2>

                            {/* 상품 리스트 간략 표시 */}
                            <div className="mb-4 space-y-2 max-h-40 overflow-y-auto">
                                {cartItems.map((item) => (
                                    <div key={item.cartId} className="flex justify-between text-sm text-gray-600">
                                        <span className="truncate flex-1 pr-4">{item.bookTitle}</span>
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
                            disabled={isProcessing}
                            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 hover:shadow-emerald-300 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
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
