import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ShoppingCart, Trash2, Plus, Minus, Loader2, ArrowRight,
    BookOpen, AlertCircle
} from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { cartService } from '../services/cartService';
import useAuthStore from '../stores/authStore';
import type { CartItem } from '../services/cartService';

const CartPage: React.FC = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuthStore();

    const [items, setItems] = useState<CartItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<number | null>(null);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        loadCart();
    }, [isAuthenticated]);

    const loadCart = async () => {
        setIsLoading(true);
        try {
            const data = await cartService.getCart();
            setItems(data);
        } catch (error) {
            console.error('Failed to load cart:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateQuantity = async (cartId: number, quantity: number) => {
        if (quantity < 1) return;
        setUpdatingId(cartId);
        try {
            const updated = await cartService.updateCartItem(cartId, quantity);
            setItems(items.map((item) => (item.cartId === cartId ? updated : item)));
        } catch (error) {
            console.error('Failed to update quantity:', error);
        } finally {
            setUpdatingId(null);
        }
    };

    const handleRemove = async (cartId: number) => {
        if (!confirm('장바구니에서 삭제하시겠습니까?')) return;
        try {
            await cartService.removeFromCart(cartId);
            setItems(items.filter((item) => item.cartId !== cartId));
        } catch (error) {
            console.error('Failed to remove item:', error);
        }
    };

    const totalPrice = items.reduce((sum, item) => sum + item.totalPrice, 0);

    return (
        <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
            <Header />

            <main className="pt-24 pb-16 px-4">
                <div className="max-w-4xl mx-auto">
                    {/* 페이지 헤더 */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8"
                    >
                        <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
                            <ShoppingCart className="text-emerald-500" />
                            장바구니
                        </h1>
                        <p className="text-gray-600 mt-2">{items.length}개의 상품</p>
                    </motion.div>

                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 size={48} className="text-emerald-500 animate-spin" />
                        </div>
                    ) : items.length === 0 ? (
                        <div className="text-center py-20">
                            <ShoppingCart size={64} className="text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg mb-4">장바구니가 비어있습니다</p>
                            <Link
                                to="/books"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors"
                            >
                                도서 둘러보기 <ArrowRight size={18} />
                            </Link>
                        </div>
                    ) : (
                        <div className="grid lg:grid-cols-3 gap-8">
                            {/* 상품 목록 */}
                            <div className="lg:col-span-2 space-y-4">
                                {items.map((item, index) => (
                                    <motion.div
                                        key={item.cartId}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
                                    >
                                        <div className="flex gap-4">
                                            {/* 표지 */}
                                            <div className="w-20 h-28 bg-gradient-to-br from-emerald-100 to-green-50 rounded-xl flex-shrink-0 overflow-hidden">
                                                {item.coverUrl ? (
                                                    <img src={item.coverUrl} alt={item.title} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <BookOpen size={32} className="text-emerald-300" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* 정보 */}
                                            <div className="flex-1 min-w-0">
                                                <Link to={`/books/${item.bookId}`}>
                                                    <h3 className="font-bold text-gray-900 hover:text-emerald-600 transition-colors line-clamp-2">
                                                        {item.title}
                                                    </h3>
                                                </Link>
                                                <p className="text-emerald-600 font-bold mt-2">
                                                    ₩{item.price.toLocaleString()}
                                                </p>

                                                {/* 수량 조절 */}
                                                <div className="flex items-center gap-4 mt-3">
                                                    <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
                                                        <button
                                                            onClick={() => handleUpdateQuantity(item.cartId, item.quantity - 1)}
                                                            disabled={item.quantity <= 1 || updatingId === item.cartId}
                                                            className="w-8 h-8 rounded-lg bg-white flex items-center justify-center disabled:opacity-50"
                                                        >
                                                            <Minus size={16} />
                                                        </button>
                                                        <span className="w-8 text-center font-bold">
                                                            {updatingId === item.cartId ? (
                                                                <Loader2 size={16} className="animate-spin mx-auto" />
                                                            ) : (
                                                                item.quantity
                                                            )}
                                                        </span>
                                                        <button
                                                            onClick={() => handleUpdateQuantity(item.cartId, item.quantity + 1)}
                                                            disabled={updatingId === item.cartId}
                                                            className="w-8 h-8 rounded-lg bg-white flex items-center justify-center disabled:opacity-50"
                                                        >
                                                            <Plus size={16} />
                                                        </button>
                                                    </div>

                                                    <button
                                                        onClick={() => handleRemove(item.cartId)}
                                                        className="text-red-500 hover:text-red-600 p-2"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* 가격 */}
                                            <div className="text-right">
                                                <p className="text-lg font-extrabold text-gray-900">
                                                    ₩{item.totalPrice.toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* 결제 요약 */}
                            <div className="lg:col-span-1">
                                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-24">
                                    <h3 className="font-bold text-lg text-gray-900 mb-4">주문 요약</h3>

                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">상품 금액</span>
                                            <span className="font-medium">₩{totalPrice.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">할인</span>
                                            <span className="font-medium text-red-500">-₩0</span>
                                        </div>
                                        <hr className="my-4" />
                                        <div className="flex justify-between text-lg">
                                            <span className="font-bold">총 결제금액</span>
                                            <span className="font-extrabold text-emerald-600">₩{totalPrice.toLocaleString()}</span>
                                        </div>
                                    </div>

                                    <Link
                                        to="/checkout"
                                        className="mt-6 w-full py-4 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold rounded-xl text-center block hover:shadow-lg shadow-emerald-200 transition-all"
                                    >
                                        결제하기
                                    </Link>

                                    <Link
                                        to="/books"
                                        className="mt-3 w-full py-3 border-2 border-emerald-200 text-emerald-700 font-bold rounded-xl text-center block hover:bg-emerald-50 transition-colors"
                                    >
                                        쇼핑 계속하기
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default CartPage;
