// PlugOn 통합 플랫폼 인증 관리 시스템

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    // 초기화
    init() {
        this.loadUserFromStorage();
        this.updateUI();
        this.bindEvents();
    }

    // 로컬 스토리지에서 사용자 정보 로드
    loadUserFromStorage() {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                this.currentUser = JSON.parse(userStr);
            } catch (error) {
                console.warn('사용자 정보 로드 실패:', error);
                localStorage.removeItem('user');
            }
        }
    }

    // 로그인 상태인지 확인
    isLoggedIn() {
        return this.currentUser !== null;
    }

    // 현재 사용자 정보 반환
    getCurrentUser() {
        return this.currentUser;
    }

    // 사용자 권한 확인
    hasRole(requiredRoles) {
        if (!this.isLoggedIn()) return false;
        
        if (Array.isArray(requiredRoles)) {
            return requiredRoles.includes(this.currentUser.role);
        } else {
            return this.currentUser.role === requiredRoles;
        }
    }

    // 관리자 권한 확인 (MyStore 접근용)
    hasAdminAccess() {
        return this.hasRole(['super_admin', 'headquarters', 'branch', 'district', 'salesPoint']);
    }

    // 업무일정 접근 권한 확인
    hasTaskAccess() {
        return this.hasRole(['super_admin', 'headquarters', 'branch']);
    }

    // 사용자 로그인 (로컬 처리 - 실제 로그인은 서버에서 처리)
    setUser(userData) {
        this.currentUser = userData;
        localStorage.setItem('user', JSON.stringify(userData));
        this.updateUI();
        this.dispatchAuthEvent('login', userData);
    }

    // 로그아웃
    async logout() {
        try {
            // 서버에 로그아웃 요청
            const response = await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });

            const result = await response.json();
            
            if (response.ok) {
                // 로컬 상태 초기화
                this.currentUser = null;
                localStorage.removeItem('user');
                this.updateUI();
                this.dispatchAuthEvent('logout');
                
                // 메인 페이지로 이동
                if (window.location.pathname !== '/' && window.location.pathname !== '/index.html') {
                    window.location.href = '/';
                }
                
                return { success: true, message: result.message };
            } else {
                throw new Error(result.message || '로그아웃에 실패했습니다.');
            }
        } catch (error) {
            console.error('로그아웃 오류:', error);
            // 네트워크 오류가 있어도 로컬에서는 로그아웃 처리
            this.currentUser = null;
            localStorage.removeItem('user');
            this.updateUI();
            
            return { success: false, message: error.message };
        }
    }

    // UI 업데이트
    updateUI() {
        this.updateNavigation();
        this.updateUserDropdown();
        this.handlePageAccess();
    }

    // 네비게이션 메뉴 업데이트
    updateNavigation() {
        const authRequiredItems = document.querySelectorAll('.nav-item.auth-required');
        const adminOnlyItems = document.querySelectorAll('.nav-item.admin-only');
        const guestOnlyItems = document.querySelectorAll('.nav-item.guest-only');

        if (this.isLoggedIn()) {
            // 로그인 상태: 인증 필요 메뉴 표시
            authRequiredItems.forEach(item => {
                item.style.display = 'block';
            });

            // 관리자 전용 메뉴 처리
            adminOnlyItems.forEach(item => {
                item.style.display = this.hasTaskAccess() ? 'block' : 'none';
            });

            // 게스트 전용 메뉴 숨김
            guestOnlyItems.forEach(item => {
                item.style.display = 'none';
            });

            // MyStore 메뉴는 admin 권한이 있을 때만 표시
            const myStoreItem = document.querySelector('.nav-item[data-page="mystore"]');
            if (myStoreItem) {
                myStoreItem.style.display = this.hasAdminAccess() ? 'block' : 'none';
            }

        } else {
            // 로그아웃 상태: 게스트 메뉴만 표시
            authRequiredItems.forEach(item => {
                item.style.display = 'none';
            });

            adminOnlyItems.forEach(item => {
                item.style.display = 'none';
            });

            guestOnlyItems.forEach(item => {
                item.style.display = 'block';
            });
        }
    }

    // 사용자 드롭다운 업데이트
    updateUserDropdown() {
        const userDropdown = document.querySelector('.user-dropdown');
        const authButtons = document.querySelector('.auth-buttons');

        if (this.isLoggedIn()) {
            // 로그인 상태: 사용자 드롭다운 표시
            if (userDropdown) {
                userDropdown.style.display = 'block';
                const userNameSpan = userDropdown.querySelector('.user-name');
                const userRoleSpan = userDropdown.querySelector('.user-role');
                
                if (userNameSpan) {
                    userNameSpan.textContent = `${this.currentUser.firstName} ${this.currentUser.lastName}`;
                }
                
                if (userRoleSpan) {
                    const roleNames = {
                        'super_admin': '최고관리자',
                        'headquarters': '본사',
                        'branch': '지사',
                        'district': '지점',
                        'salesPoint': '영업점',
                        'customer': '일반회원'
                    };
                    userRoleSpan.textContent = roleNames[this.currentUser.role] || this.currentUser.role;
                }
            }

            // 로그인/회원가입 버튼 숨김
            if (authButtons) {
                authButtons.style.display = 'none';
            }

        } else {
            // 로그아웃 상태: 로그인/회원가입 버튼 표시
            if (userDropdown) {
                userDropdown.style.display = 'none';
            }

            if (authButtons) {
                authButtons.style.display = 'flex';
            }
        }
    }

    // 페이지 접근 권한 확인
    handlePageAccess() {
        const currentPath = window.location.pathname;
        
        // MyStore 페이지 접근 권한 확인
        if (currentPath.includes('/mystore/')) {
            if (!this.hasAdminAccess()) {
                this.showAccessDeniedMessage('MyStore 시스템은 관리자만 접근할 수 있습니다.');
                window.location.href = '/';
                return;
            }
        }

        // 업무일정 페이지 접근 권한 확인
        if (currentPath.includes('/tasks/')) {
            if (!this.hasTaskAccess()) {
                this.showAccessDeniedMessage('업무일정은 최고관리자가 지정한 사용자만 접근할 수 있습니다.');
                window.location.href = '/';
                return;
            }
        }

        // 게시판 글쓰기는 로그인 필요
        if (currentPath.includes('/board/write')) {
            if (!this.isLoggedIn()) {
                this.showAccessDeniedMessage('글을 작성하려면 로그인이 필요합니다.');
                window.location.href = '/auth/login';
                return;
            }
        }
    }

    // 접근 거부 메시지 표시
    showAccessDeniedMessage(message) {
        if (typeof window.showNotification === 'function') {
            window.showNotification(message, 'error');
        } else {
            alert(message);
        }
    }

    // 이벤트 바인딩
    bindEvents() {
        // 로그아웃 버튼 이벤트
        document.addEventListener('click', (e) => {
            if (e.target.matches('.logout-btn') || e.target.closest('.logout-btn')) {
                e.preventDefault();
                this.handleLogout();
            }

            // 사용자 드롭다운 토글
            if (e.target.matches('.user-dropdown-toggle') || e.target.closest('.user-dropdown-toggle')) {
                e.preventDefault();
                this.toggleUserDropdown();
            }
        });

        // 드롭다운 외부 클릭 시 닫기
        document.addEventListener('click', (e) => {
            const dropdown = document.querySelector('.user-dropdown');
            const toggle = document.querySelector('.user-dropdown-toggle');
            
            if (dropdown && toggle && !dropdown.contains(e.target) && !toggle.contains(e.target)) {
                dropdown.classList.remove('show');
            }
        });

        // 페이지 로드 시 서버에서 사용자 정보 동기화
        this.syncUserWithServer();
    }

    // 서버와 사용자 정보 동기화
    async syncUserWithServer() {
        if (!this.isLoggedIn()) return;

        try {
            const response = await fetch('/api/auth/me', {
                credentials: 'include'
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success && result.user) {
                    // 서버의 사용자 정보로 업데이트
                    this.setUser(result.user);
                }
            } else {
                // 서버에서 인증 실패 시 로컬 로그아웃
                this.currentUser = null;
                localStorage.removeItem('user');
                this.updateUI();
            }
        } catch (error) {
            console.warn('서버와 사용자 정보 동기화 실패:', error);
        }
    }

    // 로그아웃 처리
    async handleLogout() {
        if (confirm('로그아웃 하시겠습니까?')) {
            const result = await this.logout();
            
            if (result.success) {
                if (typeof window.showNotification === 'function') {
                    window.showNotification(result.message, 'success');
                }
            } else {
                if (typeof window.showNotification === 'function') {
                    window.showNotification(result.message, 'error');
                }
            }
        }
    }

    // 사용자 드롭다운 토글
    toggleUserDropdown() {
        const dropdown = document.querySelector('.user-dropdown');
        if (dropdown) {
            dropdown.classList.toggle('show');
        }
    }

    // 인증 이벤트 발생
    dispatchAuthEvent(type, data = null) {
        const event = new CustomEvent('auth-' + type, {
            detail: { user: data }
        });
        document.dispatchEvent(event);
    }

    // 쇼핑몰 장바구니 권한 확인 (모든 로그인 사용자)
    canAccessCart() {
        return this.isLoggedIn();
    }

    // 주문 권한 확인 (모든 로그인 사용자)
    canPlaceOrder() {
        return this.isLoggedIn();
    }

    // 권한별 대시보드 URL 반환
    getDashboardUrl() {
        if (!this.isLoggedIn()) return '/';
        
        switch (this.currentUser.role) {
            case 'super_admin':
            case 'headquarters':
            case 'branch':
            case 'district':
            case 'salesPoint':
                return '/mystore/dashboard.html';
            case 'customer':
            default:
                return '/';
        }
    }
}

// 전역 AuthManager 인스턴스 생성
window.authManager = new AuthManager();

// 유틸리티 함수들
window.authUtils = {
    // 로그인 페이지로 리다이렉트
    redirectToLogin: (returnUrl = null) => {
        const loginUrl = '/auth/login.html';
        if (returnUrl) {
            window.location.href = loginUrl + '?return=' + encodeURIComponent(returnUrl);
        } else {
            window.location.href = loginUrl;
        }
    },

    // 권한 확인 후 페이지 이동
    navigateWithAuth: (url, requiredRoles = null) => {
        if (requiredRoles && !window.authManager.hasRole(requiredRoles)) {
            window.authManager.showAccessDeniedMessage('접근 권한이 없습니다.');
            return false;
        }
        
        window.location.href = url;
        return true;
    },

    // 로그인 필요 액션 처리
    requireAuth: (callback, errorMessage = '로그인이 필요합니다.') => {
        if (window.authManager.isLoggedIn()) {
            callback();
        } else {
            window.authManager.showAccessDeniedMessage(errorMessage);
            window.authUtils.redirectToLogin(window.location.href);
        }
    }
};

// DOM 로드 완료 후 초기화
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ PlugOn 인증 시스템 초기화 완료');
    
    // 인증 이벤트 리스너 등록 예시
    document.addEventListener('auth-login', function(e) {
        console.log('사용자 로그인:', e.detail.user);
    });

    document.addEventListener('auth-logout', function(e) {
        console.log('사용자 로그아웃');
    });
});