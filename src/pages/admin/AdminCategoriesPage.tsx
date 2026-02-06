import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus, Edit3, Trash2,
    Loader2, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../../stores/authStore';
import { adminCategoryService, type AdminCategory } from '../../services/adminService';
import AdminSidebar from '../../components/layout/AdminSidebar';

const AdminCategoriesPage: React.FC = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuthStore();

    // Data State
    const [categories, setCategories] = useState<AdminCategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage] = useState(0);


    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<AdminCategory | null>(null);
    const [categoryName, setCategoryName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Auth Check
    useEffect(() => {
        const isAdmin = user?.role === 'ADMIN' || user?.role === 'ROLE_ADMIN';
        if (!isAuthenticated || !isAdmin) {
            navigate('/admin', { replace: true });
            return;
        }
        loadCategories();
    }, [isAuthenticated, user?.role, currentPage]);

    const loadCategories = async () => {
        setIsLoading(true);
        try {
            const response = await adminCategoryService.getAllCategories(currentPage, 20);
            setCategories(response.content);
        } catch (error) {
            console.error('Failed to load categories:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (category?: AdminCategory) => {
        if (category) {
            setEditingCategory(category);
            setCategoryName(category.categoryName);
        } else {
            setEditingCategory(null);
            setCategoryName('');
        }
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!categoryName.trim()) {
            alert('카테고리 이름을 입력해주세요.');
            return;
        }

        setIsSubmitting(true);
        try {
            if (editingCategory) {
                await adminCategoryService.updateCategory(editingCategory.categoryId, categoryName.trim());
                alert('카테고리가 수정되었습니다.');
            } else {
                await adminCategoryService.createCategory(categoryName.trim());
                alert('카테고리가 등록되었습니다.');
            }
            setShowModal(false);
            loadCategories();
        } catch (error) {
            console.error('Failed to save category:', error);
            alert('저장 중 오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (categoryId: number) => {
        if (!confirm('정말로 이 카테고리를 삭제하시겠습니까?')) return;
        try {
            await adminCategoryService.deleteCategory(categoryId);
            alert('카테고리가 삭제되었습니다.');
            loadCategories();
        } catch (error) {
            console.error('Failed to delete category:', error);
            alert('삭제에 실패했습니다. (도서가 연결된 카테고리는 삭제할 수 없습니다)');
        }
    };

    // Sidebar Menu


    return (
        <div className="min-h-screen bg-gray-900">
            {/* Sidebar */}
            <AdminSidebar activePath="/admin/categories" />

            {/* Main Content */}
            <main className="ml-64 p-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">카테고리 관리</h1>
                        <p className="text-gray-400">도서 분류를 관리합니다.</p>
                    </div>
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors"
                    >
                        <Plus size={20} />
                        새 카테고리
                    </button>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 size={48} className="text-emerald-500 animate-spin" />
                    </div>
                ) : (
                    <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-700/50">
                                <tr>
                                    <th className="p-4 text-gray-400 font-medium">ID</th>
                                    <th className="p-4 text-gray-400 font-medium">이름</th>
                                    <th className="p-4 text-gray-400 font-medium">등록일</th>
                                    <th className="p-4 text-gray-400 font-medium text-right">관리</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {categories.map((cat) => (
                                    <tr key={cat.categoryId} className="hover:bg-gray-700/30 transition-colors">
                                        <td className="p-4 text-gray-500">{cat.categoryId}</td>
                                        <td className="p-4 text-white font-medium">{cat.categoryName}</td>
                                        <td className="p-4 text-gray-400 text-sm">
                                            {new Date(cat.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleOpenModal(cat)}
                                                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                                                >
                                                    <Edit3 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(cat.categoryId)}
                                                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {categories.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-gray-500">
                                            등록된 카테고리가 없습니다.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => setShowModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-white">
                                    {editingCategory ? '카테고리 수정' : '새 카테고리'}
                                </h3>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">카테고리 이름</label>
                                    <input
                                        type="text"
                                        value={categoryName}
                                        onChange={(e) => setCategoryName(e.target.value)}
                                        placeholder="예: 판타지, 로맨스"
                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    취소
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isSubmitting}
                                    className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 transition-colors"
                                >
                                    {isSubmitting ? '저장 중...' : '저장'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminCategoriesPage;
