import { supabase } from './supabaseClient.js';
import { getSessionId } from './sessionService.js';

export const testDatabaseConnection = async () => {
  try {
    const { error } = await supabase.from('test_scenarios').select('id').limit(1);
    return !error;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
};

export const getDatabaseStats = async () => {
  try {
    const { count, error } = await supabase
      .from('test_scenarios')
      .select('id', { count: 'exact', head: true });

    if (error) throw error;
    return { reports: count || 0 };
  } catch (error) {
    console.error('Error getting database stats:', error);
    return { reports: 0 };
  }
};

export const cleanupTemporaryReports = async () => {
  try {
    const sessionId = getSessionId();
    const { error } = await supabase
      .from('test_scenarios')
      .delete()
      .eq('session_id', sessionId)
      .eq('is_temp', true);

    if (error) {
      console.error('Error cleaning up temporary reports:', error);
    } else {
      console.log('Temporary reports cleaned up for session:', sessionId);
    }
  } catch (error) {
    console.error('Error cleaning up temporary reports:', error);
  }
};

export const initializeDatabaseCleanup = () => {
  const sessionId = getSessionId();
  let isPageActive = true;
  let cleanupTimeoutId = null;

  sessionStorage.setItem('qa_session_active', 'true');
  sessionStorage.setItem('qa_last_activity', Date.now().toString());

  const activityInterval = setInterval(() => {
    if (isPageActive) {
      sessionStorage.setItem('qa_last_activity', Date.now().toString());
    }
  }, 30000);

  const cleanup = async () => {
    try {
      isPageActive = false;
      sessionStorage.setItem('qa_session_active', 'false');
      await cleanupTemporaryReports();
      console.log('Temporary reports cleaned up for session:', sessionId);
    } catch (error) {
      console.warn('Error during cleanup:', error);
    }
  };

  const handleUnload = () => {
    sessionStorage.setItem('qa_session_active', 'false');
    if (navigator.sendBeacon) {
      console.log('Page unloading, marking session for cleanup');
    }
    cleanup();
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      isPageActive = false;
      cleanupTimeoutId = setTimeout(async () => {
        const lastActivity = parseInt(sessionStorage.getItem('qa_last_activity') || '0');
        const timeSinceActivity = Date.now() - lastActivity;

        if (timeSinceActivity > 5 * 60 * 1000) {
          console.log('Page hidden for extended period, cleaning up temporary reports');
          await cleanup();
        }
      }, 5 * 60 * 1000);
    } else if (document.visibilityState === 'visible') {
      isPageActive = true;
      sessionStorage.setItem('qa_session_active', 'true');
      sessionStorage.setItem('qa_last_activity', Date.now().toString());

      if (cleanupTimeoutId) {
        clearTimeout(cleanupTimeoutId);
        cleanupTimeoutId = null;
      }
    }
  };

  window.addEventListener('beforeunload', handleUnload);
  window.addEventListener('unload', handleUnload);
  window.addEventListener('pagehide', handleUnload);
  document.addEventListener('visibilitychange', handleVisibilityChange);

  return () => {
    clearInterval(activityInterval);
    if (cleanupTimeoutId) {
      clearTimeout(cleanupTimeoutId);
    }
    window.removeEventListener('beforeunload', handleUnload);
    window.removeEventListener('unload', handleUnload);
    window.removeEventListener('pagehide', handleUnload);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    cleanup();
  };
};
