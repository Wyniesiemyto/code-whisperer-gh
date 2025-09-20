import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// Declare reCAPTCHA types
declare global {
  interface Window {
    grecaptcha: {
      render: (container: Element, parameters: {
        sitekey: string;
        callback: (token: string) => void;
        'expired-callback': () => void;
      }) => void;
      reset: () => void;
      ready: (callback: () => void) => void;
      execute: (sitekey: string, options: { action: string }) => Promise<string>;
    };
  }
}

interface ContactFormProps {
  onSubmitSuccess?: () => void;
}

export const ContactForm: React.FC<ContactFormProps> = ({ onSubmitSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    message: '',
    needsWasteCollection: ''
  });

  // reCAPTCHA site key
  const RECAPTCHA_SITE_KEY = '6LceusorAAAAAEJsv6s4uTVSXmBj-XnpTMRfr8qP';

  useEffect(() => {
    // reCAPTCHA v3 - loads automatically, no widget needed
    const loadRecaptcha = () => {
      if (window.grecaptcha && window.grecaptcha.ready) {
        console.log('reCAPTCHA v3 loaded and ready');
      }
    };

    if (window.grecaptcha && window.grecaptcha.ready) {
      window.grecaptcha.ready(loadRecaptcha);
    } else {
      const checkRecaptcha = () => {
        if (window.grecaptcha && window.grecaptcha.ready) {
          window.grecaptcha.ready(loadRecaptcha);
        } else {
          setTimeout(checkRecaptcha, 100);
        }
      };
      checkRecaptcha();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // Get reCAPTCHA v3 token
      const token = await window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: 'contact_form' });
      
      const { data, error } = await supabase.functions.invoke('send-contact-email', {
        body: {
          name: formData.name,
          phone: formData.phone,
          message: formData.message,
          needsWasteCollection: formData.needsWasteCollection,
          recaptchaToken: token,
        },
      });

      if (error) {
        console.error('Supabase function error:', error);
        setSubmitStatus('error');
      } else {
        setSubmitStatus('success');
        setFormData({ name: '', phone: '', message: '', needsWasteCollection: '' });
        onSubmitSuccess?.();
      }
    } catch (error) {
      console.error('Error:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-50 p-8 rounded-xl">
      <h3 className="text-2xl font-bold text-gray-900 mb-6">Wyślij wiadomość</h3>
      <form onSubmit={handleSubmit} className="space-y-6">
        {submitStatus === 'success' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <p className="text-green-700">Dziękujemy za wiadomość! Skontaktujemy się z Państwem wkrótce.</p>
          </div>
        )}
        
        {submitStatus === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <X className="h-5 w-5 text-red-500" />
            <p className="text-red-700">Wystąpił błąd podczas wysyłania wiadomości. Prosimy spróbować ponownie lub zadzwonić bezpośrednio.</p>
          </div>
        )}

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Imię i nazwisko *
          </label>
          <input
            type="text"
            id="name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition duration-200"
            placeholder="Jak się do Ciebie zwracać?"
          />
        </div>
        
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
            Numer telefonu *
          </label>
          <input
            type="tel"
            id="phone"
            required
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition duration-200"
            placeholder="Twój numer telefonu"
          />
        </div>
        
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
            Wiadomość *
          </label>
          <textarea
            id="message"
            required
            rows={5}
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition duration-200"
            placeholder="Opisz czego potrzebujesz..."
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Czy potrzebujesz wywozu do Punktu Selektywnej Zbiórki Odpadów Komunalnych? *
          </label>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="wasteCollection"
                value="tak"
                checked={formData.needsWasteCollection === 'tak'}
                onChange={(e) => setFormData({ ...formData, needsWasteCollection: e.target.value })}
                className="w-4 h-4 text-orange-500 border-gray-300 focus:ring-orange-500"
                required
              />
              <span className="text-sm text-gray-700">Tak</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="wasteCollection"
                value="nie"
                checked={formData.needsWasteCollection === 'nie'}
                onChange={(e) => setFormData({ ...formData, needsWasteCollection: e.target.value })}
                className="w-4 h-4 text-orange-500 border-gray-300 focus:ring-orange-500"
                required
              />
              <span className="text-sm text-gray-700">Nie</span>
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-lg transition duration-300 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Wysyłanie...
            </>
          ) : (
            <>
              <Mail className="h-5 w-5" />
              Wyślij wiadomość
            </>
          )}
        </button>
      </form>
    </div>
  );
};