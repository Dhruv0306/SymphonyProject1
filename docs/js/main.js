document.addEventListener('DOMContentLoaded', function () {
    console.log('Initializing Symphony Logo Detection Documentation...');
    // Mobile menu toggle
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.querySelector('.sidebar');

    if (menuToggle) {
        menuToggle.addEventListener('click', function () {
            const isActive = sidebar.classList.toggle('active');
            menuToggle.setAttribute('aria-expanded', isActive);

            // Trap focus in sidebar when open
            if (isActive) {
                const firstLink = sidebar.querySelector('.nav-links a');
                if (firstLink) firstLink.focus();
            }
        });
    }

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', function (event) {
        if (window.innerWidth <= 768) {
            const isClickInside = sidebar.contains(event.target) || menuToggle.contains(event.target);
            if (!isClickInside && sidebar.classList.contains('active')) {
                sidebar.classList.remove('active');
                menuToggle.setAttribute('aria-expanded', 'false');
            }
        }
    });

    // Close sidebar with Escape key
    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && sidebar.classList.contains('active')) {
            sidebar.classList.remove('active');
            menuToggle.setAttribute('aria-expanded', 'false');
            menuToggle.focus();
        }
    });

    // Enhanced search functionality with highlighting and clear button
    const searchInput = document.querySelector('.search-box input');
    const searchClear = document.querySelector('.search-clear');

    if (searchInput) {
        // Debounced search
        let searchTimeout;
        searchInput.addEventListener('input', function (e) {
            clearTimeout(searchTimeout);
            const searchTerm = e.target.value.toLowerCase();

            // Show/hide clear button
            if (searchTerm.length > 0) {
                searchClear.style.display = 'block';
            } else {
                searchClear.style.display = 'none';
            }

            searchTimeout = setTimeout(() => {
                performSearch(searchTerm);
            }, 300);
        });

        // Clear search functionality
        if (searchClear) {
            searchClear.addEventListener('click', function () {
                searchInput.value = '';
                searchClear.style.display = 'none';
                performSearch('');
                searchInput.focus();
            });
        }
    }

    function performSearch(searchTerm) {
        const contentSections = document.querySelectorAll('.content-section');

        // Reset previous highlights
        document.querySelectorAll('.search-highlight').forEach(el => {
            el.outerHTML = el.innerHTML;
        });

        if (searchTerm.length < 2) {
            contentSections.forEach(section => {
                section.style.display = 'block';
            });
            return;
        }

        let hasResults = false;
        contentSections.forEach(section => {
            const text = section.textContent.toLowerCase();
            if (text.includes(searchTerm)) {
                section.style.display = 'block';
                hasResults = true;

                // Highlight matching text
                highlightText(section, searchTerm);
            } else {
                section.style.display = 'none';
            }
        });

        // Show no results message
        if (!hasResults && searchTerm.length >= 2) {
            showNoResultsMessage();
        } else {
            hideNoResultsMessage();
        }
    }

    function showNoResultsMessage() {
        let noResultsMsg = document.getElementById('no-results-message');
        if (!noResultsMsg) {
            noResultsMsg = document.createElement('div');
            noResultsMsg.id = 'no-results-message';
            noResultsMsg.className = 'no-results';
            noResultsMsg.innerHTML = '<i class="fas fa-search"></i><p>No results found. Try different keywords.</p>';
            document.querySelector('.main-content').appendChild(noResultsMsg);
        }
        noResultsMsg.style.display = 'block';
    }

    function hideNoResultsMessage() {
        const noResultsMsg = document.getElementById('no-results-message');
        if (noResultsMsg) {
            noResultsMsg.style.display = 'none';
        }
    }

    // Function to highlight search terms
    function highlightText(element, term) {
        if (element.nodeType === 3) { // Text node
            const text = element.nodeValue;
            const lowerText = text.toLowerCase();
            const index = lowerText.indexOf(term);

            if (index >= 0) {
                const before = text.substring(0, index);
                const match = text.substring(index, index + term.length);
                const after = text.substring(index + term.length);

                const span = document.createElement('span');
                span.className = 'search-highlight';
                span.style.backgroundColor = 'yellow';
                span.textContent = match;

                const fragment = document.createDocumentFragment();
                fragment.appendChild(document.createTextNode(before));
                fragment.appendChild(span);
                fragment.appendChild(document.createTextNode(after));

                element.parentNode.replaceChild(fragment, element);
                return true;
            }
        } else if (element.nodeType === 1) { // Element node
            // Skip script and style elements
            if (element.tagName === 'SCRIPT' || element.tagName === 'STYLE') {
                return false;
            }

            // Process child nodes
            Array.from(element.childNodes).forEach(child => {
                highlightText(child, term);
            });
        }
        return false;
    }

    // Code copy functionality
    function copyCode(button) {
        const codeBlock = button.parentElement.querySelector('code');
        const text = codeBlock.textContent;

        navigator.clipboard.writeText(text).then(() => {
            const originalIcon = button.innerHTML;
            button.innerHTML = '<i class="fas fa-check"></i>';

            setTimeout(() => {
                button.innerHTML = originalIcon;
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy text:', err);
        });
    }

    // Make copyCode function globally available
    window.copyCode = copyCode;

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });

                // Update active state in navigation
                document.querySelectorAll('.nav-links a').forEach(link => {
                    link.classList.remove('active');
                });
                this.classList.add('active');

                // Close mobile menu after clicking
                if (window.innerWidth <= 768) {
                    sidebar.classList.remove('active');
                }
            }
        });
    });

    // Highlight current section based on scroll position
    let ticking = false;
    window.addEventListener('scroll', function () {
        if (!ticking) {
            window.requestAnimationFrame(function () {
                highlightCurrentSection();
                ticking = false;
            });
            ticking = true;
        }
    });

    function highlightCurrentSection() {
        const sections = document.querySelectorAll('.content-section');
        const navLinks = document.querySelectorAll('.nav-links a');

        let currentSection = '';

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (window.scrollY >= sectionTop - 100) {
                currentSection = '#' + section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === currentSection) {
                link.classList.add('active');
            }
        });
    }

    // Add WebSocket indicator to WebSocket endpoints
    document.querySelectorAll('.api-overview code').forEach(code => {
        const text = code.textContent;
        if (text.includes('/ws/')) {
            const badge = document.createElement('span');
            badge.className = 'version-badge';
            badge.style.backgroundColor = 'var(--websocket-color)';
            badge.textContent = 'WS';
            code.appendChild(badge);
        }
    });

    // Add technology version badges
    const techVersions = {
        'FastAPI': '0.115.12',
        'React': '19.1.0',
        'Material-UI': '7.1.0',
        'Ultralytics': '8.3.151',
        'Torch': '2.7.1',
        'SlowAPI': '0.1.9'
    };

    Object.entries(techVersions).forEach(([tech, version]) => {
        document.querySelectorAll('li').forEach(li => {
            if (li.textContent.includes(tech) && !li.querySelector('.version-badge')) {
                const badge = document.createElement('span');
                badge.className = 'version-badge';
                badge.textContent = `v${version}`;
                badge.style.marginLeft = '0.5rem';
                li.appendChild(badge);
            }
        });
    });

    // Initialize API method tags
    document.querySelectorAll('.api-overview li').forEach(item => {
        const codeText = item.querySelector('code').textContent;
        let method = 'GET';

        if (codeText.includes('POST')) method = 'POST';
        else if (codeText.includes('WS')) method = 'WS';
        else if (codeText.includes('GET')) method = 'GET';

        const methodTag = document.createElement('span');
        methodTag.className = `api-method ${method.toLowerCase()}`;
        methodTag.textContent = method;

        if (method === 'WS') {
            methodTag.style.backgroundColor = 'var(--websocket-color)';
        }

        item.insertBefore(methodTag, item.firstChild);
    });

    // Add copy button to all code blocks
    document.querySelectorAll('pre code').forEach(codeBlock => {
        const copyButton = document.createElement('button');
        copyButton.className = 'copy-btn';
        copyButton.innerHTML = '<i class="fas fa-copy"></i>';
        copyButton.addEventListener('click', () => {
            navigator.clipboard.writeText(codeBlock.textContent)
                .then(() => {
                    copyButton.innerHTML = '<i class="fas fa-check"></i>';
                    setTimeout(() => {
                        copyButton.innerHTML = '<i class="fas fa-copy"></i>';
                    }, 2000);
                })
                .catch(err => {
                    console.error('Failed to copy code: ', err);
                });
        });

        // Find the parent pre element and make it relative positioned
        const preElement = codeBlock.parentElement;
        if (preElement && preElement.tagName === 'PRE') {
            preElement.style.position = 'relative';
            preElement.appendChild(copyButton);
        }
    });

    // Add model sequence indicators
    document.querySelectorAll('.model').forEach((model, index) => {
        const sequenceNumber = document.createElement('div');
        sequenceNumber.className = 'model-sequence';
        sequenceNumber.textContent = index + 1;
        sequenceNumber.style.cssText = `
            position: absolute;
            top: -10px;
            left: -10px;
            width: 24px;
            height: 24px;
            background: var(--primary-color);
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
        `;
        model.style.position = 'relative';
        model.appendChild(sequenceNumber);
    });

    // Handle SVG responsive behavior
    function handleSVGResize() {
        document.querySelectorAll('.responsive-svg').forEach(svg => {
            const container = svg.parentElement;
            const containerWidth = container.offsetWidth;

            if (containerWidth < 480) {
                svg.style.maxHeight = '400px';
            } else if (containerWidth < 768) {
                svg.style.maxHeight = '600px';
            } else {
                svg.style.maxHeight = '800px';
            }
        });
    }

    // Handle SVG loading
    document.querySelectorAll('object[data*=".svg"]').forEach(obj => {
        obj.addEventListener('load', function () {
            this.style.opacity = '1';
        });
    });

    handleSVGResize();
    window.addEventListener('resize', handleSVGResize);

    // SVG Zoom and Pan functionality
    document.querySelectorAll('.zoom-controls').forEach(controls => {
        const container = controls.parentElement;
        const svg = container.querySelector('.responsive-svg');
        let scale = 1;
        let translateX = 0;
        let translateY = 0;
        let isDragging = false;
        let startX = 0;
        let startY = 0;

        function updateTransform() {
            svg.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
        }

        // Zoom controls
        controls.querySelector('.zoom-in').addEventListener('click', () => {
            scale = Math.min(scale * 1.3, 10);
            updateTransform();
        });

        controls.querySelector('.zoom-out').addEventListener('click', () => {
            scale = Math.max(scale / 1.3, 0.5);
            updateTransform();
        });

        controls.querySelector('.zoom-reset').addEventListener('click', () => {
            scale = 1;
            translateX = 0;
            translateY = 0;
            updateTransform();
        });

        // Pan functionality
        container.addEventListener('mousedown', (e) => {
            if (scale > 1) {
                isDragging = true;
                startX = e.clientX - translateX;
                startY = e.clientY - translateY;
                container.classList.add('dragging');
            }
        });

        container.addEventListener('mousemove', (e) => {
            if (isDragging) {
                translateX = e.clientX - startX;
                translateY = e.clientY - startY;
                updateTransform();
            }
        });

        container.addEventListener('mouseup', () => {
            isDragging = false;
            container.classList.remove('dragging');
        });

        container.addEventListener('mouseleave', () => {
            isDragging = false;
            container.classList.remove('dragging');
        });

        // Touch support
        container.addEventListener('touchstart', (e) => {
            if (scale > 1 && e.touches.length === 1) {
                isDragging = true;
                startX = e.touches[0].clientX - translateX;
                startY = e.touches[0].clientY - translateY;
            }
        });

        container.addEventListener('touchmove', (e) => {
            if (isDragging && e.touches.length === 1) {
                e.preventDefault();
                translateX = e.touches[0].clientX - startX;
                translateY = e.touches[0].clientY - startY;
                updateTransform();
            }
        });

        container.addEventListener('touchend', () => {
            isDragging = false;
        });
    });

    // Back to Top Button functionality
    const backToTop = document.getElementById('backToTop');
    if (backToTop) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                backToTop.style.display = 'flex';
            } else {
                backToTop.style.display = 'none';
            }
        });

        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Deep linking support
    if (window.location.hash) {
        setTimeout(() => {
            const target = document.querySelector(window.location.hash);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
    }

    // Keyboard navigation for sidebar
    document.querySelectorAll('.nav-links a').forEach((link, index, links) => {
        link.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                const nextIndex = (index + 1) % links.length;
                links[nextIndex].focus();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                const prevIndex = (index - 1 + links.length) % links.length;
                links[prevIndex].focus();
            }
        });
    });

    // Add copy-to-clipboard for .env example
    document.querySelectorAll('.copy-btn[data-copy-target]').forEach(btn => {
        btn.addEventListener('click', function () {
            const targetSelector = btn.getAttribute('data-copy-target');
            const codeBlock = document.querySelector(targetSelector + ' code');
            if (codeBlock) {
                navigator.clipboard.writeText(codeBlock.textContent).then(() => {
                    btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                    setTimeout(() => {
                        btn.innerHTML = '<i class="fas fa-copy"></i> Copy .env Example';
                    }, 2000);
                });
            }
        });
    });

    // Style for feature highlights
    const style = document.createElement('style');
    style.textContent = `
        .fault-tolerance, .file-storage {
            transition: box-shadow 0.3s ease;
        }
        .fault-tolerance:hover, .file-storage:hover {
            box-shadow: 0 6px 16px rgba(0, 102, 179, 0.2);
        }
    `;
    document.head.appendChild(style);

    console.log('Symphony Logo Detection Documentation loaded successfully');
    console.log('Features: 6 YOLO models, FastAPI 0.115.12, React 19.1.0, Real-time WebSocket updates');
    console.log('Core capabilities: Fault-tolerant processing, WebSocket auto-reconnection, Parallel chunk processing');
});



// Add global error handler for better debugging
window.addEventListener('error', (e) => {
    console.error('Documentation error:', e.error);
});

// Add performance monitoring
if ('performance' in window) {
    window.addEventListener('load', () => {
        setTimeout(() => {
            const perfData = performance.getEntriesByType('navigation')[0];
            if (perfData) {
                console.log(`Page load time: ${perfData.loadEventEnd - perfData.loadEventStart}ms`);
            }
        }, 0);
    });
}