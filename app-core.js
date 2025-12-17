// app-core.js - نسخه اصلاح شده برای کار با Supabase
console.log('🚀 app-core.js با پشتیبانی Supabase بارگذاری شد');

// ==================== توابع اصلی ====================

// ذخیره‌سازی پیشرفته برای پنل مدیریت
async function saveGameDataForAdmin() {
    try {
        if (!window.SupabaseConfig || !window.SupabaseConfig.isInitialized()) {
            console.log('⚠️ Supabase در دسترس نیست، ذخیره محلی');
            saveToLocalStorage();
            return false;
        }
        
        const userData = JSON.parse(localStorage.getItem('sodmaxUserData') || '{}');
        if (!userData || !userData.email) {
            console.log('⚠️ اطلاعات کاربر یافت نشد');
            return false;
        }
        
        // بررسی کاربر جاری
        const currentUser = window.SupabaseConfig.getCurrentUser();
        if (!currentUser) {
            console.log('⚠️ کاربر لاگین نکرده است');
            return false;
        }
        
        // دریافت اطلاعات بازی
        const gameData = JSON.parse(localStorage.getItem('sodmaxGameData') || '{}');
        
        // آپدیت اطلاعات کاربر
        const { error: userError } = await window.supabaseClient
            .from('users')
            .update({
                last_active: new Date().toISOString(),
                level: gameData.userLevel || 1,
                total_earned: gameData.totalMined || 0
            })
            .eq('id', currentUser.id);
        
        if (userError) {
            console.error('❌ خطا در آپدیت کاربر:', userError);
        }
        
        // آپدیت اطلاعات بازی
        const { error: gameError } = await window.supabaseClient
            .from('game_data')
            .upsert({
                user_id: currentUser.id,
                sod_balance: gameData.sodBalance || 0,
                usdt_balance: gameData.usdtBalance || 0,
                user_level: gameData.userLevel || 1,
                mining_power: gameData.miningPower || 10,
                total_mined: gameData.totalMined || 0,
                today_earnings: gameData.todayEarnings || 0,
                usdt_progress: gameData.usdtProgress || 0,
                boost_active: gameData.boostActive || false,
                boost_end_time: gameData.boostEndTime || null,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', currentUser.id);
        
        if (gameError) {
            console.error('❌ خطا در آپدیت بازی:', gameError);
            return false;
        }
        
        console.log('✅ داده‌ها در Supabase ذخیره شدند');
        return true;
        
    } catch (error) {
        console.error('🚨 خطا در ذخیره‌سازی:', error);
        saveToLocalStorage();
        return false;
    }
}

// ذخیره در localStorage (فقط)
function saveToLocalStorage() {
    try {
        const gameData = JSON.parse(localStorage.getItem('sodmaxGameData') || '{}');
        localStorage.setItem('sodmaxGameData', JSON.stringify(gameData));
        console.log('📱 داده‌ها در localStorage ذخیره شد');
    } catch (e) {
        console.error('خطا در ذخیره localStorage:', e);
    }
}

// ==================== مدیریت کاربران ====================

// تابع ایجاد کاربر جدید در Supabase
async function createUserRecord(email, name = '') {
    try {
        console.log('👤 تلاش برای ایجاد کاربر جدید:', email);
        
        if (!window.SupabaseConfig || !window.SupabaseConfig.isInitialized()) {
            console.log('⚠️ Supabase آماده نیست، از حالت آفلاین استفاده می‌کنیم');
            return null;
        }
        
        // اول ثبت‌نام در Auth
        const signUpResult = await window.SupabaseConfig.signUp(
            email, 
            'password123', // رمز ثابت برای کاربران آفلاین
            name
        );
        
        if (!signUpResult.success) {
            console.log('⚠️ ثبت‌نام Auth ناموفق، تلاش برای ورود:', signUpResult.message);
            
            // اگر کاربر وجود دارد، وارد شو
            const signInResult = await window.SupabaseConfig.signIn(email, 'password123');
            if (!signInResult.success) {
                console.error('❌ ورود هم ناموفق بود');
                return null;
            }
            
            return signInResult.user;
        }
        
        console.log('✅ کاربر جدید در Supabase ایجاد شد');
        return signUpResult.user;
        
    } catch (error) {
        console.error('🚨 خطا در ایجاد کاربر:', error);
        return null;
    }
}

// دریافت کاربر بر اساس ایمیل
async function getUserByEmail(email) {
    try {
        if (!window.supabaseClient) {
            console.log('⚠️ Supabase client موجود نیست');
            return null;
        }
        
        const { data, error } = await window.supabaseClient
            .from('users')
            .select('*')
            .eq('email', email)
            .single();
        
        if (error) {
            console.log('⚠️ خطا در دریافت کاربر:', error.message);
            return null;
        }
        
        return data;
        
    } catch (error) {
        console.error('❌ خطا در دریافت کاربر:', error);
        return null;
    }
}

// ==================== سینک داده‌ها ====================

// سینک خودکار داده‌ها با Supabase
async function syncWithSupabase() {
    try {
        const userData = JSON.parse(localStorage.getItem('sodmaxUserData') || '{}');
        if (!userData.email) {
            console.log('⚠️ ایمیل کاربر یافت نشد');
            return;
        }
        
        console.log('🔄 سینک داده‌ها با Supabase برای:', userData.email);
        
        // اگر Supabase آماده نیست، صبر کن
        if (!window.SupabaseConfig || !window.SupabaseConfig.isInitialized()) {
            console.log('⏳ منتظر راه‌اندازی Supabase...');
            setTimeout(syncWithSupabase, 5000);
            return;
        }
        
        // کاربر را در Supabase پیدا کن
        let user = await getUserByEmail(userData.email);
        
        // اگر کاربر پیدا نشد، ایجاد کن
        if (!user) {
            console.log('👤 کاربر در Supabase پیدا نشد، ایجاد رکورد جدید...');
            user = await createUserRecord(userData.email, userData.fullName);
        }
        
        if (user) {
            // داده‌های بازی را سینک کن
            await saveGameDataForAdmin();
            console.log('✅ سینک کامل شد');
        }
        
    } catch (error) {
        console.error('⚠️ خطا در سینک:', error);
    }
}

// ==================== رویدادهای سیستم ====================

// ذخیره خودکار هر 30 ثانیه
let syncInterval = null;
function startAutoSync() {
    if (syncInterval) clearInterval(syncInterval);
    
    syncInterval = setInterval(() => {
        if (localStorage.getItem('sodmaxUserData')) {
            syncWithSupabase();
        }
    }, 30000);
    
    console.log('🔄 سینک خودکار فعال شد (هر 30 ثانیه)');
}

// ذخیره دستی
function manualSave() {
    try {
        // ذخیره در localStorage
        saveToLocalStorage();
        
        // ذخیره در Supabase
        syncWithSupabase();
        
        console.log('💾 ذخیره دستی انجام شد');
    } catch (error) {
        console.error('خطا در ذخیره دستی:', error);
    }
}

// ==================== سازگاری با کد قبلی ====================

// رپ کردن تابع saveGame اصلی
if (typeof window.saveGame === 'function') {
    const originalSaveGame = window.saveGame;
    window.saveGame = function() {
        if (originalSaveGame) originalSaveGame();
        manualSave();
    };
} else {
    window.saveGame = manualSave;
}

// رپ کردن تابع startGame
if (typeof window.startGame === 'function') {
    const originalStartGame = window.startGame;
    window.startGame = function() {
        if (originalStartGame) originalStartGame();
        startAutoSync();
        
        // سینک اولیه بعد از 3 ثانیه
        setTimeout(syncWithSupabase, 3000);
    };
}

// ==================== رویدادهای ثبت‌نام ====================

// رویداد برای وقتی کاربر ثبت‌نام می‌کند
window.addEventListener('userRegistered', async function(e) {
    const { email, fullName } = e.detail;
    
    console.log('🎉 رویداد ثبت‌نام دریافت شد:', email);
    
    // در localStorage ذخیره کن
    const userData = {
        isRegistered: true,
        email: email,
        fullName: fullName,
        registerDate: new Date().toLocaleDateString('fa-IR')
    };
    localStorage.setItem('sodmaxUserData', JSON.stringify(userData));
    
    // در Supabase ایجاد کن
    setTimeout(async () => {
        const result = await createUserRecord(email, fullName);
        if (result) {
            console.log('✅ کاربر در Supabase ثبت شد');
        }
    }, 1000);
});

// ==================== راه‌اندازی ====================

// وقتی DOM بارگذاری شد
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 app-core.js راه‌اندازی شد');
    
    // منتظر بارگذاری Supabase-config.js باش
    const checkSupabase = setInterval(() => {
        if (window.SupabaseConfig) {
            clearInterval(checkSupabase);
            console.log('✅ SupabaseConfig پیدا شد');
            
            // راه‌اندازی Supabase
            window.SupabaseConfig.init().then(() => {
                console.log('🎮 سیستم آماده است');
                
                // اگر کاربری لاگین کرده، سینک کن
                const userData = JSON.parse(localStorage.getItem('sodmaxUserData') || '{}');
                if (userData.email) {
                    setTimeout(syncWithSupabase, 2000);
                }
            });
        }
    }, 1000);
});

console.log('✅ app-core.js با پشتیبانی Supabase بارگذاری شد');
