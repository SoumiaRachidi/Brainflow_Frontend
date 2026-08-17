# 🧠 BrainFlow - Frontend Dashboard

![Next JS](https://img.shields.io/badge/Next-black?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)

The interactive user interface for **BrainFlow**. Built with Next.js and React, this application provides administrators and support agents with a responsive dashboard to track system metrics, manage ticket queues, and monitor performance indicators in real time.

## ✨ Core Features
*   **Dynamic Dashboard:** Real-time visibility into open tickets, resolution times, and SLA metrics.
*   **Seamless API Integration:** Asynchronous data fetching and state management communicating directly with the BrainFlow Spring Boot backend.
*   **Responsive Layouts:** Modular UI components built for seamless operation across desktop and mobile devices.
*   **Error Boundaries:** Graceful error handling and loading skeletons for a polished user experience.

## 🛠️ Technology Stack
*   **Framework:** Next.js (React)
*   **Styling:** CSS Modules / Tailwind CSS *(Update this based on what you used)*
*   **Network Requests:** Fetch API / Axios

## 🚀 Getting Started

### Prerequisites
*   Node.js (v18 or higher)
*   npm, yarn, or pnpm
*   The **BrainFlow Backend** must be running locally.

### Installation & Setup
1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/SoumiaRachidi/Brainflow_Frontend.git](https://github.com/SoumiaRachidi/Brainflow_Frontend.git)
    cd Brainflow_Frontend
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```
3.  **Set up environment variables:**
    Create a `.env.local` file in the root directory and add your backend API URL:
    ```env
    NEXT_PUBLIC_API_URL=http://localhost:8080/api
    ```
4.  **Run the development server:**
    ```bash
    npm run dev
    # or
    yarn dev
    ```
    Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.
