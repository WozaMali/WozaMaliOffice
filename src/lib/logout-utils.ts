// Comprehensive logout utilities to ensure proper session clearing
// and prevent auto sign-in

export class LogoutUtils {
  /**
   * Comprehensive logout function that clears all authentication data
   * and prevents auto sign-in
   */
  static async performCompleteLogout(supabase: any): Promise<void> {
    try {
      console.log('🚪 Starting comprehensive logout...');
      
      // 1. Sign out from Supabase with global scope
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) {
        console.error('Supabase logout error:', error);
      }
      
      // 2. Clear all browser storage
      if (typeof window !== 'undefined') {
        // Clear localStorage
        localStorage.clear();
        
        // Clear sessionStorage
        sessionStorage.clear();
        
        // Clear IndexedDB if it exists
        if ('indexedDB' in window) {
          try {
            indexedDB.deleteDatabase('supabase');
            indexedDB.deleteDatabase('sb-mljtjntkddwkcjixkyuy-auth-token');
          } catch (e) {
            console.log('IndexedDB cleanup skipped:', e);
          }
        }
        
        // Clear all cookies
        this.clearAllCookies();
        
        // Clear any remaining auth-related storage
        this.clearAuthStorage();
      }
      
      console.log('✅ Comprehensive logout completed');
    } catch (error) {
      console.error('❌ Logout error:', error);
      throw error;
    }
  }
  
  /**
   * Clear all cookies to prevent auto sign-in
   */
  private static clearAllCookies(): void {
    if (typeof document === 'undefined') return;
    
    const cookies = document.cookie.split(";");
    const domain = window.location.hostname;
    const path = window.location.pathname;
    
    cookies.forEach(cookie => {
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      
      if (name) {
        // Clear with current domain
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${domain}`;
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${path}`;
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${path};domain=${domain}`;
      }
    });
  }
  
  /**
   * Clear any remaining authentication-related storage
   */
  private static clearAuthStorage(): void {
    if (typeof window === 'undefined') return;
    
    // Clear specific auth-related keys
    const authKeys = [
      'sb-mljtjntkddwkcjixkyuy-auth-token',
      'supabase.auth.token',
      'supabase.auth.user',
      'supabase.auth.session',
      'auth-token',
      'user-token',
      'session-token'
    ];
    
    authKeys.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
    
    // Clear any keys that contain auth-related terms
    Object.keys(localStorage).forEach(key => {
      if (key.toLowerCase().includes('auth') || 
          key.toLowerCase().includes('token') || 
          key.toLowerCase().includes('session') ||
          key.toLowerCase().includes('supabase')) {
        localStorage.removeItem(key);
      }
    });
    
    Object.keys(sessionStorage).forEach(key => {
      if (key.toLowerCase().includes('auth') || 
          key.toLowerCase().includes('token') || 
          key.toLowerCase().includes('session') ||
          key.toLowerCase().includes('supabase')) {
        sessionStorage.removeItem(key);
      }
    });
  }
  
  /**
   * Force redirect to home page with cache busting
   */
  static forceRedirectToHome(): void {
    if (typeof window === 'undefined') return;
    
    // Add cache busting parameter
    const timestamp = Date.now();
    window.location.href = `/?logout=${timestamp}&nocache=true`;
  }
  
  /**
   * Check if user is properly logged out
   */
  static isLoggedOut(): boolean {
    if (typeof window === 'undefined') return true;
    
    // Check if any auth-related data exists
    const hasAuthData = 
      localStorage.getItem('sb-mljtjntkddwkcjixkyuy-auth-token') ||
      localStorage.getItem('supabase.auth.token') ||
      sessionStorage.getItem('sb-mljtjntkddwkcjixkyuy-auth-token') ||
      sessionStorage.getItem('supabase.auth.token');
    
    return !hasAuthData;
  }
}
