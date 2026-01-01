const app = {
    state: {
        email_addr: null,
        email_timestamp: 0,
        alias: null,
        sid_token: null,
        emails: [],
        selectedEmailId: null
    },

    elements: {
        emailAddress: document.getElementById('email-address'),
        countdown: document.getElementById('countdown'),
        emailList: document.getElementById('email-list'),
        detailView: document.getElementById('email-detail-view'),
        statusText: document.getElementById('status-text'),
        totalEmails: document.getElementById('total-emails')
    },

    init() {
        this.fetchEmailAddress();

        // Event Listeners
        document.getElementById('extend-btn').addEventListener('click', () => this.extendSession());
        document.getElementById('forget-btn').addEventListener('click', () => this.forgetSession());

        // Polling
        setInterval(() => this.checkEmail(), 10000); // Check every 10s
        setInterval(() => this.updateTimer(), 1000); // Update timer every 1s
    },

    async apiCall(functionName, params = {}) {
        this.elements.statusText.textContent = "Syncing...";
        try {
            const formData = new FormData();
            formData.append('f', functionName);
            for (const key in params) {
                formData.append(key, params[key]);
            }

            // We use the proxy.php
            const response = await fetch('proxy.php?f=' + functionName, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            this.elements.statusText.textContent = "Connected";
            return data;
        } catch (error) {
            console.error("API Error:", error);
            this.elements.statusText.textContent = "Error";
            return null;
        }
    },

    async fetchEmailAddress() {
        const data = await this.apiCall('get_email_address');
        if (data) {
            this.state.email_addr = data.email_addr;
            this.state.email_timestamp = data.email_timestamp;
            this.state.sid_token = data.sid_token;
            this.updateUI();

            // Initial check for emails
            this.checkEmail();
        }
    },

    async checkEmail() {
        // 'seq' is the id of the oldest email. 
        // Effectively we want to check for new emails.
        // For simplicity in this list view, we just fetch a batch of recent emails using check_email
        // standard call usually returns the list of NEW emails since the last seq. 
        // But get_email_list is safer for a full refresh.
        // Let's use get_email_list to ensure we see everything for now.

        const params = { offset: 0 };
        if (this.state.sid_token) {
            params.sid_token = this.state.sid_token;
        }
        const data = await this.apiCall('get_email_list', params);
        if (data && data.list) {
            this.state.emails = data.list;
            this.elements.totalEmails.textContent = data.count || data.list.length;
            this.renderEmailList();
        }
    },

    async fetchEmailContent(id) {
        const data = await this.apiCall('fetch_email', { email_id: id });
        if (data) {
            this.renderEmailDetail(data);
        }
    },

    async extendSession() {
        const params = {};
        if (this.state.sid_token) {
            params.sid_token = this.state.sid_token;
        }
        // "extend" function is disabled by API, use "get_email_address" instead
        const data = await this.apiCall('get_email_address', params);
        if (data && data.email_addr) {
            // API returns original creation timestamp, so we must manually reset our local timer baseline
            // to "now" to give the user another 60 minutes visual countdown.
            // We assume the server keeps the session alive for 60m from last activity.
            this.state.email_timestamp = Math.floor(Date.now() / 1000);
            alert("Session extended!");
            this.updateTimer(); // Force update immediately
        }
    },

    async forgetSession() {
        if (confirm("Are you sure? This will generate a new email address.")) {
            const params = {};
            if (this.state.sid_token) {
                params.sid_token = this.state.sid_token;
            }
            await this.apiCall('forget_me', params);
            // After forget_me, we need to get a new address
            this.state.emails = [];
            this.state.selectedEmailId = null;
            this.elements.detailView.innerHTML = this.getEmptyStateHTML();
            this.fetchEmailAddress();
        }
    },

    updateUI() {
        this.elements.emailAddress.textContent = this.state.email_addr;
    },

    updateTimer() {
        if (!this.state.email_timestamp) return;

        // The API says: seconds remaining = 3600 - (Current Timestamp - Email Timestamp)
        // Wait, the API docs say: "seconds remaining = 3600 - Current Timestamp - Email Timestamp" 
        // which seems weird. Usually it's: ExpireTime = CreatedTime + 3600. Remaining = ExpireTime - Now.
        // Let's assume email_timestamp is Creation Time.

        const now = Math.floor(Date.now() / 1000);
        // Expiry time is creation time + 3600 (1 hour)
        const expiry = parseInt(this.state.email_timestamp) + 3600;
        const remaining = expiry - now;

        if (remaining > 0) {
            const minutes = Math.floor(remaining / 60);
            const seconds = remaining % 60;
            this.elements.countdown.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        } else {
            this.elements.countdown.textContent = "Expired";
        }
    },

    renderEmailList() {
        this.elements.emailList.innerHTML = '';

        this.state.emails.forEach(email => {
            const li = document.createElement('li');
            li.className = `email-item ${email.mail_read === '0' ? 'unread' : ''}`;
            if (email.mail_id === this.state.selectedEmailId) {
                li.classList.add('active');
            }

            li.onclick = () => {
                this.state.selectedEmailId = email.mail_id;
                this.renderEmailList(); // Re-render to update active state
                this.fetchEmailContent(email.mail_id);
            };

            li.innerHTML = `
                <div class="email-sender">
                    <span>${email.mail_from}</span>
                    <span class="email-date">${email.mail_date}</span>
                </div>
                <div class="email-subject">${email.mail_subject}</div>
                <div class="email-excerpt">${email.mail_excerpt}</div>
            `;
            this.elements.emailList.appendChild(li);
        });
    },

    renderEmailDetail(email) {
        // Sanitize body? The API says filtered, but we might want to handle images.
        // API Notes: Images hidden, blocked by GM image.

        const bodyContent = email.mail_body; // Contains HTML

        this.elements.detailView.innerHTML = `
            <div class="detail-header">
                <h3 class="detail-subject">${email.mail_subject}</h3>
                <div class="detail-meta">
                    <span>From: <strong>${email.mail_from}</strong></span>
                    <span>${email.mail_date}</span>
                </div>
            </div>
            <div class="detail-body">
                ${bodyContent}
            </div>
        `;
    },

    getEmptyStateHTML() {
        return `
            <div class="empty-state">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                <p>Select an email to read</p>
            </div>
        `;
    }
};

window.copyEmail = function () {
    const email = document.getElementById('email-address').textContent;
    navigator.clipboard.writeText(email).then(() => {
        alert("Email copied!");
    });
}

// Start
app.init();
