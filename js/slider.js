// Slider logic for product carousel
document.addEventListener('DOMContentLoaded', () => {
  const sliderTrack = document.querySelector('.slider-track');
  const leftArrow = document.querySelector('.slider-arrow.left');
  const rightArrow = document.querySelector('.slider-arrow.right');

  if (!sliderTrack || !leftArrow || !rightArrow) return;

  let currentIndex = 0;

  function getVisibleCount() {
    if (window.innerWidth <= 700) return 1;
    if (window.innerWidth <= 1024) return 2;
    return 4;
  }

  function updateSlider() {
    const visibleCount = getVisibleCount();
    const maxIndex = Math.max(0, sliderTrack.children.length - visibleCount);
    if (currentIndex > maxIndex) currentIndex = maxIndex;
    const card = sliderTrack.querySelector('.product-card');
    if (!card) return;
    const cardWidth = card.offsetWidth;
    const gap = parseInt(getComputedStyle(sliderTrack).gap) || 32;
    const translateX = -(currentIndex * (cardWidth + gap));
    sliderTrack.style.transform = `translateX(${translateX}px)`;
    leftArrow.disabled = currentIndex === 0;
    rightArrow.disabled = currentIndex >= maxIndex;
  }

  leftArrow.addEventListener('click', () => {
    if (currentIndex > 0) {
      currentIndex--;
      updateSlider();
    }
  });

  rightArrow.addEventListener('click', () => {
    const visibleCount = getVisibleCount();
    const maxIndex = Math.max(0, sliderTrack.children.length - visibleCount);
    if (currentIndex < maxIndex) {
      currentIndex++;
      updateSlider();
    }
  });

  window.addEventListener('resize', updateSlider);
  updateSlider();
});
