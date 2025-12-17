// فایل: state-manager.js
class GameStateManager {
    constructor() {
        this.state = {
            user: null,
            gameData: null,
            isOnline: false,
            useSupabase: false
        };
    }

    async init() {
        // 1. بررسی Supabase
        if (window.supabaseClient) {
            try {
                const { data: { session } } = await supabaseClient.auth.getSession();
                if (session) {
                    this.state.user = session.user;
                    this.state.useSupabase = true;
                    this.state.isOnline = true;
                    console.log('✅ حالت آنلاین (Supabase) فعال');
                    return 'supabase';
                }
            } catch (e) {
                console.log('⚠️ خطا در اتصال به Supabase:', e);
            }
        }

        // 2. حالت آفلاین (localStorage)
        const savedUser = localStorage.getItem('sodmax_user');
        if (savedUser) {
            this.state.user = JSON.parse(savedUser);
            this.state.useSupabase = false;
            this.state.isOnline = false;
            console.log('✅ حالت آفلاین فعال');
            return 'local';
        }

        // 3. حالت مهمان
        console.log('✅ حالت مهمان فعال');
        return 'guest';
    }

    async saveGameData(data) {
        if (this.state.useSupabase && this.state.user?.id) {
            // ذخیره در Supabase
            try {
                await window.GameDB.updateGameData(this.state.user.id, data);
                console.log('💾 ذخیره در Supabase');
            } catch (e) {
                console.log('⚠️ خطا در ذخیره Supabase، استفاده از localStorage');
                this.saveToLocal(data);
            }
        } else {
            // ذخیره در localStorage
            this.saveToLocal(data);
        }
    }

    saveToLocal(data) {
        localStorage.setItem('sodmax_game', JSON.stringify(data));
        localStorage.setItem('sodmax_user', JSON.stringify(this.state.user || {}));
        console.log('💾 ذخیره در localStorage');
    }

    async loadGameData() {
        if (this.state.useSupabase && this.state.user?.id) {
            try {
                const result = await window.GameDB.getOrCreateGameData(this.state.user.id);
                if (!result.error) {
                    return result.data;
                }
            } catch (e) {
                console.log('⚠️ خطا در بارگذاری از Supabase');
            }
        }

        // بارگذاری از localStorage
        const localData = localStorage.getItem('sodmax_game');
        return localData ? JSON.parse(localData) : this.getDefaultGameData();
    }

    getDefaultGameData() {
        return {
            sod_balance: 1000000,
            usdt_balance: 0,
            today_earnings: 0,
            mining_power: 10,
            user_level: 1,
            usdt_progress: 0,
            total_mined: 1000000,
            boost_active: false,
            boost_end_time: 0
        };
    }
}
