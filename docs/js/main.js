document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
        });
    }

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', function(event) {
        if (window.innerWidth <= 768) {
            const isClickInside = sidebar.contains(event.target) || menuToggle.contains(event.target);
            if (!isClickInside && sidebar.classList.contains('active')) {
                sidebar.classList.remove('active');
            }
        }
    });

    // Enhanced search functionality with highlighting
    const searchInput = document.querySelector('.search-box input');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
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
            
            contentSections.forEach(section => {
                const text = section.textContent.toLowerCase();
                if (text.includes(searchTerm)) {
                    section.style.display = 'block';
                    
                    // Highlight matching text
                    highlightText(section, searchTerm);
                } else {
                    section.style.display = 'none';
                }
            });
        });
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
        anchor.addEventListener('click', function(e) {
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
    window.addEventListener('scroll', function() {
        if (!ticking) {
            window.requestAnimationFrame(function() {
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
    
    // Add version badges to API endpoints
    document.querySelectorAll('.api-overview code').forEach(code => {
        const text = code.textContent;
        if (text.includes('/v2/')) {
            const badge = document.createElement('span');
            badge.className = 'version-badge new';
            badge.textContent = 'v2';
            code.appendChild(badge);
        }
    });
    
    // Initialize API method tags
    document.querySelectorAll('.api-overview li').forEach(item => {
        const codeText = item.querySelector('code').textContent;
        const method = codeText.split(' ')[0];
        
        if (method) {
            const methodTag = document.createElement('span');
            methodTag.className = `api-method ${method.toLowerCase()}`;
            methodTag.textContent = method;
            item.insertBefore(methodTag, item.firstChild);
        }
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
}); 