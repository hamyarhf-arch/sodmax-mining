// ==================== app-core.js (نسخه کامل با دیتابیس) ====================
// هسته اصلی بازی SODmAX Pro با اتصال کامل به Supabase
// تاریخ: ۲۵ اسفند ۱۴۰۳

console.log('🎮 بارگذاری هسته بازی SODmAX Pro با دیتابیس...');

// ==================== کلاس اصلی بازی ====================
class SODmaxGame {
    constructor() {
        this.user = null;
        this.gameData = null;
        this.userInfo = null;
        this.transactions = [];
        this.isAdmin = false;
        this.autoMineInterval = null;
        this.autoSaveInterval = null;
        this.boostInterval = null;
        
        // پنل‌های فروش SOD
        this.sodSalePlans = [
            {
                id: 1,
                name: "پنل استارتر",
                usdtPrice: 1,
                sodAmount: 5000000,
                features: [
                    "۵,۰۰۰,۰۰۰ SOD",
                    "هدیه ۵۰۰,۰۰۰ SOD اضافی",
                    "قدرت استخراج +۵٪ به مدت ۷ روز",
                    "پشتیبانی اولیه",
                    "کد تخفیف ۱۰٪ برای خرید بعدی"
                ],
                popular: false,
                discount: 0
            },
            {
                id: 2,
                name: "پنل پرو",
                usdtPrice: 5,
                sodAmount: 30000000,
                features: [
                    "۳۰,۰۰۰,۰۰۰ SOD",
                    "هدیه ۳,۰۰۰,۰۰۰ SOD اضافی",
                    "قدرت استخراج +۱۵٪ به مدت ۱۴ روز",
                    "پشتیبانی ویژه",
                    "کد تخفیف ۱۵٪ برای خرید بعدی",
                    "دسترسی به استخراج خودکار"
                ],
                popular: true,
                discount: 10
            },
            {
                id: 3,
                name: "پنل پلاتینیوم",
                usdtPrice: 15,
                sodAmount: 100000000,
                features: [
                    "۱۰۰,۰۰۰,۰۰۰ SOD",
                    "هدیه ۱۰,۰۰۰,۰۰۰ SOD اضافی",
                    "قدرت استخراج +۳۰٪ به مدت ۳۰ روز",
                    "پشتیبانی VIP",
                    "کد تخفیف ۲۰٪ برای خرید بعدی",
                    "دسترسی به استخراج خودکار",
                    "دریافت روزانه پاداش SOD"
                ],
                popular: false,
                discount: 15
            },
            {
                id: 4,
                name: "پنل الماس",
                usdtPrice: 50,
                sodAmount: 500000000,
                features: [
                    "۵۰۰,۰۰۰,۰۰۰ SOD",
                    "هدیه ۵۰,۰۰۰,۰۰۰ SOD اضافی",
                    "قدرت استخراج +۵۰٪ به مدت ۶۰ روز",
                    "پشتیبانی اختصاصی",
                    "کد تخفیف ۳۰٪ برای خرید بعدی",
                    "دسترسی به استخراج خودکار",
                    "دریافت روزانه پاداش SOD",
                    "مشارکت در سود شبکه",
                    "دسترسی به API پیشرفته"
                ],
                popular: false,
                discount: 20
            }
        ];
        
        console.log('✅ نمونه بازی ایجاد شد');
    }
    
    // ==================== راه‌اندازی اولیه ====================
    
    async init() {
        console.log('🚀 راه‌اندازی بازی با دیتابیس...');
        
        try {
            // 1. بررسی Supabase
            if (!window.supabaseClient) {
                console.error('❌ Supabase بارگذاری نشده است');
                this.showNotification('خطا', 'سیستم دیتابیس آماده نیست. لطفاً صفحه را رفرش کنید.');
                return;
            }
            
            // 2. بررسی session کاربر
            await this.checkAuthSession();
            
            // 3. تنظیم رویدادها
            this.setupEventListeners();
            
            // 4. رندر پنل‌های فروش
            this.renderSalePlans();
            
            // 5. بروزرسانی UI
            if (this.user) {
                this.showMainPage();
                await this.updateUI();
            } else {
                this.showLoginPage();
            }
            
            console.log('✅ بازی با دیتابیس راه‌اندازی شد');
            
        } catch (error) {
            console.error('❌ خطا در راه‌اندازی بازی:', error);
            this.showNotification('خطا', 'مشکلی در راه‌اندازی بازی پیش آمد');
        }
    }
    
    // ==================== احراز هویت و مدیریت کاربر ====================
    
    async checkAuthSession() {
        try {
            // بررسی session در Supabase
            const { data: { session }, error } = await window.supabaseClient.auth.getSession();
            
            if (error) {
                console.error('❌ خطا در دریافت session:', error);
                return false;
            }
            
            if (session) {
                this.user = session.user;
                console.log('✅ کاربر پیدا شد:', this.user.email);
                
                // بارگذاری اطلاعات کاربر
                await this.loadUserData();
                
                // بررسی ادمین
                this.checkAdminStatus();
                
                return true;
            }
            
            console.log('⚠️ کاربر لاگین نکرده است');
            return false;
            
        } catch (error) {
            console.error('❌ خطا در بررسی session:', error);
            return false;
        }
    }
    
    async loadUserData() {
        if (!this.user) return;
        
        console.log('📊 بارگذاری اطلاعات کاربر از دیتابیس...');
        
        try {
            // 1. دریافت اطلاعات کاربر
            const { data: userData, error: userError } = await window.supabaseClient
                .from('users')
                .select('*')
                .eq('id', this.user.id)
                .single();
            
            if (userError) {
                if (userError.code === 'PGRST116') {
                    // کاربر وجود ندارد، ایجاد کن
                    console.log('👤 کاربر جدید، ایجاد رکورد...');
                    await this.createUserRecord();
                    await this.loadUserData(); // بارگذاری مجدد
                    return;
                }
                throw userError;
            }
            
            this.userInfo = userData;
            
            // 2. دریافت اطلاعات بازی
            const { data: gameData, error: gameError } = await window.supabaseClient
                .from('game_data')
                .select('*')
                .eq('user_id', this.user.id)
                .single();
            
            if (gameError) {
                if (gameError.code === 'PGRST116') {
                    // اطلاعات بازی وجود ندارد، ایجاد کن
                    console.log('🎮 اطلاعات بازی جدید، ایجاد رکورد...');
                    await this.createGameDataRecord();
                    await this.loadUserData(); // بارگذاری مجدد
                    return;
                }
                throw gameError;
            }
            
            this.gameData = gameData;
            
            // 3. دریافت تراکنش‌های اخیر
            await this.loadRecentTransactions();
            
            // 4. بررسی بوست فعال
            this.checkActiveBoost();
            
            console.log('✅ اطلاعات کاربر بارگذاری شد');
            
        } catch (error) {
            console.error('❌ خطا در بارگذاری اطلاعات کاربر:', error);
            this.showNotification('خطا', 'مشکلی در بارگذاری اطلاعات پیش آمد');
        }
    }
    
    async createUserRecord() {
        try {
            const userData = {
                id: this.user.id,
                email: this.user.email,
                full_name: this.user.user_metadata?.full_name || this.user.email.split('@')[0],
                register_date: new Date().toISOString(),
                last_login: new Date().toISOString(),
                invite_code: this.generateInviteCode(),
                is_active: true,
                is_admin: this.isAdmin,
                level: 1,
                total_earned: 0,
                referral_count: 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            const { error } = await window.supabaseClient
                .from('users')
                .insert([userData]);
            
            if (error) throw error;
            
            console.log('✅ رکورد کاربر ایجاد شد');
            
        } catch (error) {
            console.error('❌ خطا در ایجاد رکورد کاربر:', error);
            throw error;
        }
    }
    
    async createGameDataRecord() {
        try {
            const gameData = {
                user_id: this.user.id,
                sod_balance: 1000000,
                usdt_balance: 0,
                user_level: 1,
                mining_power: 10,
                total_mined: 1000000,
                today_earnings: 0,
                usdt_progress: 0,
                boost_active: false,
                boost_end_time: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            const { error } = await window.supabaseClient
                .from('game_data')
                .insert([gameData]);
            
            if (error) throw error;
            
            // ایجاد تراکنش هدیه ثبت نام
            await this.addTransaction('هدیه ثبت نام', 1000000, 'sod');
            
            console.log('✅ رکورد بازی ایجاد شد');
            
        } catch (error) {
            console.error('❌ خطا در ایجاد رکورد بازی:', error);
            throw error;
        }
    }
    
    // ==================== ورود و ثبت‌نام ====================
    
    async loginUser() {
        const email = document.getElementById('authEmail')?.value;
        const password = document.getElementById('authPassword')?.value;
        
        if (!email || !password) {
            this.showNotification('خطا', 'لطفاً ایمیل و رمز عبور را وارد کنید');
            return false;
        }
        
        try {
            console.log(`🔑 درخواست ورود: ${email}`);
            
            const { data, error } = await window.supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });
            
            if (error) throw error;
            
            if (data.user) {
                this.user = data.user;
                await this.loadUserData();
                
                this.showNotification('خوش آمدید', `سلام ${this.userInfo?.full_name || email.split('@')[0]}!`);
                
                this.showMainPage();
                await this.updateUI();
                
                return true;
            }
            
        } catch (error) {
            console.error('❌ خطا در ورود:', error);
            
            let message = 'خطا در ورود';
            if (error.message.includes('Invalid login credentials')) {
                message = 'ایمیل یا رمز عبور اشتباه است';
            } else if (error.message.includes('Email not confirmed')) {
                message = 'لطفاً ابتدا ایمیل خود را تایید کنید';
            }
            
            this.showNotification('خطا در ورود', message);
            return false;
        }
    }
    
    async registerUser() {
        const email = document.getElementById('authEmail')?.value;
        const password = document.getElementById('authPassword')?.value;
        
        if (!email || !password) {
            this.showNotification('خطا', 'لطفاً ایمیل و رمز عبور را وارد کنید');
            return false;
        }
        
        // اعتبارسنجی ایمیل
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            this.showNotification('خطا', 'لطفاً یک ایمیل معتبر وارد کنید');
            return false;
        }
        
        // اعتبارسنجی رمز عبور
        if (password.length < 6) {
            this.showNotification('خطا', 'رمز عبور باید حداقل ۶ کاراکتر باشد');
            return false;
        }
        
        try {
            console.log(`📝 درخواست ثبت‌نام: ${email}`);
            
            const { data, error } = await window.supabaseClient.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        full_name: email.split('@')[0],
                        created_at: new Date().toISOString()
                    }
                }
            });
            
            if (error) throw error;
            
            if (data.user) {
                this.showNotification('ثبت‌نام موفق', 'حساب شما ایجاد شد! اکنون وارد شوید.');
                
                // خودکار لاگین کن
                setTimeout(() => {
                    document.getElementById('authPassword').value = password;
                    this.loginUser();
                }, 2000);
                
                return true;
            }
            
        } catch (error) {
            console.error('❌ خطا در ثبت‌نام:', error);
            
            let message = 'خطا در ثبت‌نام';
            if (error.message.includes('already registered')) {
                message = 'این ایمیل قبلاً ثبت شده است';
            } else if (error.message.includes('weak password')) {
                message = 'رمز عبور بسیار ضعیف است';
            }
            
            this.showNotification('خطا در ثبت‌نام', message);
            return false;
        }
    }
    
    async logout() {
        try {
            console.log('🚪 درخواست خروج...');
            
            // توقف عملیات خودکار
            this.stopAutoMining();
            
            if (this.boostInterval) {
                clearInterval(this.boostInterval);
                this.boostInterval = null;
            }
            
            // خروج از Supabase
            const { error } = await window.supabaseClient.auth.signOut();
            if (error) throw error;
            
            this.user = null;
            this.gameData = null;
            this.userInfo = null;
            this.transactions = [];
            
            this.showLoginPage();
            this.showNotification('خروج موفق', 'با موفقیت از سیستم خارج شدید');
            
        } catch (error) {
            console.error('❌ خطا در خروج:', error);
        }
    }
    
    // ==================== منطق اصلی بازی ====================
    
    async mine() {
        if (!this.user || !this.gameData) {
            this.showNotification('خطا', 'لطفاً ابتدا وارد سیستم شوید');
            return;
        }
        
        try {
            // محاسبه مقدار استخراج
            const basePower = this.gameData.mining_power || 10;
            const boostMultiplier = this.gameData.boost_active ? 3 : 1;
            const earned = basePower * boostMultiplier;
            
            console.log(`⛏️ استخراج دستی: ${earned} SOD`);
            
            // بروزرسانی محلی
            this.gameData.sod_balance += earned;
            this.gameData.total_mined += earned;
            this.gameData.today_earnings += earned;
            this.gameData.usdt_progress += earned;
            
            // بروزرسانی در دیتابیس
            await this.updateGameData({
                sod_balance: this.gameData.sod_balance,
                total_mined: this.gameData.total_mined,
                today_earnings: this.gameData.today_earnings,
                usdt_progress: this.gameData.usdt_progress
            });
            
            // ثبت تراکنش
            await this.addTransaction('استخراج دستی', earned, 'sod');
            
            // افکت‌های بصری
            this.createMiningEffect(earned);
            
            // انیمیشن کلیک
            const minerCore = document.getElementById('minerCore');
            if (minerCore) {
                minerCore.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    minerCore.style.transform = 'scale(1)';
                }, 150);
            }
            
            // بروزرسانی UI
            await this.updateUI();
            
            // بررسی پاداش USDT
            await this.checkUSDT();
            
        } catch (error) {
            console.error('❌ خطا در استخراج:', error);
            this.showNotification('خطا', 'مشکلی در استخراج پیش آمد');
        }
    }
    
    async checkUSDT() {
        if (!this.gameData || (this.gameData.usdt_progress || 0) < 10000000) {
            return;
        }
        
        try {
            const usdtEarned = 0.01;
            
            console.log(`💰 پاداش USDT دریافت شد: ${usdtEarned} USDT`);
            
            // بروزرسانی
            this.gameData.usdt_balance += usdtEarned;
            this.gameData.usdt_progress -= 10000000;
            
            // بروزرسانی در دیتابیس
            await this.updateGameData({
                usdt_balance: this.gameData.usdt_balance,
                usdt_progress: this.gameData.usdt_progress
            });
            
            // ثبت تراکنش
            await this.addTransaction('دریافت پاداش USDT', usdtEarned, 'usdt');
            
            // اعلان
            this.showNotification('🎉 پاداش USDT', `${usdtEarned.toFixed(4)} USDT دریافت کردید!`);
            
            // شانس ارتقاء سطح
            if (Math.random() < 0.15) {
                this.gameData.user_level += 1;
                this.gameData.mining_power = 10 * this.gameData.user_level;
                
                await this.updateGameData({
                    user_level: this.gameData.user_level,
                    mining_power: this.gameData.mining_power
                });
                
                this.showNotification('⭐ ارتقاء سطح', `سطح شما به ${this.gameData.user_level} ارتقاء یافت!`);
            }
            
            await this.updateUI();
            
        } catch (error) {
            console.error('❌ خطا در بررسی USDT:', error);
        }
    }
    
    async claimUSDT() {
        if (!this.user || !this.gameData) {
            this.showNotification('خطا', 'لطفاً ابتدا وارد سیستم شوید');
            return;
        }
        
        if (!this.gameData.usdt_balance || this.gameData.usdt_balance <= 0) {
            this.showNotification('اطلاع', 'هنوز USDT پاداش دریافت نکرده‌اید.');
            return;
        }
        
        const usdtToClaim = this.gameData.usdt_balance;
        const sodNeeded = Math.floor(usdtToClaim * 1000000000);
        
        if (this.gameData.sod_balance < sodNeeded) {
            this.showNotification('⚠️ موجودی ناکافی', 
                `برای دریافت ${usdtToClaim.toFixed(4)} USDT به ${this.formatNumber(sodNeeded)} SOD نیاز دارید.`);
            return;
        }
        
        const confirmMsg = `آیا مایل به دریافت ${usdtToClaim.toFixed(4)} USDT هستید؟\n\n${this.formatNumber(sodNeeded)} SOD از موجودی شما کسر خواهد شد.`;
        
        if (!confirm(confirmMsg)) {
            return;
        }
        
        try {
            // کسر SOD و دریافت USDT
            this.gameData.usdt_balance = 0;
            this.gameData.sod_balance -= sodNeeded;
            
            // بروزرسانی در دیتابیس
            await this.updateGameData({
                usdt_balance: this.gameData.usdt_balance,
                sod_balance: this.gameData.sod_balance
            });
            
            // ثبت تراکنش‌ها
            await this.addTransaction('دریافت پاداش USDT', -usdtToClaim, 'usdt');
            await this.addTransaction('تبدیل SOD به USDT', -sodNeeded, 'sod');
            
            this.showNotification('✅ پاداش دریافت شد', `${usdtToClaim.toFixed(4)} USDT دریافت کردید.`);
            
            await this.updateUI();
            
        } catch (error) {
            console.error('❌ خطا در دریافت پاداش:', error);
            this.showNotification('خطا', 'مشکلی در دریافت پاداش پیش آمد');
        }
    }
    
    async buySODPlan(planId) {
        if (!this.user || !this.gameData) {
            this.showNotification('خطا', 'لطفاً ابتدا وارد سیستم شوید');
            return;
        }
        
        const plan = this.sodSalePlans.find(p => p.id === planId);
        if (!plan) {
            this.showNotification('خطا', 'پنل انتخاب شده معتبر نیست');
            return;
        }
        
        // محاسبه SOD با در نظر گرفتن تخفیف
        const bonusSOD = Math.floor(plan.sodAmount * (plan.discount / 100));
        const totalSOD = plan.sodAmount + bonusSOD;
        
        const confirmMsg = `آیا مایل به خرید پنل ${plan.name} هستید؟\n\n` +
                          `💰 مبلغ: ${plan.usdtPrice} USDT\n` +
                          `🎁 دریافت: ${this.formatNumber(totalSOD)} SOD\n` +
                          `(اصلی: ${this.formatNumber(plan.sodAmount)} SOD + هدیه: ${this.formatNumber(bonusSOD)} SOD)`;
        
        if (!confirm(confirmMsg)) return;
        
        try {
            console.log(`🛒 خرید پنل ${plan.name}: ${totalSOD} SOD`);
            
            // در نسخه واقعی اینجا باید پرداخت USDT انجام شود
            // فعلاً فقط SOD اضافه می‌کنیم
            
            this.gameData.sod_balance += totalSOD;
            this.gameData.total_mined += totalSOD;
            
            // بروزرسانی در دیتابیس
            await this.updateGameData({
                sod_balance: this.gameData.sod_balance,
                total_mined: this.gameData.total_mined
            });
            
            // ثبت تراکنش
            await this.addTransaction(`خرید پنل ${plan.name}`, totalSOD, 'sod');
            
            this.showNotification('🎉 خرید موفق', `پنل ${plan.name} با موفقیت خریداری شد!\n${this.formatNumber(totalSOD)} SOD به موجودی شما اضافه شد.`);
            
            await this.updateUI();
            
        } catch (error) {
            console.error('❌ خطا در خرید پنل:', error);
            this.showNotification('خطا', 'مشکلی در خرید پنل پیش آمد');
        }
    }
    
    async boostMining() {
        if (!this.user || !this.gameData) {
            this.showNotification('خطا', 'لطفاً ابتدا وارد سیستم شوید');
            return;
        }
        
        const cost = 5000;
        
        if (this.gameData.sod_balance < cost) {
            this.showNotification('⚠️ موجودی کافی نیست', 'برای افزایش قدرت به ۵۰۰۰ SOD نیاز دارید.');
            return;
        }
        
        try {
            // کسر هزینه
            this.gameData.sod_balance -= cost;
            this.gameData.boost_active = true;
            this.gameData.boost_end_time = new Date(Date.now() + (30 * 60 * 1000)).toISOString();
            
            // بروزرسانی در دیتابیس
            await this.updateGameData({
                sod_balance: this.gameData.sod_balance,
                boost_active: true,
                boost_end_time: this.gameData.boost_end_time
            });
            
            // ثبت تراکنش
            await this.addTransaction('خرید افزایش قدرت', -cost, 'sod');
            
            this.showNotification('⚡ افزایش قدرت', 'قدرت استخراج شما ۳ برابر شد! (۳۰ دقیقه)');
            
            // تنظیم تایمر برای پایان بوست
            this.setupBoostTimer();
            
            await this.updateUI();
            
        } catch (error) {
            console.error('❌ خطا در افزایش قدرت:', error);
            this.showNotification('خطا', 'مشکلی در افزایش قدرت پیش آمد');
        }
    }
    
    checkActiveBoost() {
        if (!this.gameData || !this.gameData.boost_active || !this.gameData.boost_end_time) {
            return;
        }
        
        const boostEndTime = new Date(this.gameData.boost_end_time);
        const now = new Date();
        
        if (now > boostEndTime) {
            // بوست تمام شده
            this.gameData.boost_active = false;
            this.updateGameData({ boost_active: false });
        } else {
            // بوست هنوز فعال است، تایمر تنظیم کن
            this.setupBoostTimer();
        }
    }
    
    setupBoostTimer() {
        if (this.boostInterval) {
            clearInterval(this.boostInterval);
        }
        
        if (!this.gameData.boost_active || !this.gameData.boost_end_time) {
            return;
        }
        
        const boostEndTime = new Date(this.gameData.boost_end_time).getTime();
        
        this.boostInterval = setInterval(() => {
            const now = Date.now();
            
            if (now > boostEndTime) {
                clearInterval(this.boostInterval);
                this.boostInterval = null;
                
                if (this.gameData) {
                    this.gameData.boost_active = false;
                    this.updateGameData({ boost_active: false });
                    this.showNotification('پایان بوست', 'زمان افزایش قدرت به پایان رسید.');
                    this.updateUI();
                }
            }
        }, 10000); // چک هر ۱۰ ثانیه
    }
    
    async toggleAutoMine() {
        if (!this.user || !this.gameData) {
            this.showNotification('خطا', 'لطفاً ابتدا وارد سیستم شوید');
            return;
        }
        
        const autoMineBtn = document.getElementById('autoMineBtn');
        
        if (this.autoMineInterval) {
            // توقف استخراج خودکار
            this.stopAutoMining();
            autoMineBtn.innerHTML = '<i class="fas fa-robot"></i> استخراج خودکار';
            autoMineBtn.style.background = '';
            this.showNotification('⏸️ توقف خودکار', 'استخراج خودکار متوقف شد.');
            return;
        }
        
        // بررسی حداقل موجودی برای استخراج خودکار
        if (this.gameData.sod_balance < 1000000) {
            this.showNotification('⚠️ موجودی ناکافی', 'برای فعال کردن استخراج خودکار حداقل ۱ میلیون SOD نیاز دارید.');
            return;
        }
        
        // شروع استخراج خودکار
        this.autoMineInterval = setInterval(async () => {
            if (!this.gameData) return;
            
            const earned = Math.floor((this.gameData.mining_power || 10) * 0.5);
            const boostMultiplier = this.gameData.boost_active ? 3 : 1;
            const totalEarned = earned * boostMultiplier;
            
            this.gameData.sod_balance += totalEarned;
            this.gameData.total_mined += totalEarned;
            this.gameData.today_earnings += totalEarned;
            this.gameData.usdt_progress += totalEarned;
            
            // ذخیره محلی هر ۱۰ ثانیه
            if (Math.random() < 0.1) {
                await this.updateGameData({
                    sod_balance: this.gameData.sod_balance,
                    total_mined: this.gameData.total_mined,
                    today_earnings: this.gameData.today_earnings,
                    usdt_progress: this.gameData.usdt_progress
                });
            }
            
            this.updateUIDisplay();
            await this.checkUSDT();
            
        }, 1000); // هر ثانیه
        
        autoMineBtn.innerHTML = '<i class="fas fa-pause"></i> توقف خودکار';
        autoMineBtn.style.background = 'var(--error)';
        this.showNotification('🤖 استخراج خودکار', 'سیستم استخراج خودکار فعال شد.');
    }
    
    stopAutoMining() {
        if (this.autoMineInterval) {
            clearInterval(this.autoMineInterval);
            this.autoMineInterval = null;
            
            // ذخیره نهایی
            if (this.gameData) {
                this.updateGameData({
                    sod_balance: this.gameData.sod_balance,
                    total_mined: this.gameData.total_mined,
                    today_earnings: this.gameData.today_earnings,
                    usdt_progress: this.gameData.usdt_progress
                });
            }
        }
    }
    
    // ==================== مدیریت تراکنش‌ها ====================
    
    async addTransaction(description, amount, type = 'sod') {
        if (!this.user) return;
        
        try {
            const transaction = {
                user_id: this.user.id,
                description: description,
                amount: amount,
                type: type,
                created_at: new Date().toISOString()
            };
            
            const { error } = await window.supabaseClient
                .from('transactions')
                .insert([transaction]);
            
            if (error) throw error;
            
            // اضافه کردن به لیست محلی
            this.transactions.unshift(transaction);
            if (this.transactions.length > 20) {
                this.transactions = this.transactions.slice(0, 20);
            }
            
            console.log('✅ تراکنش ثبت شد:', description);
            
        } catch (error) {
            console.error('❌ خطا در ثبت تراکنش:', error);
        }
    }
    
    async loadRecentTransactions() {
        if (!this.user) return;
        
        try {
            const { data, error } = await window.supabaseClient
                .from('transactions')
                .select('*')
                .eq('user_id', this.user.id)
                .order('created_at', { ascending: false })
                .limit(10);
            
            if (error) throw error;
            
            this.transactions = data || [];
            
        } catch (error) {
            console.error('❌ خطا در بارگذاری تراکنش‌ها:', error);
            this.transactions = [];
        }
    }
    
    // ==================== مدیریت دیتابیس ====================
    
    async updateGameData(updates) {
        if (!this.user || !this.gameData) return;
        
        try {
            updates.updated_at = new Date().toISOString();
            
            const { error } = await window.supabaseClient
                .from('game_data')
                .update(updates)
                .eq('user_id', this.user.id);
            
            if (error) throw error;
            
            // بروزرسانی محلی
            Object.assign(this.gameData, updates);
            
        } catch (error) {
            console.error('❌ خطا در بروزرسانی اطلاعات بازی:', error);
            throw error;
        }
    }
    
    async updateUserData(updates) {
        if (!this.user || !this.userInfo) return;
        
        try {
            updates.updated_at = new Date().toISOString();
            
            const { error } = await window.supabaseClient
                .from('users')
                .update(updates)
                .eq('id', this.user.id);
            
            if (error) throw error;
            
            // بروزرسانی محلی
            Object.assign(this.userInfo, updates);
            
        } catch (error) {
            console.error('❌ خطا در بروزرسانی اطلاعات کاربر:', error);
            throw error;
        }
    }
    
    // ==================== UI و نمایش ====================
    
    async updateUI() {
        if (!this.gameData) return;
        
        // موجودی‌ها
        this.updateElement('sodBalance', this.formatNumber(this.gameData.sod_balance) + ' <span>SOD</span>');
        this.updateElement('usdtBalance', (this.gameData.usdt_balance || 0).toFixed(4) + ' <span>USDT</span>');
        
        // آمار
        this.updateElement('todayEarnings', this.formatNumber(this.gameData.today_earnings || 0) + ' SOD');
        this.updateElement('miningPower', (this.gameData.mining_power || 10) + 'x');
        this.updateElement('clickReward', '+' + (this.gameData.mining_power || 10) + ' SOD');
        this.updateElement('userLevel', this.gameData.user_level || 1);
        
        // پاداش USDT
        this.updateElement('availableUSDT', (this.gameData.usdt_balance || 0).toFixed(4) + ' USDT');
        this.updateElement('nextReward', '۰.۰۱ USDT');
        
        // نوار پیشرفت
        const progressPercent = Math.min(((this.gameData.usdt_progress || 0) / 10000000) * 100, 100);
        const progressFill = document.getElementById('progressFill');
        if (progressFill) {
            progressFill.style.width = progressPercent + '%';
        }
        
        this.updateElement('progressText', 
            this.formatNumber(this.gameData.usdt_progress || 0) + ' / ۱۰,۰۰۰,۰۰۰ SOD (۰.۰۱ USDT)'
        );
        
        // دکمه دریافت USDT
        const claimBtn = document.getElementById('claimUSDTBtn');
        if (claimBtn) {
            if (this.gameData.usdt_balance > 0) {
                claimBtn.disabled = false;
                claimBtn.style.opacity = '1';
            } else {
                claimBtn.disabled = true;
                claimBtn.style.opacity = '0.7';
            }
        }
        
        // دکمه استخراج خودکار
        const autoBtn = document.getElementById('autoMineBtn');
        if (autoBtn) {
            if (this.gameData.sod_balance >= 1000000) {
                autoBtn.disabled = false;
                autoBtn.style.opacity = '1';
                
                if (this.autoMineInterval) {
                    autoBtn.innerHTML = '<i class="fas fa-pause"></i> توقف خودکار';
                    autoBtn.style.background = 'var(--error)';
                } else {
                    autoBtn.innerHTML = '<i class="fas fa-robot"></i> استخراج خودکار';
                    autoBtn.style.background = '';
                }
            } else {
                autoBtn.disabled = true;
                autoBtn.style.opacity = '0.7';
                autoBtn.innerHTML = '<i class="fas fa-robot"></i> نیاز به ۱M SOD';
            }
        }
        
        // نمایش بوست فعال
        if (this.gameData.boost_active) {
            document.querySelector('.miner-core')?.style.setProperty('--primary', '#FF6B35');
        } else {
            document.querySelector('.miner-core')?.style.removeProperty('--primary');
        }
        
        // رندر تراکنش‌ها
        this.renderTransactions();
        
        // نمایش لینک ادمین
        this.showAdminLink();
    }
    
    updateUIDisplay() {
        // بروزرسانی سریع UI بدون بارگذاری از دیتابیس
        if (this.gameData) {
            this.updateElement('sodBalance', this.formatNumber(this.gameData.sod_balance) + ' <span>SOD</span>');
            this.updateElement('todayEarnings', this.formatNumber(this.gameData.today_earnings || 0) + ' SOD');
            
            const progressPercent = Math.min(((this.gameData.usdt_progress || 0) / 10000000) * 100, 100);
            const progressFill = document.getElementById('progressFill');
            if (progressFill) {
                progressFill.style.width = progressPercent + '%';
            }
        }
    }
    
    renderTransactions() {
        const list = document.getElementById('transactionsList');
        if (!list) return;
        
        if (!this.transactions || this.transactions.length === 0) {
            list.innerHTML = `
                <div class="transaction-row">
                    <div class="transaction-type">
                        <div class="transaction-icon">🎁</div>
                        <div style="flex: 1;">
                            <div style="font-weight: bold;">هدیه ثبت نام</div>
                            <div style="color: var(--text-secondary); font-size: 12px;">${new Date().toLocaleDateString('fa-IR')}</div>
                        </div>
                        <div style="font-weight: bold; color: var(--primary-light);">
                            +۱,۰۰۰,۰۰۰ SOD
                        </div>
                    </div>
                </div>
            `;
            return;
        }
        
        list.innerHTML = this.transactions.map(tx => {
            const date = new Date(tx.created_at);
            const time = date.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
            const dateStr = date.toLocaleDateString('fa-IR');
            
            let icon = '⛏️';
            let color = 'var(--primary-light)';
            
            if (tx.type === 'usdt') {
                icon = '💰';
                color = tx.amount > 0 ? 'var(--usdt)' : 'var(--error)';
            } else if (tx.amount < 0) {
                icon = '📤';
                color = 'var(--error)';
            } else if (tx.description.includes('خرید پنل')) {
                icon = '🛒';
            } else if (tx.description.includes('افزایش قدرت')) {
                icon = '⚡';
            }
            
            const amount = tx.type === 'usdt' 
                ? (tx.amount > 0 ? '+' : '') + Math.abs(tx.amount).toFixed(4) + ' USDT'
                : (tx.amount > 0 ? '+' : '') + this.formatNumber(tx.amount) + ' SOD';
            
            return `
                <div class="transaction-row">
                    <div class="transaction-type">
                        <div class="transaction-icon">${icon}</div>
                        <div style="flex: 1;">
                            <div style="font-weight: bold;">${tx.description}</div>
                            <div style="color: var(--text-secondary); font-size: 12px;">${dateStr} ${time}</div>
                        </div>
                        <div style="font-weight: bold; color: ${color}">
                            ${amount}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    renderSalePlans() {
        const grid = document.getElementById('salePlansGrid');
        if (!grid) return;
        
        grid.innerHTML = this.sodSalePlans.map(plan => {
            const totalSOD = plan.sodAmount + Math.floor(plan.sodAmount * (plan.discount / 100));
            
            return `
                <div class="sale-plan-card ${plan.popular ? 'featured' : ''}">
                    ${plan.popular ? `<div class="sale-plan-badge">پیشنهاد ویژه</div>` : ''}
                    ${plan.discount > 0 ? `<div style="position: absolute; top: 16px; right: 16px;"><span class="discount-badge">${plan.discount}% تخفیف</span></div>` : ''}
                    
                    <div class="sale-plan-header">
                        <h3 class="sale-plan-name">${plan.name}</h3>
                        <div class="sale-plan-price">${plan.usdtPrice} <span>USDT</span></div>
                        <div class="sod-amount">${this.formatNumber(totalSOD)} SOD</div>
                    </div>
                    
                    <ul class="sale-plan-features">
                        ${plan.features.map(feature => `<li><i class="fas fa-check" style="color: var(--success);"></i> ${feature}</li>`).join('')}
                    </ul>
                    
                    <button class="btn ${plan.popular ? 'btn-warning' : 'btn-primary'}" onclick="game.buySODPlan(${plan.id})">
                        <i class="fas fa-shopping-cart"></i>
                        خرید پنل
                    </button>
                </div>
            `;
        }).join('');
    }
    
    // ==================== توابع کمکی ====================
    
    showLoginPage() {
        const registerOverlay = document.getElementById('registerOverlay');
        const mainContainer = document.getElementById('mainContainer');
        
        if (registerOverlay) registerOverlay.style.display = 'flex';
        if (mainContainer) mainContainer.style.display = 'none';
    }
    
    showMainPage() {
        const registerOverlay = document.getElementById('registerOverlay');
        const mainContainer = document.getElementById('mainContainer');
        
        if (registerOverlay) registerOverlay.style.display = 'none';
        if (mainContainer) mainContainer.style.display = 'block';
    }
    
    showSODSale() {
        const sodSaleSection = document.getElementById('sodSaleSection');
        if (sodSaleSection) {
            sodSaleSection.style.display = 'block';
            sodSaleSection.scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
        }
    }
    
    createMiningEffect(amount) {
        const effect = document.createElement('div');
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
        
        const core = document.getElementById('minerCore');
        if (!core) return;
        
        const rect = core.getBoundingClientRect();
        effect.style.left = rect.left + rect.width / 2 + 'px';
        effect.style.top = rect.top + rect.height / 2 + 'px';
        effect.textContent = '+' + this.formatNumber(amount);
        
        document.body.appendChild(effect);
        
        setTimeout(() => effect.remove(), 1000);
    }
    
    generateInviteCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = 'INV-';
        
        for (let i = 0; i < 8; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        return code;
    }
    
    formatNumber(num) {
        if (num >= 1000000000) {
            return (num / 1000000000).toFixed(2) + 'B';
        }
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return Math.floor(num).toLocaleString('fa-IR');
    }
    
    updateElement(id, content) {
        const element = document.getElementById(id);
        if (element) {
            element.innerHTML = content;
        }
    }
    
    showNotification(title, message) {
        const notification = document.getElementById('notification');
        if (!notification) return;
        
        document.getElementById('notificationTitle').textContent = title;
        document.getElementById('notificationMessage').textContent = message;
        
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 4000);
    }
    
    checkAdminStatus() {
        if (!this.user) return;
        
        const adminEmails = ['hamyarhf@gmail.com'];
        this.isAdmin = adminEmails.includes(this.user.email.toLowerCase());
        
        const adminLink = document.getElementById('adminLink');
        if (adminLink && this.isAdmin) {
            adminLink.style.display = 'flex';
        }
    }
    
    showAdminLink() {
        const adminLink = document.getElementById('adminLink');
        if (adminLink && this.isAdmin) {
            adminLink.style.display = 'flex';
        }
    }
    
    setupEventListeners() {
        // رویداد کلیک ماینر
        const minerCore = document.getElementById('minerCore');
        if (minerCore) {
            minerCore.addEventListener('click', () => this.mine());
        }
        
        // رویداد استخراج خودکار
        const autoMineBtn = document.getElementById('autoMineBtn');
        if (autoMineBtn) {
            autoMineBtn.addEventListener('click', () => this.toggleAutoMine());
        }
        
        // رویداد دریافت پاداش
        const claimBtn = document.getElementById('claimUSDTBtn');
        if (claimBtn) {
            claimBtn.addEventListener('click', () => this.claimUSDT());
        }
        
        // ذخیره خودکار
        window.addEventListener('beforeunload', () => {
            this.stopAutoMining();
            if (this.gameData) {
                this.updateGameData({
                    sod_balance: this.gameData.sod_balance,
                    usdt_balance: this.gameData.usdt_balance,
                    today_earnings: this.gameData.today_earnings
                });
            }
        });
        
        // ذخیره دوره‌ای
        this.autoSaveInterval = setInterval(() => {
            if (this.gameData) {
                this.updateGameData({
                    sod_balance: this.gameData.sod_balance,
                    usdt_balance: this.gameData.usdt_balance,
                    today_earnings: this.gameData.today_earnings,
                    usdt_progress: this.gameData.usdt_progress
                });
            }
        }, 60000); // هر 1 دقیقه
    }
}

// ==================== راه‌اندازی بازی ====================

let game = null;

async function initializeGame() {
    console.log('🎮 شروع راه‌اندازی بازی...');
    
    // ایجاد نمونه بازی
    game = new SODmaxGame();
    window.game = game;
    
    // راه‌اندازی Supabase اول
    if (window.SupabaseConfig) {
        await window.SupabaseConfig.init();
    } else {
        console.error('❌ SupabaseConfig بارگذاری نشده است');
    }
    
    // راه‌اندازی بازی
    setTimeout(() => {
        game.init();
    }, 1000);
}

// تابع‌های عمومی برای استفاده در HTML
window.loginUser = () => game?.loginUser();
window.registerUser = () => game?.registerUser();
window.showSODSale = () => game?.showSODSale();
window.boostMining = () => game?.boostMining();
window.logoutUser = () => game?.logout();

// راه‌اندازی هنگام بارگذاری صفحه
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeGame);
} else {
    initializeGame();
}

console.log('✅ فایل app-core.js با دیتابیس بارگذاری شد');