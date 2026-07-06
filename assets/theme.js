/**
 * LuxeCommerce Premium Redesign Interactions
 */
document.addEventListener('DOMContentLoaded', () => {
  // --- Sticky Header Scroll Direction Handler ---
  let lastScrollTop = 0;
  const headerSection = document.querySelector('.shopify-section-group-header-group');
  
  if (headerSection) {
    window.addEventListener('scroll', () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      if (scrollTop > 80) {
        headerSection.classList.add('is-sticky');
        if (scrollTop > lastScrollTop) {
          // Scrolling down - hide header slightly
          headerSection.style.transform = 'translateY(-100%)';
          headerSection.style.position = 'fixed';
          headerSection.style.width = '100%';
          headerSection.style.top = '0';
          headerSection.style.transition = 'transform 0.3s ease';
        } else {
          // Scrolling up - show sticky header
          headerSection.style.transform = 'translateY(0)';
          headerSection.style.position = 'fixed';
          headerSection.style.width = '100%';
          headerSection.style.top = '0';
        }
      } else {
        headerSection.classList.remove('is-sticky');
        headerSection.style.position = '';
        headerSection.style.transform = '';
      }
      lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
    }, { passive: true });
  }

  // --- Wishlist localStorage Persistent Toggles ---
  document.body.addEventListener('click', (e) => {
    const wishlistBtn = e.target.closest('.card-wishlist-btn');
    if (!wishlistBtn) return;
    
    e.preventDefault();
    const productId = wishlistBtn.dataset.productId;
    if (!productId) return;
    
    let wishlist = JSON.parse(localStorage.getItem('theme-wishlist') || '[]');
    const index = wishlist.indexOf(productId);
    
    if (index > -1) {
      wishlist.splice(index, 1);
      wishlistBtn.classList.remove('is-active');
      wishlistBtn.querySelector('svg').style.fill = 'none';
      wishlistBtn.querySelector('svg').style.stroke = 'var(--color-luxury-text)';
    } else {
      wishlist.push(productId);
      wishlistBtn.classList.add('is-active');
      wishlistBtn.querySelector('svg').style.fill = '#FF4B4B';
      wishlistBtn.querySelector('svg').style.stroke = '#FF4B4B';
    }
    
    localStorage.setItem('theme-wishlist', JSON.stringify(wishlist));
    updateHeaderWishlistCount();
  });

  // Function to update header wishlist count badge
  function updateHeaderWishlistCount() {
    const wishlist = JSON.parse(localStorage.getItem('theme-wishlist') || '[]');
    const bubble = document.querySelector('#wishlist-icon-bubble .wishlist-count-bubble');
    const text = document.getElementById('wishlist-count-text');
    if (bubble && text) {
      text.textContent = wishlist.length;
      if (wishlist.length > 0) {
        bubble.classList.remove('hidden');
      } else {
        bubble.classList.add('hidden');
      }
    }
  }

  // Restore wishlist buttons state on load
  const wishlist = JSON.parse(localStorage.getItem('theme-wishlist') || '[]');
  document.querySelectorAll('.card-wishlist-btn').forEach(btn => {
    const productId = btn.dataset.productId;
    if (wishlist.includes(productId)) {
      btn.classList.add('is-active');
      btn.querySelector('svg').style.fill = '#FF4B4B';
      btn.querySelector('svg').style.stroke = '#FF4B4B';
    }
  });
  updateHeaderWishlistCount();

  // --- Dynamic Color Swatches in Cards ---
  document.body.addEventListener('click', (e) => {
    const swatch = e.target.closest('.card-swatches__item');
    if (!swatch) return;
    
    e.preventDefault();
    const cardWrapper = swatch.closest('.card-wrapper');
    if (!cardWrapper) return;
    
    // Toggle active swatch visual style
    const siblingSwatches = swatch.parentNode.querySelectorAll('.card-swatches__item');
    siblingSwatches.forEach(s => s.classList.remove('is-active'));
    swatch.classList.add('is-active');
    
    // Update card main image if a swatch image url is specified
    const targetImageUrl = swatch.dataset.variantImage;
    const cardImage = cardWrapper.querySelector('.card__media img');
    if (targetImageUrl && cardImage) {
      cardImage.src = targetImageUrl;
      cardImage.srcset = targetImageUrl; // Override responsive srcset for simplicity
    }
  });

  // --- Sticky mobile purchase bar toggle ---
  const buyPanel = document.querySelector('.product-form__buttons');
  const stickyMobileBar = document.querySelector('.product-sticky-bar');
  
  if (buyPanel && stickyMobileBar && window.innerWidth < 750) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          stickyMobileBar.classList.remove('is-active');
        } else {
          // Show sticky bar when primary add-to-cart scroll has passed viewport
          if (window.scrollY > entry.boundingClientRect.top + window.scrollY) {
            stickyMobileBar.classList.add('is-active');
          } else {
            stickyMobileBar.classList.remove('is-active');
          }
        }
      });
    }, { threshold: 0 });
    
    observer.observe(buyPanel);
  }

  // --- Free Shipping Progress Calculator ---
  window.updateFreeShippingProgress = (cartTotal) => {
    const progressBar = document.querySelector('.shipping-progress__bar');
    const messageText = document.querySelector('.shipping-progress__message');
    if (!progressBar || !messageText) return;
    
    // Define shipping threshold in cents (e.g. $100.00 = 10000 cents)
    const threshold = 10000; 
    const currentTotal = cartTotal || 0;
    
    const percentage = Math.min((currentTotal / threshold) * 100, 100);
    progressBar.style.width = `${percentage}%`;
    
    if (percentage >= 100) {
      messageText.innerHTML = '🎉 You qualify for <strong>FREE SHIPPING!</strong>';
    } else {
      const remainingCents = threshold - currentTotal;
      // Simple currency formatting (assuming local currency string format)
      const remainingFormatted = (remainingCents / 100).toLocaleString('en-US', {
        style: 'currency',
        currency: window.Shopify?.currency?.active || 'USD'
      });
      messageText.innerHTML = `You are only <strong>${remainingFormatted}</strong> away from free shipping.`;
    }
  };

  // Listen to Shopify Cart API changes
  document.addEventListener('cart:updated', (e) => {
    if (e.detail && e.detail.cart) {
      window.updateFreeShippingProgress(e.detail.cart.total_price);
    }
  });
  
  // Initial check on load
  const initialTotal = document.querySelector('.cart-drawer__footer [data-cart-total]')?.dataset.cartTotal;
  if (initialTotal) {
    window.updateFreeShippingProgress(parseInt(initialTotal, 10));
  }
});
