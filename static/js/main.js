document.addEventListener('DOMContentLoaded', () => {
    // --- Theme Toggle ---
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = document.getElementById('themeIcon');
    const htmlElement = document.documentElement;

    // Load preference from localStorage
    if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        htmlElement.classList.add('dark');
        themeIcon.classList.replace('fa-moon', 'fa-sun');
    } else {
        htmlElement.classList.remove('dark');
        themeIcon.classList.replace('fa-sun', 'fa-moon');
    }

    themeToggle.addEventListener('click', () => {
        if (htmlElement.classList.contains('dark')) {
            htmlElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
            themeIcon.classList.replace('fa-sun', 'fa-moon');
        } else {
            htmlElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
            themeIcon.classList.replace('fa-moon', 'fa-sun');
        }
    });

    // --- Tab Switching ---
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const successResult = document.getElementById('successResult');
    const alertBox = document.getElementById('alertBox');
    
    function hideAlert() {
        alertBox.classList.add('hidden');
    }

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Reset UI
            successResult.classList.add('hidden');
            hideAlert();

            // Toggle active styling
            tabBtns.forEach(b => {
                b.classList.remove('active-tab');
                b.classList.add('text-gray-500', 'dark:text-gray-400');
            });
            btn.classList.add('active-tab');
            btn.classList.remove('text-gray-500', 'dark:text-gray-400');

            // Show corresponding content
            const targetId = btn.getAttribute('data-target');
            tabContents.forEach(content => {
                if (content.id === targetId) {
                    content.classList.remove('hidden');
                    // small delay for css transition
                    setTimeout(() => content.style.opacity = '1', 50);
                } else {
                    content.classList.add('hidden');
                    content.style.opacity = '0';
                }
            });
        });
    });

    // --- Utility: Show Alerts ---
    function showAlert(msg, type='error') {
        alertBox.textContent = msg;
        alertBox.classList.remove('hidden', 'bg-red-100', 'text-red-700', 'bg-green-100', 'text-green-700');
        if (type === 'error') {
            alertBox.classList.add('bg-red-100', 'text-red-700', 'dark:bg-red-900/30', 'dark:text-red-400');
        } else {
            alertBox.classList.add('bg-green-100', 'text-green-700', 'dark:bg-green-900/30', 'dark:text-green-400');
        }
    }

    function showSuccessCode(code) {
        document.getElementById('generatedCode').textContent = code;
        successResult.classList.remove('hidden');
    }

    // --- Copy Code to Clipboard ---
    document.getElementById('copyCodeBtn').addEventListener('click', () => {
        const code = document.getElementById('generatedCode').textContent;
        navigator.clipboard.writeText(code).then(() => {
            const icon = document.querySelector('#copyCodeBtn i');
            icon.classList.replace('fa-copy', 'fa-check');
            setTimeout(() => {
                icon.classList.replace('fa-check', 'fa-copy');
            }, 2000);
        });
    });
    
    // --- Text Upload ---
    const btnTextUpload = document.getElementById('btnTextUpload');
    btnTextUpload.addEventListener('click', async () => {
        const textToSave = document.getElementById('textContent').value;
        if (!textToSave.trim()) {
            showAlert('Please enter some text before generating a link.');
            return;
        }

        btnTextUpload.disabled = true;
        btnTextUpload.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';
        hideAlert();

        try {
            const res = await fetch('/upload/text', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: textToSave })
            });
            const data = await res.json();
            
            if (!res.ok) throw new Error(data.error || 'Server error');
            
            // Clear text and show code
            document.getElementById('textContent').value = '';
            showSuccessCode(data.code);
            
        } catch (err) {
            showAlert(err.message);
        } finally {
            btnTextUpload.disabled = false;
            btnTextUpload.innerHTML = '<span>Generate Link</span><i class="fa-solid fa-arrow-right"></i>';
        }
    });

    // --- File Upload ---
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const selectedFileInfo = document.getElementById('selectedFileInfo');
    const fileName = document.getElementById('fileName');
    const clearFile = document.getElementById('clearFile');
    const btnFileUpload = document.getElementById('btnFileUpload');
    
    let currentFile = null;

    dropZone.addEventListener('click', () => fileInput.click());
    
    // Drag & drop logic
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('border-indigo-500', 'bg-indigo-50', 'dark:bg-indigo-900/20');
    });
    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('border-indigo-500', 'bg-indigo-50', 'dark:bg-indigo-900/20');
    });
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('border-indigo-500', 'bg-indigo-50', 'dark:bg-indigo-900/20');
        if (e.dataTransfer.files.length) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    });
    
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFileSelect(e.target.files[0]);
        }
    });

    function handleFileSelect(file) {
        hideAlert();
        // Check size (10MB)
        if (file.size > 10 * 1024 * 1024) {
            showAlert('File exceeds the 10MB maximum limit.');
            return;
        }
        currentFile = file;
        fileName.textContent = file.name;
        dropZone.classList.add('hidden');
        selectedFileInfo.classList.remove('hidden');
        btnFileUpload.classList.remove('hidden');
        btnFileUpload.disabled = false;
    }

    clearFile.addEventListener('click', () => {
        currentFile = null;
        fileInput.value = '';
        dropZone.classList.remove('hidden');
        selectedFileInfo.classList.add('hidden');
        btnFileUpload.classList.add('hidden');
    });

    // File Upload via AJAX with Progress Bar
    btnFileUpload.addEventListener('click', () => {
        if (!currentFile) return;

        hideAlert();
        
        // Setup UI for upload
        const progressWrapper = document.getElementById('progressWrapper');
        const progressBar = document.getElementById('progressBar');
        const progressText = document.getElementById('progressText');
        
        btnFileUpload.disabled = true;
        btnFileUpload.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Uploading...';
        progressWrapper.classList.remove('hidden');
        
        // FormData
        const formData = new FormData();
        formData.append('file', currentFile);

        // XMLHttpRequest for progress tracking
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/upload/file', true);

        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
                const percentComplete = Math.round((e.loaded / e.total) * 100);
                progressBar.style.width = percentComplete + '%';
                progressText.textContent = percentComplete + '%';
            }
        };

        xhr.onload = () => {
            btnFileUpload.disabled = false;
            btnFileUpload.innerHTML = '<span>Upload File</span><i class="fa-solid fa-upload"></i>';
            progressWrapper.classList.add('hidden');
            progressBar.style.width = '0%';
            
            if (xhr.status >= 200 && xhr.status < 300) {
                const data = JSON.parse(xhr.responseText);
                clearFile.click(); // Reset file input UI
                showSuccessCode(data.code);
            } else {
                let errorMsg = 'Upload failed.';
                try {
                    const data = JSON.parse(xhr.responseText);
                    errorMsg = data.error || errorMsg;
                } catch(e) {}
                showAlert(errorMsg);
            }
        };

        xhr.onerror = () => {
            btnFileUpload.disabled = false;
            btnFileUpload.innerHTML = '<span>Upload File</span><i class="fa-solid fa-upload"></i>';
            progressWrapper.classList.add('hidden');
            showAlert('Network error occurred.');
        };

        xhr.send(formData);
    });

    // --- Retrieve Item ---
    const btnRetrieve = document.getElementById('btnRetrieve');
    const retrieveCodeInput = document.getElementById('retrieveCode');
    const retrieveResultArea = document.getElementById('retrieveResultArea');
    const retrievedTextWrapper = document.getElementById('retrievedTextWrapper');
    const retrievedFileWrapper = document.getElementById('retrievedFileWrapper');

    btnRetrieve.addEventListener('click', async () => {
        const code = retrieveCodeInput.value.trim().toUpperCase();
        if (!code) {
            showAlert('Please enter a code to retrieve.');
            return;
        }

        btnRetrieve.disabled = true;
        btnRetrieve.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Retrieving...';
        hideAlert();
        retrieveResultArea.classList.add('hidden');

        try {
            const res = await fetch('/get/' + code);
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Failed to retrieve item.');

            retrieveResultArea.classList.remove('hidden');

            if (data.type === 'text') {
                retrievedFileWrapper.classList.add('hidden');
                retrievedTextWrapper.classList.remove('hidden');
                document.getElementById('retrievedText').value = data.content;
            } else if (data.type === 'file') {
                retrievedTextWrapper.classList.add('hidden');
                retrievedFileWrapper.classList.remove('hidden');
                document.getElementById('retrievedFileName').textContent = data.filename;
                document.getElementById('downloadLink').href = data.download_url;
            }
        } catch (err) {
            showAlert(err.message);
        } finally {
            btnRetrieve.disabled = false;
            btnRetrieve.innerHTML = '<span>Retrieve</span><i class="fa-solid fa-magnifying-glass"></i>';
        }
    });

    // Copy retrieved text
    const copyRetrievedBtn = document.getElementById('copyRetrievedBtn');
    copyRetrievedBtn.addEventListener('click', () => {
        const text = document.getElementById('retrievedText').value;
        navigator.clipboard.writeText(text).then(() => {
            const icon = document.querySelector('#copyRetrievedBtn i');
            icon.classList.replace('fa-copy', 'fa-check');
            setTimeout(() => {
                icon.classList.replace('fa-check', 'fa-copy');
            }, 2000);
        });
    });

    // Format retrieve input to uppercase
    retrieveCodeInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.toUpperCase();
    });

    // --- Antigravity-Style Deep Void Network Engine ---
    const canvas = document.getElementById('canvas-trail');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        
        let width, height;
        let particles = [];
        let mouse = { x: -1000, y: -1000 };
        
        function resize() {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        }
        
        window.addEventListener('resize', resize);
        resize();
        
        document.addEventListener('pointermove', (e) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        });
        document.addEventListener('pointerleave', () => {
            mouse.x = -1000;
            mouse.y = -1000;
        });
        
        const isDark = () => document.documentElement.classList.contains('dark');
        
        class Particle {
            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.vx = (Math.random() - 0.5) * 1.2;
                this.vy = (Math.random() - 0.5) * 1.2;
                this.size = Math.random() * 1.5 + 0.5;
            }
            update() {
                this.x += this.vx;
                this.y += this.vy;
                if (this.x < 0 || this.x > width) this.vx *= -1;
                if (this.y < 0 || this.y > height) this.vy *= -1;
            }
            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = isDark() ? 'rgba(148, 163, 184, 0.4)' : 'rgba(99, 102, 241, 0.4)';
                ctx.fill();
            }
        }
        
        // Populate node network
        for (let i = 0; i < 90; i++) particles.push(new Particle());
        
        function animate() {
            ctx.clearRect(0, 0, width, height);
            
            ctx.lineWidth = 0.6;
            const connectionDist = 140;
            const mouseDist = 180;
            
            for (let i = 0; i < particles.length; i++) {
                particles[i].update();
                particles[i].draw();
                
                // Network inter-particle links
                for (let j = i + 1; j < particles.length; j++) {
                    let dx = particles[i].x - particles[j].x;
                    let dy = particles[i].y - particles[j].y;
                    let dist = Math.hypot(dx, dy);
                    
                    if (dist < connectionDist) {
                        let opacity = 1 - (dist / connectionDist);
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = isDark() ? `rgba(148, 163, 184, ${opacity * 0.25})` : `rgba(99, 102, 241, ${opacity * 0.2})`;
                        ctx.stroke();
                    }
                }
                
                // Mouse gravity interaction links
                let dmx = particles[i].x - mouse.x;
                let dmy = particles[i].y - mouse.y;
                let dmDist = Math.hypot(dmx, dmy);
                
                if (dmDist < mouseDist) {
                    let opacity = 1 - (dmDist / mouseDist);
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(mouse.x, mouse.y);
                    ctx.strokeStyle = isDark() ? `rgba(167, 139, 250, ${opacity * 0.5})` : `rgba(79, 70, 229, ${opacity * 0.5})`;
                    ctx.stroke();
                    
                    // Subtle organic gravity
                    particles[i].x -= dmx * 0.005;
                    particles[i].y -= dmy * 0.005;
                }
            }
            requestAnimationFrame(animate);
        }
        requestAnimationFrame(animate);
    }

    // --- Material Ripple Interactivity ---
    const buttons = document.querySelectorAll('.ripple-btn');
    buttons.forEach(btn => {
        btn.addEventListener('mousedown', function(e) {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const ripple = document.createElement('span');
            ripple.classList.add('ripple-circle');
            ripple.style.left = `${x}px`;
            ripple.style.top = `${y}px`;
            
            // Dimensions
            const size = Math.max(rect.width, rect.height) * 1.5;
            ripple.style.width = ripple.style.height = `${size}px`;
            // Center
            ripple.style.marginTop = `-${size/2}px`;
            ripple.style.marginLeft = `-${size/2}px`;
            
            btn.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
        });
    });
});
