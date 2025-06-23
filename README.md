# 🏡 FamilyHub

**FamilyHub** is a customizable, self-hosted family dashboard built with React and Supabase. It helps families organize chores, meals, events, and to-do lists from a central hub.

## ✨ Features

- 📆 Shared family calendar with weather and Google Calendar integration
- ✅ Chore tracking with rotation and completion history
- 🍽️ Meal planning with assigned family members
- 📝 Lists for groceries, tasks, or anything else
- 👨‍👩‍👧‍👦 Profiles for each family member
- 🌤️ Optional weather widget and sleep mode
- 🔄 Real-time updates powered by Supabase

## ⚙️ Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **State Management**: Context API
- **Optional**: Hosted on Raspberry Pi or cloud platform

## 🔑 Environment Variables

Create a `.env` file in the project root with the following variables:

```bash
# Required for weather features
VITE_WEATHER_API_KEY=your_openweathermap_api_key

# Optional: Supabase configuration (if using Supabase backend)
# VITE_SUPABASE_URL=your_supabase_url
# VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Obtaining a Weather API Key

1. Sign up at [OpenWeatherMap](https://openweathermap.org/)
2. Get your API key from the dashboard
3. Add it to your `.env` file as `VITE_WEATHER_API_KEY`

## 🚀 Getting Started

### 1. Clone the Repo

```bash
git clone https://github.com/jasoned/family-hub.git
cd family-hub
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

- Create a project at [https://supabase.com](https://supabase.com)
- Get your **project URL** and **anon/public key**
- Create a `.env` file:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Start the App

```bash
npm run dev
```

---

## 📁 Project Structure

```bash
src/
│
├── context/        # App-wide context + Supabase sync
├── components/     # UI components
├── pages/          # Main screens (Chores, Calendar, etc.)
├── services/       # Utility services (e.g. weather)
├── types/          # TypeScript interfaces
└── supabaseClient.js
```

---

## 🧠 Future Ideas

- Chore rewards system (stars or points)
- Dark mode / theming options
- Touchscreen kiosk mode
- Optional voice reminders

---

## 📸 Screenshots

> Add some screenshots or a demo video once it's running!

---

## 🙏 Credits

- Built by Jason Edington
- Supabase for the realtime backend
- Tailwind for the styling speed

---

## 📜 License

MIT – do what you want, just don’t blame me if your kids still don’t do their chores.
