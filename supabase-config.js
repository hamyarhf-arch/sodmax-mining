// supabase-config.js - نسخه نهایی
console.log('🚀 بارگذاری پیکربندی Supabase...');

// بررسی اینکه آیا قبلاً بارگذاری شده
if (typeof window.supabaseConfigLoaded !== 'undefined') {
    console.log('⚠️ SupabaseConfig قبلاً بارگذاری شده است');
} else {
    window.supabaseConfigLoaded = true;
    
    // ==================== تنظیمات پروژه ====================
    const SUPABASE_SETTINGS = {
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
    async function initSupabase() {
        try {
            console.log('🔗 شروع اتصال به Supabase...');
            
            // ایجاد کلاینت Supabase
            supabaseClient = window.supabase.createClient(
                SUPABASE_SETTINGS.url,
                SUPABASE_SETTINGS.anonKey,
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
            const { data, error } = await supabaseClient.from('settings').select('count').limit(1);
            if (error) {
                console.warn('⚠️ تست اتصال با خطا:', error.message);
            } else {
                console.log('✅ اتصال به Supabase برقرار است');
            }
            
            // چک کردن session کاربر
            await checkUserSession();
            
            isInitialized = true;
            console.log('🎉 راه‌اندازی Supabase تکمیل شد');
            
            return true;
            
        } catch (error) {
            console.error('❌ خطا در راه‌اندازی Supabase:', error);
            return false;
        }
    }

    // بررسی session کاربر
    async function checkUserSession() {
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

    // ثبت‌نام کاربر
    async function registerUser(email, password, fullName = null) {
        try {
            console.log(`📝 ثبت‌نام کاربر: ${email}`);
            
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
                
                // ایجاد رکورد در جدول users
                await createUser(data.user, fullName);
                
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
    async function loginUser(email, password) {
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
    async function logoutUser() {
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

    // ایجاد کاربر در جدول users
    async function createUser(user, fullName = null) {
        try {
            const userData = {
                id: user.id,
                email: user.email,
                full_name: fullName || user.user_metadata?.full_name || user.email.split('@')[0],
                register_date: new Date().toLocaleDateString('fa-IR'),
                invite_code: 'INV' + Math.random().toString(36).substr(2, 8).toUpperCase(),
                is_admin: SUPABASE_SETTINGS.adminEmails.includes(user.email.toLowerCase())
            };
            
            const { data, error } = await supabaseClient
                .from(SUPABASE_SETTINGS.tables.users)
                .insert([userData]);
            
            if (error) {
                console.error('❌ خطا در ایجاد کاربر:', error.message);
                
                // اگر خطا به خاطر ستون is_admin است، بدون آن امتحان کن
                const simpleUserData = {
                    id: user.id,
                    email: user.email,
                    full_name: userData.full_name,
                    register_date: userData.register_date,
                    invite_code: userData.invite_code
                };
                
                const { error: simpleError } = await supabaseClient
                    .from(SUPABASE_SETTINGS.tables.users)
                    .insert([simpleUserData]);
                
                if (simpleError) {
                    console.error('❌ خطا در ایجاد کاربر ساده:', simpleError.message);
                    throw simpleError;
                }
                
                console.log('✅ کاربر ساده ایجاد شد:', user.id);
                return simpleUserData;
            }
            
            console.log('✅ کاربر ایجاد شد:', user.id);
            return userData;
            
        } catch (error) {
            console.error('❌ خطا در ایجاد کاربر:', error);
            throw error;
        }
    }

    // ایجاد اطلاعات بازی
    async function createGameInfo(userId) {
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
                .from(SUPABASE_SETTINGS.tables.game_data)
                .insert([gameData]);
            
            if (error) {
                console.error('❌ خطا در ایجاد اطلاعات بازی:', error.message);
                throw error;
            }
            
            console.log('✅ اطلاعات بازی ایجاد شد برای کاربر:', userId);
            return gameData;
            
        } catch (error) {
            console.error('❌ خطا در ایجاد اطلاعات بازی:', error);
            throw error;
        }
    }

    // دریافت اطلاعات کاربر
    async function getUserInfo(userId) {
        try {
            const { data, error } = await supabaseClient
                .from(SUPABASE_SETTINGS.tables.users)
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
    async function getGameInfo(userId) {
        try {
            const { data, error } = await supabaseClient
                .from(SUPABASE_SETTINGS.tables.game_data)
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
    async function updateGameInfo(userId, updates) {
        try {
            const { data, error } = await supabaseClient
                .from(SUPABASE_SETTINGS.tables.game_data)
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
    async function addNewTransaction(userId, description, amount, type = 'sod') {
        try {
            const transaction = {
                user_id: userId,
                description: description,
                amount: amount,
                type: type
            };
            
            const { data, error } = await supabaseClient
                .from(SUPABASE_SETTINGS.tables.transactions)
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

    // بررسی ادمین
    function checkAdmin(email) {
        if (!email) return false;
        return SUPABASE_SETTINGS.adminEmails.includes(email.toLowerCase());
    }

    // ==================== اکسپورت ====================

    window.SupabaseManager = {
        init: initSupabase,
        register: registerUser,
        login: loginUser,
        logout: logoutUser,
        getCurrentUser: () => currentUser,
        isAdmin: checkAdmin,
        client: () => supabaseClient,
        isReady: () => isInitialized,
        
        // توابع دیتابیس
        getUser: getUserInfo,
        getGameData: getGameInfo,
        updateGameData: updateGameInfo,
        addTransaction: addNewTransaction,
        createUserRecord: createUser,
        createGameRecord: createGameInfo
    };

    console.log('✅ پیکربندی Supabase بارگذاری شد');

    // راه‌اندازی خودکار
    document.addEventListener('DOMContentLoaded', async function() {
        console.log('📄 DOM آماده است، راه‌اندازی Supabase...');
        await initSupabase();
    });
}
