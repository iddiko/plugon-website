// PlugOn 통합 플랫폼 데모 인증 시스템

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
        const userStr = localStorage.getItem('plugon-demo-user');
        if (userStr) {
            try {
                this.currentUser = JSON.parse(userStr);
            } catch (error) {
                console.warn('사용자 정보 로드 실패:', error);
                localStorage.removeItem('plugon-demo-user');
            }
        }
    }

    // 로컬 스토리지에 사용자 정보 저장
    saveUserToStorage() {
        if (this.currentUser) {
            localStorage.setItem('plugon-demo-user', JSON.stringify(this.currentUser));
        } else {
            localStorage.removeItem('plugon-demo-user');
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

    // 사용자 역할 확인
    hasRole(roles) {
        if (!this.isLoggedIn()) return false;
        if (typeof roles === 'string') roles = [roles];
        return roles.includes(this.currentUser.role);
    }

    // 특정 권한 확인
    hasPermission(permission) {
        if (!this.isLoggedIn()) return false;
        
        const permissions = {
            'super_admin': ['all'],
            'headquarters': ['manage_branch', 'manage_district', 'manage_sales_point', 'view_tasks', 'manage_products'],
            'branch': ['manage_district', 'manage_sales_point', 'view_tasks', 'manage_products'],
            'district': ['manage_sales_point', 'manage_products'],
            'salesPoint': ['manage_products'],
            'customer': ['view_products', 'shop']
        };

        const userPermissions = permissions[this.currentUser.role] || [];
        return userPermissions.includes('all') || userPermissions.includes(permission);
    }

    // 업무일정 접근 권한 확인
    hasTaskAccess() {
        return this.hasRole(['super_admin', 'headquarters', 'branch']);
    }

    // 관리자 접근 권한 확인
    hasAdminAccess() {
        return this.hasRole(['super_admin', 'headquarters', 'branch', 'district', 'salesPoint']);
    }

    // 데모 로그인
    async login(email, password) {
        if (!window.CONFIG || !window.CONFIG.DEMO_ACCOUNTS) {
            return { success: false, message: '데모 계정 정보를 찾을 수 없습니다.' };
        }

        const demoAccount = window.CONFIG.DEMO_ACCOUNTS.find(
            account => account.email === email && account.password === password
        );

        if (demoAccount) {
            this.currentUser = {
                id: Date.now().toString(),
                email: demoAccount.email,
                firstName: demoAccount.firstName,
                lastName: demoAccount.lastName,
                role: demoAccount.role,
                companyName: demoAccount.companyName,
                phone: demoAccount.phone,
                createdAt: new Date().toISOString()
            };
            
            this.saveUserToStorage();
            this.updateUI();
            this.dispatchAuthEvent('login', this.currentUser);
            return { success: true };
        } else {
            return { success: false, message: '이메일 또는 비밀번호가 올바르지 않습니다.' };
        }
    }

    // 회원가입 (데모용)
    async register(userData) {
        // 데모 모드에서는 실제 회원가입하지 않고 성공 메시지만 반환
        return { 
            success: true, 
            message: '데모 모드에서는 회원가입이 시뮬레이션됩니다. 기존 데모 계정을 사용해주세요.',
            demoAccounts: window.CONFIG.DEMO_ACCOUNTS
        };
    }

    // 로그아웃
    logout() {
        this.currentUser = null;
        this.saveUserToStorage();
        this.updateUI();
        this.dispatchAuthEvent('logout');
        
        // 홈페이지로 리디렉션
        window.location.href = '/';
    }

    // UI 업데이트
    updateUI() {
        this.updateNavigationMenu();
        this.updateUserInfo();
        this.updateAccessControls();
    }

    // 네비게이션 메뉴 업데이트
    updateNavigationMenu() {
        // 인증 관련 메뉴 표시/숨김
        const authRequiredElements = document.querySelectorAll('.auth-required');
        const guestOnlyElements = document.querySelectorAll('.guest-only');
        const adminOnlyElements = document.querySelectorAll('.admin-only');

        if (this.isLoggedIn()) {
            authRequiredElements.forEach(el => el.style.display = '');
            guestOnlyElements.forEach(el => el.style.display = 'none');
            
            // 관리자 메뉴
            if (this.hasAdminAccess()) {
                adminOnlyElements.forEach(el => el.style.display = '');
            } else {
                adminOnlyElements.forEach(el => el.style.display = 'none');
            }
        } else {
            authRequiredElements.forEach(el => el.style.display = 'none');
            guestOnlyElements.forEach(el => el.style.display = '');
            adminOnlyElements.forEach(el => el.style.display = 'none');
        }
    }

    // 사용자 정보 업데이트
    updateUserInfo() {
        const userNameElements = document.querySelectorAll('.user-name');
        const userRoleElements = document.querySelectorAll('.user-role');
        const userEmailElements = document.querySelectorAll('.user-email');

        if (this.isLoggedIn()) {
            const user = this.currentUser;
            userNameElements.forEach(el => {
                el.textContent = `${user.firstName} ${user.lastName}`;
            });
            userRoleElements.forEach(el => {
                el.textContent = this.getRoleDisplayName(user.role);
            });
            userEmailElements.forEach(el => {
                el.textContent = user.email;
            });
        } else {
            userNameElements.forEach(el => el.textContent = '로그인 필요');
            userRoleElements.forEach(el => el.textContent = 'guest');
            userEmailElements.forEach(el => el.textContent = '');
        }
    }

    // 접근 제어 업데이트
    updateAccessControls() {
        // 페이지별 접근 제어
        const currentPath = window.location.pathname;
        
        // 인증이 필요한 페이지들
        const authRequiredPages = ['/mystore/', '/tasks/', '/board/write'];
        const adminRequiredPages = ['/tasks/'];

        if (authRequiredPages.some(page => currentPath.includes(page))) {
            if (!this.isLoggedIn()) {
                this.redirectToLogin();
                return;
            }
        }

        if (adminRequiredPages.some(page => currentPath.includes(page))) {
            if (!this.hasTaskAccess()) {
                alert('접근 권한이 없습니다.');
                window.location.href = '/';
                return;
            }
        }
    }

    // 역할 표시명 반환
    getRoleDisplayName(role) {
        const roleNames = {
            'super_admin': '최고관리자',
            'headquarters': '본사',
            'branch': '지사',
            'district': '지점',
            'salesPoint': '영업점',
            'customer': '일반회원'
        };
        return roleNames[role] || role;
    }

    // 로그인 페이지로 리디렉션
    redirectToLogin() {
        const currentUrl = encodeURIComponent(window.location.href);
        window.location.href = `/auth/login.html?return=${currentUrl}`;
    }

    // 이벤트 바인딩
    bindEvents() {
        // 로그아웃 버튼
        document.addEventListener('click', (e) => {
            if (e.target.matches('.logout-btn') || e.target.closest('.logout-btn')) {
                e.preventDefault();
                this.logout();
            }
        });

        // 사용자 드롭다운 토글
        document.addEventListener('click', (e) => {
            if (e.target.matches('.user-dropdown-toggle') || e.target.closest('.user-dropdown-toggle')) {
                const dropdown = e.target.closest('.user-dropdown');
                if (dropdown) {
                    dropdown.classList.toggle('show');
                }
            }
        });

        // 외부 클릭시 드롭다운 닫기
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.user-dropdown')) {
                document.querySelectorAll('.user-dropdown.show').forEach(dropdown => {
                    dropdown.classList.remove('show');
                });
            }
        });
    }

    // 인증 이벤트 발생
    dispatchAuthEvent(type, data = null) {
        const event = new CustomEvent(`auth-${type}`, {
            detail: data
        });
        document.dispatchEvent(event);
    }
}

// 전역 AuthManager 인스턴스 생성
document.addEventListener('DOMContentLoaded', function() {
    // CONFIG가 로드된 후 AuthManager 생성
    if (window.CONFIG) {
        window.authManager = new AuthManager();
        console.log('✅ PlugOn 데모 인증 시스템 초기화 완료');
    } else {
        // CONFIG 로드 대기
        document.addEventListener('configLoaded', function() {
            window.authManager = new AuthManager();
            console.log('✅ PlugOn 데모 인증 시스템 초기화 완료');
        });
    }
});

// 인증 이벤트 리스너
document.addEventListener('auth-login', function(e) {
    console.log('사용자 로그인:', e.detail);
});

document.addEventListener('auth-logout', function(e) {
    console.log('사용자 로그아웃');
});

// 페이지 로드시 인증 확인
window.addEventListener('load', function() {
    if (window.authManager) {
        window.authManager.updateAccessControls();
    }
});