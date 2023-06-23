
// Manage selected image
const imageInput = document.getElementById("flower-input-image")
imageInput.onchange = () => {
  if (imageInput.files.length > 0) {
    closeAllModals()

    const fileReader = new FileReader();
    const target = document.getElementById("flower-preview-image")
    fileReader.onload = function(e) {
      target.src = this.result;
      target.style.visibility = "visible"
    };
    fileReader.readAsDataURL(imageInput.files[0]);
    document.getElementById("flower-input-album-image").value = null
    document.getElementById("flower-preview-nav").style.visibility = "visible"
  }
}

const imageAlbumInput = document.getElementById("flower-input-album-image")
imageAlbumInput.onchange = () => {
  if (imageAlbumInput.files.length > 0) {
    closeAllModals()

    const fileReader = new FileReader();
    const target = document.getElementById("flower-preview-image")
    fileReader.onload = function(e) {
      target.src = this.result;
      target.style.visibility = "visible"
    };
    fileReader.readAsDataURL(imageAlbumInput.files[0]);
    document.getElementById("flower-input-image").value = null
    document.getElementById("flower-preview-nav").style.visibility = "visible"
  }
}


// Modal view control
function openModal($el) {
  $el.classList.add('is-active');
}

function closeModal($el) {
  $el.classList.remove('is-active');
}

function closeAllModals() {
  (document.querySelectorAll('.modal') || []).forEach(($modal) => {
    closeModal($modal);
  });
}

// Add a click event on buttons to open a specific modal
(document.querySelectorAll('.js-modal-trigger') || []).forEach(($trigger) => {
  const modal = $trigger.dataset.target;
  const $target = document.getElementById(modal);

  $trigger.addEventListener('click', () => {
    openModal($target);
  });
});

// Add a click event on various child elements to close the parent modal
(document.querySelectorAll('.modal-background, .modal-close, .modal-card-head .delete, .modal-card-foot .button') || []).forEach(($close) => {
  const $target = $close.closest('.modal');

  $close.addEventListener('click', () => {
    closeModal($target);
  });
});

// Add a keyboard event to close all modals
document.addEventListener('keydown', (event) => {
  const e = event || window.event;

  if (e.keyCode === 27) { // Escape key
    closeAllModals();
  }
});