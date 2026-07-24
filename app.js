// Interactive service details for Audi-inspired Bottom Selector
const SERVICE_DETAILS = {
  consulting: {
    desc: "Ruta estratégica personalizada para alinear tecnología y negocio.",
    targetId: "service-consulting"
  },
  cloud: {
    desc: "Desarrollo de aplicaciones SaaS y migración cloud seguras y escalables.",
    targetId: "service-cloud"
  },
  automation: {
    desc: "Automatización con bots e IA para eliminar tareas administrativas repetitivas.",
    targetId: "service-automation"
  }
};

// Initialize listeners on page load
window.addEventListener('DOMContentLoaded', () => {
  setupScrollListener();
  setupBottomBarScrollTrigger();
  setupTimelineObserver();
  initHeroCanvas(); // Start interactive background constellation

  // Check for chat test mode query param
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('chat') === 'true') {
    setTimeout(() => {
      toggleChatbot();
      handleChatReply('planes');
    }, 100);
  }
});

// 1. Header scroll trigger (Nike-inspired)
function setupScrollListener() {
  const navbar = document.getElementById('navbar');
  
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });
}

// 2. Audi-inspired bottom bar display on scroll
function setupBottomBarScrollTrigger() {
  const bottomBar = document.getElementById('audi-selector-bar');
  
  window.addEventListener('scroll', () => {
    // Show bottom bar when user scrolls past 500px (i.e. past Hero)
    if (window.scrollY > 500) {
      bottomBar.classList.add('show');
    } else {
      bottomBar.classList.remove('show');
    }
  });
}

// Interactive selector click handler
function selectServicePreview(serviceKey) {
  // Highlight clicked button
  const buttons = document.querySelectorAll('.selector-item-btn');
  buttons.forEach(btn => btn.classList.remove('active'));
  
  // Find which button to activate
  const eventTarget = window.event ? window.event.target : null;
  if (eventTarget) {
    eventTarget.classList.add('active');
  } else {
    // Fallback search
    const btnTextMap = { consulting: 'Consultoría', cloud: 'Software y Cloud', automation: 'Automatización' };
    buttons.forEach(btn => {
      if (btn.innerText.includes(btnTextMap[serviceKey])) btn.classList.add('active');
    });
  }

  // Update preview description text
  const previewDesc = document.getElementById('selector-preview-desc');
  const details = SERVICE_DETAILS[serviceKey];
  if (previewDesc && details) {
    previewDesc.innerText = details.desc;
    
    // Smoothly scroll viewport to the target service card
    const targetElement = document.getElementById(details.targetId);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Temporarily highlight the card
      targetElement.style.borderColor = 'var(--color-purple)';
      targetElement.style.boxShadow = '0 0 25px rgba(139, 92, 246, 0.4)';
      setTimeout(() => {
        targetElement.style.borderColor = '';
        targetElement.style.boxShadow = '';
      }, 1500);
    }
  }
}

// 3. Pricing plans monthly/annual toggle
function togglePricing(forceAnnual = null) {
  const toggleBtn = document.getElementById('pricing-toggle');
  const labelMonthly = document.getElementById('label-monthly');
  const labelAnnual = document.getElementById('label-annual');
  
  const priceStartup = document.getElementById('price-startup');
  const priceCorporate = document.getElementById('price-corporate');
  const priceEnterprise = document.getElementById('price-enterprise');

  let isAnnual = toggleBtn.classList.contains('annual');
  if (forceAnnual !== null) isAnnual = !forceAnnual; // invert to trigger toggling correctly

  if (isAnnual) {
    // Switch to Monthly
    toggleBtn.classList.remove('annual');
    labelMonthly.classList.add('active');
    labelAnnual.classList.remove('active');

    priceStartup.innerHTML = `$499<span class="price-period">/mes</span>`;
    priceCorporate.innerHTML = `$1,299<span class="price-period">/mes</span>`;
    priceEnterprise.innerHTML = `$2,999<span class="price-period">/mes</span>`;
  } else {
    // Switch to Annual (20% discount)
    toggleBtn.classList.add('annual');
    labelMonthly.classList.remove('active');
    labelAnnual.classList.add('active');

    priceStartup.innerHTML = `$399<span class="price-period">/mes (facturado anual)</span>`;
    priceCorporate.innerHTML = `$999<span class="price-period">/mes (facturado anual)</span>`;
    priceEnterprise.innerHTML = `$2,399<span class="price-period">/mes (facturado anual)</span>`;
  }
}

// 4. Collapsible FAQ Accordion
function toggleAccordion(button) {
  const faqItem = button.parentElement;
  const isActive = faqItem.classList.contains('active');

  // Close all FAQ items
  document.querySelectorAll('.faq-item').forEach(item => {
    item.classList.remove('active');
    item.querySelector('.faq-panel').style.maxHeight = null;
  });

  if (!isActive) {
    faqItem.classList.add('active');
    const panel = faqItem.querySelector('.faq-panel');
    panel.style.maxHeight = panel.scrollHeight + "px";
  }
}

// 5. Timeline Active scroll effect
function setupTimelineObserver() {
  const timelineItems = document.querySelectorAll('.timeline-item');
  if (timelineItems.length === 0) return;

  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.6 // Element is active when 60% visible
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        timelineItems.forEach(item => item.classList.remove('active'));
        entry.target.classList.add('active');
      }
    });
  }, observerOptions);

  timelineItems.forEach(item => observer.observe(item));
}

// 6. Modal controllers
function openModal(modalId) {
  document.getElementById(modalId).classList.add('active');
  document.body.style.overflow = 'hidden'; // Lock background scrolling
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
  document.body.style.overflow = ''; // Unlock scrolling
}

// Close modals when clicking outside
window.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal')) {
    e.target.classList.remove('active');
    document.body.style.overflow = '';
  }
});

// 7. Form Handlers & LocalStorage
function handleSubscribe(inputId) {
  const emailInput = document.getElementById(inputId);
  if (!emailInput || !emailInput.value) return;

  const email = emailInput.value.trim();
  
  // Save subscription email in localStorage
  let subscriptions = JSON.parse(localStorage.getItem('nexora_subscriptions') || '[]');
  if (!subscriptions.includes(email)) {
    subscriptions.push(email);
    localStorage.setItem('nexora_subscriptions', JSON.stringify(subscriptions));
  }

  showNotification(`¡Suscripción exitosa! Hemos enviado un diagnóstico gratuito a ${email}.`);
  emailInput.value = '';
}

function handleFormSubmit() {
  const name = document.getElementById('support-name').value.trim();
  const email = document.getElementById('support-email').value.trim();
  const message = document.getElementById('support-message').value.trim();

  // Save support ticket mock
  let tickets = JSON.parse(localStorage.getItem('nexora_support_tickets') || '[]');
  tickets.push({ name, email, message, date: new Date().toISOString() });
  localStorage.setItem('nexora_support_tickets', JSON.stringify(tickets));

  showNotification(`¡Mensaje recibido! Gracias ${name}. Nos pondremos en contacto contigo pronto.`);
  
  // Clear inputs
  document.getElementById('support-name').value = '';
  document.getElementById('support-email').value = '';
  document.getElementById('support-message').value = '';
}

function handleLogin() {
  const email = document.getElementById('login-email').value.trim();
  
  // Save mock login state in localStorage
  localStorage.setItem('nexora_user_session', JSON.stringify({ email, loginTime: new Date().toISOString() }));
  
  closeModal('login-modal');
  showNotification(`Bienvenido de nuevo, has iniciado sesión como ${email}.`);
}

// 8. Reusable alert toast notification system
function showNotification(message) {
  const container = document.getElementById('alert-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'alert-toast';
  
  // Check SVG icon inside toast
  toast.innerHTML = `
    <svg viewBox="0 0 24 24" style="width: 16px; height: 16px; fill: currentColor; margin-right: 5px;"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
    <span>${message}</span>
  `;
  container.appendChild(toast);

  // Auto remove toast
  setTimeout(() => {
    toast.classList.add('fade-out');
    toast.addEventListener('transitionend', () => {
      toast.remove();
    });
  }, 4000);
}

// 9. Floating Chatbot Logic
function toggleChatbot() {
  const chatWindow = document.getElementById('chat-window');
  chatWindow.classList.toggle('active');
  
  // Scroll to bottom on open
  if (chatWindow.classList.contains('active')) {
    const chatMessages = document.getElementById('chat-messages');
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
}

function handleChatReply(replyType) {
  const chatMessages = document.getElementById('chat-messages');
  const quickReplies = document.getElementById('chat-quick-replies');
  
  // Define reply texts
  const userTexts = {
    planes: "Quiero saber más sobre los planes de Nexora.",
    asesoria: "Me gustaría solicitar una asesoría digital.",
    whatsapp: "Necesito soporte extra por WhatsApp."
  };
  
  const userText = userTexts[replyType] || "Tengo una pregunta.";
  
  // Append user bubble
  appendChatBubble(userText, 'user');
  
  // Temporarily disable quick replies container layout
  quickReplies.style.pointerEvents = 'none';
  quickReplies.style.opacity = '0.5';
  
  // Bot typing delay animation simulation
  setTimeout(() => {
    let botResponse = "";
    
    if (replyType === 'planes') {
      botResponse = `Ofrecemos 3 planes diseñados a tu medida:<br>
        <div class="chat-card-plan">
          <span class="chat-card-plan-title">Startup</span>
          <span class="chat-card-plan-price">$499 / mes ($399 anual)</span>
          <span>Auditoría inicial y hasta 2 flujos automatizados.</span>
        </div>
        <div class="chat-card-plan">
          <span class="chat-card-plan-title">Corporate</span>
          <span class="chat-card-plan-price">$1,299 / mes ($999 anual)</span>
          <span>Desarrollo SaaS, IA y soporte técnico 24/7.</span>
        </div>
        <div class="chat-card-plan">
          <span class="chat-card-plan-title">Enterprise</span>
          <span class="chat-card-plan-price">$2,999 / mes ($2,399 anual)</span>
          <span>Transformación completa a escala e integración ERP.</span>
        </div>
        <br>¿Te gustaría cotizar alguno en particular?`;
    } else if (replyType === 'asesoria') {
      botResponse = `¡Excelente elección! Ofrecemos un <strong>Diagnóstico Digital Gratuito</strong> para auditar la madurez tecnológica de tus procesos.
        <br><br>
        Para agendarla:<br>
        1. Ingresa tu correo en el banner de la sección de inicio.<br>
        2. O escríbenos a través del formulario de contacto en la sección de Soporte.`;
    } else if (replyType === 'whatsapp') {
      botResponse = `Si tienes una consulta compleja o necesitas soporte extra inmediato, presiona el botón a continuación para hablar directamente con un especialista en nuestro canal de WhatsApp de Soporte:<br>
        <a href="https://wa.me/573000000000?text=Hola%20Nexora,%20necesito%20asesoria%20digital" target="_blank" class="chat-whatsapp-btn">
          <svg viewBox="0 0 24 24"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.81 9.81 0 0 0 12.04 2zm5.72 13.91c-.24.68-1.24 1.24-1.72 1.32-.48.08-.96.16-3.23-.74-2.9-1.15-4.74-4.1-4.9-4.31-.16-.21-1.3-1.73-1.3-3.3 0-1.57.81-2.33 1.09-2.61.28-.28.6-.36.81-.36H9.4c.2 0 .48 0 .73.59.24.6.85 2.09.93 2.25.08.16.14.36.04.56-.1.2-.16.32-.32.51-.16.19-.34.42-.48.57-.16.16-.33.34-.14.67.19.32.85 1.41 1.83 2.29.98.88 1.8-1.17 2.1-1.28.3-.12.59-.08.81.08.21.16 1.37.64 1.61.76.24.12.4.18.46.28.06.12.06.68-.18 1.36z"/></svg>
          Chat de WhatsApp
        </a>`;
    }
    
    appendChatBubble(botResponse, 'bot');
    
    // Restore quick replies
    quickReplies.style.pointerEvents = 'auto';
    quickReplies.style.opacity = '1';
  }, 750);
}

function appendChatBubble(text, sender) {
  const chatMessages = document.getElementById('chat-messages');
  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${sender}`;
  bubble.innerHTML = text;
  chatMessages.appendChild(bubble);
  
  // Smooth scroll to bottom
  chatMessages.scrollTo({
    top: chatMessages.scrollHeight,
    behavior: 'smooth'
  });
}

// 10. Interactive Particle Canvas for Hero Background
function initHeroCanvas() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  
  function resize() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const particles = [];
  const particleCount = 80;
  const connectionDistance = 120;
  const mouse = { x: null, y: null, radius: 180 };

  canvas.parentElement.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });

  canvas.parentElement.addEventListener('mouseleave', () => {
    mouse.x = null;
    mouse.y = null;
  });

  class Particle {
    constructor() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.vx = (Math.random() - 0.5) * 0.8;
      this.vy = (Math.random() - 0.5) * 0.8;
      this.radius = Math.random() * 2.5 + 1.5;
      this.color = Math.random() > 0.5 ? '#2563EB' : '#8B5CF6';
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;

      if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
      if (this.y < 0 || this.y > canvas.height) this.vy *= -1;

      if (mouse.x !== null && mouse.y !== null) {
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < mouse.radius) {
          const force = (mouse.radius - dist) / mouse.radius;
          this.x -= (dx / dist) * force * 0.8;
          this.y -= (dy / dist) * force * 0.8;
        }
      }
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();
    }
  }

  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(p => {
      p.update();
      p.draw();
    });

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const p1 = particles[i];
        const p2 = particles[j];
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < connectionDistance) {
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          const alpha = (1 - dist / connectionDistance) * 0.15;
          ctx.strokeStyle = `rgba(139, 92, 246, ${alpha})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }

      if (mouse.x !== null && mouse.y !== null) {
        const p = particles[i];
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < mouse.radius) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouse.x, mouse.y);
          const alpha = (1 - dist / mouse.radius) * 0.25;
          ctx.strokeStyle = `rgba(37, 99, 235, ${alpha})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(animate);
  }

  animate();
}
