/**
 * CardioAI - Heart Disease Prediction Frontend
 * Advanced JavaScript functionality for healthcare AI interface
 * @version 1.0.0
 * @author CardioAI Team
 */

class CardioAI {
    constructor() {
        this.API_BASE_URL = window.location.origin;
        this.isLoading = false;
        this.currentPrediction = null;
        this.formData = {};
        this.config = {
            autoSave: true,
            animationSpeed: 'normal',
            theme: 'dark'
        };
        
        this.init();
    }

    /**
     * Initialize the application
     */
    init() {
        console.log('🫀 Initializing CardioAI...');
        
        this.setupEventListeners();
        this.checkAPIStatus();
        this.initializeAnimations();
        this.setupValidation();
        this.setupKeyboardShortcuts();
        this.setupAdvancedFeatures();
        this.loadSavedData();
        this.hideLoadingScreen();
        
        console.log('✅ CardioAI initialized successfully!');
    }

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Form submission
        const form = document.getElementById('predictionForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        // Real-time validation and interactions
        const inputs = document.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.addEventListener('input', (e) => this.handleInputChange(e));
            input.addEventListener('blur', (e) => this.validateField(e.target));
            input.addEventListener('focus', (e) => this.handleFieldFocus(e.target));
        });

        // Button interactions
        this.setupButtonListeners();
        
        // Window events
        window.addEventListener('beforeunload', () => this.handleBeforeUnload());
        window.addEventListener('resize', () => this.handleResize());
    }

    /**
     * Setup button event listeners
     */
    setupButtonListeners() {
        // Reset button
        const resetBtn = document.querySelector('.btn-secondary');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.clearForm());
        }

        // Toast close button
        const toastClose = document.querySelector('.toast-close');
        if (toastClose) {
            toastClose.addEventListener('click', () => this.closeToast());
        }

        // Modal close button
        const modalClose = document.querySelector('.modal-close');
        if (modalClose) {
            modalClose.addEventListener('click', () => this.closeModal());
        }

        // Click outside modal to close
        const modal = document.getElementById('infoModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal();
                }
            });
        }
    }

    /**
     * Handle form submission
     */
    async handleFormSubmit(e) {
        e.preventDefault();
        
        if (this.isLoading) {
            this.showToast('Analysis already in progress...', 'warning');
            return;
        }
        
        const isValid = this.validateForm();
        if (!isValid) {
            this.showToast('Please fill all fields correctly', 'error');
            this.focusFirstError();
            return;
        }

        this.setLoading(true);
        this.hideDefaultState();
        
        try {
            const formData = this.collectFormData(e.target);
            this.formData = formData;
            
            const result = await this.makePrediction(formData);
            
            this.displayResults(result);
            this.currentPrediction = result;
            this.showToast('Analysis completed successfully!', 'success');
            
            // Track analytics
            this.trackEvent('prediction_completed', {
                risk_level: result.risk_level,
                confidence: result.confidence.high_risk
            });
            
        } catch (error) {
            console.error('Prediction error:', error);
            this.handlePredictionError(error);
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Handle input changes
     */
    handleInputChange(e) {
        const field = e.target;
        
        // Auto-save if enabled
        if (this.config.autoSave) {
            this.saveFieldData(field.name, field.value);
        }
        
        // Real-time validation with debounce
        clearTimeout(this.validationTimeout);
        this.validationTimeout = setTimeout(() => {
            this.validateField(field);
        }, 300);
    }

    /**
     * Collect form data
     */
    collectFormData(form) {
        const formData = new FormData(form);
        const data = {
            Age: parseInt(formData.get('age')),
            Sex: parseInt(formData.get('sex')),
            ChestPainType: parseInt(formData.get('chestPainType')),
            RestingBP: parseInt(formData.get('restingBP')),
            Cholesterol: parseInt(formData.get('cholesterol')),
            FastingBS: parseInt(formData.get('fastingBS')),
            RestingECG: parseInt(formData.get('restingECG')),
            MaxHR: parseInt(formData.get('maxHR')),
            ExerciseAngina: parseInt(formData.get('exerciseAngina')),
            Oldpeak: parseFloat(formData.get('oldpeak')),
            ST_Slope: parseInt(formData.get('stSlope'))
        };
        
        console.log('📊 Form data collected:', data);
        return data;
    }

    /**
     * Make prediction API call
     */
    async makePrediction(patientData) {
        const response = await fetch(`${this.API_BASE_URL}/predict`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ patient_data: patientData })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    }

    /**
     * Display prediction results
     */
    displayResults(result) {
        const resultsContainer = document.getElementById('resultsContainer');
        const predictionCard = document.getElementById('predictionCard');
        
        // Update risk display
        this.updateRiskDisplay(result);
        
        // Update confidence bars with animation
        this.updateConfidenceBars(result);
        
        // Show recommendations
        this.updateRecommendations(result);
        
        // Add timestamp
        this.updateTimestamp();
        
        // Show results with animation
        resultsContainer.style.display = 'block';
        
        setTimeout(() => {
            predictionCard.classList.add('show');
            this.animateResults();
        }, 200);
        
        // Enable chart generation button
        const chartBtn = document.getElementById('generateChartsBtn');
        if (chartBtn) {
            chartBtn.style.display = 'inline-flex';
        }
    }

    /**
     * Update risk display
     */
    updateRiskDisplay(result) {
        const riskIcon = document.getElementById('riskIcon');
        const riskLevel = document.getElementById('riskLevel');
        const riskMessage = document.getElementById('riskMessage');
        
        if (result.prediction === 1) {
            riskIcon.innerHTML = '<i class="fas fa-exclamation-triangle risk-high"></i>';
            riskLevel.textContent = result.risk_level;
            riskLevel.style.color = '#ff4757';
            riskLevel.className = 'risk-high';
        } else {
            riskIcon.innerHTML = '<i class="fas fa-heart risk-low"></i>';
            riskLevel.textContent = result.risk_level;
            riskLevel.style.color = 'var(--primary-green)';
            riskLevel.className = 'risk-low';
        }
        
        // Typewriter effect for message
        this.typewriterEffect(riskMessage, result.message);
    }

    /**
     * Update confidence bars with animation
     */
    updateConfidenceBars(result) {
        const lowRiskBar = document.getElementById('lowRiskBar');
        const highRiskBar = document.getElementById('highRiskBar');
        const lowRiskPercent = document.getElementById('lowRiskPercent');
        const highRiskPercent = document.getElementById('highRiskPercent');
        
        // Reset bars
        lowRiskBar.style.width = '0%';
        highRiskBar.style.width = '0%';
        
        // Animate bars with staggered timing
        setTimeout(() => {
            lowRiskBar.style.width = result.confidence.low_risk + '%';
            this.animateCounter(lowRiskPercent, 0, result.confidence.low_risk, '%');
        }, 500);
        
        setTimeout(() => {
            highRiskBar.style.width = result.confidence.high_risk + '%';
            this.animateCounter(highRiskPercent, 0, result.confidence.high_risk, '%');
        }, 800);
    }

    /**
     * Update recommendations with staggered animation
     */
    updateRecommendations(result) {
        if (result.recommendations && result.recommendations.length > 0) {
            const recommendationsSection = document.getElementById('recommendationsSection');
            const recommendationsList = document.getElementById('recommendationsList');
            
            recommendationsList.innerHTML = '';
            
            result.recommendations.forEach((rec, index) => {
                const li = document.createElement('li');
                li.textContent = rec;
                li.style.opacity = '0';
                li.style.transform = 'translateX(-20px)';
                recommendationsList.appendChild(li);
                
                // Staggered animation
                setTimeout(() => {
                    li.style.transition = 'all 0.5s ease';
                    li.style.opacity = '1';
                    li.style.transform = 'translateX(0)';
                }, (index * 150) + 1000);
            });
            
            recommendationsSection.style.display = 'block';
        }
    }

    /**
     * Update timestamp
     */
    updateTimestamp() {
        const timestampElement = document.getElementById('analysisTime');
        if (timestampElement) {
            const now = new Date();
            timestampElement.textContent = `Analysis completed at ${now.toLocaleTimeString()}`;
        }
    }

    /**
     * Validate entire form
     */
    validateForm() {
        const form = document.getElementById('predictionForm');
        const inputs = form.querySelectorAll('input[required], select[required]');
        let isValid = true;
        
        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });
        
        return isValid;
    }

    /**
     * Validate individual field
     */
    validateField(field) {
        const value = field.value.trim();
        const fieldName = field.name;
        let isValid = true;
        let errorMessage = '';
        
        // Required field validation
        if (field.hasAttribute('required') && !value) {
            isValid = false;
            errorMessage = 'This field is required';
        }
        
        // Field-specific validation
        if (value && fieldName && isValid) {
            const validation = this.getFieldValidation(fieldName, value);
            isValid = validation.isValid;
            errorMessage = validation.message;
        }
        
        this.updateFieldValidation(field, isValid, errorMessage);
        return isValid;
    }

    /**
     * Get field-specific validation rules
     */
    getFieldValidation(fieldName, value) {
        const validations = {
            age: {
                min: 1, max: 120,
                message: 'Age must be between 1 and 120 years'
            },
            restingBP: {
                min: 80, max: 250,
                message: 'Blood pressure must be between 80 and 250 mmHg'
            },
            cholesterol: {
                min: 100, max: 600,
                message: 'Cholesterol must be between 100 and 600 mg/dl'
            },
            maxHR: {
                min: 60, max: 220,
                message: 'Heart rate must be between 60 and 220 bpm'
            },
            oldpeak: {
                min: 0, max: 10,
                message: 'Oldpeak must be between 0 and 10'
            }
        };
        
        if (validations[fieldName]) {
            const rule = validations[fieldName];
            const numValue = parseFloat(value);
            
            if (numValue < rule.min || numValue > rule.max) {
                return { isValid: false, message: rule.message };
            }
        }
        
        return { isValid: true, message: '' };
    }

    /**
     * Update field validation display
     */
    updateFieldValidation(field, isValid, errorMessage) {
        const formGroup = field.closest('.form-group');
        
        // Remove existing classes and messages
        field.classList.remove('error', 'success');
        
        const existingError = formGroup.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        if (field.value.trim()) {
            if (isValid) {
                field.classList.add('success');
                this.addFieldIcon(formGroup, 'success');
            } else {
                field.classList.add('error');
                this.addFieldIcon(formGroup, 'error');
                
                // Add error message
                const errorDiv = document.createElement('div');
                errorDiv.className = 'error-message';
                errorDiv.textContent = errorMessage;
                formGroup.appendChild(errorDiv);
            }
        } else {
            this.removeFieldIcon(formGroup);
        }
    }

    /**
     * Add validation icon to field
     */
    addFieldIcon(formGroup, type) {
        this.removeFieldIcon(formGroup);
        
        const icon = document.createElement('i');
        icon.className = `field-icon fas ${type === 'success' ? 'fa-check-circle text-success' : 'fa-times-circle text-danger'}`;
        icon.style.cssText = `
            position: absolute;
            right: 10px;
            top: 50%;
            transform: translateY(-50%);
            pointer-events: none;
            font-size: 1.2rem;
        `;
        
        const inputWrapper = formGroup.querySelector('input, select').parentElement;
        if (inputWrapper === formGroup) {
            formGroup.style.position = 'relative';
            formGroup.appendChild(icon);
        }
    }

    /**
     * Remove validation icon from field
     */
    removeFieldIcon(formGroup) {
        const existingIcon = formGroup.querySelector('.field-icon');
        if (existingIcon) {
            existingIcon.remove();
        }
    }

    /**
     * Handle field focus
     */
    handleFieldFocus(field) {
        const formGroup = field.closest('.form-group');
        formGroup.style.transform = 'scale(1.02)';
        formGroup.style.transition = 'transform 0.2s ease';
        
        field.addEventListener('blur', () => {
            formGroup.style.transform = 'scale(1)';
        }, { once: true });
    }

    /**
     * Focus first error field
     */
    focusFirstError() {
        const firstError = document.querySelector('.form-group input.error, .form-group select.error');
        if (firstError) {
            firstError.focus();
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    /**
     * Set loading state
     */
    setLoading(loading) {
        this.isLoading = loading;
        const loadingIndicator = document.getElementById('loadingIndicator');
        const submitBtn = document.querySelector('button[type="submit"]');
        
        if (loading) {
            loadingIndicator.classList.add('show');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';
        } else {
            loadingIndicator.classList.remove('show');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-brain"></i> Analyze Risk';
        }
    }

    /**
     * Hide default state
     */
    hideDefaultState() {
        const defaultState = document.getElementById('defaultState');
        if (defaultState) {
            defaultState.style.display = 'none';
        }
    }

    /**
     * Clear form and reset to default state
     */
    clearForm() {
        const form = document.getElementById('predictionForm');
        form.reset();
        
        // Clear validation styles
        const fields = form.querySelectorAll('input, select');
        fields.forEach(field => {
            field.classList.remove('error', 'success');
            const formGroup = field.closest('.form-group');
            formGroup.style.transform = 'scale(1)';
            
            this.removeFieldIcon(formGroup);
            
            const errorMessage = formGroup.querySelector('.error-message');
            if (errorMessage) {
                errorMessage.remove();
            }
        });
        
        // Hide results and show default state
        const resultsContainer = document.getElementById('resultsContainer');
        const predictionCard = document.getElementById('predictionCard');
        const defaultState = document.getElementById('defaultState');
        
        if (predictionCard) {
            predictionCard.classList.remove('show');
        }
        
        setTimeout(() => {
            if (resultsContainer) {
                resultsContainer.style.display = 'none';
            }
            if (defaultState) {
                defaultState.style.display = 'block';
            }
        }, 300);
        
        // Clear saved data
        this.clearSavedData();
        this.currentPrediction = null;
        
        this.showToast('Form cleared successfully!', 'success');
    }

    /**
     * Check API status
     */
    async checkAPIStatus() {
        try {
            const response = await fetch(`${this.API_BASE_URL}/health`);
            const data = await response.json();
            
            const statusElement = document.getElementById('apiStatus');
            const statusDot = document.querySelector('.status-dot');
            
            if (data.status === 'healthy') {
                statusElement.textContent = 'AI Service Online';
                statusElement.style.color = 'var(--primary-green)';
                statusDot.style.background = 'var(--primary-green)';
            } else {
                statusElement.textContent = 'Service Warning';
                statusElement.style.color = '#ffa500';
                statusDot.style.background = '#ffa500';
            }
        } catch (error) {
            const statusElement = document.getElementById('apiStatus');
            const statusDot = document.querySelector('.status-dot');
            
            statusElement.textContent = 'Service Offline';
            statusElement.style.color = '#ff4757';
            statusDot.style.background = '#ff4757';
            
            console.error('API connection failed:', error);
        }
    }

    /*
     // -- Show toast notification
     
    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        const toastMessage = toast.querySelector('.toast-message');
        const toastIcon = toast.querySelector('.toast-icon');
        
        // Set icon based on type
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        
        // Remove existing classes
        toast.className = 'toast';
        
        // Set content
        toastMessage.textContent = message;
        toastIcon.className = `toast-icon ${icons[type] || icons.info}`;
        
        // Add type class
        toast.classList.add(type);
        
        // Show toast
        toast.classList.add('show');
        
        // Auto hide after 4 seconds
        setTimeout(() => {
            toast.classList.remove('show');
        }, 4000);
    }

    
     // Close toast notification
     
    closeToast() {
        const toast = document.getElementById('toast');
        toast.classList.remove('show');
    }
    */
    /**
     * Handle prediction errors
     */
    handlePredictionError(error) {
        let errorMessage = 'An error occurred during analysis. Please try again.';
        
        if (error.message.includes('Model not loaded')) {
            errorMessage = 'AI model is not available. Please contact support.';
        } else if (error.message.includes('Network')) {
            errorMessage = 'Network error. Please check your connection.';
        } else if (error.message.includes('500')) {
            errorMessage = 'Server error. Please try again later.';
        }
        
        this.showToast(errorMessage, 'error');
        
        // Show default state again
        const defaultState = document.getElementById('defaultState');
        if (defaultState) {
            defaultState.style.display = 'block';
        }
    }

    /**
     * Initialize animations
     */
    initializeAnimations() {
        // Add entrance animations to cards
        const cards = document.querySelectorAll('.card');
        cards.forEach((card, index) => {
            card.style.animationDelay = `${index * 0.2}s`;
            card.style.animation = 'cardFloat 6s ease-in-out infinite';
        });
        
        // Add floating animation keyframes if not already defined
        if (!document.querySelector('#cardFloatAnimation')) {
            const style = document.createElement('style');
            style.id = 'cardFloatAnimation';
            style.textContent = `
                @keyframes cardFloat {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-5px); }
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+Enter to submit form
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                const form = document.getElementById('predictionForm');
                if (form && !this.isLoading) {
                    form.dispatchEvent(new Event('submit'));
                }
            }
            
            // Ctrl+R to reset form
            if (e.ctrlKey && e.key === 'r') {
                e.preventDefault();
                this.clearForm();
            }
            
            // Escape to close modals/toasts
            if (e.key === 'Escape') {
                this.closeModal();
                this.closeToast();
            }
        });
    }

    /**
     * Setup advanced features
     */
    setupAdvancedFeatures() {
        // Setup auto-save
        if (this.config.autoSave) {
            this.setupAutoSave();
        }
        
        // Setup form recovery
        this.setupFormRecovery();
        
        // Setup analytics
        this.setupAnalytics();
    }

    /**
     * Setup auto-save functionality
     */
    setupAutoSave() {
        const form = document.getElementById('predictionForm');
        const inputs = form.querySelectorAll('input, select');
        
        inputs.forEach(input => {
            input.addEventListener('change', () => {
                this.saveFieldData(input.name, input.value);
            });
        });
    }

    /**
     * Save field data to localStorage
     */
    saveFieldData(fieldName, value) {
        try {
            localStorage.setItem(`cardioai_${fieldName}`, value);
        } catch (error) {
            console.warn('Failed to save field data:', error);
        }
    }

    /**
     * Load saved data from localStorage
     */
    loadSavedData() {
        try {
            const form = document.getElementById('predictionForm');
            const inputs = form.querySelectorAll('input, select');
            
            inputs.forEach(input => {
                const savedValue = localStorage.getItem(`cardioai_${input.name}`);
                if (savedValue && savedValue !== 'null' && savedValue !== '') {
                    input.value = savedValue;
                }
            });
        } catch (error) {
            console.warn('Failed to load saved data:', error);
        }
    }

    /**
     * Clear saved data from localStorage
     */
    clearSavedData() {
        try {
            const form = document.getElementById('predictionForm');
            const inputs = form.querySelectorAll('input, select');
            
            inputs.forEach(input => {
                localStorage.removeItem(`cardioai_${input.name}`);
            });
        } catch (error) {
            console.warn('Failed to clear saved data:', error);
        }
    }

    /**
     * Setup form recovery
     */
    setupFormRecovery() {
        // Show recovery notice if there's saved data
        setTimeout(() => {
            const hasData = this.checkForSavedData();
            if (hasData) {
                this.showToast('Previous form data restored', 'info');
            }
        }, 1000);
    }

    /**
     * Check if there's saved form data
     */
    checkForSavedData() {
        try {
            const form = document.getElementById('predictionForm');
            const inputs = form.querySelectorAll('input, select');
            
            for (let input of inputs) {
                const savedValue = localStorage.getItem(`cardioai_${input.name}`);
                if (savedValue && savedValue !== 'null' && savedValue !== '') {
                    return true;
                }
            }
            return false;
        } catch (error) {
            return false;
        }
    }

    /**
     * Hide loading screen
     */
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            setTimeout(() => {
                loadingScreen.style.opacity = '0';
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                }, 500);
            }, 1000);
        }
    }

    /**
     * Handle before unload
     */
    handleBeforeUnload() {
        // Save current form state before page unload
        if (this.config.autoSave) {
            const form = document.getElementById('predictionForm');
            const formData = new FormData(form);
            
            for (let [key, value] of formData.entries()) {
                this.saveFieldData(key, value);
            }
        }
    }

    /**
     * Handle window resize
     */
    handleResize() {
        // Adjust layout if needed
        const container = document.querySelector('.container');
        if (container && window.innerWidth <= 768) {
            // Mobile adjustments
            container.style.gridTemplateColumns = '1fr';
        }
    }

    /**
     * Animate results elements
     */
    animateResults() {
        const elements = document.querySelectorAll('.confidence-item, .recommendations li');
        elements.forEach((el, index) => {
            setTimeout(() => {
                el.style.transform = 'translateX(0)';
                el.style.opacity = '1';
            }, index * 100);
        });
    }

    /**
     * Typewriter effect for text
     */
    typewriterEffect(element, text, speed = 50) {
        element.textContent = '';
        let i = 0;
        
        const timer = setInterval(() => {
            element.textContent += text.charAt(i);
            i++;
            
            if (i >= text.length) {
                clearInterval(timer);
            }
        }, speed);
    }

    /**
     * Animate counter
     */
    animateCounter(element, start, end, suffix = '') {
        const duration = 1500;
        const increment = (end - start) / (duration / 16);
        let current = start;
        
        const timer = setInterval(() => {
            current += increment;
            element.textContent = Math.round(current) + suffix;
            
            if (current >= end) {
                element.textContent = end + suffix;
                clearInterval(timer);
            }
        }, 16);
    }

    /**
     * Setup analytics tracking
     */
    setupAnalytics() {
        // Basic analytics setup
        this.analytics = {
            sessionStart: Date.now(),
            events: []
        };
    }

    /**
     * Track analytics event
     */
    trackEvent(eventName, data = {}) {
        const event = {
            name: eventName,
            timestamp: Date.now(),
            data: data
        };
        
        this.analytics.events.push(event);
        console.log('📈 Analytics Event:', event);
        
        // Send to analytics service if available
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, data);
        }
    }

    /**
     * Close modal
     */
    closeModal() {
        const modal = document.getElementById('infoModal');
        if (modal) {
            modal.classList.remove('show');
            modal.style.display = 'none';
        }
    }

    /**
     * Show modal with content
     */
    showModal(title, content) {
        const modal = document.getElementById('infoModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');
        
        if (modal && modalTitle && modalBody) {
            modalTitle.textContent = title;
            modalBody.innerHTML = content;
            modal.style.display = 'flex';
            modal.classList.add('show');
        }
    }
}

// Global utility functions
function clearForm() {
    if (window.cardioAI) {
        window.cardioAI.clearForm();
    }
}

function exportResults() {
    if (window.cardioAI && window.cardioAI.currentPrediction) {
        const data = {
            timestamp: new Date().toISOString(),
            prediction: window.cardioAI.currentPrediction,
            formData: window.cardioAI.formData
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], 
            { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cardioai_prediction_${Date.now()}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        window.cardioAI.showToast('Results exported successfully!', 'success');
    } else {
        window.cardioAI.showToast('No results to export', 'warning');
    }
} 
        
function shareResults() {
    if (window.cardioAI && window.cardioAI.currentPrediction) {
        if (navigator.share) {
            navigator.share({
                title: 'CardioAI Heart Disease Risk Analysis',
                text: `Risk Level: ${window.cardioAI.currentPrediction.risk_level}`,
                url: window.location.href
            }).then(() => {
                window.cardioAI.showToast('Results shared successfully!', 'success');
            }).catch(() => {
                // Fallback to copy to clipboard
                copyToClipboard();
            });
        } else {
            // Fallback to copy to clipboard
            copyToClipboard();
        }
    } else {
        window.cardioAI.showToast('No results to share', 'warning');
    }
}

function copyToClipboard() {
    if (window.cardioAI && window.cardioAI.currentPrediction) {
        const result = window.cardioAI.currentPrediction;
        const shareText = `CardioAI Analysis Results:
Risk Level: ${result.risk_level}
Confidence: ${result.confidence.high_risk}% high risk, ${result.confidence.low_risk}% low risk
Analyzed at: ${new Date().toLocaleString()}

Visit: ${window.location.href}`;
        
        navigator.clipboard.writeText(shareText).then(() => {
            window.cardioAI.showToast('Results copied to clipboard!', 'success');
        }).catch(() => {
            window.cardioAI.showToast('Failed to copy results', 'error');
        });
    }
}

function generateCharts() {
    if (window.cardioAI && window.cardioAI.currentPrediction) {
        window.cardioAI.showToast('Generating visual charts...', 'info');
        
        // Simulate chart generation (replace with actual API call)
        setTimeout(() => {
            const chartPlaceholder = document.getElementById('chartPlaceholder');
            chartPlaceholder.innerHTML = `
                <div style="padding: 2rem; text-align: center;">
                    <i class="fas fa-chart-pie" style="font-size: 3rem; color: var(--primary-green); margin-bottom: 1rem;"></i>
                    <h4 style="color: var(--primary-green); margin-bottom: 1rem;">Risk Analysis Charts</h4>
                    <p>Interactive charts and detailed visualizations would appear here in the full implementation.</p>
                    <div style="margin-top: 1rem;">
                        <button class="btn btn-small" onclick="downloadChart()">
                            <i class="fas fa-download"></i> Download Chart
                        </button>
                    </div>
                </div>
            `;
            window.cardioAI.showToast('Charts generated successfully!', 'success');
        }, 2000);
    }
}

function downloadChart() {
    window.cardioAI.showToast('Chart download feature coming soon!', 'info');
}

function showInfo(type) {
    const content = {
        privacy: `
            <h4>Privacy Policy</h4>
            <p>CardioAI respects your privacy and is committed to protecting your personal information.</p>
            <ul>
                <li>We do not store personal health data on our servers</li>
                <li>All analysis is performed locally when possible</li>
                <li>No data is shared with third parties</li>
                <li>Session data is automatically cleared</li>
            </ul>
            <p><strong>Note:</strong> This tool is for educational purposes only and should not replace professional medical advice.</p>
        `,
        terms: `
            <h4>Terms of Service</h4>
            <p>By using CardioAI, you agree to the following terms:</p>
            <ul>
                <li>This tool is for educational and research purposes only</li>
                <li>Results should not be used as a substitute for professional medical diagnosis</li>
                <li>Always consult healthcare professionals for medical advice</li>
                <li>We are not liable for any decisions made based on these results</li>
            </ul>
            <p><strong>Disclaimer:</strong> CardioAI provides AI-assisted risk assessment, not medical diagnosis.</p>
        `,
        about: `
            <h4>About CardioAI</h4>
            <p>CardioAI is an advanced AI-powered tool for heart disease risk assessment using machine learning algorithms.</p>
            
            <h5>Features:</h5>
            <ul>
                <li>Real-time risk analysis using 11 key health parameters</li>
                <li>Professional-grade AI models trained on medical data</li>
                <li>Instant results with confidence levels</li>
                <li>Personalized health recommendations</li>
                <li>Modern, responsive user interface</li>
            </ul>
            
            <h5>Technology Stack:</h5>
            <ul>
                <li>Backend: Python Flask with scikit-learn</li>
                <li>Frontend: Vanilla JavaScript with modern CSS</li>
                <li>AI Model: Random Forest Classifier</li>
                <li>Visualization: Matplotlib & Chart.js</li>
            </ul>
            
            <p><strong>Version:</strong> 1.0.0 | <strong>Last Updated:</strong> 2025</p>
        `
    };
    
    if (window.cardioAI && content[type]) {
        window.cardioAI.showModal(
            type.charAt(0).toUpperCase() + type.slice(1), 
            content[type]
        );
    }
}

// Utility Functions
const Utils = {
    // Format medical values
    formatMedicalValue(value, type) {
        const formats = {
            bp: val => `${val} mmHg`,
            cholesterol: val => `${val} mg/dl`,
            heartrate: val => `${val} bpm`,
            percentage: val => `${val}%`,
            age: val => `${val} years`
        };
        return formats[type] ? formats[type](value) : value;
    },
    
    // Generate health tips based on values
    generateHealthTips(patientData) {
        const tips = [];
        
        if (patientData.Age > 50) {
            tips.push('Regular cardiovascular screenings recommended for your age group');
        }
        
        if (patientData.Cholesterol > 240) {
            tips.push('Consider adopting a low-cholesterol diet rich in fruits and vegetables');
        }
        
        if (patientData.RestingBP > 140) {
            tips.push('Monitor blood pressure regularly and practice stress management');
        }
        
        if (patientData.MaxHR < 150 && patientData.Age < 60) {
            tips.push('Regular aerobic exercise can help improve cardiovascular fitness');
        }
        
        return tips;
    },
    
    // Risk level color mapping
    getRiskColor(riskLevel) {
        const colors = {
            'Low Risk': '#00ff88',
            'Moderate Risk': '#ffa500',
            'High Risk': '#ff4757',
            'Very High Risk': '#ff1744'
        };
        return colors[riskLevel] || '#666';
    },
    
    // Debounce function
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // Validate email format
    isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },
    
    // Format date for display
    formatDate(date) {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    }
};

// Performance monitoring
const Performance = {
    marks: {},
    
    start(name) {
        this.marks[name] = performance.now();
    },
    
    end(name) {
        if (this.marks[name]) {
            const duration = performance.now() - this.marks[name];
            console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
            delete this.marks[name];
            return duration;
        }
    }
};

// Error handling
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    if (window.cardioAI) {
        window.cardioAI.showToast('An unexpected error occurred', 'error');
    }
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    if (window.cardioAI) {
        window.cardioAI.showToast('A network error occurred', 'error');
    }
});

// Service Worker registration (for PWA functionality)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    Performance.start('app_initialization');
    
    // Initialize CardioAI
    window.cardioAI = new CardioAI();
    
    // Add version info to console
    console.log(`
    🫀 CardioAI v1.0.0
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    AI-Powered Heart Disease Risk Assessment
    Built with ❤️ for better healthcare through technology
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);
    
    Performance.end('app_initialization');
    
    // Add keyboard navigation support
    document.addEventListener('keydown', (e) => {
        // Tab navigation enhancement
        if (e.key === 'Tab') {
            document.body.classList.add('keyboard-navigation');
        }
    });
    
    document.addEventListener('mousedown', () => {
        document.body.classList.remove('keyboard-navigation');
    });
    
    // Add focus styles for keyboard navigation
    const style = document.createElement('style');
    style.textContent = `
        .keyboard-navigation *:focus {
            outline: 2px solid var(--primary-green) !important;
            outline-offset: 2px !important;
        }
    `;
    document.head.appendChild(style);
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CardioAI, Utils, Performance };
}