// app-core.js - نسخه ساده
console.log('📦 بارگذاری app-core.js');

// بررسی اینکه آیا قبلاً بارگذاری شده
if (typeof window.appCoreLoaded !== 'undefined') {
    console.log('⚠️ app-core قبلاً بارگذاری شده است');
} else {
    window.appCoreLoaded = true;
    
    let autoSyncTimer = null;
    
    // ذخیره در Supabase
    async function saveToSupabase() {
        try {
            if (!window.SupabaseManager || !window.SupabaseManager.isReady()) {
                console.log('⚠️ Supabase آماده نیست');
                return false;
            }
            
            const currentUser = window.SupabaseManager.getCurrentUser();
            if (!currentUser) {
                console.log('⚠️ کاربر لاگین نکرده است');
                return false;
            }
            
            const gameData = JSON.parse(localStorage.getItem('sodmaxGameData') || '{}');
            if (!gameData) {
                console.log('⚠️ اطلاعات بازی یافت نشد');
                return false;
            }
            
            const gameDataForDB = {
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
            
            const result = await window.SupabaseManager.updateGameData(currentUser.id, gameDataForDB);
            
            if (result) {
                console.log('✅ داده‌ها در Supabase ذخیره شدند');
                return true;
            } else {
                console.log('⚠️ خطا در ذخیره Supabase');
                return false;
            }
            
        } catch (error) {
            console.error('🚨 خطا در ذخیره‌سازی:', error);
            return false;
        }
    }
    
    // شروع سینک خودکار
    function startAutoSync() {
        if (autoSyncTimer) {
            clearInterval(autoSyncTimer);
        }
        
        autoSyncTimer = setInterval(async () => {
            const userData = JSON.parse(localStorage.getItem('sodmaxUserData') || '{}');
            if (userData && userData.email) {
                await saveToSupabase();
            }
        }, 60000);
        
        console.log('🔄 سینک خودکار فعال شد');
    }
    
    // توقف سینک خودکار
    function stopAutoSync() {
        if (autoSyncTimer) {
            clearInterval(autoSyncTimer);
            autoSyncTimer = null;
            console.log('🛑 سینک خودکار متوقف شد');
        }
    }
    
    // ذخیره کلی
    async function saveAllData() {
        try {
            // ذخیره در localStorage
            console.log('💾 ذخیره در localStorage');
            
            // ذخیره در Supabase
            await saveToSupabase();
            
            console.log('✅ تمام داده‌ها ذخیره شدند');
        } catch (error) {
            console.error('خطا در ذخیره:', error);
        }
    }
    
    // اکسپورت توابع
    window.GameStorage = {
        save: saveAllData,
        saveToSupabase: saveToSupabase,
        startSync: startAutoSync,
        stopSync: stopAutoSync
    };
    
    // وقتی صفحه بارگذاری شد
    document.addEventListener('DOMContentLoaded', function() {
        console.log('📄 app-core.js راه‌اندازی شد');
        
        // منتظر Supabase باش
        const checkTimer = setInterval(() => {
            if (window.SupabaseManager && window.SupabaseManager.isReady()) {
                clearInterval(checkTimer);
                console.log('✅ Supabase آماده است');
                
                // اگر کاربر لاگین کرده، سینک را شروع کن
                const userData = JSON.parse(localStorage.getItem('sodmaxUserData') || '{}');
                if (userData.email) {
                    startAutoSync();
                }
            }
        }, 1000);
    });
    
    console.log('✅ app-core.js بارگذاری کامل شد');
}
