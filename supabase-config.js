// ==================== supabase-config.js ====================
// فایل پیکربندی کامل برای اتصال به Supabase
// تاریخ ایجاد: ۱۴۰۳/۱۲/۲۵

console.log('🚀 بارگذاری پیکربندی Supabase...');

// ==================== تنظیمات پروژه ====================
const SUPABASE_CONFIG = {
    url: 'https://moattzdydyiqoftlgtmq.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vYXR0emR5ZHlpcW9mdGxndG1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5ODgzNTAsImV4cCI6MjA4MTU2NDM1MH0.DaTbOXcDxqx5JKZ5LbNvT-k8hYcjgbwK6nEgXz9QRy8',
    
    tables: {
        users: 'users',
        game_data: 'game_data',
        transactions: 'transactions',
        missions: 'missions',
        settings: 'settings'
    },
    
    adminEmails: [
        'hamyarhf@gmail.com',
        'admin@example.com',
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
        
        // ایجاد کلاینت Supabase
        supabaseClient = window.supabase.createClient(
            SUPABASE_CONFIG.url,
            SUPABASE_CONFIG.anonKey,
            {
                auth: {
                    autoRefreshToken: true,
                    persistSession: true,
                    detectSessionInUrl: true
                }
            }
        );
        
        window.supabaseClient = supabaseClient;
        
        console.log('✅ Supabase client ایجاد شد');
        
        // تست اتصال
        const connected = await testConnection();
        if (!connected) {
            console.log('⚠️ اتصال به Supabase برقرار نیست. حالت آفلاین فعال می‌شود.');
        }
        
        // چک کردن session کاربر
        await checkCurrentSession();
        
        isInitialized = true;
        console.log('🎉 راه‌اندازی Supabase تکمیل شد');
        
        return true;
        
    } catch (error) {
        console.error('❌ خطا در راه‌اندازی Supabase:', error);
        return false;
    }
}

// تست اتصال به Supabase
async function testConnection() {
    try {
        const { data, error } = await supabaseClient.from('settings').select('count').limit(1);
        
        if (error) {
            console.warn('⚠️ تست اتصال با خطا:', error.message);
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
            
            // بروزرسانی آخرین لاگین
            await updateUserLastLogin(currentUser.id);
            
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
                    full_name: fullName || email.split('@')[0]
                }
            }
        });
        
        if (error) {
            console.error('❌ خطا در ثبت‌نام:', error.message);
            throw error;
        }
        
        if (data.user) {
            console.log('✅ کاربر ایجاد شد:', data.user.id);
            
            // ایجاد رکورد کاربر
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
            
            // بروزرسانی آخرین لاگین
            await updateUserLastLogin(currentUser.id);
            
            // ایجاد رکورد اگر وجود ندارد
            const userExists = await getUserData(currentUser.id);
            if (!userExists) {
                await createUserRecord(currentUser, currentUser.email.split('@')[0]);
            }
            
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
            register_date: new Date().toLocaleDateString('fa-IR'),
            last_login: new Date().toISOString(),
            invite_code: 'INV' + Math.random().toString(36).substr(2, 8).toUpperCase(),
            is_admin: SUPABASE_CONFIG.adminEmails.includes(user.email.toLowerCase()),
            user_level: 1
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
            usdt_progress: 0
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

// افزودن تراکنش
async function addTransaction(userId, description, amount, type = 'sod') {
    try {
        const transaction = {
            user_id: userId,
            description: description,
            amount: amount,
            type: type
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

// ==================== سیستم مدیریت ====================

// بررسی اینکه آیا کاربر ادمین است
function isUserAdmin(email) {
    if (!email) return false;
    return SUPABASE_CONFIG.adminEmails.includes(email.toLowerCase());
}

// دریافت تمام کاربران (برای ادمین)
async function getAllUsers(limit = 50) {
    try {
        const { data, error } = await supabaseClient
            .from(SUPABASE_CONFIG.tables.users)
            .select('*, game_data(sod_balance, usdt_balance, total_mined)')
            .order('register_date', { ascending: false })
            .limit(limit);
        
        if (error) {
            console.error('❌ خطا در دریافت کاربران:', error.message);
            return [];
        }
        
        return data || [];
        
    } catch (error) {
        console.error('❌ خطا در دریافت کاربران:', error);
        return [];
    }
}

// آمار کلی سیستم
async function getSystemStats() {
    try {
        // تعداد کاربران
        const { count: totalUsers } = await supabaseClient
            .from(SUPABASE_CONFIG.tables.users)
            .select('*', { count: 'exact', head: true });
        
        // مجموع SOD
        const { data: sodData } = await supabaseClient
            .from(SUPABASE_CONFIG.tables.game_data)
            .select('sod_balance');
        
        let totalSOD = 0;
        if (sodData) {
            totalSOD = sodData.reduce((sum, item) => sum + (item.sod_balance || 0), 0);
        }
        
        return {
            total_users: totalUsers || 0,
            total_sod: totalSOD,
            today_users: 0
        };
        
    } catch (error) {
        console.error('❌ خطا در دریافت آمار سیستم:', error);
        return {
            total_users: 0,
            total_sod: 0,
            today_users: 0
        };
    }
}

// ==================== اکسپورت ====================

// اکسپورت توابع برای استفاده
window.SupabaseConfig = {
    init: initializeSupabase,
    signUp: signUpUser,
    signIn: signInUser,
    signOut: signOutUser,
    getCurrentUser: () => currentUser,
    isAdmin: isUserAdmin,
    client: () => supabaseClient,
    isInitialized: () => isInitialized,
    
    // توابع دیتابیس
    getUserData: getUserData,
    getGameData: getGameData,
    updateGameData: updateGameData,
    addTransaction: addTransaction,
    getTransactions: getTransactions,
    
    // توابع ادمین
    getAllUsers: getAllUsers,
    getSystemStats: getSystemStats
};

console.log('✅ فایل پیکربندی Supabase بارگذاری شد');

// راه‌اندازی خودکار
document.addEventListener('DOMContentLoaded', async function() {
    console.log('📄 DOM آماده است، راه‌اندازی Supabase...');
    await initializeSupabase();
});// ==================== supabase-config.js ====================
// فایل پیکربندی کامل برای اتصال به Supabase
// تاریخ ایجاد: ۱۴۰۳/۱۲/۲۵

console.log('🚀 بارگذاری پیکربندی Supabase...');

// ==================== تنظیمات پروژه ====================
const SUPABASE_CONFIG = {
    url: 'https://moattzdydyiqoftlgtmq.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vYXR0emR5ZHlpcW9mdGxndG1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5ODgzNTAsImV4cCI6MjA4MTU2NDM1MH0.DaTbOXcDxqx5JKZ5LbNvT-k8hYcjgbwK6nEgXz9QRy8',
    
    tables: {
        users: 'users',
        game_data: 'game_data',
        transactions: 'transactions',
        missions: 'missions',
        settings: 'settings'
    },
    
    adminEmails: [
        'hamyarhf@gmail.com',
        'admin@example.com',
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
        
        // ایجاد کلاینت Supabase
        supabaseClient = window.supabase.createClient(
            SUPABASE_CONFIG.url,
            SUPABASE_CONFIG.anonKey,
            {
                auth: {
                    autoRefreshToken: true,
                    persistSession: true,
                    detectSessionInUrl: true
                }
            }
        );
        
        window.supabaseClient = supabaseClient;
        
        console.log('✅ Supabase client ایجاد شد');
        
        // تست اتصال
        const connected = await testConnection();
        if (!connected) {
            console.log('⚠️ اتصال به Supabase برقرار نیست. حالت آفلاین فعال می‌شود.');
        }
        
        // چک کردن session کاربر
        await checkCurrentSession();
        
        isInitialized = true;
        console.log('🎉 راه‌اندازی Supabase تکمیل شد');
        
        return true;
        
    } catch (error) {
        console.error('❌ خطا در راه‌اندازی Supabase:', error);
        return false;
    }
}

// تست اتصال به Supabase
async function testConnection() {
    try {
        const { data, error } = await supabaseClient.from('settings').select('count').limit(1);
        
        if (error) {
            console.warn('⚠️ تست اتصال با خطا:', error.message);
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
            
            // بروزرسانی آخرین لاگین
            await updateUserLastLogin(currentUser.id);
            
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
                    full_name: fullName || email.split('@')[0]
                }
            }
        });
        
        if (error) {
            console.error('❌ خطا در ثبت‌نام:', error.message);
            throw error;
        }
        
        if (data.user) {
            console.log('✅ کاربر ایجاد شد:', data.user.id);
            
            // ایجاد رکورد کاربر
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
            
            // بروزرسانی آخرین لاگین
            await updateUserLastLogin(currentUser.id);
            
            // ایجاد رکورد اگر وجود ندارد
            const userExists = await getUserData(currentUser.id);
            if (!userExists) {
                await createUserRecord(currentUser, currentUser.email.split('@')[0]);
            }
            
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
            register_date: new Date().toLocaleDateString('fa-IR'),
            last_login: new Date().toISOString(),
            invite_code: 'INV' + Math.random().toString(36).substr(2, 8).toUpperCase(),
            is_admin: SUPABASE_CONFIG.adminEmails.includes(user.email.toLowerCase()),
            user_level: 1
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
            usdt_progress: 0
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

// افزودن تراکنش
async function addTransaction(userId, description, amount, type = 'sod') {
    try {
        const transaction = {
            user_id: userId,
            description: description,
            amount: amount,
            type: type
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

// ==================== سیستم مدیریت ====================

// بررسی اینکه آیا کاربر ادمین است
function isUserAdmin(email) {
    if (!email) return false;
    return SUPABASE_CONFIG.adminEmails.includes(email.toLowerCase());
}

// دریافت تمام کاربران (برای ادمین)
async function getAllUsers(limit = 50) {
    try {
        const { data, error } = await supabaseClient
            .from(SUPABASE_CONFIG.tables.users)
            .select('*, game_data(sod_balance, usdt_balance, total_mined)')
            .order('register_date', { ascending: false })
            .limit(limit);
        
        if (error) {
            console.error('❌ خطا در دریافت کاربران:', error.message);
            return [];
        }
        
        return data || [];
        
    } catch (error) {
        console.error('❌ خطا در دریافت کاربران:', error);
        return [];
    }
}

// آمار کلی سیستم
async function getSystemStats() {
    try {
        // تعداد کاربران
        const { count: totalUsers } = await supabaseClient
            .from(SUPABASE_CONFIG.tables.users)
            .select('*', { count: 'exact', head: true });
        
        // مجموع SOD
        const { data: sodData } = await supabaseClient
            .from(SUPABASE_CONFIG.tables.game_data)
            .select('sod_balance');
        
        let totalSOD = 0;
        if (sodData) {
            totalSOD = sodData.reduce((sum, item) => sum + (item.sod_balance || 0), 0);
        }
        
        return {
            total_users: totalUsers || 0,
            total_sod: totalSOD,
            today_users: 0
        };
        
    } catch (error) {
        console.error('❌ خطا در دریافت آمار سیستم:', error);
        return {
            total_users: 0,
            total_sod: 0,
            today_users: 0
        };
    }
}

// ==================== اکسپورت ====================

// اکسپورت توابع برای استفاده
window.SupabaseConfig = {
    init: initializeSupabase,
    signUp: signUpUser,
    signIn: signInUser,
    signOut: signOutUser,
    getCurrentUser: () => currentUser,
    isAdmin: isUserAdmin,
    client: () => supabaseClient,
    isInitialized: () => isInitialized,
    
    // توابع دیتابیس
    getUserData: getUserData,
    getGameData: getGameData,
    updateGameData: updateGameData,
    addTransaction: addTransaction,
    getTransactions: getTransactions,
    
    // توابع ادمین
    getAllUsers: getAllUsers,
    getSystemStats: getSystemStats
};

console.log('✅ فایل پیکربندی Supabase بارگذاری شد');

// راه‌اندازی خودکار
document.addEventListener('DOMContentLoaded', async function() {
    console.log('📄 DOM آماده است، راه‌اندازی Supabase...');
    await initializeSupabase();
});
