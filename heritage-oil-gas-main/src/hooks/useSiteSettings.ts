import { useState, useEffect } from 'react';

export interface SiteSettings {
  id?: number;
  site_name: string;
  site_title: string;
  meta_description: string;
  meta_keywords: string;
  logo?: string | null;
  favicon?: string | null;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/settings`);
        const data = await response.json();
        
        if (data.success) {
          setSettings(data.data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch settings');
        console.error('Error fetching site settings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  return { settings, loading, error };
}
