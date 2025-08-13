/**
 * 805 HVAC Pro - Enhanced JavaScript
 * Advanced tracking and interactive functionality for premium HVAC website
 */

// Global tracking utilities
window.HVACPro = {
  tracking: {
    // Enhanced event tracking
    trackEvent: function(eventName, category, label, value = null) {
      if (typeof gtag !== 'undefined') {
        const eventData = {
          event_category: category,
          event_label: label
        };
        if (value !== null) {
          eventData.value = value;
        }
        gtag('event', eventName, eventData);
      }
    },

    // Track form interactions
    trackFormInteraction: function(formId, action, field = null) {
      const eventName = `form_${action}`;
      const label = field ? `${formId}_${field}` : formId;
      this.trackEvent(eventName, 'form', label, action === 'submit' ? 25 : 5);
    },

    // Track premium interactions (high-value events)
    trackPremiumInteraction: function(interactionType, value = 15) {
      this.trackEvent('premium_interaction', 'high_value', interactionType, value);
      
      // Set custom user type for premium interactions
      if (typeof gtag !== 'undefined') {
        gtag('config', 'G-NDMH7Q3QG9', {
          custom_map: { custom_user_type: 'user_type' },
          user_type: 'high_value_prospect'
        });
      }
    },

    // Track service interest
    trackServiceInterest: function(serviceName) {
      this.trackEvent('service_interest', 'engagement', serviceName, 10);
      
      // Store service interest in session for remarketing
      if (typeof sessionStorage !== 'undefined') {
        let interests = JSON.parse(sessionStorage.getItem('serviceInterests') || '[]');
        if (!interests.includes(serviceName)) {
          interests.push(serviceName);
          sessionStorage.setItem('serviceInterests', JSON.stringify(interests));
        }
      }
    },

    // Track phone interactions
    trackPhoneClick: function(location = 'general') {
      this.trackEvent('phone_click', 'contact', location, 20);
      this.trackPremiumInteraction(`phone_click_${location}`, 20);
    },

    // Track scroll depth
    trackScrollDepth: function(percentage) {
      this.trackEvent('scroll_depth', 'engagement', `${percentage}%`, percentage);
    },

    // Track time on page milestones
    trackTimeOnPage: function(seconds) {
      this.trackEvent('time_on_page', 'engagement', `${seconds}s`, Math.floor(seconds / 10));
    },

    // Track CTA clicks with context
    trackCTA: function(ctaText, location, isPremium = false) {
      this.trackEvent('cta_click', 'conversion', `${ctaText}_${location}`, isPremium ? 25 : 15);
      if (isPremium) {
        this.trackPremiumInteraction(`cta_${location}`, 25);
      }
    }
  },

  // UI enhancements
  ui: {
    // Initialize all UI components
    init: function() {
      this.initMobileMenu();
      this.initFormEnhancements();
      this.initScrollEffects();
      this.initLazyLoading();
      this.initAccessibility();
    },

    // Enhanced mobile menu
    initMobileMenu: function() {
      const menuToggle = document.getElementById('menu-toggle');
      const mobileMenu = document.getElementById('mobile-menu');
      
      if (menuToggle && mobileMenu) {
        menuToggle.addEventListener('click', function() {
          const isHidden = mobileMenu.classList.contains('hidden');
          
          if (isHidden) {
            mobileMenu.classList.remove('hidden');
            menuToggle.setAttribute('aria-expanded', 'true');
            HVACPro.tracking.trackEvent('mobile_menu_open', 'ui', 'menu_toggle');
          } else {
            mobileMenu.classList.add('hidden');
            menuToggle.setAttribute('aria-expanded', 'false');
            HVACPro.tracking.trackEvent('mobile_menu_close', 'ui', 'menu_toggle');
          }
        });

        // Close menu when clicking outside
        document.addEventListener('click', function(event) {
          if (!menuToggle.contains(event.target) && !mobileMenu.contains(event.target)) {
            mobileMenu.classList.add('hidden');
            menuToggle.setAttribute('aria-expanded', 'false');
          }
        });

        // Close menu on escape key
        document.addEventListener('keydown', function(event) {
          if (event.key === 'Escape' && !mobileMenu.classList.contains('hidden')) {
            mobileMenu.classList.add('hidden');
            menuToggle.setAttribute('aria-expanded', 'false');
            menuToggle.focus();
          }
        });
      }
    },

    // Enhanced form functionality
    initFormEnhancements: function() {
      const forms = document.querySelectorAll('form');
      
      forms.forEach(form => {
        const formId = form.id || 'contact_form';
        let formStarted = false;

        // Track form start
        form.addEventListener('focusin', function() {
          if (!formStarted) {
            formStarted = true;
            HVACPro.tracking.trackFormInteraction(formId, 'start');
          }
        });

        // Track field interactions
        const inputs = form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
          input.addEventListener('blur', function() {
            if (this.value.trim()) {
              HVACPro.tracking.trackFormInteraction(formId, 'field_complete', this.name || this.type);
            }
          });

          // Real-time validation feedback
          input.addEventListener('input', function() {
            this.classList.remove('error');
            const errorMsg = this.parentNode.querySelector('.error-message');
            if (errorMsg) {
              errorMsg.remove();
            }
          });
        });

        // Enhanced form submission
        form.addEventListener('submit', function(e) {
          const isValid = HVACPro.ui.validateForm(this);
          
          if (isValid) {
            HVACPro.tracking.trackFormInteraction(formId, 'submit');
            HVACPro.tracking.trackPremiumInteraction('form_submission', 30);
            
            // Show loading state
            const submitBtn = this.querySelector('button[type="submit"]');
            if (submitBtn) {
              submitBtn.disabled = true;
              submitBtn.innerHTML = 'Sending...';
              submitBtn.classList.add('loading');
            }
          } else {
            e.preventDefault();
            HVACPro.tracking.trackEvent('form_validation_error', 'form', formId);
          }
        });
      });
    },

    // Form validation
    validateForm: function(form) {
      let isValid = true;
      const requiredFields = form.querySelectorAll('[required]');
      
      requiredFields.forEach(field => {
        if (!field.value.trim()) {
          this.showFieldError(field, 'This field is required');
          isValid = false;
        } else if (field.type === 'email' && !this.isValidEmail(field.value)) {
          this.showFieldError(field, 'Please enter a valid email address');
          isValid = false;
        } else if (field.type === 'tel' && !this.isValidPhone(field.value)) {
          this.showFieldError(field, 'Please enter a valid phone number');
          isValid = false;
        }
      });
      
      return isValid;
    },

    showFieldError: function(field, message) {
      field.classList.add('error');
      
      // Remove existing error message
      const existingError = field.parentNode.querySelector('.error-message');
      if (existingError) {
        existingError.remove();
      }
      
      // Add new error message
      const errorDiv = document.createElement('div');
      errorDiv.className = 'error-message text-sm text-red-600 mt-1';
      errorDiv.textContent = message;
      field.parentNode.appendChild(errorDiv);
    },

    isValidEmail: function(email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    },

    isValidPhone: function(phone) {
      const phoneRegex = /^[\+]?[1-9]?[\d\s\-\(\)]{10,}$/;
      return phoneRegex.test(phone.replace(/\s/g, ''));
    },

    // Scroll effects and animations
    initScrollEffects: function() {
      // Intersection Observer for animations
      const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      };

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in');
            
            // Track section visibility
            const sectionName = entry.target.id || entry.target.className;
            HVACPro.tracking.trackEvent('section_view', 'engagement', sectionName);
          }
        });
      }, observerOptions);

      // Observe sections and cards
      const elementsToObserve = document.querySelectorAll('section, .card, .hero-content');
      elementsToObserve.forEach(el => observer.observe(el));

      // Scroll depth tracking
      let scrollMarks = [25, 50, 75, 90];
      let marksTracked = [];
      
      function trackScrollDepthOnce() {
        const scrollPercent = Math.round(
          (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
        );
        
        scrollMarks.forEach(mark => {
          if (scrollPercent >= mark && !marksTracked.includes(mark)) {
            marksTracked.push(mark);
            HVACPro.tracking.trackScrollDepth(mark);
          }
        });
      }
      
      let scrollTimeout;
      window.addEventListener('scroll', function() {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(trackScrollDepthOnce, 100);
      });
    },

    // Lazy loading enhancements
    initLazyLoading: function() {
      if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const img = entry.target;
              img.src = img.dataset.src || img.src;
              img.classList.remove('loading');
              img.classList.add('loaded');
              imageObserver.unobserve(img);
            }
          });
        });

        const lazyImages = document.querySelectorAll('img[loading="lazy"]');
        lazyImages.forEach(img => {
          img.classList.add('loading');
          imageObserver.observe(img);
        });
      }
    },

    // Accessibility enhancements
    initAccessibility: function() {
      // Focus management
      const focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
      
      // Skip to main content
      const skipLink = document.createElement('a');
      skipLink.href = '#main';
      skipLink.textContent = 'Skip to main content';
      skipLink.className = 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary-600 text-white px-4 py-2 rounded z-50';
      document.body.insertBefore(skipLink, document.body.firstChild);

      // Keyboard navigation for custom elements
      document.addEventListener('keydown', function(e) {
        // Handle escape key for modals/dropdowns
        if (e.key === 'Escape') {
          const openModals = document.querySelectorAll('.modal.open, .dropdown.open');
          openModals.forEach(modal => {
            modal.classList.remove('open');
          });
        }

        // Handle arrow keys for custom navigation
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          const focusedElement = document.activeElement;
          if (focusedElement.matches('.nav-link')) {
            e.preventDefault();
            const navLinks = Array.from(document.querySelectorAll('.nav-link'));
            const currentIndex = navLinks.indexOf(focusedElement);
            const nextIndex = e.key === 'ArrowDown' 
              ? (currentIndex + 1) % navLinks.length 
              : (currentIndex - 1 + navLinks.length) % navLinks.length;
            navLinks[nextIndex].focus();
          }
        }
      });

      // Announce important changes to screen readers
      this.createAriaLiveRegion();
    },

    createAriaLiveRegion: function() {
      const liveRegion = document.createElement('div');
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.className = 'sr-only';
      liveRegion.id = 'aria-live-region';
      document.body.appendChild(liveRegion);
    },

    announceToScreenReader: function(message) {
      const liveRegion = document.getElementById('aria-live-region');
      if (liveRegion) {
        liveRegion.textContent = message;
        setTimeout(() => {
          liveRegion.textContent = '';
        }, 1000);
      }
    }
  },

  // Performance optimizations
  performance: {
    init: function() {
      this.preloadCriticalResources();
      this.optimizeImages();
      this.deferNonCriticalScripts();
    },

    preloadCriticalResources: function() {
      // Preload hero images
      const heroImages = [
        '/assets/images/805-hvac-pro-conejo-valley-hero-01-ac-unit.jpg',
        '/assets/images/805-hvac-pro-conejo-valley-hero-02-furnace-service.jpg'
      ];

      heroImages.forEach(src => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = src;
        document.head.appendChild(link);
      });
    },

    optimizeImages: function() {
      // Add loading states to images
      const images = document.querySelectorAll('img');
      images.forEach(img => {
        if (!img.complete) {
          img.addEventListener('load', function() {
            this.classList.add('loaded');
          });
          img.addEventListener('error', function() {
            this.classList.add('error');
            console.warn('Failed to load image:', this.src);
          });
        }
      });
    },

    deferNonCriticalScripts: function() {
      // Defer non-critical third-party scripts
      window.addEventListener('load', function() {
        // Load analytics after page load
        setTimeout(function() {
          // Additional analytics or marketing scripts can be loaded here
        }, 2000);
      });
    }
  },

  // Time tracking
  timeTracking: {
    startTime: Date.now(),
    milestones: [30, 60, 120, 300], // seconds
    trackedMilestones: [],

    init: function() {
      setInterval(() => {
        const timeOnPage = Math.floor((Date.now() - this.startTime) / 1000);
        
        this.milestones.forEach(milestone => {
          if (timeOnPage >= milestone && !this.trackedMilestones.includes(milestone)) {
            this.trackedMilestones.push(milestone);
            HVACPro.tracking.trackTimeOnPage(milestone);
          }
        });
      }, 10000); // Check every 10 seconds
    }
  }
};

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Initialize all modules
  HVACPro.ui.init();
  HVACPro.performance.init();
  HVACPro.timeTracking.init();

  // Track page load
  HVACPro.tracking.trackEvent('page_load', 'engagement', document.title);

  // Add global click tracking for links
  document.addEventListener('click', function(e) {
    const target = e.target.closest('a');
    if (target) {
      const href = target.getAttribute('href');
      const text = target.textContent.trim();
      
      if (href) {
        if (href.startsWith('tel:')) {
          HVACPro.tracking.trackPhoneClick('link');
        } else if (href.startsWith('mailto:')) {
          HVACPro.tracking.trackEvent('email_click', 'contact', text);
        } else if (href.startsWith('http') && !href.includes(window.location.hostname)) {
          HVACPro.tracking.trackEvent('external_link', 'outbound', href);
        } else {
          HVACPro.tracking.trackEvent('internal_link', 'navigation', href);
        }
      }
    }
  });

  // Track page visibility changes
  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'hidden') {
      const timeOnPage = Math.floor((Date.now() - HVACPro.timeTracking.startTime) / 1000);
      HVACPro.tracking.trackEvent('page_exit', 'engagement', 'visibility_change', timeOnPage);
    }
  });

  // Track beforeunload for true page exits
  window.addEventListener('beforeunload', function() {
    const timeOnPage = Math.floor((Date.now() - HVACPro.timeTracking.startTime) / 1000);
    HVACPro.tracking.trackEvent('page_exit', 'engagement', 'beforeunload', timeOnPage);
  });
});

// Add CSS for animations and states
const style = document.createElement('style');
style.textContent = `
  /* Loading states */
  .loading {
    opacity: 0.7;
    transition: opacity 0.3s ease;
  }
  
  .loaded {
    opacity: 1;
  }
  
  .error {
    border-color: #ef4444 !important;
  }
  
  /* Animation classes */
  .animate-fade-in {
    animation: fadeIn 0.6s ease-out forwards;
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  /* Focus styles */
  .focus-visible:focus {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
  }
  
  /* High contrast mode support */
  @media (prefers-contrast: high) {
    .btn {
      border: 2px solid currentColor;
    }
  }
  
  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
`;
document.head.appendChild(style);

// Export for global access
window.HVACPro = HVACPro;
