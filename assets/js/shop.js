// PlugOn 쇼핑몰 관리 시스템

class ShopManager {
    constructor() {
        this.cart = [];
        this.init();
    }

    // 초기화
    init() {
        this.loadCartFromStorage();
        this.updateCartCount();
        this.bindEvents();
    }

    // 로컬 스토리지에서 장바구니 로드
    loadCartFromStorage() {
        const savedCart = localStorage.getItem('plugon-cart');
        if (savedCart) {
            try {
                this.cart = JSON.parse(savedCart);
            } catch (error) {
                console.warn('장바구니 데이터 로드 실패:', error);
                this.cart = [];
            }
        }
    }

    // 로컬 스토리지에 장바구니 저장
    saveCartToStorage() {
        try {
            localStorage.setItem('plugon-cart', JSON.stringify(this.cart));
            this.updateCartCount();
        } catch (error) {
            console.error('장바구니 저장 실패:', error);
        }
    }

    // 장바구니 개수 업데이트
    updateCartCount() {
        const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        const cartCountElements = document.querySelectorAll('#cart-count');
        cartCountElements.forEach(element => {
            if (element) {
                element.textContent = totalItems;
            }
        });
    }

    // 이벤트 바인딩
    bindEvents() {
        // 장바구니 추가 버튼들
        document.addEventListener('click', (e) => {
            if (e.target.matches('.btn-add-to-cart') || e.target.closest('.btn-add-to-cart')) {
                e.preventDefault();
                e.stopPropagation();
                
                const button = e.target.matches('.btn-add-to-cart') ? e.target : e.target.closest('.btn-add-to-cart');
                const productId = button.dataset.productId;
                const quantity = parseInt(button.dataset.quantity) || 1;
                
                this.addToCart(productId, quantity);
            }
        });
    }

    // 장바구니에 상품 추가
    async addToCart(productId, quantity = 1) {
        // 로그인 확인
        if (!window.authManager || !window.authManager.isLoggedIn()) {
            this.showLoginRequiredMessage();
            return false;
        }

        try {
            // 상품 정보 가져오기
            const product = await this.getProductInfo(productId);
            if (!product) {
                this.showMessage('상품 정보를 찾을 수 없습니다.', 'error');
                return false;
            }

            // 이미 장바구니에 있는 상품인지 확인
            const existingItem = this.cart.find(item => item.id === productId);
            
            if (existingItem) {
                // 기존 상품의 수량 증가
                existingItem.quantity += quantity;
            } else {
                // 새 상품 추가
                this.cart.push({
                    id: product.id,
                    name: product.name,
                    description: product.description,
                    price: product.price,
                    quantity: quantity,
                    category: product.category,
                    imageUrl: product.imageUrl,
                    addedAt: new Date().toISOString()
                });
            }

            // 저장 및 UI 업데이트
            this.saveCartToStorage();
            this.showMessage(`${product.name}이(가) 장바구니에 추가되었습니다.`, 'success');
            this.showCartModal();
            
            return true;

        } catch (error) {
            console.error('장바구니 추가 실패:', error);
            this.showMessage('장바구니 추가 중 오류가 발생했습니다.', 'error');
            return false;
        }
    }

    // 상품 정보 가져오기
    async getProductInfo(productId) {
        try {
            const response = await fetch(`/api/products/${productId}`);
            if (response.ok) {
                const data = await response.json();
                return data.success ? data.product : null;
            } else {
                console.error('상품 정보 로드 실패:', response.status);
                return null;
            }
        } catch (error) {
            console.error('상품 정보 로드 오류:', error);
            
            // 샘플 데이터 반환 (실제 API 실패 시)
            const sampleProducts = {
                'item1': {
                    id: 'item1',
                    name: 'PlugOn 스탠다드 패키지',
                    description: '기본 전산시스템 패키지',
                    price: 99000,
                    category: 'software'
                },
                'item2': {
                    id: 'item2',
                    name: 'PlugOn 프리미엄 패키지',
                    description: '고급 전산시스템 패키지',
                    price: 199000,
                    category: 'software'
                },
                'item3': {
                    id: 'item3',
                    name: 'PlugOn 엔터프라이즈 패키지',
                    description: '대기업용 전산시스템 패키지',
                    price: 499000,
                    category: 'software'
                }
            };
            
            return sampleProducts[productId] || null;
        }
    }

    // 장바구니에서 상품 제거
    removeFromCart(productId) {
        const itemIndex = this.cart.findIndex(item => item.id === productId);
        if (itemIndex !== -1) {
            const removedItem = this.cart[itemIndex];
            this.cart.splice(itemIndex, 1);
            this.saveCartToStorage();
            this.showMessage(`${removedItem.name}이(가) 장바구니에서 제거되었습니다.`, 'info');
            return true;
        }
        return false;
    }

    // 장바구니 수량 업데이트
    updateCartQuantity(productId, newQuantity) {
        const item = this.cart.find(item => item.id === productId);
        if (item) {
            if (newQuantity <= 0) {
                return this.removeFromCart(productId);
            } else {
                item.quantity = Math.min(Math.max(1, newQuantity), 99); // 1-99 범위
                this.saveCartToStorage();
                return true;
            }
        }
        return false;
    }

    // 장바구니 비우기
    clearCart() {
        this.cart = [];
        this.saveCartToStorage();
        this.showMessage('장바구니가 비워졌습니다.', 'info');
    }

    // 장바구니 총액 계산
    getCartTotal() {
        return this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    // 장바구니 상품 개수
    getCartItemCount() {
        return this.cart.reduce((count, item) => count + item.quantity, 0);
    }

    // 장바구니 데이터 가져오기
    getCartItems() {
        return [...this.cart]; // 복사본 반환
    }

    // 로그인 필요 메시지
    showLoginRequiredMessage() {
        if (typeof window.showNotification === 'function') {
            window.showNotification('장바구니를 이용하려면 로그인이 필요합니다.', 'info');
        } else {
            alert('장바구니를 이용하려면 로그인이 필요합니다.');
        }
        
        // 로그인 페이지로 이동할지 확인
        if (confirm('로그인 페이지로 이동하시겠습니까?')) {
            const currentUrl = encodeURIComponent(window.location.href);
            window.location.href = `/auth/login.html?return=${currentUrl}`;
        }
    }

    // 메시지 표시
    showMessage(message, type = 'info') {
        if (typeof window.showNotification === 'function') {
            window.showNotification(message, type);
        } else {
            // 알림 시스템이 없는 경우 콘솔에 출력
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    // 장바구니 모달 표시
    showCartModal() {
        const modal = document.getElementById('cart-modal');
        if (modal) {
            modal.style.display = 'flex';
            
            // 3초 후 자동 닫기
            setTimeout(() => {
                this.closeModal('cart-modal');
            }, 3000);
        }
    }

    // 모달 닫기
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // 즉시 구매
    buyNow(productId, quantity = 1) {
        if (!window.authManager || !window.authManager.isLoggedIn()) {
            this.showLoginRequiredMessage();
            return;
        }

        // 장바구니에 추가 후 결제 페이지로 이동
        this.addToCart(productId, quantity).then(success => {
            if (success) {
                window.location.href = '/shop/checkout.html';
            }
        });
    }

    // 위시리스트 기능 (향후 구현)
    addToWishlist(productId) {
        if (!window.authManager || !window.authManager.isLoggedIn()) {
            this.showLoginRequiredMessage();
            return;
        }

        this.showMessage('위시리스트 기능은 준비 중입니다.', 'info');
    }

    // 상품 비교 기능 (향후 구현)
    addToCompare(productId) {
        this.showMessage('상품 비교 기능은 준비 중입니다.', 'info');
    }

    // 할인/쿠폰 적용 (향후 구현)
    applyCoupon(couponCode) {
        this.showMessage('쿠폰 기능은 준비 중입니다.', 'info');
    }

    // 배송비 계산
    calculateShipping(totalAmount) {
        // 5만원 이상 무료배송
        return totalAmount >= 50000 ? 0 : 3000;
    }

    // 주문 요약 정보
    getOrderSummary() {
        const subtotal = this.getCartTotal();
        const shipping = this.calculateShipping(subtotal);
        const discount = 0; // 향후 할인 로직 추가
        const total = subtotal + shipping - discount;

        return {
            subtotal,
            shipping,
            discount,
            total,
            itemCount: this.getCartItemCount()
        };
    }

    // 장바구니 데이터 검증
    validateCart() {
        // 유효하지 않은 아이템 제거
        this.cart = this.cart.filter(item => {
            return item.id && item.name && item.price && item.quantity > 0;
        });

        this.saveCartToStorage();
        return this.cart;
    }

    // 재고 확인 (향후 구현)
    async checkStock(productId, quantity) {
        try {
            // 실제로는 서버 API 호출
            // const response = await fetch(`/api/products/${productId}/stock`);
            // return response.ok;
            
            // 현재는 항상 true 반환
            return true;
        } catch (error) {
            console.error('재고 확인 실패:', error);
            return false;
        }
    }
}

// 전역 ShopManager 인스턴스 생성
window.shopManager = new ShopManager();

// 전역 유틸리티 함수들
window.shopUtils = {
    // 가격 포맷팅
    formatPrice: (price) => {
        return new Intl.NumberFormat('ko-KR', {
            style: 'currency',
            currency: 'KRW'
        }).format(price).replace('₩', '₩');
    },

    // 숫자 포맷팅
    formatNumber: (number) => {
        return new Intl.NumberFormat('ko-KR').format(number);
    },

    // 할인율 계산
    calculateDiscountPercent: (originalPrice, salePrice) => {
        if (originalPrice <= salePrice) return 0;
        return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
    },

    // 카테고리 한글명 변환
    getCategoryName: (category) => {
        const categoryNames = {
            'software': '소프트웨어',
            'hardware': '하드웨어',
            'service': '서비스',
            'consulting': '컨설팅'
        };
        return categoryNames[category] || category;
    },

    // 상품 URL 생성
    getProductUrl: (productId) => {
        return `/shop/detail.html?id=${productId}`;
    },

    // 이미지 URL 처리
    getProductImageUrl: (imageUrl, defaultIcon = 'fas fa-box') => {
        if (imageUrl && imageUrl.trim()) {
            return imageUrl;
        }
        return null; // 기본 아이콘 사용
    }
};

// DOM 로드 완료 후 추가 초기화
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ PlugOn 쇼핑몰 시스템 초기화 완료');
    
    // 모달 외부 클릭 시 닫기
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            window.shopManager.closeModal(e.target.id);
        }
    });

    // ESC 키로 모달 닫기
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const modals = document.querySelectorAll('.modal');
            modals.forEach(modal => {
                if (modal.style.display !== 'none') {
                    window.shopManager.closeModal(modal.id);
                }
            });
        }
    });

    // 장바구니 아이콘 클릭 시 장바구니 페이지로 이동
    document.addEventListener('click', (e) => {
        if (e.target.closest('.btn-cart') || e.target.closest('[href*="cart.html"]')) {
            if (!window.authManager || !window.authManager.isLoggedIn()) {
                e.preventDefault();
                window.shopManager.showLoginRequiredMessage();
            }
        }
    });
});

// 전역 함수로 노출 (HTML에서 직접 호출용)
window.addToCart = function(productId, quantity = 1) {
    return window.shopManager.addToCart(productId, quantity);
};

window.removeFromCart = function(productId) {
    return window.shopManager.removeFromCart(productId);
};

window.buyNow = function(productId, quantity = 1) {
    return window.shopManager.buyNow(productId, quantity);
};

window.closeModal = function(modalId) {
    return window.shopManager.closeModal(modalId);
};