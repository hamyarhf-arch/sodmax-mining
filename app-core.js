// app-core.js - نسخه ساده شده
console.log('🚀 app-core.js بارگذاری شد');

// ==================== سیستم ذخیره‌سازی ====================

// ذخیره در Supabase
async function saveGameDataToSupabase() {
    try {
        // چک کن که Supabase آماده باشد
        if (!window.SupabaseConfig || !window.SupabaseConfig.isInitialized()) {
            console.log('⚠️ Supabase آماده نیست');
            return false;
        }
        
        // دریافت کاربر جاری
        const currentUser = window.SupabaseConfig.getCurrentUser();
        if (!currentUser) {
            console.log('⚠️ کاربر لاگین نکرده است');
            return false;
        }
        
        // دریافت اطلاعات از localStorage
        const gameData = JSON.parse(localStorage.getItem('sodmaxGameData') || '{}');
        if (!gameData) {
            console.log('⚠️ اطلاعات بازی یافت نشد');
            return false;
        }
        
        // آماده کردن داده‌ها برای Supabase
        const gameDataForSupabase = {
            user_id: currentUser.id,
            sod_balance: gameData.sodBalance || 0,
            usdt_balance: gameData.usdtBalance || 0,
            user_level: gameData.userLevel || 1,
            mining_power: gameData.miningPower || 10,
            total_mined: gameData.totalMined || 0,
            today_earnings: gameData.todayEarnings || 0,
            usdt_progress: gameData.usdtProgress || 0,
            boost_active: gameData.boostActive || false,
            boost_end_time: gameData.boostEndTime || null
        };
        
        // آپدیت در Supabase
        const result = await window.SupabaseConfig.updateGameData(currentUser.id, gameDataForSupabase);
        
        if (result) {
            console.log('✅ داده‌ها در Supabase ذخیره شدند');
            return true;
        } else {
            console.log('⚠️ خطا در ذخیره Supabase');
            return false;
        }
        
    } catch (error) {
        console.error('🚨 خطا در ذخیره‌سازی Supabase:', error);
        return false;
    }
}

// ذخیره در localStorage
function saveGameDataToLocal() {
    try {
        // این تابع توسط index.html پر می‌شود
        console.log('📱 ذخیره در localStorage');
    } catch (error) {
        console.error('خطا در ذخیره localStorage:', error);
    }
}

// ذخیره ترکیبی (هم Supabase هم localStorage)
async function saveGameData() {
    try {
        // اول در localStorage ذخیره کن
        saveGameDataToLocal();
        
        // سپس در Supabase ذخیره کن
        await saveGameDataToSupabase();
        
        console.log('💾 داده‌ها ذخیره شدند');
    } catch (error) {
        console.error('خطا در ذخیره:', error);
    }
}

// ==================== بارگذاری داده‌ها ====================

// بارگذاری از Supabase
async function loadGameDataFromSupabase() {
    try {
        if (!window.SupabaseConfig || !window.SupabaseConfig.isInitialized()) {
            console.log('⚠️ Supabase آماده نیست');
            return null;
        }
        
        const currentUser = window.SupabaseConfig.getCurrentUser();
        if (!currentUser) {
            console.log('⚠️ کاربر لاگین نکرده است');
            return null;
        }
        
        // دریافت اطلاعات بازی از Supabase
        const gameData = await window.SupabaseConfig.getGameData(currentUser.id);
        
        if (gameData) {
            console.log('✅ اطلاعات بازی از Supabase بارگذاری شد');
            
            // تبدیل به فرمت مورد نظر
            return {
                sodBalance: gameData.sod_balance || 0,
                usdtBalance: gameData.usdt_balance || 0,
                userLevel: gameData.user_level || 1,
                miningPower: gameData.mining_power || 10,
                totalMined: gameData.total_mined || 0,
                todayEarnings: gameData.today_earnings || 0,
                usdtProgress: gameData.usdt_progress || 0,
                boostActive: gameData.boost_active || false,
                boostEndTime: gameData.boost_end_time || null
            };
        }
        
        return null;
        
    } catch (error) {
        console.error('🚨 خطا در بارگذاری از Supabase:', error);
        return null;
    }
}

// ==================== سیستم سینک ====================

// سینک خودکار
let syncInterval = null;

function startAutoSync() {
    // اگر قبلاً فعال بود، متوقفش کن
    if (syncInterval) {
        clearInterval(syncInterval);
    }
    
    // هر 60 ثانیه سینک کن
    syncInterval = setInterval(async () => {
        const userData = JSON.parse(localStorage.getItem('sodmaxUserData') || '{}');
        if (userData && userData.email) {
            await saveGameDataToSupabase();
        }
    }, 60000);
    
    console.log('🔄 سینک خودکار فعال شد (هر 60 ثانیه)');
}

function stopAutoSync() {
    if (syncInterval) {
        clearInterval(syncInterval);
        syncInterval = null;
        console.log('🛑 سینک خودکار متوقف شد');
    }
}

// ==================== مدیریت کاربران ====================

// وقتی کاربر ثبت‌نام می‌کند
window.addEventListener('userRegistered', async function(e) {
    const { email, fullName } = e.detail;
    
    console.log('🎉 رویداد ثبت‌نام دریافت شد:', email);
    
    // ذخیره در localStorage
    const userData = {
        isRegistered: true,
        email: email,
        fullName: fullName,
        registerDate: new Date().toLocaleDateString('fa-IR')
    };
    localStorage.setItem('sodmaxUserData', JSON.stringify(userData));
    
    // اگر Supabase آماده است، کاربر را در آنجا هم ثبت کن
    if (window.SupabaseConfig && window.SupabaseConfig.isInitialized()) {
        try {
            // از یک رمز ثابت استفاده می‌کنیم (در پروژه واقعی باید کاربر رمز وارد کند)
            const result = await window.SupabaseConfig.signUp(email, 'DefaultPassword123', fullName);
            
            if (result.success) {
                console.log('✅ کاربر در Supabase ثبت شد');
            } else {
                console.log('⚠️ خطا در ثبت Supabase:', result.message);
            }
        } catch (error) {
            console.error('🚨 خطا در ثبت Supabase:', error);
        }
    }
});

// وقتی کاربر لاگین می‌کند
window.addEventListener('userLoggedIn', async function(e) {
    const { email } = e.detail;
    
    console.log('🔑 رویداد لاگین دریافت شد:', email);
    
    // ذخیره در localStorage
    const userData = {
        isRegistered: true,
        email: email
    };
    localStorage.setItem('sodmaxUserData', JSON.stringify(userData));
    
    // سعی کن از Supabase بارگذاری کنی
    if (window.SupabaseConfig && window.SupabaseConfig.isInitialized()) {
        const supabaseData = await loadGameDataFromSupabase();
        if (supabaseData) {
            // ذخیره در localStorage
            localStorage.setItem('sodmaxGameData', JSON.stringify(supabaseData));
            console.log('✅ اطلاعات از Supabase بارگذاری شد');
        }
    }
});

// ==================== راه‌اندازی ====================

// وقتی صفحه بارگذاری شد
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 app-core.js راه‌اندازی شد');
    
    // منتظر Supabase باش
    const checkInterval = setInterval(() => {
        if (window.SupabaseConfig && window.SupabaseConfig.isInitialized()) {
            clearInterval(checkInterval);
            console.log('✅ Supabase آماده است');
            
            // اگر کاربر لاگین کرده، سینک خودکار را شروع کن
            const userData = JSON.parse(localStorage.getItem('sodmaxUserData') || '{}');
            if (userData.email) {
                startAutoSync();
                
                // یک بار هم الآن سینک کن
                setTimeout(() => {
                    saveGameDataToSupabase();
                }, 3000);
            }
        }
    }, 1000);
});

// ==================== اکسپورت توابع ====================

window.SODmaxCore = {
    saveGameData,
    saveGameDataToSupabase,
    saveGameDataToLocal,
    loadGameDataFromSupabase,
    startAutoSync,
    stopAutoSync
};

console.log('✅ app-core.js بارگذاری کامل شد');
