# Guerrilla Mail API Client

A premium, modern web interface for [Guerrilla Mail](https://guerrillamail.com/), allowing you to create disposable email addresses and receive emails instantly.

![Guerrilla Mail Client]

## Features

-   **Instant Disposable Email**: Generates a temporary email address immediately upon loading.
-   **Real-time Inbox**: Fetches emails automatically every 10 seconds.
-   **Session Management**:
    -   **Extend Session**: Add another 60 minutes to your temporary email.
    -   **Forget Me**: Destroy the current session and generate a new identity.
-   **Modern UI**: Sleek, dark-mode interface with high-contrast text and smooth transitions.
-   **Privacy Focused**: Proxies all API requests through a local PHP backend to bypass CORS and manage sessions securely.

## Technology Stack

-   **Frontend**: HTML5, Vanilla CSS (Flexbox/Grid), Vanilla JavaScript (ES6+).
-   **Backend**: PHP (acting as a proxy for the Guerrilla Mail JSON API).
-   **API**: [Guerrilla Mail API](https://guerrillamail.com).

## Installation & Setup

This project requires a PHP server to run the proxy script.

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/aitoruranga/guerrilla-mail.git
    ```
2.  **Move to Web Server**:
    -   Copy the project folder to your web server's root directory (e.g., `htdocs` in XAMPP/MAMP or `/var/www/html` in Apache).
3.  **Start the Server**:
    -   Ensure Apache/PHP is running.
4.  **Access the App**:
    -   Open your browser and navigate to `http://localhost/guerrilla-mail-client` (or your specific folder name).

## Usage

1.  **Open the App**: A temporary email address is generated automatically.
2.  **Copy Address**: Click the copy icon next to the email address.
3.  **Receive Mail**: Send an email to the generated address. It will appear in the inbox list within 10 seconds.
4.  **Read Mail**: Click on an email in the list to view its full content.

## Credits

-   **Created by**: [Aitor Uranga](https://uranga.eus)
-   **Powered by**: [Guerrilla Mail API](https://guerrillamail.com)

---

&copy; 2026 Guerrilla Mail Client
