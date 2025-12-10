// Three.js Scene Setup
let scene, camera, renderer, particles, connectionLines = [];
let mouseX = 0, mouseY = 0;
let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;
let scrollY = 0;

// Network nodes for structured grid
let networkNodes = [];
const gridSize = 10;
const spacing = 120;

// Initialize
init();
animate();

function init() {
    // Scene
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0f0f0f, 0.0005);

    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 3000);
    camera.position.z = 600;
    camera.position.y = 100;

    // Renderer
    const canvas = document.getElementById('bg-canvas');
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Create structured network grid
    createNetworkGrid();
    
    // Lights
    const ambientLight = new THREE.AmbientLight(0x303030);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xdc2626, 0.8, 2000);
    pointLight.position.set(0, 200, 400);
    scene.add(pointLight);

    const pointLight2 = new THREE.PointLight(0xfbbf24, 0.4, 2000);
    pointLight2.position.set(-400, -200, 200);
    scene.add(pointLight2);

    // Event Listeners
    document.addEventListener('mousemove', onDocumentMouseMove, false);
    window.addEventListener('resize', onWindowResize, false);
    window.addEventListener('scroll', onScroll, false);
}

function createNetworkGrid() {
    // Create organized grid of nodes
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const colors = [];
    
    for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize; y++) {
            for (let z = 0; z < 4; z++) {
                const posX = (x - gridSize / 2) * spacing + (Math.random() - 0.5) * 20;
                const posY = (y - gridSize / 2) * spacing + (Math.random() - 0.5) * 20;
                const posZ = (z - 1.5) * spacing * 2 + (Math.random() - 0.5) * 20;
                
                vertices.push(posX, posY, posZ);
                networkNodes.push({ 
                    x: posX, 
                    y: posY, 
                    z: posZ,
                    originalY: posY,
                    connections: []
                });
                
                // Red color with slight variation
                const brightness = 0.7 + Math.random() * 0.3;
                colors.push(brightness, 0.1, 0.1);
            }
        }
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 5,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        sizeAttenuation: true
    });

    particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // Create connection lines between nearby nodes
    createConnectionLines();
}

function createConnectionLines() {
    const lineMaterial = new THREE.LineBasicMaterial({
        color: 0xdc2626,
        transparent: true,
        opacity: 0.2,
        linewidth: 1
    });

    for (let i = 0; i < networkNodes.length; i++) {
        const node1 = networkNodes[i];
        
        for (let j = i + 1; j < networkNodes.length; j++) {
            const node2 = networkNodes[j];
            const distance = Math.sqrt(
                Math.pow(node1.x - node2.x, 2) +
                Math.pow(node1.y - node2.y, 2) +
                Math.pow(node1.z - node2.z, 2)
            );
            
            // Connect nodes that are close to each other - more connections
            if (distance < spacing * 1.6) {
                const geometry = new THREE.BufferGeometry();
                const positions = new Float32Array([
                    node1.x, node1.y, node1.z,
                    node2.x, node2.y, node2.z
                ]);
                geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
                
                const line = new THREE.Line(geometry, lineMaterial);
                const lineObj = {
                    line: line,
                    geometry: geometry,
                    positions: positions,
                    node1Index: i,
                    node2Index: j,
                    opacity: 0.15 + Math.random() * 0.1
                };
                connectionLines.push(lineObj);
                scene.add(line);
                
                // Store connection references
                node1.connections.push(lineObj);
                node2.connections.push(lineObj);
            }
        }
    }
}

function animate() {
    requestAnimationFrame(animate);
    render();
}

function render() {
    const time = Date.now() * 0.00005;

    // Update particle positions based on scroll
    if (particles) {
        const positions = particles.geometry.attributes.position.array;
        
        for (let i = 0; i < networkNodes.length; i++) {
            const node = networkNodes[i];
            const index = i * 3;
            
            // Wave animation based on scroll
            const wave = Math.sin(time * 2 + node.x * 0.02 + scrollY * 0.005) * 15;
            const scrollOffset = scrollY * 0.1;
            
            positions[index + 1] = node.originalY + wave - scrollOffset;
        }
        
        particles.geometry.attributes.position.needsUpdate = true;
        particles.rotation.y = time * 0.05 + scrollY * 0.0002;
    }

    // Update connection lines to follow nodes
    connectionLines.forEach((lineObj, index) => {
        const node1 = networkNodes[lineObj.node1Index];
        const node2 = networkNodes[lineObj.node2Index];
        
        const positions = lineObj.geometry.attributes.position.array;
        const wave1 = Math.sin(time * 2 + node1.x * 0.02 + scrollY * 0.005) * 15;
        const wave2 = Math.sin(time * 2 + node2.x * 0.02 + scrollY * 0.005) * 15;
        const scrollOffset = scrollY * 0.1;
        
        positions[0] = node1.x;
        positions[1] = node1.originalY + wave1 - scrollOffset;
        positions[2] = node1.z;
        positions[3] = node2.x;
        positions[4] = node2.originalY + wave2 - scrollOffset;
        positions[5] = node2.z;
        
        lineObj.geometry.attributes.position.needsUpdate = true;
        
        // Pulsing effect
        const pulseSpeed = 0.5 + (index % 5) * 0.1;
        const pulse = Math.sin(time * pulseSpeed + index + scrollY * 0.01) * 0.5 + 0.5;
        lineObj.line.material.opacity = lineObj.opacity * (0.4 + pulse * 0.6);
    });

    // Subtle camera movement based on mouse and scroll
    camera.position.x += (mouseX * 0.3 - camera.position.x) * 0.02;
    camera.position.y += ((-mouseY * 0.3 + 100 - scrollY * 0.3) - camera.position.y) * 0.02;
    camera.lookAt(0, -scrollY * 0.3, 0);

    renderer.render(scene, camera);
}

function onDocumentMouseMove(event) {
    mouseX = (event.clientX - windowHalfX) * 0.3;
    mouseY = (event.clientY - windowHalfY) * 0.3;
}

function onScroll() {
    scrollY = window.pageYOffset;
}

function onWindowResize() {
    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Smooth Scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

// Mobile Menu Toggle
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');

navToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    navToggle.classList.toggle('active');
});

// Close mobile menu when clicking on a link
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        // Don't close menu if clicking on dropdown parent
        if (link.nextElementSibling?.classList.contains('dropdown-menu')) {
            e.preventDefault();
            link.parentElement.classList.toggle('active');
        } else {
            navMenu.classList.remove('active');
            navToggle.classList.remove('active');
        }
    });
});

// Handle dropdown submenu toggle on mobile
document.querySelectorAll('.dropdown-submenu > a').forEach(link => {
    link.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
            e.preventDefault();
            link.parentElement.classList.toggle('active');
        }
    });
});

// Close dropdowns when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-item-dropdown') && !e.target.closest('.dropdown-submenu')) {
        document.querySelectorAll('.nav-item-dropdown.active, .dropdown-submenu.active').forEach(item => {
            item.classList.remove('active');
        });
    }
});

// FAQ Accordion
document.querySelectorAll('.faq-question').forEach(question => {
    question.addEventListener('click', () => {
        const faqItem = question.parentElement;
        const isActive = faqItem.classList.contains('active');
        
        // Close all other FAQ items
        document.querySelectorAll('.faq-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Toggle current item
        if (!isActive) {
            faqItem.classList.add('active');
        }
    });
});

// Navbar Scroll Effect
let lastScroll = 0;
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
    
    lastScroll = currentScroll;
});

// Counter Animation
function animateCounter(element, target, duration = 2000) {
    let current = 0;
    const increment = target / (duration / 16);
    const isDecimal = target % 1 !== 0;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        
        if (isDecimal) {
            element.textContent = current.toFixed(1);
        } else {
            element.textContent = Math.floor(current).toLocaleString();
        }
    }, 16);
}

// Intersection Observer for animations
const observerOptions = {
    threshold: 0.2,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            
            // Animate counters when stats section is visible
            if (entry.target.classList.contains('stat-number')) {
                const target = parseInt(entry.target.getAttribute('data-target'));
                animateCounter(entry.target, target);
                observer.unobserve(entry.target);
            }
        }
    });
}, observerOptions);

// Observe all animated elements
document.querySelectorAll('.service-card, .tech-item, .feature-item, .stat-number, .gallery-item, .partner-item').forEach(el => {
    observer.observe(el);
});

// Carousel Functionality
const carouselTrack = document.querySelector('.carousel-track');
const carouselSlides = document.querySelectorAll('.gallery-slide');
const prevBtn = document.querySelector('.prev-btn');
const nextBtn = document.querySelector('.next-btn');
const indicatorsContainer = document.querySelector('.carousel-indicators');

let currentSlideIndex = 0;
const totalSlides = carouselSlides.length;

// Create indicator dots
carouselSlides.forEach((_, index) => {
    const indicator = document.createElement('div');
    indicator.classList.add('indicator');
    if (index === 0) indicator.classList.add('active');
    indicator.addEventListener('click', () => goToSlide(index));
    indicatorsContainer.appendChild(indicator);
});

const indicators = document.querySelectorAll('.indicator');

function updateCarousel() {
    const slideWidth = carouselSlides[0].clientWidth;
    carouselTrack.style.transform = `translateX(-${currentSlideIndex * slideWidth}px)`;
    
    // Update indicators
    indicators.forEach((indicator, index) => {
        indicator.classList.toggle('active', index === currentSlideIndex);
    });
    
    // Update button states
    prevBtn.style.opacity = currentSlideIndex === 0 ? '0.5' : '1';
    nextBtn.style.opacity = currentSlideIndex === totalSlides - 1 ? '0.5' : '1';
}

function goToSlide(index) {
    if (index >= 0 && index < totalSlides) {
        currentSlideIndex = index;
        updateCarousel();
    }
}

function nextSlide() {
    if (currentSlideIndex < totalSlides - 1) {
        currentSlideIndex++;
        updateCarousel();
    }
}

function prevSlide() {
    if (currentSlideIndex > 0) {
        currentSlideIndex--;
        updateCarousel();
    }
}

prevBtn.addEventListener('click', prevSlide);
nextBtn.addEventListener('click', nextSlide);

// Auto-play carousel
let autoPlayInterval = setInterval(() => {
    if (currentSlideIndex < totalSlides - 1) {
        nextSlide();
    } else {
        currentSlideIndex = 0;
        updateCarousel();
    }
}, 5000);

// Pause auto-play on hover
const carouselContainer = document.querySelector('.gallery-carousel');
carouselContainer.addEventListener('mouseenter', () => {
    clearInterval(autoPlayInterval);
});

carouselContainer.addEventListener('mouseleave', () => {
    autoPlayInterval = setInterval(() => {
        if (currentSlideIndex < totalSlides - 1) {
            nextSlide();
        } else {
            currentSlideIndex = 0;
            updateCarousel();
        }
    }, 5000);
});

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') prevSlide();
    if (e.key === 'ArrowRight') nextSlide();
});

// Touch support for mobile
let touchStartX = 0;
let touchEndX = 0;

carouselTrack.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
});

carouselTrack.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].clientX;
    handleSwipe();
});

function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;
    
    if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
            nextSlide();
        } else {
            prevSlide();
        }
    }
}

// Update carousel on window resize
window.addEventListener('resize', updateCarousel);


// Glitch Effect on Hero Title - reduced frequency
const glitchElement = document.querySelector('.glitch');
setInterval(() => {
    if (Math.random() > 0.98) {
        glitchElement.classList.add('glitch-active');
        setTimeout(() => {
            glitchElement.classList.remove('glitch-active');
        }, 100);
    }
}, 200);

// Parallax Effect
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const heroContent = document.querySelector('.hero-content');
    
    if (heroContent) {
        heroContent.style.transform = `translateY(${scrolled * 0.5}px)`;
        heroContent.style.opacity = 1 - (scrolled / 700);
    }
});

// Cursor Trail Effect
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
canvas.style.position = 'fixed';
canvas.style.top = '0';
canvas.style.left = '0';
canvas.style.pointerEvents = 'none';
canvas.style.zIndex = '9999';
document.body.appendChild(canvas);

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const particles_trail = [];
const particleCount = 20;

class TrailParticle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 3 + 1;
        this.speedX = Math.random() * 2 - 1;
        this.speedY = Math.random() * 2 - 1;
        this.life = 50;
    }
    
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life -= 1;
        if (this.size > 0.1) this.size -= 0.05;
    }
    
    draw() {
        ctx.fillStyle = `rgba(220, 38, 38, ${this.life / 50})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

window.addEventListener('mousemove', (e) => {
    for (let i = 0; i < 1; i++) {
        particles_trail.push(new TrailParticle(e.clientX, e.clientY));
    }
});

function animateTrail() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    for (let i = particles_trail.length - 1; i >= 0; i--) {
        particles_trail[i].update();
        particles_trail[i].draw();
        
        if (particles_trail[i].life <= 0) {
            particles_trail.splice(i, 1);
        }
    }
    
    requestAnimationFrame(animateTrail);
}

animateTrail();

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// Button Hover Effects
document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('mouseenter', function(e) {
        const x = e.pageX - this.offsetLeft;
        const y = e.pageY - this.offsetTop;
        
        const ripple = document.createElement('span');
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.classList.add('ripple');
        
        this.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    });
});

// Loading Animation
window.addEventListener('load', () => {
    document.body.classList.add('loaded');
});