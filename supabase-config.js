// ==================== supabase-config.js ====================
// فایل پیکربندی کامل برای اتصال به Supabase
// تاریخ ایجاد: ۲۵ اسفند ۱۴۰۳

console.log('🚀 بارگذاری پیکربندی Supabase...');

// ==================== تنظیمات پروژه ====================
const SUPABASE_CONFIG = {
    // تنظیمات اصلی Supabase (آپدیت شده با URL و Key جدید شما)
    url: 'https://utnqkgbmdjilvbkwjqef.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0bnFrZ2JtZGppbHZia3dqcWVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5MDM3ODUsImV4cCI6MjA4MTQ3OTc4NX0.-PA0KAaSuQ-ZAJZLdVNe-AafE5fHf8CA5R4uR3TKGDc',
    
    // تنظیمات دیتابیس
    tables: {
        users: 'users',
        game_data: 'game_data',
        transactions: 'transactions',
        referrals: 'referrals',
        settings: 'settings',
        notifications: 'notifications'
    },
    
    // ایمیل‌های ادمین (با توجه به ایمیل شما)
    adminEmails: [
        'hamyarhf@gmail.com',
        'test@example.com'
    ]
};

// ==================== اتصال به Supabase ====================
let supabaseClient = null;
let currentUser = null;
let isInitialized = false;

// تابع راه‌اندازی اتصال
async function initializeSupabase() {
    try {
        console.log('🔗 شروع اتصال به Supabase...');
        
        // بررسی وجود کتابخانه Supabase
        if (typeof window.supabase === 'undefined') {
            console.error('❌ کتابخانه Supabase بارگذاری نشده است!');
            console.log('⚠️ بارگذاری کتابخانه از CDN...');
            
            // بارگذاری دینامیک کتابخانه
            await loadSupabaseLibrary();
        }
        
        // ایجاد کلاینت Supabase
        supabaseClient = window.supabase.createClient(
            SUPABASE_CONFIG.url,
            SUPABASE_CONFIG.anonKey,
            {
                auth: {
                    autoRefreshToken: true,
                    persistSession: true,
                    detectSessionInUrl: true
                },
                db: {
                    schema: 'public'
                },
                realtime: {
                    params: {
                        eventsPerSecond: 10
                    }
                }
            }
        );
        
        // ذخیره در متغیر سراسری
        window.supabaseClient = supabaseClient;
        
        console.log('✅ Supabase client ایجاد شد');
        console.log('📊 تنظیمات:');
        console.log('- URL:', SUPABASE_CONFIG.url);
        console.log('- Tables:', Object.keys(SUPABASE_CONFIG.tables));
        
        // بررسی اتصال
        await testConnection();
        
        // چک کردن session کاربر
        await checkCurrentSession();
        
        isInitialized = true;
        console.log('🎉 راه‌اندازی Supabase تکمیل شد');
        
        return true;
        
    } catch (error) {
        console.error('❌ خطا در راه‌اندازی Supabase:', error);
        showError('خطا در اتصال به سرور. لطفاً اینترنت خود را بررسی کنید.');
        return false;
    }
}

// بارگذاری کتابخانه Supabase
async function loadSupabaseLibrary() {
    return new Promise((resolve, reject) => {
        // بررسی اینکه آیا قبلاً بارگذاری شده
        if (window.supabase) {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/@supabase/supabase-js@2/dist/umd/supabase.min.js';
        script.async = true;
        
        script.onload = () => {
            console.log('✅ کتابخانه Supabase بارگذاری شد');
            resolve();
        };
        
        script.onerror = () => {
            console.error('❌ خطا در بارگذاری کتابخانه Supabase');
            reject(new Error('Failed to load Supabase library'));
        };
        
        document.head.appendChild(script);
    });
}

// تست اتصال به Supabase
async function testConnection() {
    try {
        console.log('🔍 تست اتصال به Supabase...');
        
        const { data, error } = await supabaseClient.from('users').select('count').limit(1);
        
        if (error) {
            console.warn('⚠️ تست اتصال با خطا:', error.message);
            console.log('🔄 استفاده از حالت آفلاین ذخیره‌سازی');
            return false;
        }
        
        console.log('✅ اتصال به Supabase برقرار است');
        return true;
        
    } catch (error) {
        console.warn('⚠️ خطا در تست اتصال:', error.message);
        return false;
    }
}

// بررسی session فعلی کاربر
async function checkCurrentSession() {
    try {
        const { data: { session }, error } = await supabaseClient.auth.getSession();
        
        if (error) {
            console.error('❌ خطا در دریافت session:', error.message);
            return null;
        }
        
        if (session) {
            currentUser = session.user;
            console.log('👤 کاربر پیدا شد:', currentUser.email);
            return currentUser;
        }
        
        console.log('⚠️ کاربر لاگین نکرده است');
        return null;
        
    } catch (error) {
        console.error('❌ خطا در بررسی session:', error);
        return null;
    }
}

// ==================== مدیریت کاربران ====================

// ثبت‌نام کاربر جدید
async function signUpUser(email, password, fullName = null) {
    try {
        console.log(`📝 ثبت‌نام کاربر جدید: ${email}`);
        
        const { data, error } = await supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: fullName || email.split('@')[0],
                    created_at: new Date().toISOString(),
                    user_type: 'player'
                }
            }
        });
        
        if (error) {
            console.error('❌ خطا در ثبت‌نام:', error.message);
            throw error;
        }
        
        if (data.user) {
            console.log('✅ کاربر ایجاد شد:', data.user.id);
            
            // ایجاد رکورد کاربر در جدول users
            await createUserRecord(data.user, fullName);
            
            return {
                success: true,
                user: data.user,
                message: 'ثبت‌نام با موفقیت انجام شد'
            };
        }
        
        return {
            success: false,
            message: 'خطا در ایجاد کاربر'
        };
        
    } catch (error) {
        console.error('❌ خطا در ثبت‌نام:', error);
        return {
            success: false,
            message: error.message || 'خطا در ثبت‌نام'
        };
    }
}

// ورود کاربر
async function signInUser(email, password) {
    try {
        console.log(`🔑 ورود کاربر: ${email}`);
        
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) {
            console.error('❌ خطا در ورود:', error.message);
            throw error;
        }
        
        if (data.user) {
            currentUser = data.user;
            console.log('✅ کاربر وارد شد:', currentUser.email);
            
            // بروزرسانی اطلاعات کاربر
            await updateUserLastLogin(currentUser.id);
            
            return {
                success: true,
                user: data.user,
                session: data.session,
                message: 'ورود موفقیت‌آمیز'
            };
        }
        
        return {
            success: false,
            message: 'خطا در ورود'
        };
        
    } catch (error) {
        console.error('❌ خطا در ورود:', error);
        return {
            success: false,
            message: error.message || 'خطا در ورود'
        };
    }
}

// خروج کاربر
async function signOutUser() {
    try {
        console.log('🚪 درخواست خروج کاربر...');
        
        const { error } = await supabaseClient.auth.signOut();
        
        if (error) {
            console.error('❌ خطا در خروج:', error.message);
            throw error;
        }
        
        currentUser = null;
        console.log('✅ کاربر با موفقیت خارج شد');
        
        return {
            success: true,
            message: 'خروج موفقیت‌آمیز'
        };
        
    } catch (error) {
        console.error('❌ خطا در خروج:', error);
        return {
            success: false,
            message: error.message || 'خطا در خروج'
        };
    }
}

// ==================== مدیریت دیتابیس ====================

// ایجاد رکورد کاربر
async function createUserRecord(user, fullName = null) {
    try {
        const userData = {
            id: user.id,
            email: user.email,
            full_name: fullName || user.user_metadata?.full_name || user.email.split('@')[0],
            register_date: new Date().toISOString(),
            last_login: new Date().toISOString(),
            invite_code: generateInviteCode(),
            is_active: true,
            is_admin: SUPABASE_CONFIG.adminEmails.includes(user.email.toLowerCase()),
            level: 1,
            total_earned: 0,
            referral_count: 0
        };
        
        const { data, error } = await supabaseClient
            .from(SUPABASE_CONFIG.tables.users)
            .insert([userData]);
        
        if (error) {
            console.error('❌ خطا در ایجاد رکورد کاربر:', error.message);
            throw error;
        }
        
        // ایجاد رکورد اطلاعات بازی
        await createGameDataRecord(user.id);
        
        console.log('✅ رکورد کاربر ایجاد شد:', user.id);
        return userData;
        
    } catch (error) {
        console.error('❌ خطا در ایجاد رکورد:', error);
        throw error;
    }
}

// ایجاد رکورد اطلاعات بازی
async function createGameDataRecord(userId) {
    try {
        const gameData = {
            user_id: userId,
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
        
        const { data, error } = await supabaseClient
            .from(SUPABASE_CONFIG.tables.game_data)
            .insert([gameData]);
        
        if (error) {
            console.error('❌ خطا در ایجاد رکورد بازی:', error.message);
            throw error;
        }
        
        console.log('✅ رکورد بازی ایجاد شد برای کاربر:', userId);
        return gameData;
        
    } catch (error) {
        console.error('❌ خطا در ایجاد رکورد بازی:', error);
        throw error;
    }
}

// دریافت اطلاعات کاربر
async function getUserData(userId) {
    try {
        const { data, error } = await supabaseClient
            .from(SUPABASE_CONFIG.tables.users)
            .select('*')
            .eq('id', userId)
            .single();
        
        if (error) {
            console.error('❌ خطا در دریافت اطلاعات کاربر:', error.message);
            return null;
        }
        
        return data;
        
    } catch (error) {
        console.error('❌ خطا در دریافت اطلاعات کاربر:', error);
        return null;
    }
}

// دریافت اطلاعات بازی
async function getGameData(userId) {
    try {
        const { data, error } = await supabaseClient
            .from(SUPABASE_CONFIG.tables.game_data)
            .select('*')
            .eq('user_id', userId)
            .single();
        
        if (error) {
            console.error('❌ خطا در دریافت اطلاعات بازی:', error.message);
            return null;
        }
        
        return data;
        
    } catch (error) {
        console.error('❌ خطا در دریافت اطلاعات بازی:', error);
        return null;
    }
}

// بروزرسانی اطلاعات بازی
async function updateGameData(userId, updates) {
    try {
        updates.updated_at = new Date().toISOString();
        
        const { data, error } = await supabaseClient
            .from(SUPABASE_CONFIG.tables.game_data)
            .update(updates)
            .eq('user_id', userId)
            .select();
        
        if (error) {
            console.error('❌ خطا در بروزرسانی اطلاعات بازی:', error.message);
            throw error;
        }
        
        console.log('✅ اطلاعات بازی بروزرسانی شد برای کاربر:', userId);
        return data;
        
    } catch (error) {
        console.error('❌ خطا در بروزرسانی اطلاعات بازی:', error);
        throw error;
    }
}

// افزودن تراکنش
async function addTransaction(userId, description, amount, type = 'sod') {
    try {
        const transaction = {
            user_id: userId,
            description: description,
            amount: amount,
            type: type,
            created_at: new Date().toISOString()
        };
        
        const { data, error } = await supabaseClient
            .from(SUPABASE_CONFIG.tables.transactions)
            .insert([transaction]);
        
        if (error) {
            console.error('❌ خطا در ثبت تراکنش:', error.message);
            throw error;
        }
        
        console.log('✅ تراکنش ثبت شد:', description);
        return transaction;
        
    } catch (error) {
        console.error('❌ خطا در ثبت تراکنش:', error);
        throw error;
    }
}

// دریافت تراکنش‌ها
async function getTransactions(userId, limit = 20) {
    try {
        const { data, error } = await supabaseClient
            .from(SUPABASE_CONFIG.tables.transactions)
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);
        
        if (error) {
            console.error('❌ خطا در دریافت تراکنش‌ها:', error.message);
            return [];
        }
        
        return data || [];
        
    } catch (error) {
        console.error('❌ خطا در دریافت تراکنش‌ها:', error);
        return [];
    }
}

// بروزرسانی آخرین لاگین
async function updateUserLastLogin(userId) {
    try {
        const { error } = await supabaseClient
            .from(SUPABASE_CONFIG.tables.users)
            .update({
                last_login: new Date().toISOString()
            })
            .eq('id', userId);
        
        if (error) {
            console.error('❌ خطا در بروزرسانی آخرین لاگین:', error.message);
        }
        
    } catch (error) {
        console.error('❌ خطا در بروزرسانی آخرین لاگین:', error);
    }
}

// ==================== سیستم ارجاع ====================

// ایجاد کد دعوت
function generateInviteCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'INV-';
    
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return code;
}

// ثبت ارجاع
async function addReferral(referrerId, referredUserId) {
    try {
        const referral = {
            referrer_id: referrerId,
            referred_id: referredUserId,
            created_at: new Date().toISOString(),
            status: 'pending'
        };
        
        const { data, error } = await supabaseClient
            .from(SUPABASE_CONFIG.tables.referrals)
            .insert([referral]);
        
        if (error) {
            console.error('❌ خطا در ثبت ارجاع:', error.message);
            throw error;
        }
        
        // افزایش شمارش ارجاع‌ها
        await incrementReferralCount(referrerId);
        
        console.log('✅ ارجاع ثبت شد:', referrerId, '->', referredUserId);
        return referral;
        
    } catch (error) {
        console.error('❌ خطا در ثبت ارجاع:', error);
        throw error;
    }
}

// افزایش شمارش ارجاع‌ها
async function incrementReferralCount(userId) {
    try {
        // دریافت تعداد فعلی
        const { data: user, error: fetchError } = await supabaseClient
            .from(SUPABASE_CONFIG.tables.users)
            .select('referral_count')
            .eq('id', userId)
            .single();
        
        if (fetchError) {
            console.error('❌ خطا در دریافت اطلاعات ارجاع:', fetchError.message);
            return;
        }
        
        const newCount = (user.referral_count || 0) + 1;
        
        const { error: updateError } = await supabaseClient
            .from(SUPABASE_CONFIG.tables.users)
            .update({
                referral_count: newCount,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId);
        
        if (updateError) {
            console.error('❌ خطا در بروزرسانی تعداد ارجاع‌ها:', updateError.message);
        } else {
            console.log('✅ تعداد ارجاع‌ها بروزرسانی شد:', userId, '->', newCount);
        }
        
    } catch (error) {
        console.error('❌ خطا در افزایش شمارش ارجاع‌ها:', error);
    }
}

// دریافت اطلاعات ارجاع
async function getReferrals(userId) {
    try {
        const { data, error } = await supabaseClient
            .from(SUPABASE_CONFIG.tables.referrals)
            .select(`
                *,
                referred_user:users!referred_id (
                    email,
                    full_name,
                    register_date
                )
            `)
            .eq('referrer_id', userId)
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('❌ خطا در دریافت اطلاعات ارجاع:', error.message);
            return [];
        }
        
        return data || [];
        
    } catch (error) {
        console.error('❌ خطا در دریافت اطلاعات ارجاع:', error);
        return [];
    }
}

// ==================== سیستم مدیریت (ادمین) ====================

// دریافت تمام کاربران (برای پنل ادمین)
async function getAllUsers(limit = 100, offset = 0) {
    try {
        const { data, error, count } = await supabaseClient
            .from(SUPABASE_CONFIG.tables.users)
            .select(`
                *,
                game_data (
                    sod_balance,
                    usdt_balance,
                    user_level,
                    total_mined,
                    today_earnings
                )
            `, { count: 'exact' })
            .order('register_date', { ascending: false })
            .range(offset, offset + limit - 1);
        
        if (error) {
            console.error('❌ خطا در دریافت کاربران:', error.message);
            return { users: [], total: 0 };
        }
        
        return {
            users: data || [],
            total: count || 0
        };
        
    } catch (error) {
        console.error('❌ خطا در دریافت کاربران:', error);
        return { users: [], total: 0 };
    }
}

// آمار کلی سیستم (برای پنل ادمین)
async function getSystemStats() {
    try {
        // تعداد کاربران
        const { count: totalUsers, error: usersError } = await supabaseClient
            .from(SUPABASE_CONFIG.tables.users)
            .select('*', { count: 'exact', head: true });
        
        // مجموع SOD
        const { data: sodData, error: sodError } = await supabaseClient
            .from(SUPABASE_CONFIG.tables.game_data)
            .select('sod_balance');
        
        // مجموع USDT
        const { data: usdtData, error: usdtError } = await supabaseClient
            .from(SUPABASE_CONFIG.tables.game_data)
            .select('usdt_balance');
        
        // تعداد تراکنش‌ها امروز
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const { count: todayTransactions, error: txError } = await supabaseClient
            .from(SUPABASE_CONFIG.tables.transactions)
            .select('*', { count: 'exact', head: true })
            .gte('created_at', today.toISOString());
        
        let totalSOD = 0;
        let totalUSDT = 0;
        
        if (sodData) {
            totalSOD = sodData.reduce((sum, item) => sum + (item.sod_balance || 0), 0);
        }
        
        if (usdtData) {
            totalUSDT = usdtData.reduce((sum, item) => sum + (item.usdt_balance || 0), 0);
        }
        
        return {
            total_users: totalUsers || 0,
            total_sod: totalSOD,
            total_usdt: totalUSDT,
            today_transactions: todayTransactions || 0,
            active_today: 0 // می‌تواند با کوئری پیچیده‌تر محاسبه شود
        };
        
    } catch (error) {
        console.error('❌ خطا در دریافت آمار سیستم:', error);
        return {
            total_users: 0,
            total_sod: 0,
            total_usdt: 0,
            today_transactions: 0,
            active_today: 0
        };
    }
}

// بروزرسانی کاربر توسط ادمین
async function updateUserByAdmin(userId, updates) {
    try {
        const { data, error } = await supabaseClient
            .from(SUPABASE_CONFIG.tables.users)
            .update(updates)
            .eq('id', userId)
            .select();
        
        if (error) {
            console.error('❌ خطا در بروزرسانی کاربر:', error.message);
            throw error;
        }
        
        console.log('✅ کاربر توسط ادمین بروزرسانی شد:', userId);
        return data;
        
    } catch (error) {
        console.error('❌ خطا در بروزرسانی کاربر:', error);
        throw error;
    }
}

// ==================== توابع کمکی ====================

// بررسی اینکه آیا کاربر ادمین است
function isUserAdmin(email) {
    if (!email) return false;
    return SUPABASE_CONFIG.adminEmails.includes(email.toLowerCase());
}

// فرمت اعداد
function formatNumber(num) {
    if (num >= 1000000000) return (num / 1000000000).toFixed(2) + 'B';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return Math.floor(num).toLocaleString('fa-IR');
}

// نمایش خطا
function showError(message) {
    console.error('❌ خطا:', message);
    
    // نمایش نوتیفیکیشن اگر UI آماده باشد
    if (typeof window.showNotification === 'function') {
        window.showNotification('خطا', message, 'error');
    } else {
        alert(message);
    }
}

// نمایش موفقیت
function showSuccess(message) {
    console.log('✅ موفقیت:', message);
    
    if (typeof window.showNotification === 'function') {
        window.showNotification('موفقیت', message, 'success');
    }
}

// ==================== API GameDB ====================
// ایجاد یک API ساده برای دسترسی به توابع

const GameDB = {
    // مدیریت کاربران
    getUser: getUserData,
    createUser: createUserRecord,
    updateUser: updateUserLastLogin,
    
    // مدیریت بازی
    getGameData: getGameData,
    updateGameData: updateGameData,
    createGameData: createGameDataRecord,
    
    // تراکنش‌ها
    addTransaction: addTransaction,
    getTransactions: getTransactions,
    
    // ارجاع
    addReferral: addReferral,
    getReferrals: getReferrals,
    generateInviteCode: generateInviteCode,
    
    // ادمین
    getAllUsers: getAllUsers,
    getSystemStats: getSystemStats,
    updateUserByAdmin: updateUserByAdmin,
    
    // توابع کمکی
    isAdmin: isUserAdmin,
    formatNumber: formatNumber,
    
    // دریافت کاربر جاری
    getCurrentUser: () => currentUser,
    
    // چک auth
    checkAuth: async () => {
        if (!supabaseClient) {
            await initializeSupabase();
        }
        return await checkCurrentSession();
    },
    
    // دریافت یا ایجاد کاربر
    getOrCreateUser: async (userId, email, fullName = null) => {
        let user = await getUserData(userId);
        
        if (!user) {
            user = await createUserRecord({ id: userId, email: email }, fullName);
        }
        
        return { data: user, error: null };
    },
    
    // دریافت یا ایجاد اطلاعات بازی
    getOrCreateGameData: async (userId) => {
        let gameData = await getGameData(userId);
        
        if (!gameData) {
            gameData = await createGameDataRecord(userId);
        }
        
        return { data: gameData, error: null };
    }
};

// ==================== راه‌اندازی خودکار ====================

// رویداد DOMContentLoaded
document.addEventListener('DOMContentLoaded', async function() {
    console.log('📄 DOM آماده است، راه‌اندازی Supabase...');
    
    // راه‌اندازی خودکار (می‌توان غیرفعال شود)
    if (window.autoInitSupabase !== false) {
        await initializeSupabase();
    }
});

// ==================== اکسپورت ====================

// اکسپورت توابع برای استفاده در فایل‌های دیگر
window.SupabaseConfig = {
    init: initializeSupabase,
    signUp: signUpUser,
    signIn: signInUser,
    signOut: signOutUser,
    getCurrentUser: () => currentUser,
    isAdmin: isUserAdmin,
    client: () => supabaseClient,
    isInitialized: () => isInitialized,
    config: SUPABASE_CONFIG
};

// اکسپورت GameDB
window.GameDB = GameDB;

// اکسپورت برای استفاده در ماژول‌های ES6
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SupabaseConfig: window.SupabaseConfig,
        GameDB: window.GameDB
    };
}

console.log('✅ فایل پیکربندی Supabase بارگذاری شد');
console.log('🎮 آماده استفاده در بازی SODmAX Pro');