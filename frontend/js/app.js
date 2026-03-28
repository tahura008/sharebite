const isLocalFile = window.location.protocol === 'file:';
const HOST = window.location.hostname || 'localhost';
const BASE_URL = isLocalFile ? 'http://localhost:5003' : '';
const API_URL = BASE_URL + '/api/items';

let slideIndex = 0;
function showSlide() {
    let slides = document.querySelectorAll(".slide"); // ✅ moved here

    if (slides.length === 0) return; // safety check

    slides.forEach((slide) => {
        slide.classList.remove("active");
    });

    slideIndex++;
    if (slideIndex >= slides.length) {
        slideIndex = 0;
    }

    slides[slideIndex].classList.add("active");
}
setInterval(showSlide, 1500); // change every 3 sec

async function fetchItems() {
  try {
    const res = await fetch(API_URL + '/all');
    if (!res.ok) throw new Error('Failed to fetch');
    return await res.json();
  } catch (err) {
    console.error('Error fetching items', err);
    return [];
  }
}

function escapeHtml(s) { 
  if (!s) return ''; 
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); 
}

async function renderItems() {
  const list = document.getElementById('itemsList');
  if (!list) return;
  const allItems = await fetchItems();
  const items = allItems.filter(i => !i.requested);
  
  list.textContent = '';
  
  const formWrap = document.getElementById('formWrapper');
  const isIndexPage = window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/');
  if (formWrap && !formWrap.classList.contains('d-none') && isIndexPage) return;

  if (items.length === 0) {
    const col = document.createElement('div');
    col.className = 'col-12';
    col.innerHTML = `
      <div class="card shadow-sm border-0 text-center py-5" style="border-radius: 20px; background: rgba(255,255,255,0.8);">
        <i class="bi bi-emoji-smile text-success display-1 mb-3"></i>
        <h4 class="fw-bold text-dark mb-2">You're all caught up!</h4>
        <p class="text-muted mb-4">There is currently no surplus food available.<br>Check back later!</p>
      </div>
    `;
    list.appendChild(col);
    return;
  }

  items.forEach(it => {
    const col = document.createElement('div'); 
    col.className = 'col-12 mb-3';

    const card = document.createElement('div'); 
    card.className = 'card shadow-sm border-0';
    
    const body = document.createElement('div'); 
    body.className = 'card-body d-flex align-items-center';

    // Image Container with fixed sizing for the list
    if (it.image) {
      const thumb = document.createElement('img');
      thumb.src = it.image;
      // 'item-img' class is key here for your CSS sizing
      thumb.className = 'item-img rounded me-3'; 
      thumb.style.width = '120px';
      thumb.style.height = '120px';
      thumb.style.objectFit = 'cover';
      body.appendChild(thumb);
    }

    const info = document.createElement('div');
    info.className = 'flex-grow-1';
    info.innerHTML = `
      <h6 class="fw-bold mb-1">${escapeHtml(it.title)}</h6>
      <p class="small text-muted mb-1">${escapeHtml(it.description)}</p>
      <p class="small mb-0"><strong>Qty:</strong> ${it.quantity} | <strong>Expires:</strong> ${it.expiry || 'N/A'}</p>
      <p class="small text-secondary mb-0"><i class="bi bi-geo-alt"></i> ${escapeHtml(it.address)}</p>
    `;

    const right = document.createElement('div');
    const btn = document.createElement('button');
    btn.className = 'btn btn-success btn-sm rounded-pill px-3';
    btn.textContent = 'Request';
    const id = it._id || it.id;
    btn.addEventListener('click', () => onRequest(id));
    right.appendChild(btn);

    body.appendChild(info);
    body.appendChild(right);
    card.appendChild(body);
    col.appendChild(card);
    list.appendChild(col);
  });
}

async function onRequest(id) {
  const userJson = localStorage.getItem('currentUser');
  const currentUser = userJson ? JSON.parse(userJson) : null;
  const requesterEmail = currentUser ? currentUser.email : 'guest';

  try {
    const token = localStorage.getItem('authToken');
    const res = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ requested: true, requestedBy: requesterEmail })
    });
    
    if (res.ok) {
        const it = await res.json();
        await renderItems();
        const modalBody = document.getElementById('modalBody');
        if (modalBody) {
            modalBody.innerHTML = `
                <p><strong>Contact ${escapeHtml(it.owner)}:</strong> ${escapeHtml(it.contact)}</p>
                <p><strong>Pickup:</strong> ${escapeHtml(it.address)}</p>
                <hr>
                <p class="text-success">Thanks for requesting — please coordinate pickup.</p>
            `;
        }
        const modalEl = document.getElementById('requestModal');
        if (modalEl) {
            const myModal = new bootstrap.Modal(modalEl);
            myModal.show();
        }
    } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || 'Error requesting item.');
    }
  } catch (err) {
      console.error(err);
      alert('Error requesting item.');
  }
}

// UI Navigation Helpers
function showContent(showForm) {
  const home = document.getElementById('homeSection');
  const content = document.getElementById('contentSection');
  const formWrap = document.getElementById('formWrapper');
  if (home) home.classList.add('d-none');
  if (content) content.classList.remove('d-none');
  
  if (formWrap) {
    showForm ? formWrap.classList.remove('d-none') : formWrap.classList.add('d-none');
  }
  renderItems();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showHome() {
  const home = document.getElementById('homeSection');
  const content = document.getElementById('contentSection');
  if (home) home.classList.remove('d-none');
  if (content) content.classList.add('d-none');
}

// Initializing the App
document.addEventListener('DOMContentLoaded', () => {
  const donateForm = document.getElementById('donateForm');
  const imageInput = document.getElementById('image');
  const previewDiv = document.getElementById('imagePreview');

  // 1. LIVE IMAGE PREVIEW LOGIC
  if (imageInput && previewDiv) {
    imageInput.addEventListener('change', function() {
      const file = this.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          // Preview is natural size (max-width 100% to avoid screen overflow)
          previewDiv.innerHTML = `<img src="${e.target.result}" style="max-width: 100%; height: auto; border-radius: 8px; margin-top: 10px;">`;
        };
        reader.readAsDataURL(file);
      } else {
        previewDiv.innerHTML = '';
      }
    });
  }

  // 2. FORM SUBMISSION
  if (donateForm) {
    donateForm.addEventListener('submit', async e => {
      e.preventDefault();
      
      let dataUrl = null;
      if (imageInput && imageInput.files[0]) {
        dataUrl = await new Promise(resolve => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(imageInput.files[0]);
        });
      }

      const userJson = localStorage.getItem('currentUser');
      const currentUser = userJson ? JSON.parse(userJson) : null;

      const item = {
        title: document.getElementById('title').value.trim(),
        description: document.getElementById('description').value.trim(),
        quantity: document.getElementById('quantity').value || '1',
        expiry: document.getElementById('expiry').value,
        address: document.getElementById('address').value.trim(),
        owner: document.getElementById('owner').value.trim(),
        contact: document.getElementById('contact').value.trim(),
        userEmail: currentUser ? currentUser.email : 'guest',
        image: dataUrl,
      };

      try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(API_URL, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(item)
        });
        
        if (res.ok) {
          donateForm.reset();
          if (previewDiv) previewDiv.innerHTML = '';
          alert('Food donated successfully!');
          window.location.href = 'available.html';
        } else {
          const errData = await res.json().catch(() => ({}));
          console.error('Server Error:', res.status, errData);
          alert(errData.error || 'Failed to donate food. Maybe the image is too large?');
        }
      } catch (err) {
        console.error('Fetch Error:', err);
        alert('Make sure backend is running and image size is reasonable.');
      }
    });
  }

  // Wire up navigation buttons
  const navIds = ['btnView', 'btnDonate', 'navBtnView', 'navBtnDonate', 'btnBackHome'];
  navIds.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('click', () => {
      if (id.toLowerCase().includes('view')) showContent(false);
      if (id.toLowerCase().includes('donate')) showContent(true);
      if (id === 'btnBackHome') showHome();
    });
  });

  renderItems();
});