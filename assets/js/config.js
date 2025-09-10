// PlugOn 통합 플랫폼 설정

// API 서버 URL 설정
window.CONFIG = {
    // 개발 환경 - 로컬 서버
    // API_BASE_URL: 'http://localhost:3000',
    
    // 프로덕션 환경 - 외부 서버 (향후 배포 시 사용)
    // API_BASE_URL: 'https://api.plugon.co.kr',
    
    // 현재는 데모 모드로 설정 (GitHub Pages에서는 백엔드 없이 프론트엔드만 동작)
    API_BASE_URL: null, // null이면 로컬 스토리지 기반 데모 모드
    
    // 기타 설정
    APP_NAME: 'PlugOn',
    APP_VERSION: '1.0.0',
    DEMO_MODE: true, // 데모 모드 활성화
    
    // 데모 계정 정보
    DEMO_ACCOUNTS: [
        {
            email: 'admin@plugon.co.kr',
            password: 'admin123',
            role: 'super_admin',
            firstName: '관리자',
            lastName: '최고',
            companyName: 'PlugOn',
            phone: '010-1234-5678'
        },
        {
            email: 'user@plugon.co.kr', 
            password: 'user123',
            role: 'customer',
            firstName: '사용자',
            lastName: '일반',
            companyName: '테스트회사',
            phone: '010-9876-5432'
        }
    ],
    
    // 샘플 제품 데이터
    SAMPLE_PRODUCTS: [
        {
            id: 'prod-001',
            name: 'PlugOn 스탠다드 패키지',
            description: '기본 전산시스템 패키지로 소규모 사업체에 최적화된 솔루션입니다.',
            price: 99000,
            category: 'software',
            imageUrl: null,
            featured: true,
            stock: 100
        },
        {
            id: 'prod-002',
            name: 'PlugOn 프리미엄 패키지',
            description: '중소기업을 위한 고급 전산시스템 패키지입니다.',
            price: 199000,
            category: 'software',
            imageUrl: null,
            featured: true,
            stock: 50
        },
        {
            id: 'prod-003',
            name: 'PlugOn 엔터프라이즈 패키지',
            description: '대기업용 전산시스템 패키지로 무제한 사용자 지원합니다.',
            price: 499000,
            category: 'software', 
            imageUrl: null,
            featured: true,
            stock: 25
        },
        {
            id: 'prod-004',
            name: 'PlugOn 하드웨어 키트',
            description: '전산시스템 구축을 위한 하드웨어 패키지입니다.',
            price: 299000,
            category: 'hardware',
            imageUrl: null,
            featured: false,
            stock: 30
        },
        {
            id: 'prod-005',
            name: 'PlugOn 컨설팅 서비스',
            description: '전문가의 1:1 컨설팅 서비스를 제공합니다.',
            price: 150000,
            category: 'consulting',
            imageUrl: null,
            featured: false,
            stock: 999
        }
    ],
    
    // 샘플 게시글 데이터
    SAMPLE_POSTS: [
        {
            id: 'post-001',
            title: 'PlugOn 통합 플랫폼 출시 안내',
            content: 'PlugOn 통합 플랫폼이 정식 출시되었습니다. 많은 관심과 이용 부탁드립니다.',
            author: '관리자',
            authorEmail: 'admin@plugon.co.kr',
            createdAt: new Date('2024-01-15').toISOString(),
            category: 'notice',
            views: 234
        },
        {
            id: 'post-002',
            title: '2024년 1월 업데이트 내역',
            content: '새로운 기능들이 추가되었습니다. 자세한 내용은 업데이트 가이드를 참고해주세요.',
            author: '개발팀',
            authorEmail: 'dev@plugon.co.kr',
            createdAt: new Date('2024-01-10').toISOString(),
            category: 'update',
            views: 189
        },
        {
            id: 'post-003',
            title: 'PlugOn 사용 가이드',
            content: 'PlugOn 플랫폼 사용법에 대한 상세한 가이드입니다.',
            author: '고객지원',
            authorEmail: 'support@plugon.co.kr',
            createdAt: new Date('2024-01-05').toISOString(),
            category: 'guide',
            views: 567
        }
    ],
    
    // 샘플 업무일정 데이터
    SAMPLE_TASKS: [
        {
            id: 'task-001',
            title: '플랫폼 보안 강화',
            description: '사용자 인증 시스템 및 데이터 암호화 강화',
            assignee: '개발팀',
            startDate: '2024-01-15',
            endDate: '2024-01-30',
            status: 'in_progress',
            priority: 'high',
            progress: 60,
            category: 'development'
        },
        {
            id: 'task-002',
            title: '사용자 매뉴얼 작성',
            description: '신규 기능에 대한 사용자 매뉴얼 작성 및 배포',
            assignee: '기획팀',
            startDate: '2024-01-20',
            endDate: '2024-02-05',
            status: 'pending',
            priority: 'medium',
            progress: 25,
            category: 'documentation'
        },
        {
            id: 'task-003',
            title: '고객 지원 시스템 개선',
            description: '실시간 채팅 및 티켓 시스템 구축',
            assignee: '고객지원팀',
            startDate: '2024-01-10',
            endDate: '2024-01-25',
            status: 'completed',
            priority: 'high',
            progress: 100,
            category: 'support'
        }
    ]
};

// 설정 로드 완료 이벤트 발생
document.dispatchEvent(new CustomEvent('configLoaded'));