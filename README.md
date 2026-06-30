# Internyx - Internship Application Tracker

A modern, feature-rich web application designed to help students and job seekers track and optimize their internship applications with ease.

## 🚀 Features

- **Track Applications**: Keep all your internship applications organized in one place with detailed status tracking
- **Visualize Progress**: See your application progress with beautiful charts and analytics to stay motivated
- **Stay Organized**: Use tags and filters to categorize and find your applications quickly and efficiently
- **Export Data**: Export your data as CSV, HTML, or print reports to share with mentors and advisors
- **Custom Status Pipeline**: Add your own application stages
- **Tagging System**: Create custom tags for better organization
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices

## 🛠️ Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth)
- **Charts**: Recharts
- **Icons**: Lucide React
- **Routing**: React Router DOM

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/internyx.git
cd internyx
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and anon key
3. Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Set up the Database

Run the following SQL in your Supabase SQL editor:

```sql
-- Create the internships table
CREATE TABLE internships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  role TEXT NOT NULL,
  location TEXT CHECK (location IN ('remote', 'on-site', 'hybrid')) DEFAULT 'remote',
  location_place TEXT,
  status TEXT CHECK (status IN ('applied', 'interviewing', 'offer', 'rejected')) DEFAULT 'applied',
  applied_date DATE,
  deadline DATE,
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create custom statuses table
CREATE TABLE custom_statuses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6b7280',
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tags table
CREATE TABLE tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6b7280',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE internships ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- Create policies for internships
CREATE POLICY "Users can view own internships" ON internships
  FOR ALL USING (auth.uid() = user_id);

-- Create policies for custom_statuses
CREATE POLICY "Users can view own custom statuses" ON custom_statuses
  FOR ALL USING (auth.uid() = user_id);

-- Create policies for tags
CREATE POLICY "Users can view own tags" ON tags
  FOR ALL USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_internships_updated_at
  BEFORE UPDATE ON internships
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view the app.

## 📖 Usage

### Authentication
1. Sign up with your email and password
2. Verify your email (check spam folder)
3. Sign in to access your dashboard

### Adding Internships
1. Click "Add Internship" button
2. Fill in the required fields (Company Name, Role)
3. Optionally add dates, location, status, and notes
4. Click "Add Internship" to save

### Managing Internships
- **Edit**: Click the edit icon on any internship card
- **Delete**: Click the delete icon (with confirmation)
- **Filter**: Use the search bar and dropdown filters
- **View Analytics**: Check the analytics section at the top

### Advanced Features
- **Custom Status Pipeline**: Add your own application stages
- **Tagging**: Create custom tags for better organization
- **Export**: Export data as CSV, HTML, or print reports
- **Progress Tracking**: Monitor your application progress

## 🗄️ Database Schema

### Internships Table
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to auth.users |
| company_name | TEXT | Company name (required) |
| role | TEXT | Position/role (required) |
| location | TEXT | remote/on-site/hybrid |
| location_place | TEXT | City/State location (e.g., "San Francisco, CA") |
| status | TEXT | applied/interviewing/offer/rejected |
| applied_date | DATE | Date applied |
| deadline | DATE | Application deadline |
| notes | TEXT | Additional notes |
| tags | TEXT[] | Array of custom tags |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Last update time |

### Custom Statuses Table
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to auth.users |
| name | TEXT | Status name (required) |
| color | TEXT | Status color (hex) |
| order | INTEGER | Display order |
| created_at | TIMESTAMP | Record creation time |

### Tags Table
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to auth.users |
| name | TEXT | Tag name (required) |
| color | TEXT | Tag color (hex) |
| created_at | TIMESTAMP | Record creation time |

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Netlify
1. Build the project: `npm run build`
2. Upload the `dist` folder to Netlify
3. Add environment variables in Netlify dashboard

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

If you encounter any issues or have questions, please open an issue on GitHub or contact us at hello@internyx.com.

## 🙏 Acknowledgments

- Built with ❤️ for students and job seekers
- Inspired by the need for better internship application tracking tools
- Special thanks to the open-source community for the amazing tools that made this possible

---

**Internyx** - Track your internship journey with ease.
