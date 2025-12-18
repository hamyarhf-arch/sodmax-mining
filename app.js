// فایل: app.js
// منطق اصلی بازی SODmAX

class SODmaxGame {
    constructor() {
        this.user = null;
        this.gameData = null;
        this.autoMineInterval = null;
        this.autoSaveInterval = null;
        this.isAdmin = false;
        this.init();
    }
    
    async init() {
        console.log('🎮 Initializing SODmAX Game...');
        
        // چک session موجود
        await this.checkSession();
        
        // تنظیم event listeners
        this.setupEventListeners();
        
        // شروع auto-save
        this.startAutoSave();
        
        // چک ادمین
        this.checkAdminStatus();
    }
    
    async checkSession() {
        try {
            const { data: { session } } = await window.supabaseClient.auth.getSession();
            
            if (session) {
                this.user = session.user;
                await this.loadUserData();
                this.showMainPage();
                
                // مخفی کردن صفحه لاگین
                document.getElementById('registerOverlay').style.display = 'none';
                document.getElementById('mainContainer').style.display = 'block';
                
                console.log('✅ User logged in:', this.user.email);
            } else {
                this.showLoginPage();
            }
        } catch (error) {
            console.error('❌ Error checking session:', error);
            this.showLoginPage();
        }
    }
    
    async loadUserData() {
        if (!this.user) return;
        
        try {
            // دریافت یا ایجاد کاربر
            const userResult = await window.GameDB.getOrCreateUser(this.user.id, this.user.email);
            if (userResult.error) throw userResult.error;
            
            // دریافت یا ایجاد اطلاعات بازی
            const gameResult = await window.GameDB.getOrCreateGameData(this.user.id);
            if (gameResult.error) throw gameResult.error;
            
            this.gameData = gameResult.data;
            
            // بارگذاری تراکنش‌ها
            await this.loadTransactions();
            
            // آپدیت UI
            this.updateUI();
            
            console.log('✅ Game data loaded:', this.gameData);
            
        } catch (error) {
            console.error('❌ Error loading user data:', error);
            this.showNotification('خطا', 'مشکلی در بارگذاری داده‌ها پیش آمد');
        }
    }
    
    async loadTransactions() {
        if (!this.user) return;
        
        const { data } = await window.GameDB.getTransactions(this.user.id, 10);
        
        // نمایش تراکنش‌ها
        this.renderTransactions(data || []);
    }
    
    // ==================== عملیات اصلی ====================
    
    async mine() {
        if (!this.user || !this.gameData) return;
        
        try {
            const earned = this.gameData.mining_power;
            const boostMultiplier = this.gameData.boost_active ? 3 : 1;
            const totalEarned = earned * boostMultiplier;
            
            // آپدیت محلی
            this.gameData.sod_balance += totalEarned;
            this.gameData.total_mined += totalEarned;
            this.gameData.today_earnings += totalEarned;
            this.gameData.usdt_progress += totalEarned;
            
            // آپدیت در دیتابیس
            await window.GameDB.updateGameData(this.user.id, {
                sod_balance: this.gameData.sod_balance,
                total_mined: this.gameData.total_mined,
                today_earnings: this.gameData.today_earnings,
                usdt_progress: this.gameData.usdt_progress
            });
            
            // ثبت تراکنش
            await window.GameDB.addTransaction(
                this.user.id,
                'استخراج دستی',
                totalEarned,
                'sod'
            );
            
            // افکت بصری
            this.createMiningEffect(totalEarned);
            
            // آپدیت UI
            this.updateUI();
            
            // چک پاداش USDT
            await this.checkUSDT();
            
        } catch (error) {
            console.error('❌ Error in mining:', error);
            this.showNotification('خطا', 'مشکلی در استخراج پیش آمد');
        }
    }
    
    async checkUSDT() {
        if (!this.gameData || this.gameData.usdt_progress < 10000000) return;
        
        try {
            const usdtEarned = 0.01;
            const cycles = Math.floor(this.gameData.usdt_progress / 10000000);
            
            this.gameData.usdt_balance += usdtEarned * cycles;
            this.gameData.usdt_progress %= 10000000;
            
            // آپدیت در دیتابیس
            await window.GameDB.updateGameData(this.user.id, {
                usdt_balance: this.gameData.usdt_balance,
                usdt_progress: this.gameData.usdt_progress
            });
            
            // ثبت تراکنش
            await window.GameDB.addTransaction(
                this.user.id,
                'دریافت پاداش USDT',
                usdtEarned * cycles,
                'usdt'
            );
            
            // نوتیفیکیشن
            this.showNotification(
                '🎉 پاداش USDT', 
                `${(usdtEarned * cycles).toFixed(4)} USDT دریافت کردید!`
            );
            
            // شانس ارتقاء سطح
            if (Math.random() > 0.85) {
                this.gameData.user_level += 1;
                this.gameData.mining_power = 10 * this.gameData.user_level;
                
                await window.GameDB.updateGameData(this.user.id, {
                    user_level: this.gameData.user_level,
                    mining_power: this.gameData.mining_power
                });
                
                this.showNotification(
                    '⭐ ارتقاء سطح', 
                    `سطح شما به ${this.gameData.user_level} ارتقاء یافت!`
                );
            }
            
            this.updateUI();
            
        } catch (error) {
            console.error('❌ Error in USDT check:', error);
        }
    }
    
    async buySODPlan(planId) {
        const plans = {
            1: { price: 1, sod: 5000000, bonus: 500000 },
            2: { price: 5, sod: 30000000, bonus: 3000000 },
            3: { price: 15, sod: 100000000, bonus: 10000000 },
            4: { price: 50, sod: 500000000, bonus: 50000000 }
        };
        
        const plan = plans[planId];
        if (!plan) return;
        
        const totalSOD = plan.sod + plan.bonus;
        
        // در نسخه واقعی اینجا پرداخت انجام می‌شود
        // فعلاً فقط اضافه می‌کنیم
        this.gameData.sod_balance += totalSOD;
        this.gameData.total_mined += totalSOD;
        
        try {
            await window.GameDB.updateGameData(this.user.id, {
                sod_balance: this.gameData.sod_balance,
                total_mined: this.gameData.total_mined
            });
            
            await window.GameDB.addTransaction(
                this.user.id,
                `خرید پنل ${planId}`,
                totalSOD,
                'sod'
            );
            
            this.showNotification(
                '🛒 خرید موفق', 
                `${this.formatNumber(totalSOD)} SOD خریداری شد!`
            );
            
            this.updateUI();
            
        } catch (error) {
            console.error('❌ Error buying plan:', error);
            this.showNotification('خطا', 'مشکلی در خرید پیش آمد');
        }
    }
    
    async claimUSDT() {
        if (!this.gameData || this.gameData.usdt_balance <= 0) {
            this.showNotification('💰 ادامه استخراج', 'هنوز USDT پاداش دریافت نکرده‌اید.');
            return;
        }
        
        const usdtToClaim = this.gameData.usdt_balance;
        const sodNeeded = Math.floor(usdtToClaim * 1000000000); // 1B SOD per USDT
        
        if (this.gameData.sod_balance >= sodNeeded) {
            if (confirm(`آیا مایل به دریافت ${usdtToClaim.toFixed(4)} USDT هستید؟\n\n${this.formatNumber(sodNeeded)} SOD از موجودی شما کسر خواهد شد.`)) {
                
                this.gameData.usdt_balance = 0;
                this.gameData.sod_balance -= sodNeeded;
                
                try {
                    await window.GameDB.updateGameData(this.user.id, {
                        usdt_balance: this.gameData.usdt_balance,
                        sod_balance: this.gameData.sod_balance
                    });
                    
                    await window.GameDB.addTransaction(
                        this.user.id,
                        'دریافت پاداش USDT',
                        -usdtToClaim,
                        'usdt'
                    );
                    
                    await window.GameDB.addTransaction(
                        this.user.id,
                        'تبدیل SOD به USDT',
                        -sodNeeded,
                        'sod'
                    );
                    
                    this.showNotification(
                        '✅ پاداش دریافت شد', 
                        `${usdtToClaim.toFixed(4)} USDT دریافت کردید.`
                    );
                    
                    this.updateUI();
                    
                } catch (error) {
                    console.error('❌ Error claiming USDT:', error);
                    this.showNotification('خطا', 'مشکلی در دریافت پاداش پیش آمد');
                }
            }
        } else {
            this.showNotification(
                '⚠️ موجودی ناکافی', 
                `برای دریافت ${usdtToClaim.toFixed(4)} USDT به ${this.formatNumber(sodNeeded)} SOD نیاز دارید.\nموجودی فعلی: ${this.formatNumber(this.gameData.sod_balance)} SOD`
            );
        }
    }
    
    // ==================== UI Functions ====================
    
    updateUI() {
        if (!this.gameData) return;
        
        // موجودی‌ها
        if (document.getElementById('sodBalance')) {
            document.getElementById('sodBalance').innerHTML = 
                this.formatNumber(this.gameData.sod_balance) + ' <span>SOD</span>';
        }
        
        if (document.getElementById('usdtBalance')) {
            document.getElementById('usdtBalance').innerHTML = 
                this.gameData.usdt_balance.toFixed(4) + ' <span>USDT</span>';
        }
        
        // آمار
        if (document.getElementById('todayEarnings')) {
            document.getElementById('todayEarnings').textContent = 
                this.formatNumber(this.gameData.today_earnings) + ' SOD';
        }
        
        if (document.getElementById('miningPower')) {
            document.getElementById('miningPower').textContent = 
                this.gameData.mining_power + 'x';
        }
        
        if (document.getElementById('clickReward')) {
            document.getElementById('clickReward').textContent = 
                '+' + this.gameData.mining_power + ' SOD';
        }
        
        if (document.getElementById('userLevel')) {
            document.getElementById('userLevel').textContent = 
                this.gameData.user_level;
        }
        
        // پاداش USDT
        if (document.getElementById('availableUSDT')) {
            document.getElementById('availableUSDT').textContent = 
                this.gameData.usdt_balance.toFixed(4) + ' USDT';
        }
        
        if (document.getElementById('progressFill')) {
            const progressPercent = (this.gameData.usdt_progress / 10000000) * 100;
            document.getElementById('progressFill').style.width = progressPercent + '%';
        }
        
        if (document.getElementById('progressText')) {
            document.getElementById('progressText').textContent = 
                this.formatNumber(this.gameData.usdt_progress) + ' / ۱۰,۰۰۰,۰۰۰ SOD (۰.۰۱ USDT)';
        }
        
        // نمایش لینک ادمین
        this.showAdminLink();
    }
    
    renderTransactions(transactions) {
        const container = document.getElementById('transactionsList');
        if (!container) return;
        
        if (!transactions || transactions.length === 0) {
            container.innerHTML = `
                <div class="transaction-row">
                    <div style="text-align: center; padding: 20px; color: var(--text-secondary);">
                        هنوز تراکنشی ثبت نشده است
                    </div>
                </div>
            `;
            return;
        }
        
        container.innerHTML = transactions.map(tx => `
            <div class="transaction-row">
                <div class="transaction-type">
                    <div class="transaction-icon">
                        ${tx.type === 'usdt' ? '💰' : '⛏️'}
                    </div>
                    <div style="flex: 1;">
                        <div style="font-weight: bold;">${tx.description}</div>
                        <div style="color: var(--text-secondary); font-size: 12px;">
                            ${new Date(tx.created_at).toLocaleString('fa-IR')}
                        </div>
                    </div>
                    <div style="font-weight: bold; color: ${tx.amount > 0 ? 'var(--success)' : 'var(--error)'}">
                        ${tx.amount > 0 ? '+' : ''}${tx.type === 'usdt' ? tx.amount.toFixed(4) + ' USDT' : this.formatNumber(tx.amount) + ' SOD'}
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    createMiningEffect(amount) {
        const effect = document.createElement('div');
        effect.textContent = '+' + this.formatNumber(amount);
        effect.style.cssText = `
            position: fixed;
            color: var(--primary-light);
            font-weight: 900;
            font-size: 16px;
            pointer-events: none;
            z-index: 10000;
            text-shadow: 0 0 10px var(--primary);
            animation: miningEffect 1s ease-out forwards;
        `;
        
        const miner = document.getElementById('minerCore');
        if (miner) {
            const rect = miner.getBoundingClientRect();
            effect.style.left = (rect.left + rect.width / 2) + 'px';
            effect.style.top = (rect.top + rect.height / 2) + 'px';
        } else {
            effect.style.left = '50%';
            effect.style.top = '50%';
        }
        
        document.body.appendChild(effect);
        setTimeout(() => effect.remove(), 1000);
    }
    
    formatNumber(num) {
        if (num >= 1000000000) return (num / 1000000000).toFixed(2) + 'B';
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return Math.floor(num).toLocaleString('fa-IR');
    }
    
    showNotification(title, message) {
        // استفاده از سیستم نوتیفیکیشن موجود
        if (typeof window.showNotification === 'function') {
            window.showNotification(title, message);
        } else {
            alert(title + '\n' + message);
        }
    }
    
    showMainPage() {
        document.getElementById('registerOverlay').style.display = 'none';
        document.getElementById('mainContainer').style.display = 'block';
    }
    
    showLoginPage() {
        document.getElementById('registerOverlay').style.display = 'flex';
        document.getElementById('mainContainer').style.display = 'none';
    }
    
    checkAdminStatus() {
        if (!this.user) return;
        
        // ایمیل‌های ادمین
        const adminEmails = [
            'hamyarhf@gmail.com',
            'admin@example.com',
            'test@example.com'
        ];
        
        this.isAdmin = adminEmails.includes(this.user.email);
        this.showAdminLink();
    }
    
    showAdminLink() {
        const adminLink = document.getElementById('adminLink');
        if (adminLink) {
            adminLink.style.display = this.isAdmin ? 'flex' : 'none';
        }
    }
    
    // ==================== Event Listeners ====================
    
    setupEventListeners() {
        // کلیک ماینر
        const minerCore = document.getElementById('minerCore');
        if (minerCore) {
            minerCore.addEventListener('click', () => this.mine());
        }
        
        // دکمه دریافت USDT
        const claimBtn = document.getElementById('claimUSDTBtn');
        if (claimBtn) {
            claimBtn.addEventListener('click', () => this.claimUSDT());
        }
        
        // دکمه‌های خرید پنل
        document.addEventListener('click', (e) => {
            if (e.target.closest('[data-plan-id]')) {
                const planId = parseInt(e.target.closest('[data-plan-id]').getAttribute('data-plan-id'));
                this.buySODPlan(planId);
            }
        });
        
        // Auto mine button
        const autoMineBtn = document.getElementById('autoMineBtn');
        if (autoMineBtn) {
            autoMineBtn.addEventListener('click', () => this.toggleAutoMine());
        }
    }
    
    async toggleAutoMine() {
        if (!this.gameData) return;
        
        if (this.autoMineInterval) {
            clearInterval(this.autoMineInterval);
            this.autoMineInterval = null;
            this.showNotification('⏸️ توقف خودکار', 'استخراج خودکار متوقف شد.');
            return;
        }
        
        if (this.gameData.sod_balance < 1000000) {
            this.showNotification('⚠️ موجودی ناکافی', 'برای فعال کردن استخراج خودکار حداقل ۱ میلیون SOD نیاز دارید.');
            return;
        }
        
        this.autoMineInterval = setInterval(async () => {
            if (!this.gameData) return;
            
            const earned = Math.floor(this.gameData.mining_power * 0.5);
            this.gameData.sod_balance += earned;
            this.gameData.total_mined += earned;
            this.gameData.today_earnings += earned;
            this.gameData.usdt_progress += earned;
            
            this.updateUI();
            await this.checkUSDT();
            
        }, 1000);
        
        this.showNotification('🤖 استخراج خودکار', 'سیستم استخراج خودکار فعال شد.');
    }
    
    startAutoSave() {
        this.autoSaveInterval = setInterval(async () => {
            if (this.user && this.gameData) {
                try {
                    await window.GameDB.updateGameData(this.user.id, {
                        sod_balance: this.gameData.sod_balance,
                        usdt_balance: this.gameData.usdt_balance,
                        total_mined: this.gameData.total_mined,
                        today_earnings: this.gameData.today_earnings,
                        usdt_progress: this.gameData.usdt_progress
                    });
                    console.log('💾 Auto-saved game data');
                } catch (error) {
                    console.error('❌ Auto-save error:', error);
                }
            }
        }, 30000); // هر 30 ثانیه
    }
    
    // ==================== Authentication ====================
    
    async login(email, password) {
        try {
            const { data, error } = await window.supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });
            
            if (error) throw error;
            
            this.user = data.user;
            await this.loadUserData();
            this.showMainPage();
            
            this.showNotification('خوش آمدید', 'با موفقیت وارد شدید!');
            return true;
            
        } catch (error) {
            console.error('❌ Login error:', error);
            this.showNotification('خطا در ورود', error.message);
            return false;
        }
    }
    
    async register(email, password, fullName) {
        try {
            const { data, error } = await window.supabaseClient.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        full_name: fullName || email.split('@')[0]
                    }
                }
            });
            
            if (error) throw error;
            
            this.showNotification('ثبت‌نام موفق', 'حساب شما ایجاد شد! اکنون وارد شوید.');
            return true;
            
        } catch (error) {
            console.error('❌ Register error:', error);
            this.showNotification('خطا در ثبت‌نام', error.message);
            return false;
        }
    }
    
    async logout() {
        try {
            await window.supabaseClient.auth.signOut();
            this.user = null;
            this.gameData = null;
            this.showLoginPage();
            this.showNotification('خروج', 'با موفقیت خارج شدید.');
        } catch (error) {
            console.error('❌ Logout error:', error);
        }
    }
}

// ایجاد نمونه بازی
let gameInstance = null;

// تابع‌های عمومی برای دسترسی از HTML
window.loginUser = async function() {
    const email = document.getElementById('authEmail')?.value;
    const password = document.getElementById('authPassword')?.value;
    
    if (!email || !password) {
        alert('لطفاً ایمیل و رمز عبور را وارد کنید');
        return;
    }
    
    if (!gameInstance) {
        gameInstance = new SODmaxGame();
    }
    
    await gameInstance.login(email, password);
};

window.registerUser = async function() {
    const email = document.getElementById('authEmail')?.value;
    const password = document.getElementById('authPassword')?.value;
    const name = prompt('نام کامل خود را وارد کنید:', email.split('@')[0]);
    
    if (!email || !password) {
        alert('لطفاً ایمیل و رمز عبور را وارد کنید');
        return;
    }
    
    if (!gameInstance) {
        gameInstance = new SODmaxGame();
    }
    
    await gameInstance.register(email, password, name);
};

window.logoutUser = function() {
    if (gameInstance) {
        gameInstance.logout();
    }
};

// راه‌اندازی بازی
document.addEventListener('DOMContentLoaded', () => {
    gameInstance = new SODmaxGame();
});